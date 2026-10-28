# SketchText

SketchText is a browser-based visual writing and thinking tool for drawing spatial layouts and turning them into live-updating ASCII/Unicode text for notes, messages, and LLM conversations.

## Run it

Open `index.html` in a modern browser. No build step, backend, account, or AI service is required.

## Current prototype

- ASCIIFlow-inspired Draw brush stamps grid-aligned X marks; rectangles, movable grid-snapped horizontal/vertical lines and arrows, and text labels are also supported
- The visual preview is the live text output and updates as objects are drawn or edited; there is no separate text-output pane or Generate button
- Desktop drawing/output panes can be resized independently
- Select, move, and resize existing objects with visible handles
- Enter and edit text directly on the canvas in an inline text box
- Responsive-width drawing canvas that fits the pane without horizontal scrolling; the drawing surface stays 1600 pixels tall and scrolls vertically
- Eraser tool removes objects on click or while dragging over them, with undo support
- The live preview is actual selectable text, preserving spacing and line breaks, and scrolls vertically without zoom or pan
- Copy ASCII as plain text, or copy it wrapped in a Markdown code fence for platforms that support Markdown
- Place consecutive text labels without switching tools
- ASCII generation uses content-based bounds and an adaptive character grid
- Output is capped at 72 columns by 28 rows for a conservative chat-friendly size
- Tiny rectangles receive a minimum 2-by-2 character footprint; line segments that would collapse into one cell are extended to remain visible
- Rectangle and horizontal/vertical line intersections use Unicode box-drawing junctions
- Structural line/arrow drawing snaps to the visible 36-pixel grid and automatically routes with a 90-degree elbow; endpoint handles reroute the path while body-drag moves the whole route
- Optional descriptor; copy ASCII alone or the drawing plus descriptor
- Clear canvas and undo the last action

## Known limitations

- This is an early prototype, not an accepted release.
- Multi-select is not implemented yet.
- The 72-by-28 output limit is a practical target, not a guarantee for every chat client, font, or zoom setting.
- Draw stamps X marks on grid points; diagonal intersections remain approximate.
- The output frame still has no drag-resize or exact numeric width/height controls; destination profiles are not implemented.
- Responsive canvas sizing and pane resizing have received source-level checks only; browser interaction acceptance remains pending.
- The drawing surface is 1600 pixels tall. Its width follows the drawing pane; resizing the pane changes the available horizontal drawing space.
- Images are out of scope for the first version.
- Browser clipboard permissions vary by browser and how the file is opened; a manual-copy fallback is included.
- The canvas and drawing are held in memory. Persistence is not implemented.

## Current design and maintenance records

- [Design refinement v0.4.0](docs/Design-Refinement-v0.4.0.md)
- [Maintenance v0.9.0](docs/Maintenance-v0.9.0.md)

These are the current working documents. Update them in place according to the established development workflow; use Git history and `git diff` for comparisons rather than creating parallel copies.
