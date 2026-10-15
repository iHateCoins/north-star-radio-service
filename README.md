# North Star Radio Service — v0.54.0 PT-44 dynamic power milestone

The engineering workbench now runs a reusable nonlinear supply model from the traced rectifier/dropper, #29A/#29B filter capacitors and #28 field-coil topology. It shows AC/DC supply operation, electrical startup, ripple and switch-off discharge. Fault controls cover dry/leaky filters, open field winding and weak/nonconducting rectifier; restoring parts reproduces the baseline. A matching SPICE deck can be exported from the same controls.

Factory values and assumptions are separate. The 35Z3 approximation passes through one GE manufacturer reference point; field inductance, lamp hot resistance and resistive stand-in loads are explicit inputs. The two load callback ports are ready for receiver-stage coupling. This is not a calibrated complete PT-44 or a replacement for the shop receiver's existing reduced-order solver.

The source graph retains 35 conductor groups, 114 memberships and all 83 declared component endpoints from v0.53. **GATE-NETLIST and the other benchmark gates remain NOT MET.** Remaining diode pin assignments, oscillator coupling, #8 value conflict, parameter validation, chassis boundaries and full receiver/repair integration are tracked in `engineering/PT44_Remaining_Actions_V1.json`.

Watermark: `BUILD v0.54.0`. Numerical checks cover KCL, discrete energy balance, an independent DC operating point, timestep convergence, fault/restore behavior, browser/module parity and ngspice transient comparisons.
