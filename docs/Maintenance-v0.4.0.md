# SketchText Maintenance v0.4.0

**Artifact:** Follow-up repair candidate  
**Version:** 0.4.0  
**Status:** Source checks passed; browser acceptance testing not run  
**Date:** 2026-10-26  
**Branch:** `fix/stabilize-canvas-text-ascii`  
**Previous candidate:** `Maintenance-v0.3.0.md`

## Reported failures

1. The first text label stayed, but subsequent labels were not committed consistently unless the user switched to Select.
2. ASCII zoom affected a scrollable text-like content area instead of behaving as a zoomable drawing viewport.

## Changes

- **Commit before the next canvas action:** when the user clicks the drawing canvas while an inline editor is still active, the active text is explicitly committed before the click is handled. This does not depend solely on blur event ordering.
- **Keep text tool reusable:** the Text tool remains active so the user can place multiple labels in sequence without switching tools.
- **Dedicated ASCII preview canvas:** replaced the transformed preformatted text element with a canvas that draws the ASCII lines.
- **Clipped viewport:** the preview canvas fills the fixed-height viewport. The viewport itself is not transformed and does not become a scaled scrollable text field.
- **Independent preview navigation:** pan and wheel zoom transform the ASCII artwork's drawing context. The editable/copyable textarea remains independent, and the preview redraws when its text changes.
- **Responsive preview backing size:** the preview canvas resizes to the viewport and device pixel ratio.

## Source-level verification

- [x] JavaScript syntax parse check passed with `new Function(appJs)`.
- [x] Source inspection confirms the previous text is committed before the next canvas click is handled.
- [x] Source inspection confirms the ASCII preview is a canvas and pan/zoom are applied to its drawing context, not the viewport or text textarea.
- [x] Source inspection confirms generated text is split into lines and drawn line-by-line.
- [x] Source inspection confirms the editable output textarea and clipboard actions remain separate from the preview rendering.
- [ ] Browser runtime and pointer/focus acceptance tests not run.

## Acceptance checklist

- [ ] Create a first text label and click elsewhere; it remains visible.
- [ ] Without switching to Select, create a second and third label; each previous label remains visible at its original position.
- [ ] Edit an existing label and click another canvas position; the edit commits and the next editor opens.
- [ ] Verify Escape cancels an active edit and leaves previously saved text unchanged.
- [ ] Create and edit multiline text at several canvas zoom levels.
- [ ] Generate ASCII and confirm the preview appears inside the fixed viewport.
- [ ] Pan with middle mouse and zoom with the wheel; artwork moves/scales inside the viewport without creating a scrollable/scaled text area.
- [ ] Confirm zoom indicator updates and preview remains clipped at viewport edges.
- [ ] Edit the generated text and confirm preview line breaks and content update.
- [ ] Copy ASCII and combined drawing/descriptor; copied content is unaffected by preview zoom or pan.
- [ ] Regression-test all drawing tools, select/move/resize, delete, clear, undo, and regeneration.
- [ ] Reload and inspect browser console for runtime errors.

## Remaining limitations and status

- The ASCII converter still emits a compact 100 × 36 character grid; this change improves preview navigation, not conversion resolution.
- Workspace growth, text interaction, and canvas rendering still require live browser verification.
- No acceptance claim is made until the checklist is run against this exact branch.

Workflow status: **S5 source inspection performed for this repair; S6 runtime/acceptance testing not completed; S7 acceptance gate not passed.**
