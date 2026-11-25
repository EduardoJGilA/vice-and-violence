import { ARMOUR_DICE, INITIATIVES } from "./data/actor.mjs";
import { validateRacePick, WEAPON_DICE, MATERIAL_BONUS } from "./logic.mjs";
import { STATUSES } from "./config.mjs";
import { VICES } from "./data/vices.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
const { StringField, NumberField, BooleanField, SchemaField, HTMLField } = foundry.data.fields;

const ABILITIES = ["smarts", "brawn", "moxie", "hotness"];
const ITEM_TYPES = ["weapon", "armour", "staff", "spell", "feat", "class", "race", "birthsign", "vice", "gear"];
const SYSTEM_ID = "vice-and-violence";

/** Sheet theme: the client setting, or (auto) Foundry's own window theme, or the OS preference. */
function applyTheme(element) {
  const pref = game.settings.get(SYSTEM_ID, "sheetTheme");
  const foundryDark = element.classList.contains("theme-dark");
  const foundryLight = element.classList.contains("theme-light");
  const dark = pref === "dark" || (pref === "auto" && (foundryDark || (!foundryLight && matchMedia("(prefers-color-scheme: dark)").matches)));
  element.classList.toggle("vv-dark", dark);
}
const PICKERS = { race: "races", birthsign: "birthsigns", class: "classes" };
const packIndexes = {};
const packIndex = async name => (packIndexes[name] ??= await game.packs.get(`${SYSTEM_ID}.${name}`)?.getIndex() ?? []);
const FEAT_CLASSES = ["bard", "dancer", "fighter", "martial", "thief", "paladin", "cleric", "warlock", "wizard", "blood"];
const FEAT_CLASS_LABEL = { martial: "Martial Skills", blood: "Blood Mage / Vampire" };
const featClassLabel = c => FEAT_CLASS_LABEL[c] ?? c.replace(/^\w/, ch => ch.toUpperCase());
const pretty = k => k.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase());
const options = (list, selected) => list.map(value => ({ value, label: value || "—", selected: value === selected }));

export class VVActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["vice-and-violence", "actor"],
    position: { width: 1080, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      roll: VVActorSheet.#onRoll,
      open: VVActorSheet.#onOpen,
      remove: VVActorSheet.#onRemove,
      equip: VVActorSheet.#onEquip,
      create: VVActorSheet.#onCreate,
      toggleStatus: VVActorSheet.#onToggleStatus,
      addStatus: VVActorSheet.#onAddStatus,
      newVice: VVActorSheet.#onNewVice,
      newWeapon: VVActorSheet.#onNewWeapon,
      newStaff: VVActorSheet.#onNewStaff,
      addVice: VVActorSheet.#onAddVice,
      learnSpell: VVActorSheet.#onLearnSpell,
      learnFeat: VVActorSheet.#onLearnFeat,
      rollFuckUp: VVActorSheet.#onRollFuckUp,
      startingSupplies: VVActorSheet.#onStartingSupplies,
      racePick: VVActorSheet.#onRacePick
    }
  };

  // scrollable: Foundry restores the scroll position of the content pane and the sidebar after each re-render
  static PARTS = { main: { template: "systems/vice-and-violence/templates/actor.hbs", scrollable: [".vv-content", ".vv-side"] } };

  static TABS = {
    primary: {
      tabs: [
        { id: "details", icon: "fa-solid fa-id-card" },
        { id: "combat", icon: "fa-solid fa-shield-halved" },
        { id: "magic", icon: "fa-solid fa-wand-sparkles" },
        { id: "skills", icon: "fa-solid fa-star" },
        { id: "gear", icon: "fa-solid fa-bag-shopping" },
        { id: "notes", icon: "fa-solid fa-feather-pointed" }
      ],
      initial: "details",
      labelPrefix: "VV.Tab"
    }
  };

  async _prepareContext(opts) {
    const ctx = await super._prepareContext(opts);
    const actor = this.document;
    const system = actor.system;
    const of = type => actor.items.filter(i => i.type === type);
    const link = i => ({ id: i.id, name: i.name });
    const pool = key => {
      const { value, max } = system[key];
      const f = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
      return { value, max, f: f.toFixed(3), pct: Math.round(100 * f), low: max > 0 && f <= 0.25 };
    };
    const die = (d, bonus) => (d ? `${d}${bonus ? `+${bonus}` : ""}` : "—");
    const statusName = id => game.i18n.localize(CONFIG.statusEffects[id]?.name ?? id);
    return Object.assign(ctx, {
      actor,
      system,
      isNpc: actor.type === "npc",
      isDowned: actor.statuses.has("downed"),
      abilities: ABILITIES.map(key => ({ key, label: game.i18n.localize(`VV.Ability.${key}`), value: system[key], total: actor.abilityTotal(key), text: actor.abilityTotal(key) > 0 ? `+${actor.abilityTotal(key)}` : `${actor.abilityTotal(key)}`, mod: actor.racial[key] })),
      subtitle: (() => {
        const bits = [...of("race"), ...of("class")].map(i => i.name);
        return bits.length ? `Level ${system.level} ${bits.join(" · ")}` : game.i18n.localize("VV.Subtitle.nobody");
      })(),
      pickers: await this.#pickers(),
      racePickNeeded: of("race").some(i => i.system.pickPlus),
      racePickText: [system.racePlus && `+ ${game.i18n.localize(`VV.Ability.${system.racePlus}`)}`, system.raceMinus && `− ${game.i18n.localize(`VV.Ability.${system.raceMinus}`)}`].filter(Boolean).join(", ") || "choose",
      classes: of("class").map(link),
      life: pool("life"),
      exertion: pool("exertion"),
      spellUses: pool("spellUses"),
      armourText: die(system.armourSave, system.armourBonus),
      armourLocked: actor.armourLocked,
      armourOptions: options(ARMOUR_DICE, system.armourSave),
      armours: of("armour").map(i => ({ ...link(i), equipped: i.system.equipped, die: i.system.saveDie, bonus: i.system.bonus })),
      weapons: of("weapon").map(i => ({
        ...link(i),
        text: die(i.system.die, i.system.materialBonus),
        kinds: options([...Object.keys(WEAPON_DICE), "custom"], i.system.kind).map(o => ({ ...o, label: pretty(o.value) })),
        materials: options([...Object.keys(MATERIAL_BONUS), "custom"], i.system.material).map(o => ({ ...o, label: pretty(o.value) }))
      })),
      stealthOptions: [["asleep", 3], ["preoccupied", 6], ["alert", 10]].map(([value, dc]) => ({ value, label: `${pretty(value)} (${dc})`, selected: value === "alert" })),
      featGroups: FEAT_CLASSES
        .map(c => ({ label: featClassLabel(c), feats: of("feat").filter(i => i.system.classType === c).map(i => ({ ...link(i), requirement: i.system.requirement })) }))
        .filter(g => g.feats.length),
      featPicker: await this.#featPicker(),
      initiativeOptions: options(INITIATIVES, system.initiative),
      spells: of("spell").map(i => ({
        ...link(i),
        school: i.system.school,
        cost: i.system.costType === "life" ? "LIFE" : i.system.cost
      })),
      staffs: of("staff").map(i => ({ ...link(i), equipped: i.system.equipped, value: i.system.charges.value, max: i.system.charges.max })),
      spellGroups: await this.#spellGroups(),
      viceOptions: VICES.map(v => ({ value: v.name, label: `${v.name}: ${v.effect}` })),
      gear: of("gear").map(i => ({ ...link(i), quantity: i.system.quantity })),
      vices: of("vice").map(i => ({ ...link(i), effect: i.system.effect })),
      statuses: [...actor.statuses].map(id => ({ id, name: statusName(id), description: game.i18n.localize(`VV.StatusDesc.${id}`) })),
      statusOptions: STATUSES.map(([id]) => ({ id, name: statusName(id), description: game.i18n.localize(`VV.StatusDesc.${id}`) })).filter(s => !actor.statuses.has(s.id)),
      conditions: STATUSES.map(([id]) => ({ id, name: statusName(id), description: game.i18n.localize(`VV.StatusDesc.${id}`), active: actor.statuses.has(id) })),
      notesField: system.schema.fields.notes,
      notesHTML: await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.notes, { relativeTo: actor, rollData: actor.getRollData?.() }),
      fuckUps: system.fuckUpTable.map((checked, i) => ({ n: i + 1, i, checked, effect: game.i18n.localize(`VV.FuckUp.${i + 1}`) })),
      fuckUpOptions: Array.from({ length: 11 }, (_, i) => ({ value: i + 1, label: `${i + 1}. ${game.i18n.localize(`VV.FuckUp.${i + 1}`)}` })),
      itemTypes: ITEM_TYPES.map(value => ({ value, label: game.i18n.localize(`TYPES.Item.${value}`) }))
    });
  }

  /** Feats of the compendium not yet learned: a class selector (defaults to the actor's class) plus the feat list to filter by it. */
  async #featPicker() {
    const learned = new Set(this.document.items.filter(i => i.type === "feat").map(i => i.name));
    const index = await game.packs.get(`${SYSTEM_ID}.feats`)?.getIndex({ fields: ["system.classType", "system.requirement"] }) ?? [];
    const available = [...index].filter(e => !learned.has(e.name));
    const own = this.document.items.find(i => i.type === "class")?.system.classType;
    const first = FEAT_CLASSES.includes(own) ? own : FEAT_CLASSES.find(c => available.some(e => e.system?.classType === c));
    return {
      classes: FEAT_CLASSES.map(c => ({ value: c, label: featClassLabel(c), selected: c === first })),
      options: available.map(e => ({ value: e._id, label: e.system?.requirement ? `${e.name} (${e.system.requirement})` : e.name, classType: e.system?.classType, hidden: e.system?.classType !== first }))
        .sort((a, b) => FEAT_CLASSES.indexOf(a.classType) - FEAT_CLASSES.indexOf(b.classType) || a.label.localeCompare(b.label))
    };
  }

  /** Every spell in the system compendia not yet learned, grouped by school, for the "learn a spell" dropdown. */
  async #spellGroups() {
    const learned = new Set(this.document.items.filter(i => i.type === "spell").map(i => i.name));
    const groups = {};
    for (const pack of ["spells", "grimoires"]) {
      const index = await game.packs.get(`${SYSTEM_ID}.${pack}`)?.getIndex({ fields: ["system.school", "system.cost", "system.costType"] }) ?? [];
      for (const e of index) {
        if (learned.has(e.name)) continue;
        const school = e.system?.school ?? "other";
        const cost = e.system?.costType === "life" ? "LIFE" : e.system?.cost;
        (groups[school] ??= []).push({ value: `${pack}.${e._id}`, label: cost ? `${e.name} (${cost})` : e.name });
      }
    }
    const order = ["light", "death", "utility", "blood", "advanced", "grimoire"];
    return Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .map(school => ({ label: pretty(school), options: groups[school].sort((a, b) => a.label.localeCompare(b.label)) }));
  }

  /** Race / Birthsign dropdown data (from the system compendia) and the current picks. */
  async #pickers() {
    const out = {};
    for (const [type, pack] of Object.entries(PICKERS)) {
      const current = this.document.items.filter(i => i.type === type);
      const names = new Set(current.map(i => i.name));
      const list = await packIndex(pack);
      out[type] = {
        options: [...list].sort((a, b) => a.name.localeCompare(b.name)).map(e => ({ value: e._id, label: e.name, selected: type !== "class" && names.has(e.name) })),
        current: current.map(i => ({ id: i.id, name: i.name }))
      };
    }
    const sign = this.document.items.find(i => i.type === "birthsign");
    out.boons = sign ? {
      id: sign.id,
      options: [["", "Choose a Boon"], ["a", `A: ${sign.system.boonA}`], ["b", `B: ${sign.system.boonB}`]].map(([value, label]) => ({ value, label, selected: value === sign.system.chosen }))
    } : null;
    return out;
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    applyTheme(root);
    // item fields edited inline on the sheet (weapon type/material, armour bonus, birthsign boon)
    root.querySelectorAll("[data-item-field]").forEach(el => el.addEventListener("change", ev => {
      const item = this.document.items.get(el.dataset.itemId);
      const value = el.type === "number" ? Number(el.value) : el.value;
      return item?.update({ [el.dataset.itemField]: value });
    }));
    // the status dropdown shows the rules text of the chosen status
    const statusSel = root.querySelector("[data-new-status]");
    const statusDesc = root.querySelector("[data-status-desc]");
    const showStatus = () => { if (statusDesc && statusSel) statusDesc.textContent = statusSel.selectedOptions[0]?.dataset.desc ?? ""; };
    statusSel?.addEventListener("change", showStatus);
    showStatus();
    // feat class selector filters the feat dropdown
    const classSel = root.querySelector("[data-feat-class]");
    const featSel = root.querySelector("[data-new-feat]");
    const filter = () => {
      if (!classSel || !featSel) return;
      for (const o of featSel.options) if (o.value) { o.hidden = o.disabled = o.dataset.class !== classSel.value; }
      featSel.value = "";
    };
    classSel?.addEventListener("change", filter);
    // race / birthsign / class dropdowns
    root.querySelectorAll("[data-pick]").forEach(el => el.addEventListener("change", ev => this.#pick(el.dataset.pick, el.value, el)));
  }

  async #pick(type, id, el) {
    if (!this.document.isOwner) return;
    if (type !== "class") await this.document.deleteEmbeddedDocuments("Item", this.document.items.filter(i => i.type === type).map(i => i.id));
    if (type === "race") await this.document.update({ "system.racePlus": "", "system.raceMinus": "" });
    if (!id) return;
    const doc = await game.packs.get(`${SYSTEM_ID}.${PICKERS[type]}`).getDocument(id);
    const [created] = await this.document.createEmbeddedDocuments("Item", [game.items.fromCompendium(doc)]);
    if (created?.type === "race" && created.system.pickPlus) await this.#chooseRaceBonus(created);
  }

  #dropped = new WeakSet();

  /**
   * Item drops from the sidebar, compendia or other sheets. Bound natively once (not through the base class's
   * DragDrop config); _onDropItem is idempotent per event, so a base-class drop handler can't double-create.
   */
  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);
    const el = this.element;
    el.addEventListener("dragover", ev => ev.preventDefault());
    el.addEventListener("drop", async ev => {
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data?.type !== "Item") return;
      ev.preventDefault();
      const item = await Item.implementation.fromDropData(data);
      if (item) await this._onDropItem(ev, item);
    });
  }

  async _onDropItem(event, item) {
    if (this.#dropped.has(event)) return;
    this.#dropped.add(event);
    if (!this.document.isOwner || item.parent === this.document) return;
    if (["race", "birthsign"].includes(item.type)) {
      await this.document.deleteEmbeddedDocuments("Item", this.document.items.filter(i => i.type === item.type).map(i => i.id));
      if (item.type === "race") await this.document.update({ "system.racePlus": "", "system.raceMinus": "" });
    }
    const [created] = await this.document.createEmbeddedDocuments("Item", [game.items.fromCompendium(item)]);
    if (created?.type === "race" && created.system.pickPlus) await this.#chooseRaceBonus(created);
    return created;
  }

  /** Centaur / Otherling: ask which abilities get the race's free +N (and -M) and apply them to the actor. */
  async #chooseRaceBonus(race) {
    const { pickPlus, pickMinus } = race.system;
    const select = (name, label) => `<div class="form-group"><label>${label}</label><select name="${name}">${
      ABILITIES.map(a => `<option value="${a}">${game.i18n.localize(`VV.Ability.${a}`)}</option>`).join("")
    }</select></div>`;
    const content = select("plus", game.i18n.format("VV.Race.plus", { n: pickPlus })) +
      (pickMinus ? select("minus", game.i18n.format("VV.Race.minus", { n: pickMinus })) : "");
    for (;;) {
      const pick = await foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.format("VV.Race.title", { race: race.name }) },
        content,
        ok: {
          label: game.i18n.localize("VV.Race.apply"),
          callback: (event, button) => ({ plus: button.form.elements.plus.value, minus: button.form.elements.minus?.value })
        },
        rejectClose: false
      });
      if (!pick) return; // cancelled: nothing applied
      if (validateRacePick({ ...pick, minusAmount: pickMinus })) {
        return this.document.update({ "system.racePlus": pick.plus, "system.raceMinus": pickMinus ? pick.minus : "" });
      }
      ui.notifications.warn(game.i18n.localize("VV.Race.differ"));
    }
  }

  /** Checkbox names system.fuckUpTable.N arrive as an object: rebuild the 11-entry array. */
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    const table = data.system?.fuckUpTable;
    if (table && !Array.isArray(table)) data.system.fuckUpTable = Array.from({ length: 11 }, (_, i) => !!table[i]);
    return data;
  }

  static async #onRoll(event, target) {
    const actor = this.document;
    const [kind, arg] = target.dataset.roll.split(":");
    const item = actor.items.get(arg);
    if (kind === "ability") return actor.rollAbility(arg);
    if (kind === "stealth") return actor.rollStealth({ alertness: this.element.querySelector("[data-stealth-dc]")?.value });
    if (kind === "life") {
      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: "LIFE" },
        content: `<p>${game.i18n.localize("VV.Life.confirm")}</p>`,
        rejectClose: false
      });
      return ok ? actor.rollLife() : undefined;
    }
    if (kind === "death") return actor.rollDeath();
    if (kind === "defence") return actor.rollDefence();
    if (kind === "npcattack") return actor.rollWeaponDamage();
    if (item?.type === "weapon") return actor.rollWeaponDamage(item);
    if (item?.type === "spell") {
      const dice = this.element.querySelector("[data-blood-dice]").value.split(",").map(d => d.trim().toLowerCase());
      return actor.castSpell(item, { dice });
    }
  }

  static #onOpen(event, target) {
    this.document.items.get(target.dataset.id)?.sheet.render({ force: true });
  }

  static #onRemove(event, target) {
    return this.document.items.get(target.dataset.id)?.delete();
  }

  static #onEquip(event, target) {
    const item = this.document.items.get(target.dataset.id);
    return item?.update({ "system.equipped": !item.system.equipped });
  }

  static #onToggleStatus(event, target) {
    return this.document.toggleStatusEffect(target.dataset.status);
  }

  static #onAddStatus() {
    const id = this.element.querySelector("[data-new-status]").value;
    return id ? this.document.toggleStatusEffect(id, { active: true }) : undefined;
  }

  static async #onStartingSupplies() {
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("VV.Supplies.title") },
      content: `<p>${game.i18n.localize("VV.Supplies.confirm")}</p>`,
      rejectClose: false
    });
    return ok ? this.document.rollStartingSupplies() : undefined;
  }

  static #onRollFuckUp(event, target) {
    const pick = target.dataset.pick === "chosen" ? this.element.querySelector("[data-fuckup-pick]").value : undefined;
    return this.document.rollFuckUp({ result: pick });
  }

  static async #onLearnFeat() {
    const id = this.element.querySelector("[data-new-feat]").value;
    if (!id) return;
    const doc = await game.packs.get(`${SYSTEM_ID}.feats`).getDocument(id);
    return this.document.createEmbeddedDocuments("Item", [game.items.fromCompendium(doc)]);
  }

  static async #onLearnSpell() {
    const value = this.element.querySelector("[data-new-spell]").value;
    if (!value) return;
    const [pack, id] = value.split(".");
    const doc = await game.packs.get(`${SYSTEM_ID}.${pack}`).getDocument(id);
    return this.document.createEmbeddedDocuments("Item", [game.items.fromCompendium(doc)]);
  }

  static #onAddVice() {
    const vice = VICES.find(v => v.name === this.element.querySelector("[data-new-vice]").value);
    return vice ? this.document.addVice(vice) : undefined;
  }

  static #onNewStaff() {
    return Item.create({ name: "Magic Staff", type: "staff", system: { charges: { value: 1, max: 1 } } }, { parent: this.document });
  }

  static #onNewWeapon() {
    return Item.create({ name: "Dagger", type: "weapon", system: { kind: "dagger", material: "wood" } }, { parent: this.document });
  }

  static #onRacePick() {
    const race = this.document.items.find(i => i.type === "race" && i.system.pickPlus);
    return race ? this.#chooseRaceBonus(race) : undefined;
  }

  static #onNewVice() {
    return this.document.gainVice();
  }

  static #onCreate() {
    const type = this.element.querySelector("[data-new-type]").value;
    return Item.create({ name: game.i18n.localize(`TYPES.Item.${type}`), type }, { parent: this.document });
  }
}

/** Generic item sheet: renders every scalar field of the item's data model (nested schemas flattened). */
export class VVItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["vice-and-violence", "item"],
    position: { width: 520, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };

  static PARTS = { main: { template: "systems/vice-and-violence/templates/item.hbs", scrollable: [""] } };

  _onRender(context, options) {
    super._onRender?.(context, options);
    applyTheme(this.element);
  }

  async _prepareContext(opts) {
    const ctx = await super._prepareContext(opts);
    const item = this.document;
    const collect = (fields, prefix = "") => Object.entries(fields).flatMap(([key, f]) => {
      const path = prefix + key;
      if (f instanceof SchemaField) return collect(f.fields, `${path}.`);
      if (f instanceof HTMLField) return []; // rendered separately as a rich-text editor
      if (![StringField, NumberField, BooleanField].some(T => f instanceof T)) return [];
      const value = foundry.utils.getProperty(item.system, path);
      return [{
        key: path,
        value,
        bool: f instanceof BooleanField,
        num: f instanceof NumberField,
        choices: Array.isArray(f.choices) ? options(f.choices, value) : null
      }];
    });
    const { TextEditor } = foundry.applications.ux;
    return Object.assign(ctx, {
      item,
      typeLabel: game.i18n.localize(`TYPES.Item.${item.type}`),
      fields: collect(item.system.schema.fields),
      descriptionField: item.system.schema.fields.description,
      description: item.system.description,
      descriptionHTML: await TextEditor.implementation.enrichHTML(item.system.description, { relativeTo: item, rollData: item.getRollData?.() })
    });
  }
}
