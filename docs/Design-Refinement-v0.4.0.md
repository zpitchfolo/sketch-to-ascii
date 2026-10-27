# SketchText Design Refinement v0.4.0

**Artifact:** Chat-sized output and intersection-aware line art  
**Version:** 0.4.0  
**Status:** Updated candidate; runtime acceptance checks pending  
**Date:** 2026-10-27  
**Base design:** Earlier refinement retained in Git history  
**Development workflow:** Development State Machine Workflow v1.3.0  
https://github.com/zpitchfolo/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow-v1.3.0.md

## Problems

- Previous output could be too wide for typical chat panes.
- Rectangle borders and axis-aligned lines overwrote one another at intersections, creating broken or ambiguous junctions.
- A fixed minimum grid size could distort drawings with extreme aspect ratios.
- A drawing can look correct on the canvas but produce text that wraps or appears differently in its destination app.
- The tool should be useful for writing and thinking, not only for converting a finished sketch into an export.

## Decisions

1. Bound generated output to at most 72 columns and 28 rows. This is a conservative target for common chat panes, not a guarantee for every font, zoom level, or client.
2. Preserve the drawing's relative spacing and crop only globally empty outer rows and columns.
3. Use a shared-scale aspect-aware grid with no artificial minimum dimensions; allow narrow/tall drawings to use fewer columns rather than stretching them.
4. Track horizontal and vertical edge connections in a per-cell bitmask. Resolve compatible overlaps into Unicode box-drawing junctions such as `┬`, `├`, `┼`, and `┤`.
5. Use the same topology-aware edge writer for rectangle borders and axis-aligned lines, so their intersections combine rather than last-write-wins.
6. Keep diagonal strokes approximate. A diagonal crossing may still need a style-specific glyph, because the renderer cannot infer whether it means a connection or an overlay.
7. Use a fixed 1:1 drawing-canvas scale. Mouse-wheel input must not zoom the drawing workspace; middle-drag panning remains available. Keep ASCII-preview zoom separate from drawing-canvas scale.
8. Prevent small objects from silently disappearing in output. Expand mapped rectangles to a minimum 2-by-2 character footprint and extend line or arrow segments if both endpoints map to the same character cell. This intentionally prioritizes visible output over exact proportions for tiny objects.
9. Keep the drawing canvas and text output as distinct but synchronized views: the canvas is the spatial editing surface, while the generated text is a first-class artifact for writing, sharing, and LLM input.

## Proposed Feature: Live Text Preview and Destination Profiles

**Status: Planned; not implemented or runtime-tested.** This feature refines the current drawing-to-text workflow. It does not replace the drawing canvas or change the current output format.

### Purpose

SketchText should let a person draw spatially and communicate textually. The same diagram should be useful in personal notes or prose, as input to an LLM, or in a message to a friend without requiring a screenshot. An image export may be useful for some sharing situations, but it is optional and is not the core workflow.

### Intended behavior

- Update the generated text preview as the user draws or edits objects, so the user can see the actual characters, spacing, and line breaks during composition rather than discovering output problems only after export.
- Keep the generated text visible and easy to select or copy. The text output should be treated as a first-class artifact, not merely a disposable representation of the canvas.
- Let users choose a destination profile, such as ChatGPT, another messaging app, or a plain-text editor, to preview formatting constraints relevant to that destination.
- Show the effects of the selected profile on output width, wrapping, and any required text wrapper such as a Markdown code fence. Preview and copy must use the same generated output and formatting settings.
- Preserve the original drawing while users adjust destination settings. A narrower destination should change the output/preview strategy, not silently rearrange the source drawing.
- Keep image export optional for cases where a faithful visual snapshot is preferable to text.

### Design constraints and open decisions

- A destination profile can model known constraints, but cannot guarantee a pixel-perfect match for every client, font, zoom level, or viewport. Profiles should describe their assumptions and allow a user-adjustable width where exact client behavior is unknown.
- Decide whether the text pane is preview-only or directly editable. If direct edits are supported, define whether they are export-only edits or can be mapped back to drawing objects; do not imply round-trip editing unless it is implemented.
- Do not add Braille-pattern output as part of this feature by default. The current box-drawing/ASCII-style output is the known working baseline; alternate encodings require evidence that they improve the intended LLM and chat use cases.
- Keep the workflow lightweight: draw, inspect the live text, choose a destination if needed, then copy and continue writing.

### Acceptance criteria for the proposed feature

- A change to a drawing object updates the text preview without requiring a separate export action.
- The preview exposes the actual generated characters and whitespace, including line breaks.
- Switching destination profiles updates the preview's formatting constraints without changing the source drawing.
- Copying output uses the same destination settings currently shown in the preview.
- A user can use the text in prose, paste it into an LLM conversation, or send it as a message without needing to create an image.
- Any mismatch between a profile and a real destination app is documented; the preview does not claim exact rendering guarantees it cannot verify.

## Implementation

- `MAX_GRID_COLUMNS` and `MAX_GRID_ROWS` define conservative output limits.
- `getGridSize(bounds)` computes output dimensions within those limits.
- `mapPoint(point)` adapts margins to small grids.
- `makeGrid()` allocates both character cells and edge masks.
- `putEdge()` merges connection directions and selects the matching box-drawing glyph.
- Rectangles and horizontal/vertical line segments use edge masks.
- Text is rendered last, preserving label readability.

The live preview and destination-profile feature above is design-only; no implementation changes are implied by its inclusion here.

## Acceptance criteria

- Generated output never exceeds 72 columns or 28 rows before trimming.
- A small drawing and a wide drawing fit the configured bounds without unnecessary canvas-origin space.
- A horizontal line crossing a vertical line produces a junction glyph.
- A line crossing a rectangle border merges into a clean junction.
- Overlapping rectangles retain connected corners and edges where possible.
- Text labels remain visible over shape edges.
- Preview and copy actions use the same output.
- Existing selection, text editing, undo, and drawing zoom still work.

## Verification state

Source checks previously confirmed the fixed drawing scale and wheel guard, minimum footprints for tiny rectangles and collapsed line/arrow endpoints, configured output limits, edge-mask resolver, rectangle edge tracking, axis-aligned line tracking, adaptive margins, and JavaScript syntax. Live browser rendering, output-width measurement in multiple chat clients, and interaction regression tests remain pending. The proposed live text preview and destination profiles have not been implemented or tested. This candidate is not accepted until the relevant tests pass.
