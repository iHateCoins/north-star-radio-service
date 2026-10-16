# North Star Radio Service — v0.66.0 first-repair tutorial

New shops open with a completely dead PT-44 and an optional guided first repair. The player confirms symptoms, switches off safely, pulls and tests tubes, identifies an open 7B7 heater, buys the matching replacement, installs it, listens to the repaired set and completes checkout before collecting payment.

The guide waits for actual game actions and test results. It can be paused and resumed from the Service manual, saves progress across reloads, and offers a location button plus an optional diagnosis hint. Good tubes must be reinstalled; the tutorial never repairs the radio, supplies free parts, overrides safety guards or forces a checkout pass. Normal prices, overnight mail order, same-day jobber purchases, rent and billing apply. The first shop starts without a spare 7B7 so that buying a part has a purpose; other starter stock is retained. Later jobs use the regular fault generator.

Existing shops retain their jobs, faults, inventory and cash. They are not converted to tutorial scenarios. A new shop can skip the guide and repair the same first job normally.

This release supports **EC-07 instruments, EC-08 service access and EC-09 end-to-end repair usability**. All nine fixed V2 closures remain intact. Receiver behavior, cascading damage, prices and checkout limits are unchanged. The v0.65 UI cleanup and optional equipment upgrades are retained.

Validation includes the 727 behavioral checks, reporting/source regressions, all 20 stock fault browser repairs, the player UI suite, and tutorial checks. `tests/test_tutorial_v66.js` checks 50 first-radio fixtures against normal service and stress limits. `tests/test_tutorial_browser_v66.js` exercises the actual guided workflow, a good tube before the failed tube, both purchase routes, pause/reload/resume, saved completion, mobile layout and pre-tutorial saves.

Open `index.html` to play. Engineering references remain available with `?engineering=1`; the player version is in the Service manual.
