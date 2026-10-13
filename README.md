# North Star Radio Service

A browser-based 1950s electronics repair-shop prototype. **Current version: v0.15 — PT-44 engineering preview.**

**[Play the game](https://ihatecoins.github.io/north-star-radio-service/)** *(works after this repository is published with GitHub Pages)*

The historical reference radio is the **1941 Philco PT-44**. Its factory circuit transcription and 3D wiring are **work in progress**. The current playable electrical solver is reduced-order, **not** full SPICE; do not treat in-game wiring or readings as a validated restoration guide.

## v0.15 — Tube terminal engineering audit

- Added datasheet-based, eight-position electrode maps for the 7A8, 7B7, 7C6, 50L6GT, and 35Z3 (40 socket positions).
- The **Factory ledger** now displays a tube-pin cross-check and 22 outstanding RF/IF, detector, audio, and power connection-review tasks, filterable by stage.
- Added `engineering/PT44_Tube_Terminals_Review_V1.json`, a machine-readable list of terminal roles and unresolved circuit transcription work.
- Verified against the 16 previously traced/partial factory networks; no new schematic edges have been certified. The existing reduced-order solver and draft passive SPICE netlist are unchanged.
- Regression testing: HTML syntax, five stage filters, 33 factory component rows, healthy checkout, 30 numerical healthy samples, and negative checks for invalid or prematurely certified tube pins.
- **Heater rating clarification (v0.15.1):** Three early 7-series Loktals have historical 7 V nominal type naming but 6.3 V / 150 mA operating references. A simple series estimate gives 103.9 V, **not** a certified PT-44 mains/dropper circuit.
- **Not engineering complete.** Receiver wiring still requires high-resolution Philco schematic review; datasheet pin identities do not establish real-world wire connectivity.

## Playing

Open `index.html` in a modern desktop browser or play via GitHub Pages. Internet access is needed for Three.js r128 from CDNJS and optional web fonts. A 2D fallback is available if WebGL or the library fails to load.

Saves use browser storage; saves on a prior `file://` copy generally **do not automatically transfer** to the GitHub Pages origin. Keep your previous file/save until you confirm your progress on the site.

## Source

- `index.html`: playable browser prototype (currently a single-file app)
- `engineering/PT44_Factory_Transcription_V3.json`: factory parts and traced electrical-network ledger
- `engineering/PT44_Factory_Passive_Subcircuit_DRAFT.cir`: incomplete, **non-runnable** passive SPICE preparation
- `engineering/PT44_Spice_Subset_Audit.json`: audit results for the draft
- `tests/`: development checks
- `scripts/`: build helpers

For the full technical status and known limitations, see the v0.14 source package and the comments in the relevant files. This is an in-development experimental game and not electrical safety advice.

## GitHub Pages setup

In this repository, go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, with **main** and **/(root)**, then save. The public site will be served at:

`https://ihatecoins.github.io/north-star-radio-service/`

You may need to wait a few minutes after enabling Pages before it is live. Subsequent commits to `main` automatically update the hosted build.
