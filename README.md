# SketchText

SketchText is a small browser-based drawing tool that turns simple sketches into ASCII art for pasting into text-based conversations.

## Run it

Open `index.html` in a modern browser. No build step, backend, account, or AI service is required.

## Current prototype

- Freehand drawing
- Rectangles, lines, arrows, and text labels
- Select, move, and resize existing objects with visible handles
- Enter and edit text directly on the canvas in an inline text box
- Draw on a large 4000 × 2500 workspace; pan with the middle mouse button and zoom with the mouse wheel
- Edit text in-place on the drawing workspace
- Pan and zoom the generated ASCII output with the middle mouse button and mouse wheel
- ASCII generation from the drawing's objects
- Optional descriptor
- Copy ASCII or copy the drawing plus optional descriptor
- Clear canvas and undo the last action

## Known limitations

- This is an early prototype, not an accepted release.
- Multi-select is not implemented yet.
- ASCII output is a compact fixed character grid that fits the drawing's overall bounds; it approximates freehand strokes, so some details are lost.
- The drawing world is large but finite (4000 × 2500), not mathematically infinite.
- Images are intentionally out of scope for the first version.
- Browser clipboard permissions vary by browser and how the file is opened; a manual-copy fallback is included.
- The canvas and drawing are held in memory. Persistence is not implemented.

## Project documents

See `docs/Initial-Design-v0.1.0.md` for the design and workflow. See `docs/Maintenance-v0.2.0.md` for this maintenance pass and its verification status.
# sketch-to-ascii
