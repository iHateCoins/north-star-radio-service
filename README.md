# North Star Radio Service — v0.51.0 PT-44 engineering update

v0.51 traces the upper #9 22 kΩ grid-leak resistor end to the 7A8 oscillator grid G1 (socket V1:4), and the upper #11 0.05 µF bypass capacitor end to the shared 7A8/7B7 screen conductor annotated 45 V. Their lower ends were already traced to B−. The nearby four-dot symbol is not promoted to a winding tap or closed contact; the screen voltage is not yet a validated pass/fail target.

The partial graph has 32 groups and 98 reviewed memberships. Component-terminal reference coverage is 76/83 (91.6%), an inventory count rather than an engineering completion score. The #8 value conflict, opposite oscillator winding, screen-feed origin and full receiver behavior remain open. PT-44 remains NOT ENGINEERING COMPLETE.

Watermark: `BUILD v0.51.0`. See `engineering/PT44_Oscillator_Grid_Screen_Bypass_Trace_V1.json` for source boundaries.
