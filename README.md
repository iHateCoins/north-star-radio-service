# North Star Radio Service — v0.61.0 idle receiver supply envelope

The same 26-state IF/detector/audio/supply circuit now runs AC/DC electrical charging, ripple and discharge with **actual modeled 7B7 and audio currents**. This extends the brief hot-DC IF fixture to an idle receiver supply study; it does not inject a carrier. The remaining 7A8 plate/screen demand is still represented by explicit converter substitutes.

The Factory ledger adds an **Idle receiver supply** panel with line/rectifier/instrument conditions, filter and tube faults, source removal, restoration, timed measurements, a rail-voltage plot and a matching SPICE export. Calculations run in a background worker.

## EC support and closure

| EC supported | Evidence added in v0.61 | Full EC closed? |
|---|---|---|
| **EC-03** | AC/DC charging, ripple and discharge with jointly solved IF/audio loads; line/reference sensitivity, faults and restoration. | No |
| **EC-04** | Electrical speaker hum and filter-fault response under the same receiver/supply loading. | No |
| **EC-07** | Explicit idle input, initialization, line/rectifier/probe settings, measurement windows, numerical bounds and curve extrapolation. | No |

All nine acceptance lists and six **NOT MET** completion gates remain unchanged. No full EC closes. Broader game development remains on hold.

## Conditions and limits

Capacitor voltages and inductor currents start at zero. Heater resistance and emission start at their nominal-hot assumptions and have no temperature evolution. This is **electrical storage charging, not cold thermal startup**. Switching off removes the source, while the assumed emission laws remain; heater cooling is not simulated.

No synthetic detector voltage or injected IF current drives this fixture. The actual modeled 7B7, 7C6 and 50L6 currents load the shared supply. The 30 kΩ converter plate and 120 kΩ screen substitutes remain. Neither RF reception nor long-duration signal-driven AVC regulation is established. There is no acoustic speaker calibration.

Backward Euler uses a default 1/48000 s step. Signal-node stopping tolerance is 20 pA, supply-node stopping allowance is 1 nA; accepted normalized residual remains below 10 nA. Half-step checks and comparison with the existing stricter 20 fA signal-node solver bound the reported supply behavior. This supply tolerance is separate from the tight sub-microvolt AVC release solver, which is unchanged.

The 10% reservoir-capacitance fault uses an eight-times finer 1/384000 s step to resolve narrow charging pulses against SPICE; its comparison tolerance is unchanged.

Measurements use full-rate states over the final six mains periods; plots are decimated. Full-rate interpolated charging/discharge checkpoints are retained separately. Supply duration/step govern the run; the receiver parameter block retains inherited IF timing defaults that are unused with zero injection. All node voltages reference B-minus; no chassis bond is asserted. The switch-off fixture records the actual modeled discharge curve rather than imposing the older resistor-load decay time.

GE legacy and RCA reference selection follows the same shared circuits and exports. RCA checks remain limited to nominal heater conditions and 5–40 V forward drop. Extrapolated conducting steps are reported separately for the whole run and measurement window. Emission-scaled faults and unverified tube, transformer, field, heater and lamp parameters remain assumptions. No historical voltage label was used as a pass/fail target.

## Remaining work

- **EC-01:** Physical diode pins, oscillator coupling interpretation and approved #8 resolution.
- **EC-02:** Remaining tube/winding/audio/field/heater/lamp correlation, including rectifier extrapolation and thermal behavior.
- **EC-03:** Actual converter currents; full receiver with RF operating; cold-heater/lamp/field behavior and broader supply envelope beyond the idle fixture.
- **EC-04:** Audio/transformer/speaker parameter and frequency-envelope correlation; shop integration.
- **EC-05:** Passband/trimmer/diode correlation, long-duration attack/steady AVC and converter feedback.
- **EC-06:** RF/oscillator/converter tracking across 540–1600 kHz.
- **EC-07/08:** RF/shop instruments, historical service conditions and serviceable chassis access/crosswalk.
- **EC-09:** Full receiver baseline and complete diagnosis/replacement/alignment/checkout acceptance.

## Evidence and reproduction

- `engineering/PT44_Receiver_Power_Fixture_V1.json`: conditions, faults, numerical contract and limits.
- `engineering/PT44_Receiver_Power_Validation_V1.json`: AC/DC, line/reference/probe sensitivity, faults/restoration, discharge and precision checks.
- `engineering/PT44_Receiver_Power_Spice_Validation_V1.json`: independent adaptive Gear execution with zero electrical initial storage; waveform statistics and charging/discharge checkpoints.
- `node tests/test_receiver_power_v61.js --record`
- `node tests/test_receiver_power_spice_v61.js --ngspice --record`
- `node tests/test_receiver_power_workbench_v61.js`
- `node tests/test_receiver_power_browser_v61.js --browser`

Existing source, power, audio, detector, IF, alignment, rectifier and AVC release regressions remain in CI. Watermark: **BUILD v0.61.0**.
