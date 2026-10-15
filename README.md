# North Star Radio Service — v0.53.0 PT-44 supply and AVC reconciliation

v0.53 corrects earlier conductor assignments using complete paths in the Philco p.38 and Rider XII 12-45 factory drawings. #13 is the 27 kΩ feed from filtered B+ to the shared screen rail. The lower right #10 winding joins filtered B+. The first-IF secondary, #17 lower lead and aerial return meet on a separate AVC conductor. #7/#8 connect AVC to B−, and the passive audio returns join B−.

The graph now references all 83 declared component endpoints in 35 conductor groups and 114 memberships. Five additional cathode/shield socket pins are source-crosswalked; 31 socket positions have graph memberships, one has a documented tube-internal equivalence, and six are manufacturer no-connection/shell options. The two 7C6 diode socket assignments, four-dot oscillator coupling, #8 value conflict, physical boundaries and receiver behavior remain open. **GATE-NETLIST is NOT MET.** Endpoint inventory coverage is not an engineering completion percentage.

Watermark: `BUILD v0.53.0`. See `engineering/PT44_Supply_AVC_Reconciliation_V1.json` for paths, nonjunctions and superseded claims. Prior membership evidence is retained in `engineering/PT44_Pre_v053_Membership_History_V1.json`.
