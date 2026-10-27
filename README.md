# SketchText

SketchText is a browser-based visual writing and thinking tool for drawing spatial layouts and turning them into live-updating ASCII/Unicode text for notes, messages, and LLM conversations.

## Run it

Open `index.html` in a modern browser. No build step, backend, account, or AI service is required.

## Current prototype

- Freehand drawing, rectangles, grid-snapped horizontal/vertical lines and arrows, X marks, and text labels
- Live text output updates as objects are drawn or edited
- Desktop drawing/output panes can be resized independently
- Select, move, and resize existing objects with visible handles
- Enter and edit text directly on the canvas in an inline text box
- Fixed-scale drawing canvas; mouse wheel cannot zoom the drawing. Middle-drag pans the workspace.
- The drawing world expands as you pan near its edges while preserving object positions and undo snapshots
- Place consecutive text labels without switching tools
- Zoom and pan the ASCII artwork inside a clipped preview; generated text is kept internally for copying
- ASCII generation uses content-based bounds and an adaptive character grid
- Output is capped at 72 columns by 28 rows for a conservative chat-friendly size
- Tiny rectangles receive a minimum 2-by-2 character footprint; line segments that would collapse into one cell are extended to remain visible
- Rectangle and horizontal/vertical line intersections use Unicode box-drawing junctions
- Structural line/arrow drawing snaps to the visible 36-pixel grid and constrains each stroke to one axis
- Optional descriptor; copy ASCII alone or the drawing plus descriptor
- Clear canvas and undo the last action

## Known limitations

- This is an early prototype, not an accepted release.
- Multi-select is not implemented yet.
- The 72-by-28 output limit is a practical target, not a guarantee for every chat client, font, or zoom setting.
- Freehand strokes and diagonal intersections remain approximate; X marks export as a single `X` at their center.
- The output frame still has no drag-resize or exact numeric width/height controls; destination profiles are not implemented.
- Live preview and pane resizing have received source-level checks only; browser interaction acceptance remains pending.
- The drawing world expands in 2000-unit increments, so it is practically expandable rather than mathematically infinite.
- Images are out of scope for the first version.
- Browser clipboard permissions vary by browser and how the file is opened; a manual-copy fallback is included.
- The canvas and drawing are held in memory. Persistence is not implemented.

## Current design and maintenance records

- [Design refinement v0.4.0](docs/Design-Refinement-v0.4.0.md)
- [Maintenance v0.9.0](docs/Maintenance-v0.9.0.md)

These are the current working documents. Update them in place according to the established development workflow; use Git history and `git diff` for comparisons rather than creating parallel copies.
