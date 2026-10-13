# North Star Radio Service — PT-44 v0.18.0 engineering preview

**[Play the game](https://ihatecoins.github.io/north-star-radio-service/)** · [GitHub source](https://github.com/iHateCoins/north-star-radio-service)

The bottom-right watermark and `<meta name="nsrs-build" content="v0.18.0">` identify this release. GitHub Pages updates after the repository changes. Three.js loads from CDNJS; if unavailable, a 2D fallback is used. Browser saves do not automatically follow across origins.

## v0.18.0: Source-limited continuity workbench

Under **Factory ledger**, a new **Continuity workbench** distinguishes three very different observations:

1. **DIRECT COPPER** — terminals explicitly grouped on an already transcribed factory wire net.
2. **THROUGH COMPONENT** — a path through documented internal passive elements such as the 500 Ω speaker field coil (#28), 40 Ω/80 Ω resistor sections (#30), individual transformer windings (#12, #14, #26), or identified factory resistors. A displayed numerical result is the selected path's sum of nominal DC resistance, **not the receiver's measured or equivalent resistance** when parallel paths exist.
3. **NOT YET TRACED** — no path in our partial documented graph. **Never interpret this as a confirmed open circuit, coil isolation, or wiring fault.** Other source circuits are still missing.

The current dataset contains **14 targeted reasoning cases**, **18 partial factory wire groups**, and **18 internal device edges**. It explicitly refuses to equate the circuit's **B− return** with the metal **chassis** without source evidence; both detector-diode external connections also remain unverified.

New standalone source: `engineering/PT44_Documented_Continuity_V1.json`. Results are computed by the same JS engine displayed in the factory ledger. The derived logic can be reused when adding further radio definitions.

### Run tests

```
node tests/test_continuity_v18.js
node tests/test_bench_v17.js
node tests/test_passive_devices_v16.js
python3 tests/test_browser_v18.py
```

The browser test requires Playwright and Chromium and tests the 2D fallback, watermark, stage filtering, service checkout and JavaScript errors. CI runs Node electrical tests on every push.

## Reference provenance

- Philco 1941 RMS Year Book, **PT-42/PT-44 schematic, parts list, chassis layout, printed page 38**: https://philcoradio.com/library/download/service%20info/yearbooks/1941/split/Part19-Philco%201941%20RMS%20Year%20Book.pdf
- John F. Rider Philco PT-42/PT-44 service page 12-45 (secondary scan): https://www.amplifiedparts.com/schematics/philco-radio-television-corp/pt-44

## Still outstanding

**Phase 1 is not complete.** Exact full factory RF / oscillator / two IF primary-and-secondary / detector / AVC / audio / AC line wiring needs a legible pin-by-pin trace, second-reader cross-check, and resolution of all unknowns. Individual component values do not prove chassis wiring. The 3D chassis and displayed schematic remain illustrative where unverified. The existing playable solver is a *reduced-order approximation*, not ngspice. Real transformer coupling, field-coil inductance, line and speaker models, SPICE calibration, and test equipment parity are future acceptance gates.

**Safety:** This is entertainment and engineering research, not a safe restoration guide. Real AC/DC vacuum tube radios can have lethal voltages and energized metal chassis.