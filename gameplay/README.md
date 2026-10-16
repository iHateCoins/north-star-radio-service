# PT-44 playable behavior — v0.63

The approved completion standard is [PT44_Game_Completion_V2.json](PT44_Game_Completion_V2.json). It keeps the nine EC IDs and replaces scientific simulation gates with fixed, observable game outcomes. This is an explicit scope change, not a claim that the original scientific requirements passed. Original engineering registries and research code remain intact.

The runtime uses `pt44_behavior_v63.js`, embedded byte-for-byte in the main page. The model reads actual part properties and settings, never hidden fault IDs. It returns sound parameters, tracer levels, loaded DC service ports, AVC state and component stress together. The same evaluator runs customer use and checkout.

Controls cover 540–1600 kHz tuning, volume, three IF centers, oscillator and aerial trims, loop connection, 90–130 V AC/DC supply, and a modulated generator at aerial / IF / volume inputs. The generator is off during checkout. Alignment is manual; no automatic repair button is provided. Parts retain existing inventory, work guards and saved radio state.

Voltage targets, stage currents, bandwidth, AVC timing and output levels are bounded game approximations. The source describes stage roles and service controls; it does not establish precision calibration. Extra AVC/screen ports do not certify unresolved physical socket routes. RF transmission, exact carrier waveforms, tube curves, acoustic calibration and undocumented wiring are outside gameplay acceptance.

`node tests/test_gameplay_v63.js` checks fixed fault/restoration, healthy limits, full-band conversion, alignment, loaded measurements, injection boundaries, AVC timing, power and stress. `node tests/test_gameplay_browser_v63.js --browser` checks the actual shop UI, replacements, checkout, persistence and geometry. Game CI runs these; historical electrical/SPICE workflows remain available manually as optional research.

v0.63 closes EC-04 and EC-06 under V2 when game CI passes. EC-03, EC-05, EC-07 and EC-09 receive support. EC-01, EC-02 and EC-08 still require their bounded reviews; the full PT-44 is not yet engineering complete.
