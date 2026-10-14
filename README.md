# North Star Radio Service — v0.43.0 PT-44 engineering update

The v0.42 factory trace closed the built-in loop and external ANT interface through aerial-transformer #2 and bypass capacitor #1, while keeping loop-mode chassis ground separate from B−. v0.43 adds source-backed lower-terminal connections for oscillator resistor #9 (22 kΩ) and capacitor #11 (0.05 µF) to the B− rail.

The partial graph has 28 groups and 81 terminal memberships. It references 63 of 83 declared component terminals (75.9% inventory coverage); this is not an engineering-completion score. The other #9/#11 ends, #4 oscillator gang, #6–#10 oscillator wiring, 7A8 socket-pin crosswalks, winding parameters, receiver behavior, full SPICE validation, and physical pin/chassis crosswalks remain open. The PT-44 benchmark is not engineering complete.

Watermark: `BUILD v0.43.0`.
