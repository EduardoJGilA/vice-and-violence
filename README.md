# Vice & Violence (Foundry VTT v14)

Unofficial Foundry VTT game system for **Vice & Violence** (version `0.6.2`, compatible with Foundry VTT `14`, verified on `14.364`, English).

## Features

- **Actor & Item Data Models (`ApplicationV2` sheets)**
  - **Actors:** `character`, `npc`
  - **Items:** `weapon`, `armour`, `staff`, `spell`, `class`, `race`, `birthsign`, `vice`, `gear`, `feat`
  - **Sheet Theme:** Client setting (`auto`, `light`, `dark`) in Foundry's system settings.
- **Core Rolls & Procedures**
  - **Abilities & Stealth:** d20 ability checks (`Smarts`, `Brawn`, `Moxie`, `Hotness`), `LIFE` rolling (`5 + 1d6 + Moxie`), and Stealth checks factoring in alertness DC, equipped armour save/stealth penalties, and `Drunk` / `Filthy` status penalties.
  - **Combat & Armour:** Weapon damage (`die + material bonus + Brawn`, or NPC flat attack die) and Armour Save rolls (`armourSave + armourBonus`).
  - **Spellcasting & Fuck Up Table:** Casting thresholds by Wizard rank, Blood Magic LIFE cost, Staff charge absorption on failed casts, Advanced Spell armour restriction checks (`Skimpy` or unarmoured), and the 11-entry Fuck Up Table.
  - **Downed & Death Flow:** Automatic `downed` status at `0` LIFE (and recovery when healed above `0`), downed turn tracking, and death table outcomes (`gone`, `ghost`, `zombie`).
  - **Vices:** d50 Vice table (including `Constant Daydreaming` initiative handling).
- **Custom Combat Tracker**
  - Initiative ordering by keyword: `Preemptive` > players > `Interspersed` / `Rapid` > `Reactive` (with `Constant Daydreaming` last).
  - Automatic combat/tactical action refresh and downed turn ticking at turn start.
  - Whispered GM reminders for active `Rapid` NPCs after each player turn.
- **Status Effects**
  - Registers system statuses (`downed`, `knocked`, `prone`, `poisoned`, `drunk`, `filthy`, `burning`, `stun`, `terrified`, `charmed`, `horny`, `blinded`, `restrain`, `berserk`, `dehydrated`, `starving`, `exhausted`).

## Compendia

Source data lives in `scripts/pack-data.mjs` and `packs-src/`, compiled into LevelDB packs under `packs/`:

- `races` — Races
- `birthsigns` — Birthsigns
- `weapons` — Weapons
- `armours` — Armours
- `spells` — Spells
- `grimoires` — Grimoires
- `classes` — Classes
- `feats` — Class Feats
- `tables` — Roll Tables
- `creatures` — Creatures

## Installation & Setup

Because compiled LevelDB files in `packs/` are gitignored, build the compendia after cloning:

1. Place or clone this repository inside Foundry's `Data/systems/vice-and-violence` directory.
2. Install dependencies and compile the compendium packs:
   ```bash
   npm install
   npm run build:packs
   ```
3. Launch Foundry VTT and create a world using the **Vice & Violence** system.

## Development

### Scripts

- **`npm test`** — Runs unit and compendium source validation (`node test/logic.test.mjs`).
- **`npm run packs:src`** — Regenerates `packs-src/<pack>/*.json` from `scripts/pack-data.mjs`.
- **`npm run build:packs`** — Compiles `packs-src/` into LevelDB compendia in `packs/` via `@foundryvtt/foundryvtt-cli`.

> [!IMPORTANT]
> After changing anything in `scripts/pack-data.mjs`: run `npm run packs:src`, **stop Foundry** (Foundry keeps the compendium LevelDB files locked while running), run `npm run build:packs`, and then start Foundry again.

### Project Structure

- `system.json` — Foundry system manifest
- `vice-and-violence.mjs` — System entry point, data models, sheets, settings, and status registration
- `module/` — Data models (`data/`), document classes (`documents/`), game rules (`logic.mjs`), hooks (`hooks.mjs`), sheets (`sheets.mjs`), and status config (`config.mjs`)
- `templates/` — Handlebars templates (`actor.hbs`, `item.hbs`)
- `styles/` — Active stylesheet (`vv-0.6.1.css`), SVG art, and self-hosted fonts
- `lang/en.json` — English localization strings
- `scripts/` — Compendium source data (`pack-data.mjs`) and pack build scripts (`generate-packs-src.mjs`, `build-packs.mjs`)
- `packs-src/` — Generated JSON compendium sources
- `test/logic.test.mjs` — Rule logic and compendium source tests

## Fonts & Assets

- Self-hosted fonts in `styles/fonts/` (`PirataOne-Regular.ttf` and `HankenGrotesk-Variable.ttf`) are licensed under the **SIL Open Font License 1.1** (see `styles/fonts/OFL.txt` and `styles/fonts/OFL-HankenGrotesk.txt`).
- No copyrighted rulebook artwork is bundled with this system.
