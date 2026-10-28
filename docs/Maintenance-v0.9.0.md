# SketchText Maintenance v0.11.3

**Artifact:** Chat-fit ASCII output and intersection handling  
**Version:** 0.11.3  
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
- Replaced canvas panning and automatic expansion with a bounded 4000 × 2500 drawing surface and native horizontal/vertical scrollbars.
- Replaced the preview canvas with a selectable `<pre>` containing generated text; it preserves line breaks and spaces and scrolls vertically only.
- Added an eraser that removes objects on click/drag with one undo snapshot per gesture, plus Markdown-fenced copy output.
- Give mapped rectangles a minimum 2-by-2 character footprint and extend line/arrow segments when both endpoints map to the same cell.
- Added a design-only proposal for ASCIIFlow-inspired grid-based drawing interactions. Structural lines and arrows should follow character-grid directions, while X marks and other freeform annotations remain available as distinct tools.
- Specified independently resizable drawing/output panes and a separate output frame that can be dragged or sized using exact character-column and line counts. Pane size and output-frame dimensions are separate controls; overflow should be shown rather than silently distorting or deleting objects.
- Expanded the live-preview and destination-profile proposal. The goal is to let people use drawings in their own writing, paste them into LLM conversations, or share them as text messages without requiring an image.
- Specified that destination previews should show generated characters, spacing, line breaks, and width/wrapping constraints; preview and copy should use the same settings.
- Recorded unresolved details, including the limits of approximating another app's rendering and whether direct editing of generated text should map back to canvas objects.
- Updated `app.js`, `index.html`, and `style.css` so Draw stamps X marks on the character grid, inspired by ASCIIFlow, instead of making continuous freehand strokes.
- Removed the separate live text-output pane and Generate ASCII button; the existing visual preview is now the single live output surface.
- Kept structural lines and arrows selectable and movable as whole objects, with endpoint handles for adjustments.
- Structural line/arrow endpoint dragging reroutes the path through a right-angle elbow while preserving grid snapping.
- Whole-line/arrow dragging moves the complete route in grid-cell increments while preserving its right-angle shape. X-brush strokes interpolate skipped grid cells between pointer events.
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
- [x] Previous candidate JavaScript syntax parse was successful.
- [x] Current candidate JavaScript syntax parses successfully (parsed without executing the app).
- [x] HTML ID references used by `app.js` resolve to unique IDs in `index.html`.
- [x] README links to the current design and maintenance documents.
- [ ] Browser test: line crosses rectangle border and renders a junction.
- [ ] Browser test: overlapping rectangles and multiple crossings.
- [ ] Browser test: output stays within configured dimensions and is readable in narrow chat panes.
- [ ] Browser test: structural-line constraints, arrowheads, labels, preview/copy, undo, fixed-size canvas bounds, eraser, and vertical-only preview scrolling.
- [ ] Interaction test: structural lines and arrows snap to character-grid directions while X marks/freeform annotations remain usable.
- [ ] Interaction test: line/arrow crossings, box-border connections, and arrowheads render without gaps or corrupted junctions.
- [ ] Interaction test: drawing and text panes resize independently without changing output-frame dimensions.
- [ ] Interaction test: output frame supports drag resizing and exact numeric width/height in characters/lines.
- [ ] Interaction test: changing frame dimensions preserves source objects, updates preview, and visibly flags overflow without silent deletion or distortion.
- [ ] Runtime test: live text output and visual preview update during pointer movement, object edits, undo, and text-label commits.
- [ ] Runtime test: grid-snapped lines/arrows draw as right-angle paths, preserve their shape when moved, and reroute when either endpoint is dragged.
- [ ] Runtime test: native scrollbars navigate the fixed canvas without changing coordinates or dimensions.
- [ ] Runtime test: eraser removes objects by click/drag and undo restores erased objects.
- [ ] Runtime test: Markdown copy produces a valid fenced code block, including labels with backticks.
- [ ] Runtime test: preview preserves spaces/newlines and only scrolls vertically.
- [ ] Runtime test: the Draw brush stamps X marks at grid points and each stamp exports as `X`.
- [ ] Runtime test: lines and arrows can be selected, moved, and adjusted by their endpoint handles.
- [ ] Runtime test: desktop pane divider works with pointer and keyboard, and is hidden on narrow screens.

## Verification and acceptance status

This candidate changes `app.js`, `index.html`, and `style.css`. Source-level consistency checks confirmed the new tool, snapping helpers, live output node, draft preview path, pane divider handlers, and responsive divider rule are present. The current JavaScript candidate was parsed successfully without executing it, and the `getElementById` references in the app resolve to unique IDs in the HTML. Browser interaction tests and runtime acceptance tests have not been run. The numeric output frame, overflow reporting, and destination profiles remain proposed work.

The app remains an unaccepted candidate until the new and existing interactions are exercised in a browser. Previously recorded source checks relate to the prior candidate and do not establish syntax correctness or runtime behavior for these changes. The 72-column limit is a conservative default, not a guarantee across every chat client's font and zoom settings. The design document is now v0.8.0. The exact numeric output frame, overflow reporting, and destination profiles are still future work.
