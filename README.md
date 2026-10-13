# North Star Radio Service

A browser-based 1950s electronics repair-shop prototype. **Current version: v0.14 — PT-44 engineering preview.**

**[Play the game](https://ihatecoins.github.io/north-star-radio-service/)** *(works after this repository is published with GitHub Pages)*

The historical reference radio is the **1941 Philco PT-44**. Its factory circuit transcription and 3D wiring are **work in progress**. The current playable electrical solver is reduced-order, **not** full SPICE; do not treat in-game wiring or readings as a validated restoration guide.

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
