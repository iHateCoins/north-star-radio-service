# North Star Radio Service — v0.62.0 bounded 7A8 conversion reference

The 7A8 is the remaining converter dependency for the receiver. This version adds an executable **manufacturer-characteristic reference** and a separately driven, unloaded small-signal conversion fixture. It prepares converter work without inventing a self-oscillating PT-44 circuit from the unresolved coupling symbol.

The Factory ledger gains a **7A8 conversion reference** panel for published-condition selection, signal bias, oscillator drive, imposed RF/LO frequencies, AM depth, omitted external clock, restoration and matching SPICE export. Existing receiver equations and converter substitute loads are unchanged. The SPICE release export starts with finer requested time resolution for numerical robustness.

## EC support and closure

| EC supported | Concrete v0.62 evidence | Remaining for closure |
|---|---|---|
| **EC-02** | Two bounded 7A8 characteristic slices, 31 withheld graph-coordinate/typical-point checks and independently executed interpolation. | Receiver-range voltage/drive behavior, loading and heater behavior; remaining tube/winding/audio/field/lamp correlation. |
| **EC-05** | Two captured-state regressions and finer SPICE release initialization at unchanged equations and tolerances. | Actual passband/parameter correlation, long-duration attack/steady AVC and converter feedback. |
| **EC-06** | Separately driven small-signal difference/sum conversion, AM sidebands and bias/drive sensitivity. | Actual oscillator, aerial/RF input, loaded conversion, 540–1600 kHz tracking, alignment, AVC feedback and physical fault response. |

**Full ECs closed: none.** EC-06 is now in progress at the isolated component-fixture level. All nine acceptance lists and all six **NOT MET** completion gates remain unchanged. Broader game work remains on hold.

## Source conditions and limits

The Sylvania 1951 manual, PDF p. 170, supplies two separate curves:

- **Signal-bias slice:** 100 V plate and oscillator anode, 75 V screen, 6.3 V heater, 0.2 mA oscillator-grid current and 50 kΩ oscillator-grid resistor; signal bias −20 to 0 V. Approximate average plate, screen, oscillator-anode currents and conversion conductance are tabulated.
- **Oscillator-drive slice:** 250 V plate, 100 V screen, −3 V signal bias, 6.3 V heater, 250 V oscillator-anode supply through 20 kΩ and 50 kΩ oscillator-grid resistor; 100–1000 µA oscillator-grid current. Only conversion conductance is modeled on this slice.

These are separate published test conditions, with no cross-slice voltage/drive interpolation. The middle 250 V bias graph on that page uses **45 V screen**, so it is not silently combined with the 100 V screen drive curve. The 250 V anode supply is not the electrode voltage. The 1947 Sylvania typical operating points provide additional comparisons. Its separate nominal 7.0 V heater rating does not change the 6.3 V curve conditions or the existing receiver heater model.

Graph coordinates are approximate manual readings. Withheld coordinates use different positions on the same printed curves, not independent physical measurements. Typical-point and graph-reading tolerances are recorded explicitly. Unsupported extrapolation is rejected.

The conversion law is the declared behavioral small-signal relation `i_ac = 2 Gc v_rf(t) cos(2π f_LO t)`. The factor two gives `Gc × RF peak` at the difference-frequency component. RF grid voltage is imposed by an ideal source; the LO is a normalized external clock. Its amplitude is not derived from average oscillator-grid current. A coherent 2 ms window measures the current spectrum; plots, if any, must not substitute for full-rate measurements.

This fixture does not stamp interelectrode capacitances, finite plate resistance, an aerial network or an IF output load. Reference mean currents apply only to the 100 V bias slice under its stated excitation. Omitting the external clock produces zero translated signal and **no DC current prediction**. It does not establish the physical stopped-oscillator currents or a dead-oscillator repair case.

Selecting RF frequencies at 540, 1000 and 1600 kHz and manually setting LO = RF + 455 kHz verifies the frequency translator, **not receiver tracking**. Existing 30 kΩ plate/120 kΩ screen converter substitutes remain in the coupled receiver. No active 7A8 supply coupling, self-oscillation, source ambiguity resolution, converter AVC feedback or receiver completion is claimed.

## Validation and reproduction

- `engineering/PT44_7A8_Characteristics_V1.json`: source URLs/hashes, exact condition boundaries, training and withheld readings, tolerances and limitations.
- `engineering/PT44_7A8_Validation_V1.json`: 31 source checks and 14 conversion scenarios, analytic Fourier targets, timestep refinement, domain guards and exact restoration.
- `engineering/PT44_7A8_Spice_Validation_V1.json`: 405 curve-value comparisons and 12 independently executed conversion cases.
- `engineering/PT44_7A8_Conversion_Reference_v62.cir`: matching default fixture deck.
- `node tests/test_converter_v62.js --record`
- `node tests/test_converter_spice_v62.js --ngspice --record`
- `node tests/test_converter_workbench_v62.js`
- `node tests/test_converter_browser_v62.js --browser`

The new Chromium check exercises bias/drive selection, omitted clock, restoration, exact export and mobile layout. Existing source, supply, audio, detector, IF, alignment, rectifier and AVC checks remain in CI.

The legacy release SPICE check collapsed at the audio plate node for a captured CI open-#17 state; selecting KLU alone exposed a second failure with a service-meter state. Both states are retained in `PT44_AVC_Release_Solver_Fixture_V1.json`. Requested SPICE time resolution is now 1 µs rather than 100 µs, enabling finer adaptive initialization of the residual IF states. The 100 µs maximum timestep, circuit equations, Gear order and all tolerances are unchanged. `PT44_AVC_Release_Solver_Validation_V1.json` records both states under default and KLU engines. The canonical export does not require KLU; the regression suite checks both engines. CI runs these regressions and the complete release set as a separate early job.

## Remaining work

- **EC-01:** Physical diode pins, oscillator coupling interpretation and approved #8 resolution.
- **EC-02:** Receiver-range 7A8 behavior and remaining tube/winding/audio/field/heater/lamp correlation.
- **EC-03:** Active converter currents and RF-operating loads; remaining thermal supply envelope.
- **EC-04:** Audio/transformer/speaker parameter and frequency correlation; shop integration.
- **EC-05:** Actual passband/trimmer/diode correlation, long-duration attack/steady AVC and converter feedback.
- **EC-06:** Actual oscillator/converter/RF network and loaded tracking/fault validation.
- **EC-07/08:** RF/shop instruments, historical service conditions and serviceable chassis access.
- **EC-09:** Full receiver baseline and complete diagnosis/replacement/alignment/checkout acceptance.

Watermark: **BUILD v0.62.0**.
