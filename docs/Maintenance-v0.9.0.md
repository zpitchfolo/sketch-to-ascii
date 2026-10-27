# SketchText Maintenance v0.11.0

**Artifact:** Chat-fit ASCII output and intersection handling  
**Version:** 0.11.0  
**Status:** Implementation candidate; syntax/runtime acceptance checks pending  
**Date:** 2026-10-27  
**Target:** `main`  
**Previous maintenance record:** Earlier records retained in Git history

## Request

- Improve broken intersections between rectangles and lines.
- Keep generated output compact enough for typical chat windows of unknown width.
- Preserve the preview and copy workflows.
- Fix the drawing canvas at 1:1 scale; the user prioritizes a predictable, chat-ready drawing workflow over canvas zoom.
- Prevent tiny rectangles and very short lines/arrows from collapsing into invisible or ambiguous output.
- Record the proposed live text preview and destination-specific formatting feature in the design document.
- Refine the design around ASCIIFlow-style character-grid drawing, distinct structural line/arrow tools and freeform X marks, independently resizable workspace panes, and an output frame that supports drag resizing plus exact numeric width/height.

## Changes

- Capped the generated grid at 72 columns by 28 rows, a conservative default for common chat panes rather than a universal guarantee.
- Removed artificial minimum grid dimensions to avoid stretching extreme aspect ratios.
- Added adaptive margins for very narrow grids.
- Added per-cell edge masks and Unicode junction resolution for rectangles and horizontal/vertical lines.
- Rectangle borders and axis-aligned lines now merge connection masks rather than blindly overwriting existing edge characters.
- Kept diagonal strokes approximate and documented this limitation; the renderer cannot infer semantic connection intent.
- Fixed the drawing canvas scale at 1:1 and made its wheel handler prevent zoom; middle-drag panning remains available. ASCII-preview zoom remains independent.
- Give mapped rectangles a minimum 2-by-2 character footprint and extend line/arrow segments when both endpoints map to the same cell.
- Added a design-only proposal for ASCIIFlow-inspired grid-based drawing interactions. Structural lines and arrows should follow character-grid directions, while X marks and other freeform annotations remain available as distinct tools.
- Specified independently resizable drawing/output panes and a separate output frame that can be dragged or sized using exact character-column and line counts. Pane size and output-frame dimensions are separate controls; overflow should be shown rather than silently distorting or deleting objects.
- Expanded the live-preview and destination-profile proposal. The goal is to let people use drawings in their own writing, paste them into LLM conversations, or share them as text messages without requiring an image.
- Specified that destination previews should show generated characters, spacing, line breaks, and width/wrapping constraints; preview and copy should use the same settings.
- Recorded unresolved details, including the limits of approximating another app's rendering and whether direct editing of generated text should map back to canvas objects.
- Updated `app.js`, `index.html`, and `style.css` to implement grid-snapped structural strokes, an X-mark tool, live generated text output, and an independently resizable desktop pane split.
- Structural line/arrow endpoint resizing now preserves axis alignment and grid snapping.
- Application source was changed for this candidate. Automated syntax checks and browser acceptance tests have not yet been run.

## Source checks

Previously recorded source checks:
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
- [ ] Browser test: diagonals/structural-line constraints, arrowheads, labels, preview/copy, undo, fixed-scale canvas behavior, and ASCII-preview zoom.
- [ ] Interaction test: structural lines and arrows snap to character-grid directions while X marks/freeform annotations remain usable.
- [ ] Interaction test: line/arrow crossings, box-border connections, and arrowheads render without gaps or corrupted junctions.
- [ ] Interaction test: drawing and text panes resize independently without changing output-frame dimensions.
- [ ] Interaction test: output frame supports drag resizing and exact numeric width/height in characters/lines.
- [ ] Interaction test: changing frame dimensions preserves source objects, updates preview, and visibly flags overflow without silent deletion or distortion.
- [ ] Runtime test: live text output and visual preview update during pointer movement, object edits, undo, and text-label commits.
- [ ] Runtime test: grid-snapped lines/arrows remain horizontal or vertical during drawing, moving, and endpoint resizing.
- [ ] Runtime test: X marks render and export as `X` at their center.
- [ ] Runtime test: desktop pane divider works with pointer and keyboard, and is hidden on narrow screens.

## Verification and acceptance status

This candidate changes `app.js`, `index.html`, and `style.css`. Source-level consistency checks confirmed the new tool, snapping helpers, live output node, draft preview path, pane divider handlers, and responsive divider rule are present. These are static source inspections, not a JavaScript parser or browser test. JavaScript syntax/runtime checks and browser acceptance tests have not been run. The numeric output frame, overflow reporting, and destination profiles remain proposed work.

The app remains an unaccepted candidate until the new and existing interactions are exercised in a browser. Previously recorded source checks relate to the prior candidate and do not establish syntax correctness or runtime behavior for these changes. The 72-column limit is a conservative default, not a guarantee across every chat client's font and zoom settings. The design document is now v0.6.0. The exact numeric output frame, overflow reporting, and destination profiles are still future work.
