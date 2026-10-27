# SketchText Maintenance v0.9.0

**Artifact:** Chat-fit ASCII output and intersection handling  
**Version:** 0.9.0  
**Status:** Updated source and documentation committed; browser acceptance checks pending  
**Date:** 2026-10-26  
**Target:** `main`  
**Previous maintenance record:** Earlier records retained in Git history

## Request

- Improve broken intersections between rectangles and lines.
- Keep generated output compact enough for typical chat windows of unknown width.
- Preserve the preview and copy workflows.
- Fix the drawing canvas at 1:1 scale; the user prioritizes a predictable, chat-ready drawing workflow over canvas zoom.
- Prevent tiny rectangles and very short lines/arrows from collapsing into invisible or ambiguous output.

## Changes

- Capped the generated grid at 72 columns by 28 rows, a conservative default for common chat panes rather than a universal guarantee.
- Removed artificial minimum grid dimensions to avoid stretching extreme aspect ratios.
- Added adaptive margins for very narrow grids.
- Added per-cell edge masks and Unicode junction resolution for rectangles and horizontal/vertical lines.
- Rectangle borders and axis-aligned lines now merge connection masks rather than blindly overwriting existing edge characters.
- Kept diagonal strokes approximate and documented this limitation; the renderer cannot infer semantic connection intent.
- Fixed the drawing canvas scale at 1:1 and made its wheel handler prevent zoom; middle-drag panning remains available. ASCII-preview zoom remains independent.
- Give mapped rectangles a minimum 2-by-2 character footprint and extend line/arrow segments when both endpoints map to the same cell.
- Updated the existing README, design refinement, and maintenance document in place. The design and maintenance filenames remain the current working filenames; comparisons belong in Git history and `git diff` rather than parallel document copies.

## Source checks

- [x] Output dimensions capped at 72 columns and 28 rows.
- [x] Shared-scale aspect-aware sizing retained without artificial minimum dimensions.
- [x] Narrow-grid margins adapt to grid dimensions.
- [x] Unicode edge-mask mapping includes common corners, tees, and four-way crossings.
- [x] Rectangle corners and borders use edge masks.
- [x] Horizontal and vertical lines use edge masks.
- [x] Drawing canvas stays at fixed 1:1 scale; wheel input is blocked for canvas zoom.
- [x] Tiny rectangles have a minimum 2-by-2 character footprint.
- [x] Collapsed line/arrow endpoints are extended along their dominant direction.
- [x] JavaScript syntax parses successfully.
- [x] README links to the current design and maintenance documents.
- [ ] Browser test: line crosses rectangle border and renders a junction.
- [ ] Browser test: overlapping rectangles and multiple crossings.
- [ ] Browser test: output stays within configured dimensions and is readable in narrow chat panes.
- [ ] Browser test: diagonals, arrowheads, labels, preview/copy, undo, fixed-scale canvas behavior, and ASCII-preview zoom.

## Acceptance gate

This remains a candidate. Source checks passed, including JavaScript parsing, but visual and interaction acceptance must be performed in a running browser. The 72-column limit is a conservative default, not a guarantee across every chat client's font and zoom settings.
