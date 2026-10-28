# SketchText Design Refinement v0.8.2

**Artifact:** Chat-sized output and intersection-aware line art  
**Version:** 0.8.2  
**Status:** Implementation candidate; runtime acceptance checks pending  
**Date:** 2026-10-27  
**Base design:** Earlier refinement retained in Git history  
**Development workflow:** Development State Machine Workflow v1.5.0  
https://github.com/zpitchfolo/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow-v1.5.0.md

## Problems

- Previous output could be too wide for typical chat panes.
- Rectangle borders and axis-aligned lines overwrote one another at intersections, creating broken or ambiguous junctions.
- A fixed minimum grid size could distort drawings with extreme aspect ratios.
- A drawing can look correct on the canvas but produce text that wraps or appears differently in its destination app.
- The tool should be useful for writing and thinking, not only for converting a finished sketch into an export.
- Freehand pixel-style drawing is a poor fit for diagrams that need clean character-grid lines, arrows, and intersections.
- Users need control over both the available screen space and the exact character dimensions of the intended text output.

## Decisions

1. Bound generated output to at most 72 columns and 28 rows. This is a conservative target for common chat panes, not a guarantee for every font, zoom level, or client.
2. Preserve the drawing's relative spacing and crop only globally empty outer rows and columns.
3. Use a shared-scale aspect-aware grid with no artificial minimum dimensions; allow narrow/tall drawings to use fewer columns rather than stretching them.
4. Track horizontal and vertical edge connections in a per-cell bitmask. Resolve compatible overlaps into Unicode box-drawing junctions such as `┬`, `├`, `┼`, and `┤`.
5. Use the same topology-aware edge writer for rectangle borders and axis-aligned lines, so their intersections combine rather than last-write-wins.
6. Keep diagonal strokes approximate. A diagonal crossing may still need a style-specific glyph, because the renderer cannot infer whether it means a connection or an overlay.
7. Keep a stable 1200 × 1600 CSS-pixel drawing surface. Do not change the canvas bitmap dimensions in response to pane resizing because changing them resets the canvas coordinate space and has caused drawing regressions. Horizontal scrolling is disabled; vertical scrolling navigates the tall surface. The generated-text preview is the actual text in a read-only, selectable text surface with vertical scrolling only.
8. Prevent small objects from silently disappearing in output. Expand mapped rectangles to a minimum 2-by-2 character footprint and extend line or arrow segments if both endpoints map to the same character cell. This intentionally prioritizes visible output over exact proportions for tiny objects.
9. Keep the drawing canvas as the sole editing surface and the generated text preview as the actual, selectable text artifact. The output should be easy to copy into chats, forums, comments, and documents.

## Proposed Feature: Grid-Based Drawing, Resizable Output Frame, and Live Text Preview

**Status: Planned; not implemented or runtime-tested.** This feature refines the current drawing-to-text workflow. It does not replace the drawing canvas or change the current output format.

### Purpose

SketchText should let a person draw spatially and communicate textually. The same diagram should be useful in personal notes or prose, as input to an LLM, or in a message to a friend without requiring a screenshot. An image export may be useful for some sharing situations, but it is optional and is not the core workflow.

### Drawing interaction model

Use [ASCIIFlow](https://asciiflow.com/) as prior art for the grid-based drawing interaction, not as a requirement to copy its implementation or limitations. This is a planned interaction change, not a description of the current prototype.

- Draw diagram lines and arrows along character-grid directions rather than allowing the line and arrow tools to create arbitrary diagonal strokes.
- Support clean horizontal and vertical segments, connected corners, crossings, and arrowheads. Resolve line intersections consistently into suitable Unicode box-drawing characters where possible.
- Keep lightweight expressive marks available for diagrams that need them, including X marks and other freeform annotations. These marks should not be forced to behave like structural box borders.
- Keep shape and line editing spatial: users should be able to select, move, resize, and adjust objects without manually editing every output character.
- Define tool behavior explicitly so structural lines/arrows and freeform marks have different, predictable constraints.

### Resizable workspace and output frame

- Allow the drawing and generated-text panes to be resized independently with a draggable divider. This changes how much screen space each pane receives, not the dimensions of the diagram's text output.
- Provide an adjustable output frame that can be resized by dragging its edges/corners and sized precisely by typing width and height.
- Express frame dimensions in output characters and lines, not screen pixels. For example, a width of 60 means 60 output columns regardless of pane width or display scaling.
- Changing pane size must not change the configured output-frame dimensions. Changing frame dimensions must not merely scale the on-screen drawing.
- Permit drawing content to extend beyond the frame, but make overflow visible and understandable. Do not silently delete, distort, or rearrange objects when the frame changes.
- Keep the frame as a layout guide for the intended text boundary. Moving or resizing it should update the generated output and preview while preserving the source objects unless the user explicitly edits those objects.

### Intended behavior

- Update the generated text preview as the user draws or edits objects, so the user can see the actual characters, spacing, and line breaks during composition rather than discovering output problems only after export.
- Keep the generated text visible in the visual preview and easy to copy. The preview should represent the actual generated characters and whitespace, not a separate manually refreshed output.
- Let users choose a destination profile, such as ChatGPT, another messaging app, or a plain-text editor, to preview formatting constraints relevant to that destination.
- Show the effects of the selected profile on output width, wrapping, and any required text wrapper such as a Markdown code fence. Preview and copy must use the same generated output and formatting settings.
- Preserve the original drawing while users adjust destination settings. A narrower destination should change the output/preview strategy, not silently rearrange the source drawing.
- Keep image export optional for cases where a faithful visual snapshot is preferable to text.

### Design constraints and open decisions

- A destination profile can model known constraints, but cannot guarantee a pixel-perfect match for every client, font, zoom level, or viewport. Profiles should describe their assumptions and allow a user-adjustable width where exact client behavior is unknown.
- The text preview is read-only. Editing generated characters directly is intentionally out of scope because the drawing canvas is the source of truth.
- Do not add Braille-pattern output as part of this feature by default. The current box-drawing/ASCII-style output is the known working baseline; alternate encodings require evidence that they improve the intended LLM and chat use cases.
- Keep the workflow lightweight: draw, inspect the live text, adjust or erase objects, then copy plain text or a Markdown code block and continue writing.

### Acceptance criteria for the proposed feature

- Line and arrow tools create grid-aligned structural strokes rather than arbitrary diagonal strokes; X marks and freeform annotations remain available through appropriate tools.
- Connected lines, arrows, box borders, and crossings produce stable, readable junctions without stray gaps or overwritten connections.
- The drawing and text panes can be resized independently without changing the output-frame width or height.
- A user can resize the output frame by dragging and enter exact numeric width and height in characters and lines.
- Changing frame dimensions updates the preview, preserves the source objects, and shows overflow rather than silently removing or distorting content.
- A change to a drawing object updates the text preview without requiring a separate export action.
- The preview exposes the actual generated characters and whitespace, including line breaks.
- Switching destination profiles updates the preview's formatting constraints without changing the source drawing.
- Copying output uses the same destination settings currently shown in the preview.
- A user can use the text in prose, paste it into an LLM conversation, or send it as a message without needing to create an image.
- Any mismatch between a profile and a real destination app is documented; the preview does not claim exact rendering guarantees it cannot verify.

## Implementation

Implemented in the current candidate:

- Structural line and arrow endpoints snap to the visible 36-pixel drawing grid and constrain the stroke to horizontal or vertical orientation, including when resizing line endpoints.
- Reworked Draw into an ASCIIFlow-inspired brush that stamps X marks on grid points, interpolating between pointer events so fast strokes do not skip cells. Each stamp exports as an `X` character.
- The generated text and visual preview refresh during drawing and editing, including the active draft stroke.
- The visual preview is the single live output surface; removed the redundant separate text-output pane and the manual Generate ASCII button.
- The Draw tool stamps grid-aligned X marks, inspired by ASCIIFlow's draw interaction, instead of drawing continuous freehand strokes.
- Structural line and arrow objects remain selectable and movable as whole objects; their endpoint handles can adjust each segment.
- Added a draggable desktop divider to resize the drawing and output panes independently; pane resizing does not alter drawing coordinates.

Still planned and not implemented:

- Drag-resizable output frame with exact numeric width and height in character columns and lines.
- Explicit overflow reporting against that frame.
- Destination profiles and destination-specific wrapping/code-fence settings.

Renderer details:

- `MAX_GRID_COLUMNS` and `MAX_GRID_ROWS` define conservative output limits.
- `getGridSize(bounds)` computes output dimensions within those limits.
- `mapPoint(point)` adapts margins to small grids.
- `makeGrid()` allocates both character cells and edge masks.
- `putEdge()` merges connection directions and selects the matching box-drawing glyph.
- Rectangles and horizontal/vertical line segments use edge masks.
- Text is rendered last, preserving label readability.

The grid-based drawing interaction, responsive-width vertically scrollable canvas, orthogonal line/arrow routing with editable endpoints, resizable workspace panes, read-only text preview, eraser, and plain-text/Markdown copy actions are implemented in the current candidate. The numeric output frame, explicit overflow reporting, and destination-profile features remain design-only.

## Acceptance criteria

- Generated output never exceeds 72 columns or 28 rows before trimming.
- A small drawing and a wide drawing fit the configured bounds without unnecessary canvas-origin space.
- A horizontal line crossing a vertical line produces a junction glyph.
- A line crossing a rectangle border merges into a clean junction.
- Overlapping rectangles retain connected corners and edges where possible.
- Text labels remain visible over shape edges.
- Preview and copy actions use the same output.
- Existing selection, text editing, and undo work; the drawing canvas no longer supports pan or zoom gestures.

## Verification state

Source checks previously confirmed the drawing scale and wheel guard, minimum footprints for tiny rectangles and collapsed line/arrow endpoints, configured output limits, edge-mask resolver, rectangle edge tracking, axis-aligned line tracking, adaptive margins, and JavaScript syntax. Live browser rendering, output-width measurement in multiple chat clients, and interaction regression tests remain pending. The current candidate implements grid-snapped structural lines/arrows, an ASCIIFlow-inspired X-stamp Draw tool, a live visual text preview without a separate text pane or Generate button, and a draggable desktop pane divider. The numeric output frame, explicit overflow reporting, and destination profiles remain unimplemented. Source-level consistency checks were performed after editing, but JavaScript syntax checks and browser interaction tests have not been run in an application runtime. This candidate is not accepted until the relevant tests pass.


## Implemented interaction refinement (v0.8.0)

- The drawing canvas retains fixed 1200 × 1600 CSS-pixel dimensions. Horizontal scrolling is disabled and vertical scrolling remains available; the right side may be clipped in a narrower pane.
- The preview is the actual generated text in a selectable, read-only `pre` element. It preserves whitespace and line breaks, scrolls vertically, and does not zoom or pan.
- The eraser removes the topmost object under the pointer and supports click-and-drag removal. A gesture is undoable as one action.
- Copy ASCII emits plain generated text. Copy Markdown wraps the drawing in a fenced `text` code block and lengthens the fence when the drawing itself contains backticks.
- These are source-level implementation changes. Browser interaction and clipboard acceptance tests remain pending.


## Responsive canvas sizing update (v0.8.1)

- The drawing surface width follows the available drawing pane width rather than scaling a 4000 × 2500 canvas down to fit.
- The canvas is 1600 CSS pixels tall, keeping the 16-pixel text and 36-pixel drawing grid readable.
- Horizontal scrolling is disabled in the drawing viewport. Vertical scrolling remains enabled so users can navigate the full height.
- Resizing the drawing/output divider changes the available drawing width; it does not intentionally change the font size or grid spacing.
- Acceptance checks still required: verify drawing and text tools after canvas resizing, confirm no horizontal scrollbar appears, confirm vertical scrolling works, and test whether existing objects remain accessible after narrowing or widening the pane.
