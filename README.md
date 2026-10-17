# North Star Radio Service — v0.69.0 component testing help

The new Help tab beside Readings provides expandable testing guides for every serviceable PT-44 component: tubes, resistors, capacitors, transformers, oscillator coil, speaker field, speaker and volume control. It explains safe setup, physical bench actions, tool selection, expected results, test limitations and confirming a repair with the 10-minute checkout.

Starter-tool diagnosis is included alongside clearly marked optional capacitor-checker, VTVM and signal-tracer guidance. The guide explains shared symptoms and follow-on damage, including the series heater string and leaky C3 damaging the output stage. Opening help never performs service actions or changes the radio.

Supports **EC-07 instruments, EC-08 physical service and EC-09 end-to-end repair**. All nine fixed V2 EC closures are retained; no acceptance criteria are added or reopened. Receiver behavior, economy and save format are unchanged.

Validation: `node tests/test_help_v69.js` checks embedded source, all-slot coverage, actual tester results, read-only rendering and Help tab navigation. `node tests/test_help_browser_v69.js --browser` checks desktop/mobile disclosure navigation, geometry, state preservation and console errors. Existing acceptance and browser regressions remain in CI.

Play: https://ihatecoins.github.io/north-star-radio-service/ — title screen Load game / New game. Engineering tools require `?engineering=1`.
