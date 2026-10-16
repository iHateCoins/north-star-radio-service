# North Star Radio Service — v0.64.0 PT-44 game completion

The first PT-44 meets all nine fixed V2 engineering packages when the release CI passes. The receiver remains a bounded behavioral game model: symptoms, sound, tools, controls, damage and repair outcomes share installed part properties. Full circuit simulation remains optional research.

The approved V2 package IDs, titles and acceptance wording are unchanged. A checked-in signature guards that finish line. Original scientific V1 records remain intact and do not become scientific passes through this release.

| EC | v0.64 closure evidence |
|---|---|
| EC-01 | Named 0.05 µF game variant; 0.1 µF acknowledged alternative; functional detector/AVC and oscillator labels without invented physical pin/winding assignments. |
| EC-02 | Every sold component class, 346 compatible catalog placements, missing/failed behavior, wrong-value/rating response and enforced compatibility; wound field assembly presentation. |
| EC-03 | Live warmup, heater-string faults, AC/DC envelope, hot-off and checkout charge, discharge guards and damaging fault cascades. |
| EC-04 | Retains v0.63 audio closure and extends stock repair coverage. |
| EC-05 | IF/detector faults, independent upstream tracer, 455 kHz selectivity, timed AVC and loaded probing, manual alignment recovery. |
| EC-06 | Retains v0.63 RF/converter closure and extends oscillator/converter repair coverage. |
| EC-07 | Shared tube/cap test results, pulled-part guards, current-limited leakage test, meter range/polarity/live-ohms checks, generator and tracer. Service references now declare the actual 115 V / volume 6 / 880 kHz / 11 MΩ conditions and B− return. |
| EC-08 | Every repairable slot has a named location and camera-independent Inspector selector; full removal/install pass, compatibility guards and field assembly rendering. |
| EC-09 | All 20 stock faults through saved browser diagnosis, incorrect-repair checkout, replacement and successful checkout, plus healthy baseline, migration, alignment and cascade tests. |

The authoritative statuses and evidence are in [game completion V2](gameplay/PT44_Game_Completion_V2.json). [Service scope](gameplay/PT44_Service_Scope_V1.json) declares the game variant, component classes and physical presentation boundaries. Exact undocumented lead dress, hidden socket mapping and precision historical calibration remain outside V2; future fidelity additions are separate scope decisions.

Open `index.html` to play. Use the Inspector's **Service part** selector to locate any supported part. Pull tubes or capacitors for component tests; power off and discharge before replacement. Use **Generator / alignment** for aerial, IF or volume injection, manual peaking, loop connection and AC/DC settings. Checkout disables the generator and retains filter charge after its powered run.

Validation runs `node tests/test_gameplay_v63.js` (208 retained checks), `node tests/test_completion_v64.js` (519 checks including 346 catalog placements), EC/source regressions, the retained v0.63 Chromium suite and four new browser matrix shards covering every stock fault and the remaining service criteria. Workflow artifacts contain measurements, checkout records and desktop/mobile screenshots. Historical electrical/SPICE workflows remain manual research tools.

After this release is merged with passing game CI, the PT-44 engineering hold is satisfied and broader game development can resume. Further fidelity work does not reopen a closed EC unless it violates the fixed V2 acceptance.

Watermark: **BUILD v0.64.0**.
