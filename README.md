# North Star Radio Service — v0.58.0 source-corrected IF alignment

The PT-44 engineering panel now has a loaded IF frequency sweep and three independent adjustments. The previous generic fixture had a tuning capacitor across both windings of each IF transformer and uniform 30 Ω winding resistances. Philco p.38 instead shows **12A/12B across the first IF windings and 14A across the second IF secondary**, with **31/29/45/6.8 Ω** printed winding DCRs. The model now follows those branches and values; it does not invent a second-IF primary tuning capacitor. Tube/parasitic capacitances remain explicit.

The sweep linearizes the same coupled 26-variable MNA at its no-signal hot DC operating point and solves the complex equations across frequency. It reports IF grid/plate/secondary magnitude and phase, sampled peak frequency and the contiguous −3 dB band around the highest peak. The equivalent AC SPICE export executes independently. Trimmers can be adjusted separately or optimized in the documented 12A → 12B → 14A order for maximum infinitesimal IF-secondary voltage at 455 kHz. Settings transfer directly into the nonlinear IF/detector/audio/supply test.

The Sylvania 7B7 curves end at zero control-grid voltage. The previous clamp made the slope at zero ambiguous for AC analysis. The final tabulated slope now continues to +3 V in screen-normalized coordinates as an explicit **uncalibrated extrapolation**, and the grid-current Jacobian uses the analytic derivative. Published manufacturer anchors remain checked. L, coupling, core-loss Q, actual tuning capacitance, positive-grid behavior, physical trimmer range and other inherited component approximations still need correlation.

## What this version supports toward engineering completion

Every release must report the EC IDs supported, concrete evidence added toward closure, and any EC IDs actually closed. The nine acceptance lists remain fixed in `engineering/PT44_Remaining_Actions_V1.json`.

| EC supported | Evidence added in v0.58 | Full EC closed? |
|---|---|---|
| **EC-02** | Source-backed winding DCRs, separate copper/core loss, and a checked numerical tube-table boundary. | No |
| **EC-05** | Three independent source-drawn controls, loaded complex IF response, bandwidth checks and fixture alignment recovery. | No |
| **EC-07** | Defined DC/current-injection conditions and measured instrument loading in the IF sweep. | No |
| **EC-09** | Misalign → adjust → recover demonstrated in the coupled detector/audio/supply arrival fixture. | No |

No full EC or full-receiver engineering gate closes in this increment. The current milestone support record and the latest remaining work are displayed in the Factory ledger. Broader game development remains on hold.

## Conditions and limits

The sweep is infinitesimal AC about a no-signal DC point. Its 1 µA input is a normalization, **not a validated finite-amplitude sensitivity measurement**; it does not predict detected audio or dynamic AVC regulation. The input remains an external converter-current boundary, rather than Philco's complete antenna-side generator hookup. The ±25% adjustment range is a fixture bound, not documented physical trimmer travel. Reported bandwidth is the declared circuit's response, not a published factory acceptance target. All voltages reference B-minus; no chassis bond is asserted.

RF/converter tracking and actual 7A8 loads, the three source ambiguities, remaining parameter correlation, long-duration AVC, the full supply/audio envelope, authoritative shop instruments/chassis mapping and complete diagnosis/replacement/alignment/checkout acceptance remain open.

## Evidence and checks

- `PT44_IF_Tuning_Winding_Trace_V1.json`: p.38 branch/DCR review, source hash and limits.
- `PT44_IF_Alignment_Validation_V1.json`: complex-solver oracle, controls, loaded response, sweep-grid convergence and deterministic alignment recovery.
- `PT44_IF_AC_Spice_Validation_V1.json`: independent complex magnitude/phase comparisons across healthy, aligned, detuned, loaded, dead-stage, supply and coupling cases.
- `PT44_IF_Alignment_Transient_Validation_V1.json`: alignment recovery through the coupled nonlinear audio/supply arrival fixture.
- Existing coupled transient validation artifacts are regenerated for the corrected IF circuit.

Run `node tests/test_if_alignment_v58.js`, `node tests/test_if_alignment_transient_v58.js`, and `node tests/test_if_alignment_workbench_v58.js`. Run `node tests/test_if_ac_spice_v58.js --ngspice` for independent AC execution and `node tests/test_if_spice_v57.js --ngspice` for coupled transient comparisons. `--record` regenerates numerical evidence. Run `node tests/test_if_alignment_browser_v58.js --browser` with Playwright/Chromium for actual controls, adjustment, exact export, settings transfer, probe loading and mobile layout. Existing power/audio/detector/IF checks remain in CI. Browser artifacts are retained for seven days.

Watermark: **BUILD v0.58.0**. All six full-receiver gates remain **NOT MET**.
