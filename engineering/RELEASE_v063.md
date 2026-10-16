# North Star Radio Service — v0.63.0 playable PT-44

The first PT-44 now runs one shared behavioral receiver. Actual installed part properties, tuning, volume, alignment, supply and instrument loading produce sound, service readings, tracer levels, AVC and damage together. Correct repairs restore those outputs; unrelated replacement does not clear the fault.

The user approved a scope change to believable surface behavior and cause/effect. The fixed nine-package finish line is now [game completion V2](gameplay/PT44_Game_Completion_V2.json). Full circuit simulation, exhaustive curve matching and exact undocumented wiring are optional research. Original scientific acceptance files remain historical records; V2 closures do not claim that V1 scientific gates passed.

| EC | v0.63 result | Remaining |
|---|---|---|
| EC-04 | **Closed under V2:** playable volume/audio, coupling/bias, output tube, transformer/speaker faults and replacement checkout. | Regression maintenance against the fixed behavioral criteria. |
| EC-06 | **Closed under V2:** full-band high-side conversion, dead/weak oscillator/converter, aerial loop, trim errors, injection and restoration. | Regression maintenance against the fixed behavioral criteria. |
| EC-03 | Supports power, warmup, heater string, residual charge and fault stress. | Complete live power-cycle and cascade acceptance matrix. |
| EC-05 | Supports 455 kHz filtering, three manual IF controls, detector and timed AVC. | Combined IF/detector fault and complete alignment acceptance. |
| EC-07 | Supports loaded DC ports, RF/IF/audio generator and coherent tracer. | Full instrument range, polarity and component-tester matrix. |
| EC-09 | Supports all 20 stock faults in the fixed core matrix plus real-shop repair scenarios. | All-stock-fault browser diagnosis/repair matrix and final acceptance. |
| EC-01 / EC-02 / EC-08 | Remain open/in progress with bounded reviews. | Source/presentation ambiguities; catalog behavior coverage; chassis/access review. |

The PT-44 is not yet fully engineering complete. Broader game development remains on hold. New fidelity work requires a separate scope decision; it does not silently expand these package criteria.

Open `index.html` in a modern browser. The playable bench includes a **Generator / alignment** tab: select aerial, IF or volume injection; set frequency/level; peak 12A/12B/14A and oscillator/aerial trims manually. Supply and alignment persist with the radio. Loop repairs use the existing power-off/discharge guard. The meter offers named service ports with B− reference. Checkout disables the generator and restores the player's tuning/volume after its standard test.

Readings are declared game approximations, not calibrated historical measurements. Extra service ports do not certify unresolved socket wiring. Research ledger panels retain their original narrower scope and are optional references.

Validation: `node tests/test_gameplay_v63.js`; `node tests/test_gameplay_browser_v63.js --browser` with Playwright/Chromium. The game workflow runs both. Historical electrical/SPICE workflows remain available through manual dispatch. See [model scope and reproduction](gameplay/README.md) and [previous research release](engineering/RELEASE_v062.md).

Watermark: **BUILD v0.63.0**.
