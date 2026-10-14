# North Star Radio Service — v0.42.0 PT-44 engineering update

The v0.42 source trace closes the next RF interface slice from the built-in loop through the aerial transformer: the lower #3 loop lead maps to the #2 11-turn winding, the #2 38-turn winding maps to the external ANT symbol and #1 bypass capacitor, the opposite winding terminal joins B−, and the #1 return uses the explicit loop-mode chassis ground. No chassis-to-B− bond is inferred. The trace records seven newly connected component terminals and three new partial graph groups.

The combined partial graph now has 28 groups and 79 component-terminal memberships. PT-44 remains incomplete: #2 winding polarity/inductance/coupling, the rest of the 7A8 converter and oscillator, #4 oscillator gang, #6–#11 connections, receiver behavior, full SPICE validation and physical pin/chassis crosswalks remain open. This is a source-coverage milestone, not an engineering-complete benchmark.

Watermark: `BUILD v0.42.0`.
