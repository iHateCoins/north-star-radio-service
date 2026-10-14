# North Star Radio Service — v0.41.0 PT-44 engineering update

The v0.41 source trace resolves the PT-44 RF input branch from the 7A8 signal-input grid (V1:6) through the upper built-in loop lead and RF tuning gang, with the aerial compensator on the same conductor. It also records the two explicit chassis grounds for loop operation without joining chassis to B−. The remaining loop lead and aerial-transformer winding crosswalk are still open.

The partial factory graph now contains 25 groups and 72 source-reviewed terminal memberships. The PT-42 identity review and chassis-photo position crosswalk are retained in the same engineering snapshot. These findings improve source coverage, but do not establish complete RF/converter behavior or a complete PT-44 model.

Work Package #2 remains in progress. Open work includes the aerial and oscillator winding endpoints, the remaining 7A8 and IF/AVC pin crosswalks, transformer parameters, measurement conditions, receiver-level simulation and repair regressions. PT-44 is not certified as the engineering-complete benchmark.

Watermark: `BUILD v0.41.0`.
