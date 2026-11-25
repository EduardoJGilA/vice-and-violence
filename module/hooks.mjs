import { downedTransition } from "./logic.mjs";

const { getProperty, setProperty } = foundry.utils;

export function registerHooks() {
  // Clamp LIFE to [0, max]; clamp Exertion at 0 and flag an overrun (spent more than available).
  Hooks.on("preUpdateActor", (actor, changes, options) => {
    const life = getProperty(changes, "system.life.value");
    if (life !== undefined) {
      const max = getProperty(changes, "system.life.max") ?? actor.system.life.max;
      setProperty(changes, "system.life.value", Math.min(max, Math.max(0, life)));
      options.vvWasUp = actor.system.life.value > 0;
    }
    const exertion = getProperty(changes, "system.exertion.value");
    if (exertion !== undefined && exertion < 0) {
      setProperty(changes, "system.exertion.value", 0);
      options.vvOverrun = true;
    }
  });

  // Only the user who made the update reacts, so effects/items aren't created once per client.
  Hooks.on("updateActor", async (actor, changes, options, userId) => {
    if (game.user.id !== userId) return;
    const transition = downedTransition({
      life: getProperty(changes, "system.life.value"),
      wasUp: options.vvWasUp,
      isDowned: actor.statuses.has("downed")
    });
    if (transition === "down") {
      await actor.update({ "system.downedTurns": 0 });
      await actor.toggleStatusEffect("downed", { active: true });
    } else if (transition === "recover") {
      await actor.toggleStatusEffect("downed", { active: false });
      await actor.update({ "system.downedTurns": 0 });
    }
    if (options.vvOverrun) await actor.exertionOverrun();
  });
}
