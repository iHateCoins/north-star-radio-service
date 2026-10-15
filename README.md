# North Star Radio Service — v0.57.0 coupled IF receiver milestone

The Factory ledger now includes **Coupled IF → speaker**. One 26-variable modified nodal system joins both tuned IF transformers, the active 7B7, detector/AVC, nonlinear 7C6/50L6 audio and dynamic hot DC supply. The detector drives the actual audio grid; the modeled IF plate/screen currents draw from the same supply; AVC returns through the first IF secondary to the 7B7 grid. There is no injected audio source or separate IF supply-load resistor in this circuit.

The new engineering panel supports carrier frequency, injected current, volume, DC supply, loaded probes, faults/restoration and an equivalent SPICE export. A generated worker performs the solve. Implicit midpoint integration avoids the artificial damping backward Euler would introduce in the tuned IF tanks. The default is 96 steps per carrier cycle; coupling-leakage fixtures require 192. Hot DC equilibrium is followed by 6 ms of 1 kHz AM input; measurements cover the final four modulation periods, including settling.

**This is not a complete PT-44 receiver.** The 7A8 is still an external current-injection boundary with explicit plate/screen substitute loads. Sylvania 7B7 curves are approximately sampled; screen scaling, winding L/k/DCR/loss and tuning capacitances need correlation. Existing diode, audio, volume and speaker/transformer assumptions remain. The three EC-01 source ambiguities remain open. The bench does not claim RF reception/tracking, steady-state sensitivity, AC/cold-heater startup validation, physical chassis repair or full shop acceptance. All voltages reference B-minus, without asserting a chassis bond.

## Fixed engineering finish line

Broader game development is on hold until the first PT-44 is engineering complete. `engineering/PT44_Remaining_Actions_V1.json` retains the same nine IDs and acceptance lists; milestone sub-results do not close an EC by themselves:

1. **EC-01:** close source interpretation.
2. **EC-02:** finish and correlate component parameters.
3. **EC-03:** connect actual receiver loads and validate supply behavior.
4. **EC-04:** complete and validate the integrated audio chain.
5. **EC-05:** complete IF/detector/AVC behavior.
6. **EC-06:** complete RF/converter and 540–1600 kHz tracking.
7. **EC-07:** validate instruments and measurement conditions.
8. **EC-08:** finish serviceable chassis/endpoints mapping.
9. **EC-09:** pass diagnosis → replacement → alignment → checkout acceptance.

v0.57 advances EC-02/03/04/05/07/09. **No full EC item or full-receiver engineering gate closes in this increment.** Next work is remaining model correlation/AVC timing, oscillator interpretation and active RF/converter integration, followed by the full operating envelope and chassis/instrument/shop acceptance. New radios, expanded careers/jobs and cosmetic work are outside this finish line.

## Evidence and reproducible checks

- `engineering/PT44_IF_Receiver_Model_V1.json`: source terminal crosswalk, approximate manufacturer data, assumptions, supported domain and measurement conditions.
- `engineering/PT44_IF_Receiver_Validation_V1.json`: deterministic integrated cases, manufacturer anchors, DC KCL, faults, feedback and timestep checks.
- `engineering/PT44_IF_Receiver_Spice_Validation_V1.json`: independent ngspice measurements and tolerances for the declared circuit. Numerical parity is not historical calibration.
- Existing v0.54 power, v0.55 audio and v0.56 detector benches and checks remain available.

Run `node tests/test_if_receiver_v57.js` for coupled numerical/fault validation, `node tests/test_if_workbench_v57.js` for exact browser-source and generated-worker checks, and `node tests/test_if_spice_v57.js --ngspice` for independent SPICE execution. Use `--record` to regenerate the corresponding numerical evidence. Run `node tests/test_if_browser_v57.js --browser` with Playwright/Chromium for actual page, worker, repair, loaded controls, exports and narrow-screen checks. Set `CHROMIUM_EXECUTABLE` or `NGSPICE_BIN` if needed. CI runs the checks and retains browser evidence for seven days.

Watermark: **BUILD v0.57.0**. All six full-receiver gates remain **NOT MET**.
