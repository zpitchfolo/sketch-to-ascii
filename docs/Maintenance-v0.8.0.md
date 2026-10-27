# SketchText Maintenance v0.8.0

**Artifact:** ASCII output framing and grid proportions  
**Version:** 0.8.0  
**Status:** Source changes committed; browser acceptance checks pending  
**Date:** 2026-10-26  
**Target:** `main`  
**Previous maintenance record:** `Maintenance-v0.7.0.md`

## Request

Improve the generated ASCII layout shown in the supplied example. Keep preview mode, preserve relative positions by default, reduce avoidable empty framing, and avoid shape distortion caused by grid sizing.

## Changes

- Reworked adaptive grid sizing to use one constrained scale based on content aspect ratio, avoiding independent column/row minimums that could distort unusually wide or tall drawings.
- Added trimming of globally empty outer columns after rendering, complementing the existing outer-row trim.
- Internal spaces between objects remain intact. The default renderer does not compact or rearrange objects.
- Updated the README and added `docs/Design-Refinement-v0.3.0.md` to document the layout policy and acceptance criteria.
- No compact mode or new dependency was added.

## Source checks

- [x] Shared-scale grid sizing is present.
- [x] Prior independent minimum-grid clamps are removed.
- [x] Empty outer rows and columns are trimmed.
- [x] Trimming operates on globally empty edges, not gaps between objects.
- [x] README links to the latest design and maintenance records.
- [ ] JavaScript syntax/runtime check unavailable through the repository connector.
- [ ] Browser test: small isolated rectangle.
- [ ] Browser test: multiple separated rectangles and labels, checking that internal spacing is preserved.
- [ ] Browser test: wide, tall, and extreme-aspect drawings.
- [ ] Browser test: preview and both copy actions, plus existing selection/edit/undo behavior.

## Acceptance gate

This is a candidate, not an accepted release. Source-level assertions passed, but visual and interaction acceptance still requires testing in a running browser.
