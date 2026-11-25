import {
  RANKS, ABILITY_KEYS, STEALTH_DC, DIE_CATEGORY, racialMods, signed, castThreshold, fuckUpResult, advancedArmourOk, resolveFailure, deathOutcome
} from "../logic.mjs";
import { viceForRoll } from "../data/vices.mjs";

const L = (key, data) => game.i18n.format(key, data);

export class VVActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    // An equipped armour item overrides the manual armour fields (derived, never persisted).
    const armour = this.items.find(i => i.type === "armour" && i.system.equipped);
    this.armourStealth = armour?.system.stealthPenalty ?? 0;
    // Racial modifiers sit on top of the base ability scores (the sheet edits the base).
    this.racial = racialMods(
      this.items.filter(i => i.type === "race").map(i => i.system),
      { plus: this.system.racePlus, minus: this.system.raceMinus }
    );
    this.armourLocked = !!armour;
    if (armour) {
      this.system.armourSave = armour.system.saveDie;
      this.system.armourBonus = armour.system.bonus;
    }
  }

  /** Base ability score plus racial modifiers. */
  abilityTotal(ability) {
    return (this.system[ability] ?? 0) + (this.racial?.[ability] ?? 0);
  }

  /** "player" for characters; the stat-block keyword for NPCs. */
  get initiativeKeyword() {
    return this.type === "npc" ? this.system.initiative : "player";
  }

  /** Rank derived from the wizard class item: learningLevel 1 = novice ... 6 = master. */
  get wizardRank() {
    const wizard = this.items.find(i => i.type === "class" && i.system.classType === "wizard");
    return wizard ? RANKS[wizard.system.learningLevel - 1] ?? "" : "";
  }

  get equippedStaff() {
    return this.items.find(i => i.type === "staff" && i.system.equipped);
  }

  /** "" (none), skimpy, light, medium, full or fitted. */
  get armourCategory() {
    const armour = this.items.find(i => i.type === "armour" && i.system.equipped);
    return armour ? armour.system.category : DIE_CATEGORY[this.system.armourSave] ?? "";
  }

  /** Armour Save as a Roll formula, e.g. "d6 + 1". */
  get armourFormula() {
    return `${this.system.armourSave || "0"} ${signed(this.system.armourBonus)}`;
  }

  hasVice(slug) {
    return this.items.some(i => i.type === "vice" && (i.system.key || i.name.slugify()) === slug);
  }

  get #speaker() {
    return ChatMessage.getSpeaker({ actor: this });
  }

  #say(content) {
    return ChatMessage.create({ speaker: this.#speaker, content });
  }

  async refreshActions() {
    const { combatActions, tacticalActions } = this.system;
    return this.update({
      "system.combatActions.value": combatActions.max,
      "system.tacticalActions.value": tacticalActions.max
    });
  }

  /** LIFE = 5 + d6 + Moxie. */
  async rollLife() {
    const roll = await new Roll(`5 + 1d6 ${signed(this.abilityTotal("moxie"))}`).evaluate();
    await roll.toMessage({ speaker: this.#speaker, flavor: "LIFE" });
    return this.update({ "system.life.max": roll.total, "system.life.value": roll.total });
  }

  /** Dice Challenge: d20 + ability total (+ bonus) >= dc. Drunk: dc +3. */
  async rollAbility(ability, { dc = 12, bonus = 0 } = {}) {
    if (this.statuses.has("drunk")) dc += 3;
    const roll = await new Roll(`1d20 ${signed(this.abilityTotal(ability) + bonus)}`).evaluate();
    const success = roll.total >= dc;
    await roll.toMessage({
      speaker: this.#speaker,
      flavor: L("VV.Roll.check", { ability: L(`VV.Ability.${ability}`), dc, result: L(success ? "VV.Roll.success" : "VV.Roll.failure") })
    });
    return { roll, success };
  }

  /**
   * Stealth is its own Dice Challenge: d20 minus the armour save (and any armour stealth penalty), no ability.
   * DC by alertness: asleep 3, preoccupied 6, alert 10. Drunk +3, Filthy +10.
   */
  async rollStealth({ alertness = "alert" } = {}) {
    let dc = STEALTH_DC[alertness] ?? STEALTH_DC.alert;
    if (this.statuses.has("drunk")) dc += 3;
    if (this.statuses.has("filthy")) dc += 10;
    const parts = ["1d20", `- (${this.armourFormula})`];
    if (this.armourStealth) parts.push(`- ${this.armourStealth}`);
    const roll = await new Roll(parts.join(" ")).evaluate();
    const success = roll.total >= dc;
    await roll.toMessage({
      speaker: this.#speaker,
      flavor: L("VV.Roll.stealth", { dc, result: L(success ? "VV.Roll.success" : "VV.Roll.failure") })
    });
    return { roll, success };
  }

  /** Weapon damage = die + material + Brawn. Without an item (NPC): its attackDie, flat. */
  async rollWeaponDamage(item) {
    const formula = item
      ? [item.system.die, signed(item.system.materialBonus), signed(this.abilityTotal("brawn"))].join(" ")
      : this.system.attackDie;
    const roll = await new Roll(formula).evaluate();
    await roll.toMessage({ speaker: this.#speaker, flavor: item?.name ?? L("VV.Roll.attack") });
    return roll;
  }

  /** Defence: Armour Save + Moxie (+ d6 Large Shield) negates incoming damage. */
  async rollDefence({ damage = 0, shield = false, apply = true } = {}) {
    const formula = [this.armourFormula, signed(this.abilityTotal("moxie")), shield ? "+ d6" : ""].join(" ");
    const roll = await new Roll(formula).evaluate();
    const taken = Math.max(0, damage - Math.max(0, roll.total));
    await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Roll.defence", { damage, taken }) });
    if (apply && taken) await this.takeDamage(taken);
    return { roll, taken };
  }

  async takeDamage(amount) {
    return this.update({ "system.life.value": Math.max(0, this.system.life.value - amount) });
  }

  /**
   * Cast a spell.
   * Blood: no roll, sacrifice LIFE with up to two dice <= d10 (damage/power = the same roll).
   * Grimoire: ritual, Skimpy/no armour, not in combat, no roll. Advanced: needs an equipped Magic Staff and Skimpy armour (or none), at any rank.
   * Others: d20 + Smarts >= threshold. On failure Utility fizzles; Light/Death/Advanced resolve via
   * resolveFailure: a result the caster already converted is free, else an equipped staff absorbs
   * it (-1 charge), else the Fuck Up Table result (1-11) is reported in chat (not automated).
   */
  async castSpell(item, { dice = ["d10"] } = {}) {
    const s = item.system;
    if (s.school === "blood") {
      const faces = dice.slice(0, 2);
      if (!faces.length || !faces.every(d => /^d(4|6|8|10)$/.test(d))) return ui.notifications.warn(L("VV.Cast.badDice"));
      const roll = await new Roll(faces.join(" + ")).evaluate();
      await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Cast.blood", { spell: item.name, life: roll.total }) });
      await this.takeDamage(roll.total);
      return { roll, success: true };
    }

    if (s.school === "grimoire") {
      // Grimoire spells: ritual-length, never in combat, Skimpy armour or none, no casting roll.
      if (!advancedArmourOk(this.armourCategory)) return ui.notifications.warn(L("VV.Cast.needSkimpy"));
      if (game.combat?.started && game.combat.combatants.some(c => c.actorId === this.id)) return ui.notifications.warn(L("VV.Cast.noCombat"));
      if (this.system.spellUses.value < s.cost) return ui.notifications.warn(L("VV.Cast.noUses"));
      await this.update({ "system.spellUses.value": this.system.spellUses.value - s.cost });
      await this.#say(L("VV.Cast.grimoire", { spell: item.name, uses: s.cost }));
      return { roll: null, success: true };
    }

    if (s.school === "advanced") {
      if (RANKS.indexOf(this.wizardRank) < RANKS.indexOf(s.minRank)) return ui.notifications.warn(L("VV.Cast.rank", { rank: s.minRank }));
      if (!this.equippedStaff) return ui.notifications.warn(L("VV.Cast.needStaff"));
      if (!advancedArmourOk(this.armourCategory)) return ui.notifications.warn(L("VV.Cast.needSkimpy"));
    }
    const cost = s.costType === "spellUses" ? s.cost : 0;
    if (this.system.spellUses.value < cost) return ui.notifications.warn(L("VV.Cast.noUses"));
    if (cost) await this.update({ "system.spellUses.value": this.system.spellUses.value - cost });

    const threshold = castThreshold(this.wizardRank);
    if (!threshold) {
      await this.#say(L("VV.Cast.auto", { spell: item.name }));
      return { roll: null, success: true };
    }

    const roll = await new Roll(`1d20 ${signed(this.abilityTotal("smarts"))}`).evaluate();
    if (roll.total >= threshold) {
      await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Cast.success", { spell: item.name }) });
      return { roll, success: true };
    }
    if (s.school === "utility") {
      await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Cast.fizzle", { spell: item.name }) });
      return { roll, success: false };
    }

    const n = fuckUpResult(roll.total);
    const staff = this.equippedStaff;
    const outcome = resolveFailure({ converted: this.system.fuckUpTable[n - 1], staffCharges: staff?.system.charges.value ?? 0 });
    if (outcome === "converted") {
      await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Cast.converted", { spell: item.name, n }) });
      return { roll, success: true, fuckUp: n };
    }
    if (outcome === "staff") {
      const left = staff.system.charges.value - 1;
      await staff.update({ "system.charges.value": left });
      await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Cast.staff", { spell: item.name, n, staff: staff.name, left }) });
      return { roll, success: true, fuckUp: n };
    }
    await roll.toMessage({
      speaker: this.#speaker,
      flavor: L("VV.Cast.fuckUp", { spell: item.name, n, effect: L(`VV.FuckUp.${n}`) })
    });
    return { roll, success: false, fuckUp: n };
  }

  /**
   * Starting kit: d10 x 10 jade and six rolls on the Adventuring Supplies d100 table (from the system compendium).
   * 62 adds d100 jade, 99 adds d10 rations, 100 is a pet (d6 on the Pets table). Everything else becomes a gear item.
   */
  async rollStartingSupplies() {
    const pack = game.packs.get("vice-and-violence.tables");
    const index = pack ? await pack.getIndex() : [];
    const entry = name => index.find(e => e.name === name);
    if (!entry("Adventuring Supplies")) return ui.notifications.warn(L("VV.Supplies.missing"));
    const table = await pack.getDocument(entry("Adventuring Supplies")._id);
    const pets = entry("Pets") ? await pack.getDocument(entry("Pets")._id) : null;
    const plain = html => (html ?? "").replace(/<[^>]*>/g, "").trim();

    const jadeRoll = await new Roll("1d10 * 10").evaluate();
    let jade = jadeRoll.total, rations = 0;
    const found = [];
    for (let i = 0; i < 6; i++) {
      const { results } = await table.roll();
      const result = results[0];
      let text = plain(result.description) || result.name;
      const n = result.range[0];
      if (n === 62) { const r = await new Roll("1d100").evaluate(); jade += r.total; text += ` (+${r.total}j)`; }
      if (n === 99) { const r = await new Roll("1d10").evaluate(); rations += r.total; text += ` (+${r.total})`; }
      if (n === 100 && pets) { const pet = (await pets.roll()).results[0]; text = `Pet: ${plain(pet.description) || pet.name}`; }
      found.push({ n, text });
    }
    await this.createEmbeddedDocuments("Item", found.map(f => ({ name: f.text, type: "gear", system: { quantity: 1 } })));
    await this.update({ "system.jade": this.system.jade + jade, "system.rations": this.system.rations + rations });
    const list = found.map(f => `<li><b>${f.n}</b> ${foundry.utils.escapeHTML(f.text)}</li>`).join("");
    await this.#say(`<p>${L("VV.Supplies.result", { jade })}</p><ol>${list}</ol>`);
  }

  /** Roll d11 on the Fuck Up Table (or show a chosen result) with its effect in chat. Effects are reported, never automated. */
  async rollFuckUp({ result } = {}) {
    let roll = null;
    let n = Number(result);
    if (!(n >= 1 && n <= 11)) {
      roll = await new Roll("1d11").evaluate();
      n = roll.total;
    }
    const converted = this.system.fuckUpTable[n - 1];
    const flavor = L("VV.Cast.fuckUp", { spell: L("VV.FuckUp.title"), n, effect: L(`VV.FuckUp.${n}`) });
    const note = converted ? ` ${L("VV.FuckUp.converted")}` : "";
    if (roll) await roll.toMessage({ speaker: this.#speaker, flavor: flavor + note });
    else await this.#say(`<p><b>${foundry.utils.escapeHTML(flavor)}</b>${foundry.utils.escapeHTML(note)}</p>`);
    return n;
  }

  /** Add a Vice by hand (chosen from the Vice table, not rolled). */
  addVice({ name, effect }) {
    return this.createEmbeddedDocuments("Item", [{ name, type: "vice", system: { key: name.slugify(), effect } }]);
  }

  /** Roll d50 on the Vice table and add the resulting Vice as an item. */
  async gainVice() {
    const roll = await new Roll("1d50").evaluate();
    const vice = viceForRoll(roll.total);
    await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Vice.gained", { vice: vice.name }) });
    return this.createEmbeddedDocuments("Item", [{
      name: vice.name,
      type: "vice",
      system: { key: vice.name.slugify(), effect: vice.effect }
    }]);
  }

  /** Exertion spent below 0: +1 Vice, Dehydrated, 2d6 damage. */
  async exertionOverrun() {
    await this.gainVice();
    await this.toggleStatusEffect("dehydrated", { active: true });
    const roll = await new Roll("2d6").evaluate();
    await roll.toMessage({ speaker: this.#speaker, flavor: L("VV.Exertion.overrun") });
    return this.takeDamage(roll.total);
  }

  /** Called at the start of a Downed actor's turn; the third turn rolls the death table. */
  async tickDowned() {
    const turns = this.system.downedTurns;
    if (turns >= 3) return;
    await this.update({ "system.downedTurns": turns + 1 });
    if (turns + 1 >= 3) await this.rollDeath();
  }

  /** Death d20: 1-10 gone, 11-15 ghost, 16-20 back as a zombie (full LIFE, +2 Moxie the first time). */
  async rollDeath() {
    const roll = await new Roll("1d20").evaluate();
    const outcome = deathOutcome(roll.total);
    const update = { "system.downedTurns": outcome === "zombie" ? 0 : 3 };
    if (outcome === "zombie") {
      update["system.life.value"] = this.system.life.max;
      if (!this.system.isZombie) update["system.moxie"] = Math.min(7, this.system.moxie + 2);
      update["system.isZombie"] = true;
    }
    await roll.toMessage({ speaker: this.#speaker, flavor: L(`VV.Death.${outcome}`) });
    return this.update(update);
  }
}
