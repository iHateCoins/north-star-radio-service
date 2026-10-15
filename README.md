# North Star Radio Service — v0.56.0 detector and AVC milestone

The Factory ledger now has a **Detector / AVC bench** alongside the coupled audio/power bench. A floating 455 kHz AM input drives both schematic-level 7C6 diode plates and the traced #7/#8/#15/#17/#18/#19/volume network. The solver resolves individual carrier cycles, recovered audio, and AVC arrival/release. Controls expose signal strength/modulation, volume, both unresolved #8 values, loaded probes, faults, restoration and matching SPICE export. A generated background worker keeps the interface responsive.

This is a detector subset. Its diode space-charge law, 50 kΩ IF source and 500 kΩ linear volume control are explicit assumptions. The second IF transformer and active 7B7 are not yet modeled here; AVC does not yet control converter/IF gain, and the detector is not yet joined to the nonlinear audio/supply or shop receiver. Diode physical pins 5/6 and #8 factory value remain unresolved. The default 12 ms signal interval shows AVC charging, not steady-state sensitivity. All readings reference B-minus; no metal-chassis bond is asserted.

Validation and conditions are recorded in:
- `engineering/PT44_Detector_AVC_Model_V1.json`
- `engineering/PT44_Detector_AVC_Validation_V1.json`
- `engineering/PT44_Detector_AVC_Spice_Validation_V1.json`
- `engineering/PT44_Remaining_Actions_V1.json`

Run `node tests/test_detector_dynamics_v56.js` and `node tests/test_detector_workbench_v56.js` for numerical, fault, loading, variant, convergence, source-mutation and worker checks. Run `node tests/test_detector_spice_v56.js --ngspice` with ngspice available for independent circuit execution. Use `--record` to regenerate the corresponding validation artifact. Run `node tests/test_detector_browser_v56.js --browser` with Playwright/Chromium for the actual page, worker, form controls, fault/restoration, export and narrow-screen check. GitHub Actions retains browser screenshots and measurement evidence for seven days.

Watermark: `BUILD v0.56.0`. **All six full-receiver gates remain NOT MET.** The fixed nine-outcome remaining-work list is shown in the Factory ledger. Next work is active/tuned IF and real supply loading, AVC gain feedback, detector/audio/supply coupling, RF/converter tracking, parameter correlation, chassis/instrument/shop integration and full diagnosis/replacement/alignment/checkout acceptance.
