# SketchText

SketchText is a small browser-based drawing tool that turns simple sketches into ASCII art for pasting into text-based conversations.

## Run it

Open `index.html` in a modern browser. No build step, backend, account, or AI service is required.

## Current prototype

- Freehand drawing
- Rectangles, lines, arrows, and text labels
- Select, move, and resize existing objects with visible handles
- Enter and edit text directly on the canvas in an inline text box
- Draw on a workspace that expands as you pan toward its edges; pan with the middle mouse button and zoom with the mouse wheel
- Start with the drawing world centered in the viewport; expanding an edge preserves existing object positions and undo snapshots
- Place consecutive text labels without switching tools; each previous label is committed before the next canvas click, and clicking away commits non-empty edits without deleting an existing label
- Pan and zoom the ASCII artwork drawn inside a clipped canvas preview; generated text is kept internally for copying rather than shown in a separate text box
- ASCII generation from the drawing's objects
- Optional descriptor
- Copy ASCII or copy the drawing plus optional descriptor
- Clear canvas and undo the last action

## Known limitations

- This is an early prototype, not an accepted release.
- Multi-select is not implemented yet.
- ASCII output is a compact fixed character grid that fits the drawing's overall bounds; it approximates freehand strokes, so some details are lost.
- The drawing world expands in 2000-unit increments when panning near an edge; it is practically expandable rather than mathematically infinite.
- Images are intentionally out of scope for the first version.
- Browser clipboard permissions vary by browser and how the file is opened; a manual-copy fallback is included.
- The canvas and drawing are held in memory. Persistence is not implemented.

## Project documents

See `docs/Initial-Design-v0.1.0.md` for the design and workflow. See `docs/Maintenance-v0.6.0.md` for the latest text-selection and preview-only output update and its verification status. Earlier maintenance records preserve previous candidates.
# sketch-to-ascii
