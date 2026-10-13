# North Star Radio Service — PT-44 v0.19.0

**Play:** https://ihatecoins.github.io/north-star-radio-service/

This is a working game prototype, **NOT a factory-complete or SPICE-validated receiver model**. The game uses the existing reduced-order simulator, and its drawn under-chassis wires are not verified original Philco harness routes.

## v0.19.0 — Authenticated 7C6 internal cathode connection

- Incorporated an independently documented **device-internal electrical connection**: the 7C6's cathode is accessible at **socket pins 4 and 7**, which are internally at the same potential. **This does not add or certify a wire between physical chassis terminals.**
- Modeled both 7C6 detector diode plates (pins 5 and 6), triode grid (pin 3), plate (pin 2) and **shared internal cathode** separately. A vacuum diode is not a metallic wire or unconditional DC short.
- Updated the Factory ledger and continuity workbench to classify a **tube-internal bond** separately from direct copper, passive component paths, and untraced circuitry.
- 17 source-limited continuity cases now explicitly test cathode internal continuity, diode non-equivalence, and non-assumed chassis ground. Seven deliberate data corruptions are rejected in the v0.19 tests.
- Added `engineering/PT44_Tube_Internal_Topology_V1.json`, versioned independent source data and a **SPICE-compatible zero-voltage source subcircuit** for the *internal cathode bond only* in `engineering/PT44_7C6_Cathode_Bond_DRAFT.cir`. It does not contain tube I–V behavior or the PT-44's external detector and AVC network.
- Updated watermark and HTML document title to `v0.19.0`. All existing source-graph (18 partial traced networks), 33-part register, and healthy radio gameplay remain intact.

## Evidence and limits

- **Sylvania Technical Manual, 9th edition (1953), 7C6 continuation:** explicitly says the cathode reaches pins 4 and 7; pin 4 is a cathode mount support and the contacts are electrically at the same potential. https://www.worldradiohistory.com/BOOKSHELF-ARH/Technology/Technology-General/Sylvania-Technical-Manual-Tubes-1953-9th-Edition.pdf
- **RCA Receiving Tube Manual:** describes the 7C6's two diode units with their common cathode sleeve shared with the triode. https://gbppr.net/RCA_Receiving_Tube_Manual.pdf
- **Philco 1941 RMS Year Book p.38:** the authoritative PT-42/PT-44 *external wiring* source; **RF/IF, detector and AVC connections are not fully transcribed**. https://philcoradio.com/library/download/service%20info/yearbooks/1941/split/Part19-Philco%201941%20RMS%20Year%20Book.pdf
- The downloaded Rider drawings (uploaded by the project owner) are cross-checks, not permission to invent ambiguous junctions.

## Tests

- `node tests/test_tube_internal_v19.js`
- `node tests/test_continuity_v18.js`
- `node tests/test_bench_v17.js`
- `node tests/test_passive_devices_v16.js`
- `python tests/test_browser_v19.py` (requires Playwright Chromium)

The JavaScript tests enforce no imaginary cathode/chassis connection, missing external diode net, or hard conductive connection between active tube electrodes.

## Remaining benchmark gates

1. Complete actual pin-by-pin Philco RF, oscillator, both IF, detector, AVC and line wiring, with source-image evidence for each connection.
2. Validate component/coil values, winding taps, pilot lamp circuit, mains B-minus/chassis isolation and factory voltage test conditions.
3. Install and validate meaningful nonlinear 7A8/7B7/7C6/50L6GT/35Z3 + transformer/SPICE equivalents.
4. Generate factory schematic and physical chassis from the same netlist and verify every chassis conductor.
5. Pass healthy and faulty performance tests and a second-radio reuse validation.