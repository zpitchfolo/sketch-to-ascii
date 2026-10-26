# SketchText Maintenance v0.3.0

**Artifact:** Maintenance record  
**Version:** 0.3.0  
**Status:** Implementation candidate; browser acceptance testing not run  
**Date:** 2026-10-26  
**Branch:** `fix/stabilize-canvas-text-ascii`  
**Baseline:** Previous candidate recorded in `Maintenance-v0.2.0.md`

## Goal

Repair the reported text-editor and ASCII pan/zoom behavior while preserving the existing drawing tools and conversion workflow.

## Changes in this candidate

- **Text commit behavior:** leaving an existing text editor no longer removes its object when the editor value is empty or whitespace. Non-empty edits are committed on blur. Escape cancels the active edit. Empty new text is not added.
- **Dedicated ASCII preview:** the zoomable preview is a separate `pre` element inside the clipped viewport. The editable, selectable, copyable output remains a separate textarea outside the transformed preview.
- **Preview synchronization:** generating ASCII updates both the text output and preview. Editing the generated text updates the preview. Copy actions continue to read the underlying text value, not the transformed preview.
- **Expandable drawing world:** panning or zooming near a world edge grows the drawing surface in 2000-unit increments. When the top or left edge expands, object coordinates, undo snapshots, active editing coordinates, and the current pan origin are shifted together so existing content stays in place.
- **Initial navigation:** the initial drawing view is centered within the current workspace, instead of starting at its top-left corner.
- **Documentation:** README describes the new interaction boundaries and links this maintenance candidate.

## Source-level verification

- **JavaScript parse check:** Passed with the JavaScript parser via `new Function(appJs)`.
- **ASCII transform boundary:** Source inspection confirms the transform is applied to `asciiPreview`, not `asciiOutput`.
- **Text deletion-on-blur guard:** Source inspection confirms blur no longer removes an existing label for an empty editor value.
- **Expansion wiring:** Source inspection confirms edge expansion is invoked from drawing-viewport pan and wheel-zoom handling.
- **Browser runtime:** **NOT RUN / BLOCKED in this pass.** No browser automation or interactive browser session was available, so pointer behavior and actual visual layout remain unverified.

## Acceptance tests still required

- [ ] Create text, click away, and confirm it remains visible.
- [ ] Edit an existing label, click away, and confirm the non-empty edit is committed.
- [ ] Empty an existing editor and click away; confirm the saved label is not silently deleted.
- [ ] Press Escape while editing existing text; confirm the previous saved text remains.
- [ ] Create multiline labels at several zoom levels and after panning; verify alignment.
- [ ] Pan to each edge and verify the world expands without moving existing content on screen.
- [ ] Verify undo snapshots remain correct after top/left world expansion.
- [ ] Generate ASCII; verify preview pan/zoom changes only the preview.
- [ ] Edit generated text and verify preview synchronization.
- [ ] Copy ASCII and combined output after preview pan/zoom; verify exact content and line breaks.
- [ ] Regression-test draw, select, move, resize, delete, clear, undo, and regenerate.
- [ ] Reload the page and inspect browser console for runtime errors.

## Known limitations

- This candidate is not accepted until the browser acceptance checks are run.
- The workspace grows in 2000-unit increments as needed. It is practically expandable, not mathematically infinite.
- The ASCII converter still uses a compact 100 × 36 character grid, so large drawings can lose detail.
- Persistence, image import, and multi-select remain out of scope.

## Workflow status

Current state: **S5 source inspection partially completed; S6 runtime and acceptance testing not completed; S7 acceptance gate not passed.**

Do not label this candidate accepted until the checks above are run against this exact branch. If a check fails, preserve the failure evidence, repair the cause in a new candidate, and rerun affected regression checks.
