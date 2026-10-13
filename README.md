# North Star Radio Service — v0.22.0 model-derived fault study

[Play current game](https://ihatecoins.github.io/north-star-radio-service/)

Extends the factory-source-backed AC passive solver (v0.21) with **physically calculated hypothetical failure signatures** for PT-44's #18 0.01 µF coupling capacitor and #19 4.7 MΩ grid resistor, whose connections were inspected from native Philco RMS 1941 p.38. The new isolated fault lab compares healthy/open/short/leaky #18, plus drifted #19 at 0, 10, and 1000 Hz, using complex nodal equations rather than scripted damage outcomes.

**Important limitation**: failure severities (0.01 Ω short, 100 kΩ leakage, 470 kΩ drift) are user-independent illustrative examples. The imposed wiper stimulus is a 1 V ideal AC source, not an actual antenna or tube output. These faults do **not yet affect in-game components, full signal reception, audio output, 3D connections or game-generated repair orders**. Neither the diode/AVC wiring nor SPICE/tube/IF models are complete. The canonical factory graph remains at 22 partial nets and benchmark-ready=false.

Source and configuration: `engineering/pt44_isolated_faults_v1.js`, `engineering/PT44_Isolated_RC_Faults_V1.json`; validation: `tests/test_fault_study_v22.js`. The watermark is now `BUILD v0.22.0`.