# North Star Radio Service — v0.35.0 PT-44 engineering update

[Play game](https://ihatecoins.github.io/north-star-radio-service/)

The Factory ledger now includes two source-backed reference layers. The v0.34 chassis crosswalk maps Philco's page-38 underside parts locator to 27 of the 33 factory component records through 26 numbered callouts; six parts are not located in that drawing. It is a 2D parts locator only and does not establish lead dress, wiring, dimensions, or a game-to-chassis coordinate map. The p.36 alignment reference transcribes the 455 kHz IF and two RF alignment steps, their dial settings, control positions, and the stated VTVM hookup. Unspecified meter loading, signal level, supply condition, tolerances, and AVC socket terminal remain open.

The v0.35 heater-string fixture compares published nominal heater ratings with the factory #30 tapped resistor and #32 lamp topology. Five nominal heaters total 103.9 V at 150 mA from the 115 V service supply. An isolated ngspice deck checks two mathematical endpoints: an open lamp (120 Ω effective #30) and an ideal short across the 40 Ω section (80 Ω effective #30). These are sensitivity bounds, not a model of the actual lamp, warm-up, rectifier load, mains waveform, or complete receiver. GitHub Actions executed both boundary cases in ngspice and confirmed parity with the calculated currents and heater voltages.

Existing passive SPICE export remains generated from the game's partial factory graph. It includes six factory-driven passive instances and an isolated AC testbench; the existing workflow checks its ngspice response. Neither SPICE fixture validates complete PT-44 behavior.

The engineering ledger remains explicitly **NOT ENGINEERING COMPLETE**: 33 component records, 22 partial net groups, 54 listed terminal memberships, seven open items, six unmet benchmark gates, and zero RF/converter net groups added. Pin-level net tracing is still needed for RF, IF winding ends, detector/AVC, output transformer, and power/line paths. The chassis locator and service procedure are useful references, but do not close those electrical gaps or certify the simulator as a restoration benchmark.

Watermark: `BUILD v0.35.0`.
