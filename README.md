# North Star Radio Service — v0.47.0 PT-44 engineering update

v0.47 completes the source trace for factory component #6, the 2 mmf condenser-and-choke assembly on the 7A8 RF input. All four declared endpoints are now accounted for: the condenser input joins the RF input conductor, the condenser/choke series junction is recorded as its own net, and the choke output joins the explicit loop-operation chassis ground. This does not equate chassis with B−.

The partial graph now contains 30 groups and 88 reviewed memberships. Component-terminal reference coverage is 67/83 (80.7%). The PT-44 benchmark remains incomplete: #4 oscillator-gang routing, #7–#10 converter wiring, remaining 7A8 pin assignments, transformer parameters, and receiver behavior are still open.

The v0.46 independent alignment cross-check is retained: Philco Volume 2 corroborates the approximately 15-minute warm-up, #4 OSC at 1600 kHz, and #5 ANT at 1500 kHz.

Watermark: `BUILD v0.47.0`.
