# Moonclan Mystery: The Game

Moonclan Mystery is a local browser roleplay game inspired by wild forest cat adventure stories. You play as Bramblepaw, a Moonclan apprentice who investigates Willowfur's murder, earns a warrior name, becomes deputy, raises or mentors younger cats, and can eventually continue as a Starclan ghost.

The project runs in Podium at:

```text
http://warrior-cats-mystery/
```

The static browser version is also suitable for GitHub Pages. The repository includes a `docs/` copy of the static game so GitHub Pages can publish from the `master` branch `/docs` folder without a build step.

## For Players

Start on the title screen, choose `PC` or `Mobile`, then press `Start`.

Controls:

- PC movement: `ArrowLeft` / `ArrowRight` or `A` / `D`
- PC jump: `Space`, `W`, or `ArrowUp`
- PC hunting catch: `ArrowDown` or `S`
- Mobile mode: on-screen arrow buttons appear after starting
- Click cats, dens, evidence, area buttons, and story buttons to interact
- Every button has a short sparkly click sound

Core loop:

1. Question Moonclan cats and inspect evidence.
2. Use `Solve` to accuse the murderer before the day limit runs out.
3. If correct, the murderer is cast out and you become a warrior.
4. Explore camp, borders, hunting grounds, fighting grounds, dens, Sunclan border, Gatherings, and the Moonpool.
5. Advance time by sleeping in the Warrior Den.

## Story Features

The first murderer is randomized every new game. Whiskerstar and Ashfall cannot be chosen as the first murderer, and all clues/evidence are rewritten to point to the chosen culprit. If you guess wrong, or if the murder deadline expires, the game returns to the title screen with a loss message.

After the first mystery:

- The murderer is removed from normal camp, den, border, hunting, fighting, and Gathering sprites after exile.
- On day 7, you see the exiled murderer return with blood, then Whiskerstar is found dead only after you return to camp.
- Ashfall becomes Ashstar, and Brambleclaw becomes deputy.
- Ashstar travels to the Moonpool, receives lives from Starclan, and returns to camp.

Deputy life includes:

- Organizing patrols of exactly 3 eligible cats.
- Random patrol reports.
- A possible one-time abandoned kit event.
- Riverkit becoming Riverpaw, with Brambleclaw named as mentor.
- Riverpaw training, hunting, fighting, and joining patrols as an apprentice.
- Riverpaw later becoming Riverheart at an Ashstar meeting.

Clan life includes:

- Dens with clickable cats inside.
- Hunting mice with a small timing minigame.
- Giving prey to build trust.
- Tic-tac-toe at the borders for a one-time rose prize.
- Opposite-gender mate selection using the rose at 3/3 trust.
- One possible litter only, randomized from 1 to 4 kits.
- Kits appearing in camp with blended fur colors.
- Ashstar calling meetings when kits become apprentices and apprentices become warriors.
- Newly grown apprentices and warriors appearing with updated names and becoming patrol eligible.
- Gatherings every 7 days after becoming deputy, with Moonclan, Sunclan, and Dawnclan leaders on the great tree.

Late game:

- At 40 moons, Brambleclaw dies peacefully of old age.
- The player may restart or continue as a ghost.
- Ghost mode makes the player starry and floating.
- Living cats cannot talk directly to ghosts, but they sense a presence nearby.
- Starclan cats appear around areas and can speak to the player.
- The Moonpool is always available in ghost mode.
- At Gatherings, only dead cats can talk to the ghost player.
- If the player had a mate, 10 ghost moons later the murderer kills the mate for revenge, and the mate joins Starclan.

## Main Characters

- Player: Bramblepaw, later Brambleclaw
- First leader: Whiskerstar
- First deputy: Ashfall, later Ashstar
- Warriors: Mistclaw, Ravenstripe, Brindleleaf, Cloudspark, Pinefoot, Sorreltail
- Medicine cat: Rosesong
- Elder: Oakwhisker
- Starting nursery kits: Pebblekit, Mosskit, Tinykit
- Sunclan cats: Nettleclaw, Dawnpelt, Russetfang, Sunstar
- Dawnclan leader: Dawnstar
- Starclan cats: Silverstar, Moonwhisper, Frostheart, Littlekit, and later story-dependent dead cats

## Project Structure

```text
.
├── README.md
├── package.json
├── package-lock.json
├── server.js
├── docs
│   ├── index.html
│   ├── game.js
│   ├── styles.css
│   └── assets
│       └── forest-camp.png
└── public
    ├── index.html
    ├── game.js
    ├── styles.css
    └── assets
        └── forest-camp.png
```

Important files:

- `docs/`: static GitHub Pages copy of the browser game.
- `server.js`: tiny Node static server.
- `public/index.html`: page shell, game HUD, world container, title screen, mobile controls, den and cutscene overlays.
- `public/game.js`: all game state, story progression, NPC rendering, movement, controls, minigames, patrols, kits, ghost mode, and audio.
- `public/styles.css`: visual world, scenes, dens, CSS cat sprites, title screen, mobile controls, effects, and animations.
- `public/assets/forest-camp.png`: generated forest background used by the camp/title screen.

The game has no database and no default credentials.

## Podium Commands

Start the project:

```bash
podium up warrior-cats-mystery
```

From this project directory, restart the app process:

```bash
podium supervisor restart all
```

Check project status:

```bash
podium status warrior-cats-mystery
```

Check JavaScript syntax:

```bash
podium node --check public/game.js
```

Verify the site responds:

```bash
curl -sI --max-time 10 http://warrior-cats-mystery/
```

Expected HTTP status is `200 OK` or another 2xx/3xx status.

## Updating The GitHub Pages Game

GitHub Pages is configured to publish from the `master` branch `/docs` folder. The local Podium game is served from `public/`, so updates must be copied into `docs/` before committing.

After changing the game:

```bash
podium node --check public/game.js
cp -r public/. docs/
podium supervisor restart all
curl -sI --max-time 10 http://warrior-cats-mystery/
git add .
git commit -m "Update game"
git push
```

After the push, GitHub Pages rebuilds automatically. It usually takes 30 seconds to a few minutes. The public URL is:

```text
https://shrimpwagon.github.io/warrior-cats-mystery/
```

You can check the live page with:

```bash
curl -sI --max-time 10 https://shrimpwagon.github.io/warrior-cats-mystery/
```

## Notes For AI Agents

This is a Podium-managed plain Node project. Do not install runtimes or services on the host. Run project tooling through Podium, for example `podium node --check public/game.js`.

Keep generated game files inside this project directory. The game is intentionally simple and self-contained:

- No build step.
- No frontend framework.
- No database.
- No asset pipeline.
- No package install needed for normal edits.

When changing behavior, start with `public/game.js`. Most features are driven by the global `game` state object created in `resetGame()`. Important state and behavior areas:

- `baseCast`, `extraCats`, and `firstLines`: core cat data and dialogue.
- `chooseMurderer()` and `applyMysteryClues()`: randomized first mystery setup.
- `renderCats()`, `addNpc()`, and `renderAreas()`: scene rendering and clickable NPC/area buttons.
- `speak()`, `inspectEvidence()`, and `accuse()`: first murder investigation.
- `sleepInWarriorDen()`: main day-advance scheduler.
- `showSecondMurder()` and `gatherClanAfterMurder()`: Whiskerstar murder and deputy promotion.
- `patrolOptions()`, `sendPatrol()`, and `resolvePatrol()`: deputy patrol system.
- `updatePatrolAndApprenticeTimeline()` and `updateKitsTimeline()`: apprentice/warrior promotion meetings.
- `askForKits()`: mate and litter flow.
- `endOldAge()`, `becomeGhost()`, and `updateGhostTimeline()`: ghost mode.
- `movePlayer()`, `jump()`, and mobile control listeners near the end of the file: movement.
- `playButtonSound()`: generated Web Audio click sound for buttons.

When changing visuals, edit `public/styles.css`. Cat sprites, dens, rivers, scenes, title stars, Starclan glow, and mobile controls are CSS-based. Avoid replacing the current CSS sprite system with external assets unless explicitly requested.

If you change the browser game and want GitHub Pages to reflect it, copy `public/` into `docs/` before committing:

```bash
cp -r public/. docs/
```

Do not push game changes without copying `public/` to `docs/`; otherwise the local Podium version and the GitHub Pages version will drift apart.

After edits, run:

```bash
podium node --check public/game.js
podium supervisor restart all
curl -sI --max-time 10 http://warrior-cats-mystery/
```

Do not report the project ready unless the final curl returns a 2xx or 3xx HTTP status.
