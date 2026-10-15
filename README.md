# North Star Radio Service — v0.59.0 coupled AVC release

The coupled IF/detector/audio/supply bench now continues through signal removal and a full second of AVC release. It carries all 26 circuit states forward from the existing short signal-arrival test, resolves 0.2 ms of IF ringdown, then uses backward Euler at ≤0.1 ms for the unforced circuit. No AVC reset, fitted exponential or frozen supply/audio state is used. The original carrier-resolved arrival and alignment controls remain available.

## What this version supports toward engineering completion

Every release reports supported EC IDs, concrete evidence toward closure, actual full closures and remaining work. The nine acceptance lists remain fixed in `engineering/PT44_Remaining_Actions_V1.json`; a frozen acceptance snapshot now guards against accidental scope changes.

| EC supported | Evidence added in v0.59 | Full EC closed? |
|---|---|---|
| **EC-05** | One-second release, timestep/ringdown convergence, both #8 alternatives, fault/restoration and independent circuit continuation. | No |
| **EC-07** | Defined removal/ringdown/release times; AVC/grid/B+ checkpoints; ideal, DMM and service-meter loading. | No |
| **EC-09** | Deterministic release, #17-open, no-signal and restored cases in the coupled electrical regression matrix. | No |

No full EC or full-receiver engineering gate closes in this increment. Broader game development remains on hold.

## Conditions and limits

The UI uses hot DC equilibrium followed by the existing **6 ms, 455 kHz, 1 kHz/50% AM arrival**, then removes the injected current. Automated comparison fixtures use **3 ms arrival with 2 kHz/50% AM**. Neither initializes AVC at a settled strong-signal operating point. Release time is measured from signal removal to 10% of the instantaneous removal magnitude; this is not a published Philco specification. A negligible starting bias has no reported recovery time. Both unresolved #8 values remain available as sensitivity cases; no variant is selected by this release.

The displayed release checkpoints use actual circuit states at 10/50/100/250/500/1000 ms. All voltages reference B-minus; no chassis bond is asserted. After carrier ringdown, backward Euler damps unresolved fast modes so they cannot persist as trapezoidal numerical ringing. Halving the release step and doubling the ringdown window bound the effect of that transition.

The release SPICE export starts from the recorded **common post-ringdown capacitor voltages and inductor currents**, with no input current. Independent adaptive Gear execution checks the continuation, rather than independently establishing that initial state. The prior carrier-resolved coupled transient SPICE suite separately checks signal arrival. Agreement validates numerical implementation under declared parameters, not factory calibration.

## Remaining work

| EC | Still required for full closure |
|---|---|
| EC-01 | Physical diode-pin assignment, oscillator coupling interpretation, approved resolution of #8 value conflict. |
| EC-02 | Remaining tube, winding, transformer/speaker, volume, field, heater and lamp parameter correlation. |
| EC-03 | Active converter loads, full AC/DC supply, startup/discharge and heater/lamp envelope. |
| EC-04 | Audio parameter/frequency-envelope correlation and shop repair integration. |
| EC-05 | Correlated passband/trimmer/diode parameters; long-duration attack/steady AVC regulation and converter feedback. |
| EC-06 | RF/oscillator/converter operation and tracking across 540–1600 kHz. |
| EC-07 | RF/shop generator, meter and tracer integration; historical service measurement conditions. |
| EC-08 | Serviceable chassis endpoints, access and repair-relevant physical identities. |
| EC-09 | Full receiver baseline and complete diagnosis/replacement/alignment/checkout acceptance. |

## Evidence and checks

- `engineering/PT44_AVC_Release_Validation_V1.json`: release convergence, #8 alternatives, loaded meters, fault/restoration and no-signal cases.
- `engineering/PT44_AVC_Release_Spice_Validation_V1.json`: independent adaptive circuit continuation from common snapshots.
- `node tests/test_avc_release_v59.js --record` regenerates coupled release evidence.
- `node tests/test_avc_release_spice_v59.js --ngspice --record` regenerates independent continuation evidence.
- `node tests/test_avc_release_workbench_v59.js` executes the generated release worker and checks its lifecycle.
- `node tests/test_avc_release_browser_v59.js --browser` checks the real controls/worker, exact release export and desktop/mobile layout.

Existing source, supply, audio, detector, IF and alignment regressions remain in CI. Watermark: **BUILD v0.59.0**. All six full-receiver gates remain **NOT MET**.
