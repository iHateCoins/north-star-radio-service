# North Star Radio Service — v0.44.0 PT-44 engineering update

v0.44 adds a source-backed 7A8/7B7 pin-level crosswalk for their shared schematic-annotated 45 V screen lead: 7A8 screen grids G3/G5 map to V1:5 and the 7B7 screen grid G2 maps to V2:3. The schematic conductor is now represented as one partial graph net. The upstream supply path and voltage measurement conditions remain unresolved.

The partial graph now contains 29 groups and 83 memberships, with 63 of 83 declared factory component terminals referenced (75.9% inventory coverage); 20 of 40 inventoried tube pins now appear in the partial graph. This is not an engineering-completion score. The #4 oscillator gang, #6–#10 oscillator wiring, remaining 7A8/7B7 pin connections, transformer parameters, receiver behavior, full SPICE validation, and physical pin/chassis crosswalks remain open. The PT-44 benchmark is not engineering complete.

Watermark: `BUILD v0.44.0`.
