# SketchText Maintenance v0.5.0

**Artifact:** Viewport-fit layout update  
**Version:** 0.5.0  
**Status:** CSS updated; viewport acceptance check pending  
**Date:** 2026-10-26  
**Target:** `main`  
**Previous maintenance record:** `Maintenance-v0.4.0.md`

## User report and request

The user confirmed that the text-placement and ASCII-preview fixes work. The remaining request is to prevent the page from scrolling on desktop and fit the app into one screen.

## Change

- Lock the desktop page to the viewport height using `100dvh` with a `100vh` fallback.
- Hide document-level overflow on desktop and make the workspace consume the remaining height below the header.
- Allow the drawing area and output panel to shrink within the available height.
- Tighten desktop spacing and let the ASCII preview/output fields use the remaining panel space.
- Preserve a vertically scrollable stacked layout on narrow screens, where placing both columns on one screen is not practical.

## Verification

- [x] CSS update committed directly to `main`.
- [x] Source inspection confirms desktop page overflow is hidden and the workspace is constrained to the viewport.
- [x] Narrow-screen rules preserve normal page scrolling instead of clipping the stacked interface.
- [ ] Visual browser check at common desktop viewport heights not run in this environment.
- [ ] Check very short desktop windows and confirm all controls remain reachable.

## Acceptance criteria

- [ ] At a typical desktop resolution, the header, drawing workspace, ASCII output, descriptor, action buttons, and footer fit without document-level scrolling.
- [ ] The drawing canvas and ASCII preview resize within their panels instead of forcing the page taller.
- [ ] All output controls remain visible and usable at the tested desktop height.
- [ ] At narrow/mobile widths, the stacked layout remains scrollable and usable.

## Status

The user's confirmation covers the previous text and ASCII fixes. This viewport-layout change has not yet received live browser acceptance testing, so the new layout itself remains **unverified** until the checklist above is run.
