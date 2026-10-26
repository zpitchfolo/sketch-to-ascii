# SketchText Design Refinement v0.2.0

**Artifact:** Content-aware ASCII rendering and precision zoom  
**Version:** 0.2.0  
**Status:** Implemented as a candidate; runtime acceptance checks pending  
**Date:** 2026-10-26  
**Base design:** `Initial-Design-v0.1.0.md`  
**Development workflow:** Development State Machine Workflow v1.3.0  
https://github.com/zpitchfolo/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow-v1.3.0.md

## Problem

The earlier converter mapped the workspace origin and a minimum 1000-by-620 region into a fixed 100-by-36 grid. A small shape could occupy only a few output cells even when the user zoomed in to draw it precisely. Canvas zoom was capped at 4×. Zoom changes only the on-screen view, not the geometry used by the converter.

## Decisions

1. Canvas precision and output resolution are independent. Increase drawing zoom to 32× while retaining cursor-centered zoom.
2. Compute the union of actual object bounds and add a small margin. Do not include the distant canvas origin unless content occupies that space.
3. Adapt output dimensions to the drawing's aspect ratio, capped at 140 columns by 60 rows, with a minimum practical grid and a correction for tall monospaced character cells.
4. Use shape-specific renderer paths on a shared grid. Rectangles use Unicode box-drawing corners and edges; lines and arrows use direction-aware characters and arrowheads; text is preserved; freehand remains an approximate character path.
5. Keep output as plain text. No framework, backend, image service, or AI API is required.
6. Render non-text objects before text to preserve label readability at intersections.

## Prior-art rationale

Unicode box-drawing characters are designed for connected box edges and corners. Direction-aware character rasterization is a conventional approach for line art. Braille-pattern output could provide a higher-detail optional renderer later, but is deferred because it introduces a distinct output style and needs separate acceptance tests. This is geometric rendering, not image-to-ASCII luminance conversion: SketchText already has typed objects and can use their geometry directly.

## Architecture

The lightweight vanilla JavaScript app keeps renderer functions in `app.js` as shape-specific branches sharing a conversion context:

- `getDrawingBounds(objects)`: actual content bounds plus padding.
- `getGridSize(bounds)`: aspect-aware output dimensions.
- `mapPoint(point)`: map logical drawing coordinates into the current grid.
- `drawObjectToGrid(grid, object)`: dispatch by shape type.
- `generateAscii()`: prepare conversion context, render shapes before text, and trim empty outer rows.

If rendering styles grow, these functions can be extracted into a separate file without changing the drawing-object model or UI. Avoid splitting files before it improves testing or maintenance.

## Acceptance criteria

- A small rectangle anywhere in the workspace produces a visible rectangular outline.
- Moving the same rectangle far from the workspace origin does not shrink its output.
- Wide and tall drawings use adaptive dimensions and remain recognizable.
- Rectangles use box-drawing corners; lines, arrows, text, and freehand use distinct handling.
- Canvas zoom can reach 32× and continues to zoom around the cursor.
- Preview and both copy actions use the same generated text.
- Existing select/move/resize/text editing, undo, and narrow-screen behavior are not regressed.

## Verification state

Only source-level assertions have been performed in this environment. Browser interaction and visual layout checks remain pending. Do not mark the candidate accepted until the listed behaviors are tested in the running app.
