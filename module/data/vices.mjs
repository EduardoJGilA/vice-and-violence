// Vice table (d50), normalised from the OCR of the book's table (bloque_09, line 184). Effects are informational.
// ponytail: 49-50's name is a guess from heavily garbled OCR ("Dightly erker"); effect (-1 Exertion Uses) is legible.
const RAW = [
  [1, 2, "Chain Smoker", "Permanent -5 LIFE"],
  [3, 4, "Giggles when Nervous", "-3 to Stealth checks"],
  [5, 6, "Painfully Embarrassed", "-1 Brawn"],
  [7, 8, "Wuss", "-1 Moxie"],
  [9, 10, "Chronic Horniness", "Gain Horny every 12 hours"],
  [11, 12, "Wine Enthusiast", "Cannot drink water"],
  [13, 14, "Constant Daydreaming", "Starts last in Initiative"],
  [15, 16, "Forgetful", "-1 Smarts"],
  [17, 18, "Miserable Bastard", "-5 to all Disposition checks"],
  [19, 20, "Bad Hygiene", "Needs 2 days of water to cure Filthy"],
  [21, 22, "Bloodletter", "Loses 2 LIFE before every combat"],
  [23, 24, "Hothead", "Gain Berserk after failing any DC"],
  [25, 26, "Greaseball", "-1 Hotness"],
  [27, 28, "Twitchy Eye", "Unable to use Bows or Crossbows"],
  [29, 30, "Lazy", "-2 Brawn"],
  [31, 32, "Monogamous", "Won't have sex with NPCs"],
  [33, 34, "Dopey", "-2 Smarts"],
  [35, 36, "Slutty", "-3 when saving against Charmed"],
  [37, 38, "Big Softy", "-2 Moxie"],
  [39, 40, "Scaredy Cat", "Gains Terrified at 50% Life"],
  [41, 42, "Creepy Smile", "-2 Hotness"],
  [43, 44, "Shaky Hands", "-3 when Lockpicking"],
  [45, 46, "Greedy Sod", "Needs twice as many rations per day"],
  [47, 48, "Milk Drinker", "Only drinks milk"],
  [49, 50, "Slightly Jerker", "-1 Exertion Uses"]
];

export const VICES = RAW.map(([min, max, name, effect]) => ({ min, max, name, effect }));

export const viceForRoll = n => VICES.find(v => n >= v.min && n <= v.max);
