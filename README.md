# North Star Radio Service — v0.16.0 PT-44 engineering chunk

The playable browser build is `index.html` and includes a **fixed bottom-right BUILD v0.16.0 watermark**.

### Changes
- Factory #30 is now modeled as separate series **40 Ω and 80 Ω sections**, with a physical tap. The #32 pilot lamp is connected across the 40 Ω section by two *source-traced partial external nets*. The full AC line and rectifier wiring are not resolved.
- First/second IF transformers (#12, #14) and output transformer (#26) have two explicit, mutually isolated winding pairs each. **No L, DCR, coupling k, or trimmer capacitance is asserted.**
- New Factory ledger device topology view under IF/AUDIO/POWER stages; power view includes a 40/80 Ω lamp-shunt diagram.
- The SPICE draft adds a standalone resistor-assembly subcircuit, and explicitly omits any guessed incandescent lamp I–V or complete mains supply.
- Regression testing includes winding isolation, current factory part/pin integrity, resistor tap, lamp shunt, user-facing watermark and working game checkout.

### Engineering status
Phase 1 remains incomplete. There are 18 partial factory wire-junction records; the new pair are for the pilot lamp. This is neither a validated 3D route nor a complete factory netlist. The source is Philco 1941 RMS Year Book, p.38: https://philcoradio.com/library/download/service%20info/yearbooks/1941/split/Part19-Philco%201941%20RMS%20Year%20Book.pdf

The application loads Three.js r128 from an external CDN (2D fallback when unavailable). Browser save data remains local to the GitHub Pages origin.