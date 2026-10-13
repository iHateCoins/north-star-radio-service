# North Star Radio Service — v0.21.0 passive circuit milestone

[Play current game](https://ihatecoins.github.io/north-star-radio-service/)

This release adds genuine **complex nodal (frequency-domain) passive circuit analysis** with a generic linear R/C solver, using only the source-traced Philco #15, #18, and #19 junctions. It calculates the isolated #18/#19 high-pass bench at 1 V ideal AC source (0, 1, 10, 1000 and 455000 Hz) and #15 capacitive reactance at 455 kHz. These are **isolated model results, not actual PT-44 signal gain**. All source fields live in `engineering/PT44_Isolated_Passive_MNA_V1.json` and the solver source is `engineering/pt44_passive_ac_solver_v1.js`.

No unverified diode/AVC wiring, coil inductances, speaker or tube models are added. The factory graph remains at 22 traced networks; this is **not** a complete factory circuit nor SPICE integration. The previously shipped playable shop stays on its simplified solver. `BUILD v0.21.0` watermark.

Run tests: `node tests/test_passive_mna_v21.js` plus existing `tests/test_detector_trace_v20.js`, `tests/test_tube_internal_v19.js`, `tests/test_continuity_v18.js`, `tests/test_bench_v17.js`, `tests/test_passive_devices_v16.js`. The new tests inject bad factory values, bad graph junctions, nonfinite frequency and a singular bench circuit to ensure errors are detected.