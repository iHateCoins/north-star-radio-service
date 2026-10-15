# North Star Radio Service — v0.55.0 coupled PT-44 audio/power milestone

The Factory ledger now has a **Coupled audio bench**. It jointly solves the dynamic supply and the volume control, 7C6 triode, 50L6 plate/screen/grid currents, output-transformer electrical equivalent and speaker load. Controls cover AC/DC supply, input signal, volume, audio/filter/field faults, loaded probes, restoration and matching SPICE export. A background worker keeps the page responsive while solving.

The model uses the source-traced factory audio topology/passive values and approximate samples from original Sylvania/GE tube data. Transformer/speaker, volume resistance/taper, grid-current law and screen scaling remain declared assumptions. The audio currents now load the supply directly; **RF/IF demand is still a substitute load**. The speaker is a resistive electrical equivalent, with no acoustic/core-saturation model. The existing shop receiver remains separate.

Validation passes 19 coupled scenarios and five independent ngspice cases, alongside the existing regression suite. Checks include manufacturer typical points and separate graph checks, joint KCL and transformer energy balance, audio fault/restore cases, clipping/mute, meter loading, timestep convergence and independent ngspice transients. Conditions and remaining outcomes are recorded in `engineering/PT44_Audio_Power_Model_V1.json`, `engineering/PT44_Audio_Power_Validation_V1.json` and `engineering/PT44_Remaining_Actions_V1.json`.

Watermark: `BUILD v0.55.0`. All six full-receiver benchmark gates remain NOT MET. The source graph retains 35 conductor groups, 114 memberships and all 83 declared component endpoints; diode-pin assignment, oscillator coupling, #8 value conflict, full parameter calibration, receiver/shop integration and end-to-end repair acceptance remain open.

GitHub Actions also exercises the actual Chromium page, generated worker, leakage/repair controls and SPICE download, and retains desktop/mobile screenshots. Run `node tests/test_audio_browser_v55.js --browser` with Playwright 1.62.1 and Chromium installed to reproduce that check.
