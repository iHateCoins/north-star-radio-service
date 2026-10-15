# North Star Radio Service — v0.52.0 PT-44 wiring-gate work

v0.52 promotes the five line/switch/resistor component endpoints already traced in the Philco p.38 power schematic and crosswalks the 35Z3 plate and end-heater pins plus the 7C6 end heater pin. Plug polarity, physical switch lug numbers, heater-lead orientation and chassis-to-B− relation remain unverified.

The partial graph now has 35 groups and 108 reviewed memberships; 82/83 declared component terminals are referenced (98.8% inventory coverage, not completion). Rider XII 12-45 corroborates the upper #10 opposite-winding end to 7A8 oscillator-anode pin V1:3; the lower end and eight active/shield socket positions remain open (six other positions are documented manufacturer no-connection/shell options). A new crossing-by-crossing review flags the older #12/#13 IF return assignment as challenged and not gate-eligible; the provisional graph is retained until a coherent correction is established. See `engineering/PT44_Wiring_Gate_Exceptions_V1.json` for the precise evidence requests. **GATE-NETLIST is NOT MET.**

Watermark: `BUILD v0.52.0`. See `engineering/PT44_Power_Pin_Crosswalk_V1.json` and `engineering/PT44_Engineering_Readiness_V1.json`.
