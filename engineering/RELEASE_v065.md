# North Star Radio Service — v0.65.0 player UI pass

The default UI focuses on taking a job, diagnosing the radio, replacing parts and returning a working set. The PT-44 remains engineering complete under the unchanged V2 acceptance; all nine EC closures are retained.

- **Bench and Schematic** are the main views. Circuit maps, wiring/source audits, the engineering notebook and the floating build badge are absent from the player interface. They remain available only with `?engineering=1` for development/reference work.
- **Meter, Tube tester and Alignment** remain included. Unowned capacitor-checker/tracer tabs and the disabled VTVM control are removed. A single **Upgrades** panel explains and sells the existing VTVM, capacitor checker and signal tracer at their unchanged prices. Owned tools and existing saves keep their capabilities; repeat purchase cannot charge twice.
- Alignment adjustments and power-supply settings are collapsed until requested. Their settings and reveal state survive routine panel redraws. No diagnostic or repair capability is put behind a new purchase.
- **Readings** follows the selected meter/range, so the starter VOM has a useful comparison chart. Source/variant details are under Reference notes. The field assembly is sold under Tubes & parts rather than as an interchangeable carbon resistor.
- Routine **Bench notes** are folded away, while heat/failure warnings open them and surface a notification. Returning a set unrepaired is under Job options. The first-run introduction is three short steps; mobile users see the service counter first when no job is selected.

This version supports **EC-07 instruments, EC-08 service access and EC-09 repair workflow usability**. It adds no new EC closures and reopens none. Receiver behavior, cascading damage, inventory, prices and checkout standards are unchanged.

Validation retains the 727 behavioral checks, historical/source regressions, stock 20-fault browser repair matrix and prior shop suite. `tests/test_ui_browser_v65.js` verifies uncluttered player navigation, upgrade affordability/purchases/persistence, correct references, advanced reveals, critical warning visibility, explicit research opt-in and desktop/mobile layout. Optional research browser tests now enter engineering mode explicitly.

Open `index.html` to play. Main development can continue beyond the completed PT-44 benchmark; additional scientific fidelity remains optional research.

Watermark: **BUILD v0.65.0** (shown only in engineering mode; player version is in the manual).
