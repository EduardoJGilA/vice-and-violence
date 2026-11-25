import { initiativeScore } from "../logic.mjs";

const keywordOf = c => c.actor?.initiativeKeyword ?? "player";

export class VVCombat extends Combat {
  #score(c, top) {
    return initiativeScore({
      keyword: keywordOf(c),
      initiative: c.initiative,
      daydream: c.actor?.hasVice("constant-daydreaming") ?? false
    }, top);
  }

  /** Preemptive > players > Interspersed/Rapid (after the first player) > Reactive; Daydreamers last. */
  _sortCombatants(a, b) {
    const players = this.combatants.filter(c => keywordOf(c) === "player");
    const top = players.length ? Math.max(...players.map(c => c.initiative ?? 0)) : 0;
    return (this.#score(b, top) - this.#score(a, top)) || a.id.localeCompare(b.id);
  }

  /** Turn events run on the active GM only (core turn management). */
  async _onStartTurn(combatant) {
    await super._onStartTurn(combatant);
    const actor = combatant.actor;
    if (!actor) return;
    await actor.refreshActions();
    if (actor.statuses.has("downed")) await actor.tickDowned();
  }

  /** After each player's turn, whisper the GM which Rapid enemies get their extra reactive action. */
  async _onEndTurn(combatant, context) {
    await super._onEndTurn(combatant, context);
    if (keywordOf(combatant) !== "player") return;
    const rapid = this.combatants.filter(c => keywordOf(c) === "rapid" && !c.isDefeated && !c.actor.statuses.has("downed"));
    if (!rapid.length) return;
    const names = rapid.map(c => Handlebars.escapeExpression(c.name)).join(", ");
    await ChatMessage.create({
      whisper: ChatMessage.getWhisperRecipients("GM"),
      content: `<small><em>${game.i18n.format("VV.Combat.rapid", { names, player: Handlebars.escapeExpression(combatant.name) })}</em></small>`
    });
  }
}
