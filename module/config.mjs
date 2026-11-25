// [status id, icon]. Ids that v14 already defines (prone, burning, stun, restrain) are skipped at registration:
// duplicate ids make the CONFIG.statusEffects proxy throw "ownKeys trap returned duplicate entries".
// Every id needs VV.Status.<id> (name) and VV.StatusDesc.<id> (rules text) in lang/en.json.
export const STATUSES = [
  ["downed", "icons/svg/unconscious.svg"],
  ["knocked", "icons/svg/sleep.svg"],
  ["prone", "icons/svg/falling.svg"],
  ["poisoned", "icons/svg/poison.svg"],
  ["drunk", "icons/svg/tankard.svg"],
  ["filthy", "icons/svg/blood.svg"],
  ["burning", "icons/svg/fire.svg"],
  ["stun", "icons/svg/daze.svg"],
  ["terrified", "icons/svg/terror.svg"],
  ["charmed", "icons/svg/aura.svg"],
  ["horny", "icons/svg/heal.svg"],
  ["blinded", "icons/svg/blind.svg"],
  ["restrain", "icons/svg/net.svg"],
  ["berserk", "icons/svg/combat.svg"],
  ["dehydrated", "icons/svg/hazard.svg"],
  ["starving", "icons/svg/bones.svg"],
  ["exhausted", "icons/svg/downgrade.svg"]
];
