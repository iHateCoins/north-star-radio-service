# North Star Radio Service v0.17.0 — Factory operating references and detector structure

Playable browser application: `index.html` (v0.17.0 watermark and `<meta name="nsrs-build" content="v0.17.0">`).

## This chunk

- The 1941 Philco PT-42/PT-44 documentation has a printed **455 kHz intermediate frequency**, **540–1600 kHz broadcast tuning range**, and **115 V AC/DC supply** (page 36).
- Six clearly labeled factory DC operating voltages from the PT-42/PT-44 schematic on printed page 38 are recorded with exact **tube types and socket electrodes**: 7A8 plate 95 V / screen 45 V; 7B7 plate 95 V / screen 45 V; 7C6 triode plate 30 V; 50L6GT plate 85 V.
- The factory voltage values are **historical labels only**. The source does not establish our eventual meter return, loading, test conditions, tolerance, or precise equivalence to the current prototype's simulated nodes. **Do not use these values for repair approval or diagnostic pass/fail yet.**
- 7C6 dual-diode / triode structure is represented explicitly, including two **distinct** diode anodes (pins 5 and 6), triode plate (pin 2), and grid (pin 3). Cathode pins 4 and 7 are listed but the internal wiring and any external detector/AVC junctions remain unverified.
- Philco #16 is now independently represented as a 3-contact volume control and a 2-contact linked on/off switch. Resistance, taper and switch wiring are not invented.
- Second-IF transformer #14 has distinct secondary endpoints; no detector pin connection is falsely certified.
- Factory ledger provides stage-filtered measurement reference and detector structure inspection.
- Inherited 18 partial traced nets, 33 factory part records, 6 winding definitions, prototype solver, and historical caution remain intact.

## Tests

`node tests/test_bench_v17.js` — compares embedded with standalone reference data; validates factory point symbols, expected electrode pins, IF frequency and line voltage; five mutation tests make sure wrong pins, merged diode electrodes, guessed nets, conflated volume/power contacts, and unjustified voltage pass/fail are rejected.

`node tests/test_passive_devices_v16.js` — previous passive / traced-net regression on current v0.17 build.

`python3 tests/test_browser_v17.py` — headless browser UI regression, stage filters, persistent watermark and metadata, no JavaScript exceptions, healthy-radio checkout (2D fallback, Three.js CDN disabled for test).

## Factory sources

- Original Philco 1941 RMS Year Book PT-42/PT-44, printed pp. **36, 38**: https://philcoradio.com/library/download/service%20info/yearbooks/1941/split/Part19-Philco%201941%20RMS%20Year%20Book.pdf
- 7C6 and other tube datasheets linked in `engineering/PT44_Tube_Terminals_Review_V1.json` and embedded pin-role database.

## Still missing

Complete RF, oscillator, both IF, detector and AVC **external electrical connectivity**; factory exact physical wiring; source-verified voltage measurement conditions; and runnable, validated ngspice/WASM models. No new external wires or SPICE-complete claims were made in v0.17. This is not a restoration instruction.