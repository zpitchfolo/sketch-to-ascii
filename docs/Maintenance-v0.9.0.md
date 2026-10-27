# SketchText Maintenance v0.9.0

**Artifact:** Chat-fit ASCII output and intersection handling  
**Version:** 0.9.0  
**Status:** Source changes committed; browser acceptance checks pending  
**Date:** 2026-10-26  
**Target:** `main`  
**Previous maintenance record:** `Maintenance-v0.8.0.md`

## Request

- Improve broken intersections between rectangles and lines.
- Keep generated output compact enough for typical chat windows of unknown width.
- Preserve the preview and copy workflows.
- Canvas zoom may remain if it does not compromise output size.

## Changes

- Capped the generated grid at 72 columns by 28 rows, a conservative default for common chat panes rather than a universal guarantee.
- Removed artificial minimum grid dimensions to avoid stretching extreme aspect ratios.
- Added adaptive margins for very narrow grids.
- Added per-cell edge masks and Unicode junction resolution for rectangles and horizontal/vertical lines.
- Rectangle borders and axis-aligned lines now merge connection masks rather than blindly overwriting existing edge characters.
- Kept diagonal strokes approximate and documented this limitation; the renderer cannot infer semantic connection intent.
- Updated README and added `docs/Design-Refinement-v0.4.0.md`.

## Source checks

- [x] Output dimensions capped at 72 columns and 28 rows.
- [x] Shared-scale aspect-aware sizing retained without artificial minimum dimensions.
- [x] Narrow-grid margins adapt to grid dimensions.
- [x] Unicode edge-mask mapping includes common corners, tees, and four-way crossings.
- [x] Rectangle corners and borders use edge masks.
- [x] Horizontal and vertical lines use edge masks.
- [x] README links to current design and maintenance documents.
- [ ] JavaScript syntax/runtime check unavailable through the repository connector.
- [ ] Browser test: line crosses rectangle border and renders a junction.
- [ ] Browser test: overlapping rectangles and multiple crossings.
- [ ] Browser test: output stays within configured dimensions and is readable in narrow chat panes.
- [ ] Browser test: diagonals, arrowheads, labels, preview/copy, undo, and canvas zoom.

## Acceptance gate

This remains a candidate. Source checks passed, but visual and interaction acceptance must be performed in a running browser. The 72-column limit is a conservative default, not a guarantee across every chat client's font and zoom settings.
