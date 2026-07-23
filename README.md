# Lunar Lander

A monochrome, mobile-first remake of the classic 1979 Atari *Lunar Lander* arcade
game, built with [Phaser 3](https://phaser.io/) and plain HTML/CSS/JS. Designed
for **portrait orientation** on phones, with on-screen touch controls.

Hosted at **<https://lunarlander.upyesp.org>** via GitHub Pages.

## How to play

Rotate the lander and fire the main thruster against gravity to set down gently,
**upright**, on one of the flat landing pads. Smaller pads pay more.

- **◀ / ▶** — rotate the lander
- **THRUST** — fire the main engine (hold). Burns fuel.
- Land with low vertical & horizontal speed and near-upright, on a pad, to score.
- Crash and you lose a life. You have **3 lives**.
- Complete all **5 levels** (each with a different lunar landscape) to win.
- Higher pad multipliers (×1 … ×5) and remaining fuel add to your score.
- Your **hi-score** persists between sessions (saved in `localStorage`).

## Settings

- **Gravity** — a friendly multiplier (0.5× … 2.5×). 1.0× is the default "lunar"
  feel; raise it to make the game harder.
- **Sound** — toggle the synthesized sound effects on/off.

## Project structure

```
index.html           # entry point, loads Phaser + scripts, references favicon
favicon.svg          # lander icon (used as favicon & apple-touch-icon)
css/style.css        # full-screen, no-scroll mobile layout
js/
  util.js            # shared constants, lander drawing, button helper, PRNG
  audio.js           # tiny WebAudio synth (thrust rumble, beep, crash) - no assets
  main.js            # Phaser config & boot
  scenes/
    Boot.js          # load persisted settings -> Menu
    Menu.js          # title, hi-score, NEW GAME, settings gear
    Settings.js      # gravity slider + sound toggle
    Game.js          # terrain gen, physics, controls, HUD, win/lose
    GameOver.js      # game over / mission complete screen
.nojekyll            # ensures GitHub Pages serves the folders as-is
CNAME                # custom domain for GitHub Pages
```

## Running locally

Because the game is 100% static you can just open `index.html` in a browser, but
for reliable behaviour (and to test on your phone) serve the folder over HTTP:

```bash
# Python
python -m http.server 8080
# or Node
npx serve .
```

Then visit `http://localhost:8080` (and use your phone's browser in dev tools
mobile mode, or open it via your LAN IP).

## Notes

- Sound is synthesized in-browser with the Web Audio API, so there are **no audio
  files** to host — ideal for a static GitHub Pages site.
- The game scales to fit any screen while keeping its 9:16 portrait aspect ratio.
- All graphics are vector line-art drawn with Phaser `Graphics` — pure black & white
  (monochrome), matching the original's aesthetic.
