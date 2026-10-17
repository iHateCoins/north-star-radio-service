# North Star Radio Service — v0.67.0 title screen

The game opens at a title screen with **Load game** and **New game**. Load is disabled when this browser has no save. Opening the page does not create or overwrite a shop.

New game opens the shop with the first-repair tutorial already active. It guides the player from the repair order through diagnosis, a normal parts purchase, replacement, testing and payment. The separate tutorial opt-in screen is removed. Coaching can still be paused and resumed from the Service manual.

Load game restores the saved shop and its tutorial progress, including a paused guide. The shop header and Service manual provide a return to the title screen. Returning saves the shop and pauses simulation, audio and autosaving until play resumes. New game asks before replacing an existing save and resets runtime tool/power state.

Existing cash, jobs, faults, stock and owned instruments remain in the same save slot. Receiver behavior, cascading damage, prices and service acceptance are unchanged. This release supports **EC-09 end-to-end workflow**; all nine fixed V2 closures remain intact.

Validation retains the 727 core checks, tutorial fixture checks across 50 radios, source/report regressions, all 20 stock-fault browser repairs, UI and full tutorial flows. Title lifecycle and browser tests verify no implicit save, automatic coaching, load/pause/resume, cancellation and confirmed reset, clean runtime, desktop/mobile layout and screenshots. Older browser suites enter through the title screen using the same choices as the player.

Open `index.html` to play. The version is shown on the title screen and in the manual; engineering references remain available with `?engineering=1`.
