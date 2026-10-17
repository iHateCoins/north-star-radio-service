# North Star Radio Service — v0.68.0 physical bench interaction

Player service begins with a component on the bench. Tap a part on the 3D chassis to open its actions directly below the view. Tap an empty socket or mounting location to fit a replacement from stock or the tray. Camera controls provide Chassis top, Underside, Speaker and Parts tray views.

The global component selector and installed-tube tester menu are removed from the player UI. Removed parts are rendered as selectable 3D tray models; tapping one opens testing/disposal actions. Salvage can be moved onto the tray. Installed tubes cannot remain on a tester after being refitted. Stock/SKU choices and the parts catalog remain available after a physical destination has been selected.

Meter connections use visible 3D service posts, including AVC and screen supply. The player probe and capacitor-checker dropdowns are removed. The schematic remains a reference for components when 3D is available. If WebGL is unavailable, the selectable 2D chassis provides a visual fallback. Engineering mode retains its explicit development selectors.

The first-job tutorial teaches tapping tubes, pulling/testing them and tapping the empty V2 socket to install a replacement. Its location helper opens the appropriate camera without choosing the component for the player. Existing tutorial progress, saves, inventory, prices, receiver behavior and cascading damage remain intact.

Supports **EC-07 instruments, EC-08 physical service and EC-09 end-to-end repair**. All nine fixed V2 closures are retained; no acceptance criteria are added or reopened.

Browser coverage now selects parts through real projected 3D ray targets and mouse/touch input rather than the component dropdown. The 20-fault repair matrix includes all-slot removal and empty-location installation through the scene. Dedicated mobile tests cover the physical tray, safe pull/test, replacement, read-only schematic selection, service posts and drag rotation. Existing core, tutorial, title and UI regressions are retained.

Open `index.html` to play. Title screen: Load game / New game. Engineering references and development selectors require `?engineering=1`.
