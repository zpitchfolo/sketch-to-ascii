# SketchText

SketchText is a small browser-based drawing tool that turns simple sketches into ASCII art for pasting into text-based conversations.

## Run it

Open `index.html` in a modern browser. No build step, backend, account, or AI service is required.

## Current prototype

- Freehand drawing, rectangles, lines, arrows, and text labels
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
- Optional descriptor; copy ASCII alone or the drawing plus descriptor
- Clear canvas and undo the last action

## Known limitations

- This is an early prototype, not an accepted release.
- Multi-select is not implemented yet.
- The 72-by-28 output limit is a practical target, not a guarantee for every chat client, font, or zoom setting.
- Freehand strokes and diagonal intersections remain approximate; minimum visible footprints may slightly distort tiny shapes to prevent them disappearing.
- The drawing world expands in 2000-unit increments, so it is practically expandable rather than mathematically infinite.
- Images are out of scope for the first version.
- Browser clipboard permissions vary by browser and how the file is opened; a manual-copy fallback is included.
- The canvas and drawing are held in memory. Persistence is not implemented.

## Working document

See [Working-Copy.md](docs/Working-Copy.md) for the current design, implementation decisions, and verification status. Use Git history and diffs to compare earlier versions.
