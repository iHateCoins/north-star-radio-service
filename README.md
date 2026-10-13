# North Star Radio Service — v0.20.0 Philco original-scan wiring

**Factory source:** user-supplied original Philco 1941 RMS Year Book PDF, printed p.38, original 300 dpi scan (2022x2587 pixels); see `engineering/PT44_Detector_Audio_Trace_Evidence_V1.json` for source SHA-256 and precise image review region.

Four new *source-traced copper conductor groups* around the second IF low end, volume wiper, 7C6 audio grid and passive return. Includes nine new source-limited continuity examples. Two 7C6 diode pins, #17 resistor junction and AVC branching remain unresolved. DO NOT equate passive return with chassis or claim full SPICE. Not engineering complete.

The live browser game retains the v0.19 reduced-order checkout and illustrative 3D wire harness. `index.html` has watermark `BUILD v0.20.0`. All canonical new data is mirrored as separate JSON. The passive SPICE fragment includes only #15 250pF, #18 10nF and #19 4.7MΩ with no unverified diode simulation.

Testing: `node tests/test_detector_trace_v20.js`, plus the existing v0.19, v0.18, v0.17 and v0.16 regression scripts. Prove no new speculative diode edge and no false ohmmeter-open claims.