# North Star Radio Service — v0.23.0 factory-driven SPICE draft

[Play game](https://ihatecoins.github.io/north-star-radio-service/)

For the first time, a SPICE-compatible passive deck is **generated from the game's source-traced factory circuit graph** rather than hand-written separately. It preserves #15 250 pF, #18 10 nF and #19 4.7 MΩ junctions; #28 speaker-field coil *only* 500 Ω measured DCR (inductance omitted); and #30 tapped line resistor with 40+80 Ω sections (pilot-lamp shunt known but its electrical behavior omitted). The independent AC testbench explicitly drives the volume wiper at 1 VAC; it is NOT a complete receiver or factory voltage simulation.

The Factory ledger can export the generated `.cir` directly from the app's currently certified source graph. Generator: `engineering/pt44_spice_emitter_v1.js`. Configuration: `engineering/PT44_Spice_Export_Policy_V1.json`. Structural parity tests: `tests/test_spice_export_v23.js`, run with existing regressions. GitHub Actions now executes the checked-in deck in ngspice and checks the isolated 10 nF / 4.7 MΩ audio-grid response at 0.1 Hz and 1 MHz. This validates the passive testbench's SPICE execution and RC transfer only; it does not validate a complete receiver. There are still 22 partial source networks and unverified diode/AVC and tube/IF winding details. Prototype gameplay remains unchanged and is not a validated restoration guide.

Watermark: `BUILD v0.24.0`.