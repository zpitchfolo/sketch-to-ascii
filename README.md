# SketchText

SketchText is a small browser-based drawing tool that turns simple sketches into ASCII art for pasting into text-based conversations.

## Run it

Open `index.html` in a modern browser. No build step, backend, account, or AI service is required.

## Current prototype

- Freehand drawing
- Rectangles, lines, arrows, and text labels
- Select and move existing objects
- ASCII generation from the drawing's objects
- Optional descriptor
- Copy ASCII only or copy the ASCII plus descriptor
- Clear canvas and undo the last action

## Known limitations

- This is an early prototype, not an accepted release.
- Text labels are added through a browser prompt.
- Objects can be selected and moved, but resizing and multi-select are not implemented yet.
- ASCII output uses a fixed character grid and approximates freehand strokes. Some drawings will lose detail.
- Images are intentionally out of scope for the first version.
- Browser clipboard permissions vary by browser and how the file is opened; a manual-copy fallback is included.
- The canvas and drawing are held in memory. Persistence is not implemented.

## Project documents

See `docs/Initial-Design-v0.1.0.md` for the design, acceptance criteria, and adopted development state-machine workflow.
# sketch-to-ascii
