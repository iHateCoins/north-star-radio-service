# North Star Radio Service — v0.48.0 PT-44 engineering update

v0.48 traces both terminals of factory component #7, the 4.7 MΩ loop-return resistor. Its upper lead joins the lower built-in loop / #2 11-turn winding junction; its lower lead joins B−. The source supports these schematic endpoints, not loop polarity or oscillator behavior.

The partial graph now contains 30 groups and 90 reviewed memberships. Component-terminal reference coverage is 69/83 (83.1%). v0.47’s #6 series input trap trace remains documented. The PT-44 benchmark is incomplete: #4 oscillator-gang routing, #8–#10 converter wiring, remaining 7A8 pin assignments, winding parameters and receiver behavior remain open.

The v0.46 independent alignment cross-check is retained: Philco Volume 2 corroborates the approximately 15-minute warm-up, #4 OSC at 1600 kHz, and #5 ANT at 1500 kHz.

Watermark: `BUILD v0.48.0`.
