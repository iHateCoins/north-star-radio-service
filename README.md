# North Star Radio Service — v0.60.0 shared 35Z3 curve references

The supply, nonlinear audio and coupled IF circuits now share an explicit **35Z3 reference selection**. The existing GE 18 V / 200 mA single-point approximation remains the default (`ge_legacy`) for reproducibility. A separately identified RCA 1947 model (`rca_1947`) uses its published average forward characteristic at nominal 35 V heater voltage. The selected model follows the circuit controls, background workers, alignment-to-IF settings transfer and matching SPICE exports.

The RCA 3/2-power law is anchored at 20 V / 200 mA and checked against **seven withheld curve readings** over 5–40 V forward drop. Approximate manual graph readings have a declared 8 mA + 3% tolerance. This bounds the graph comparison; it does not measure production spread or identify the installed tube. The GE law is retained as a separate manufacturer reference, not relabeled as validated against the RCA curve.

## EC support and closure

| EC supported | Concrete evidence added in v0.60 | Full EC closed? |
|---|---|---|
| **EC-02** | Source/hash/conditions, separated fit and withheld 35Z3 readings, derivative and reference-point checks. | No |
| **EC-03** | Shared rectifier selection through actual modeled stage currents; loaded AC/DC supply sensitivity, faults and independent SPICE execution. | No |
| **EC-07** | Selected reference recorded in conditions and exports; explicit forward-curve coverage during startup and measurement. | No |

All nine acceptance lists and all six **NOT MET** gates remain fixed. No full EC closes. Broader game development remains on hold.

## Conditions and limits

The power bench reports conducting time-step counts outside the RCA curve's **5–40 V forward-drop range**, separately for the whole run and the final measurement window. Those steps use extrapolation. GE coverage is reported as unavailable because that model has only one reference point. Counts are discrete sample counts, not a continuous time fraction or a tube-rating check.

Both reference laws still omit heater-dependent emission, reverse leakage/breakdown, saturation and cold-heater behavior. Hot heater resistance, lamp behavior and field L remain approximations. A nominal-heater average curve does not establish operation across all supported line voltages. Supply variation here checks the declared electrical model and its sensitivity, not historical receiver calibration. No factory voltage labels were used to fit it.

Supply validation covers 90/115/130 V AC and DC with both laws, plus RCA dry-reservoir, weak/open rectifier, discharge and restored cases. The dry-reservoir fixture uses a four-times finer step, with an additional refinement check, because the smaller capacitor sharpens charging pulses. The power fixture still uses declared stand-in load resistors. Six hot DC operating points separately exercise the actual modeled IF/audio/supply currents at those line voltages; the 7A8 converter remains substituted.

## Remaining work

- **EC-01:** Physical diode pins, oscillator coupling interpretation and approved #8 value resolution.
- **EC-02:** Remaining tube, winding, audio/transformer, volume, field, heater and lamp correlation; 35Z3 extrapolation and thermal behavior.
- **EC-03:** Actual converter currents; complete coupled-receiver AC/DC startup/discharge and heater/lamp/field envelope.
- **EC-04:** Audio parameter/frequency envelope and shop integration.
- **EC-05:** Correlated passband/trimmer/diode parameters, long-duration attack/steady AVC and converter feedback.
- **EC-06:** RF/oscillator/converter tracking over 540–1600 kHz.
- **EC-07/08:** RF/shop instruments, historical service conditions and serviceable chassis crosswalk.
- **EC-09:** Full receiver baseline and complete diagnosis/replacement/alignment/checkout acceptance.

## Evidence and reproduction

- `engineering/PT44_35Z3_Curve_Reference_V1.json`: manufacturer URL/hash, nominal conditions, fit, withheld points and reading tolerances.
- `engineering/PT44_35Z3_Validation_V1.json`: curve, derivative, supply, receiver load and fault/restoration checks.
- `engineering/PT44_35Z3_Spice_Validation_V1.json`: independently executed loaded supply waveforms and actual-stage DC points.
- `node tests/test_rectifier_v60.js --record` regenerates electrical evidence.
- `node tests/test_rectifier_spice_v60.js --ngspice --record` regenerates independent evidence.
- `node tests/test_rectifier_browser_v60.js --browser` exercises selected-model propagation through supply/audio/alignment/IF controls, real workers, exports and mobile layout.

Existing source, power, audio, detector, IF, alignment and AVC release regressions remain in CI. Watermark: **BUILD v0.60.0**.
