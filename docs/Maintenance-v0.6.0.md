# SketchText Maintenance v0.6.0

**Artifact:** Text-layer selection and preview-only output  
**Version:** 0.6.0  
**Status:** Source changes committed; browser acceptance checks pending  
**Date:** 2026-10-26  
**Target:** `main`  
**Previous maintenance record:** `Maintenance-v0.5.0.md`

## User report and request

- Text objects could not be selected when another object overlapped them.
- Text behind another object could be missing from generated ASCII.
- Keep the zoomable Preview, but remove the separate generated-text box.

## Change

- Hit-testing checks text objects first, so an overlapping shape does not make a text label inaccessible to selection or editing.
- ASCII generation draws non-text objects first and text objects afterward, keeping labels visible over intersecting shapes regardless of creation order.
- Removed the generated-text textarea. The zoomable Preview remains the visible output view.
- Generated ASCII is held in application state and used by both copy actions. The optional descriptor and combined-copy behavior remain.
- Updated the clipboard failure message because there is no longer a visible text box to select for manual copying.
- Updated README to describe preview-only output and point to this maintenance record.

## Verification

- [x] Source changes prepared against the current `main` implementation.
- [x] Static source assertions confirm the app no longer references the removed generated-text textarea.
- [x] Static source assertions confirm text hit-testing is prioritized and text is emitted after non-text objects.
- [x] Static source assertions confirm preview and copy actions use generated output state.
- [ ] JavaScript syntax check in a runtime not available through the repository connector.
- [ ] Browser test: select and edit text overlapped by a shape.
- [ ] Browser test: generate overlapping text and shapes; confirm the label appears in Preview.
- [ ] Browser test: generate, copy ASCII, and copy drawing plus descriptor without a generated-text box.
- [ ] Recheck viewport fit after removing the generated-text box.

## Acceptance criteria

- [ ] Clicking text covered by another object selects the text; double-clicking it opens the editor.
- [ ] Text remains visible in generated ASCII when it overlaps shapes or lines.
- [ ] The zoomable Preview remains and updates after generation.
- [ ] No separate generated-text display box appears.
- [ ] Both copy actions preserve generated ASCII and optional descriptor behavior.
- [ ] Desktop single-screen layout and narrow-screen scrolling remain usable.

## Status

The code changes address the reported causes at source level, but no live browser acceptance test was run in this environment. The feature remains **pending runtime verification** until the listed interactions are tested.
