# SketchText Design Refinement v0.4.0

**Artifact:** Chat-sized output and intersection-aware line art  
**Version:** 0.4.0  
**Status:** Updated candidate; runtime acceptance checks pending  
**Date:** 2026-10-26  
**Base design:** `Design-Refinement-v0.3.0.md`  
**Development workflow:** Development State Machine Workflow v1.3.0  
https://github.com/zpitchfolo/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow-v1.3.0.md

## Problems

- Previous output could be too wide for typical chat panes.
- Rectangle borders and axis-aligned lines overwrote one another at intersections, creating broken or ambiguous junctions.
- A fixed minimum grid size could distort drawings with extreme aspect ratios.

## Decisions

1. Bound generated output to at most 72 columns and 28 rows. This is a conservative target for common chat panes, not a guarantee for every font, zoom level, or client.
2. Preserve the drawing's relative spacing and crop only globally empty outer rows and columns.
3. Use a shared-scale aspect-aware grid with no artificial minimum dimensions; allow narrow/tall drawings to use fewer columns rather than stretching them.
4. Track horizontal and vertical edge connections in a per-cell bitmask. Resolve compatible overlaps into Unicode box-drawing junctions such as `┬`, `├`, `┼`, and `┤`.
5. Use the same topology-aware edge writer for rectangle borders and axis-aligned lines, so their intersections combine rather than last-write-wins.
6. Keep diagonal strokes approximate. A diagonal crossing may still need a style-specific glyph, because the renderer cannot infer whether it means a connection or an overlay.
7. Use a fixed 1:1 drawing-canvas scale. Mouse-wheel input must not zoom the drawing workspace; middle-drag panning remains available. Keep ASCII-preview zoom separate from drawing-canvas scale.
8. Prevent small objects from silently disappearing in output. Expand mapped rectangles to a minimum 2-by-2 character footprint and extend line or arrow segments if both endpoints map to the same character cell. This intentionally prioritizes visible output over exact proportions for tiny objects.

## Implementation

- `MAX_GRID_COLUMNS` and `MAX_GRID_ROWS` define conservative output limits.
- `getGridSize(bounds)` computes output dimensions within those limits.
- `mapPoint(point)` adapts margins to small grids.
- `makeGrid()` allocates both character cells and edge masks.
- `putEdge()` merges connection directions and selects the matching box-drawing glyph.
- Rectangles and horizontal/vertical line segments use edge masks.
- Text is rendered last, preserving label readability.

## Acceptance criteria

- Generated output never exceeds 72 columns or 28 rows before trimming.
- A small drawing and a wide drawing fit the configured bounds without unnecessary canvas-origin space.
- A horizontal line crossing a vertical line produces a junction glyph.
- A line crossing a rectangle border merges into a clean junction.
- Overlapping rectangles retain connected corners and edges where possible.
- Text labels remain visible over shape edges.
- Preview and copy actions use the same output.
- Existing selection, text editing, undo, and drawing zoom still work.

## Verification state

Source checks confirm the fixed drawing scale and wheel guard, minimum footprints for tiny rectangles and collapsed line/arrow endpoints, configured output limits, edge-mask resolver, rectangle edge tracking, axis-aligned line tracking, adaptive margins, and JavaScript syntax. Live browser rendering, output-width measurement in multiple chat clients, and interaction regression tests remain pending. This candidate is not accepted until those tests pass.
