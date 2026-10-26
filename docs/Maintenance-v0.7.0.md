# SketchText Maintenance v0.7.0

**Artifact:** Precision zoom and content-aware ASCII rendering  
**Version:** 0.7.0  
**Status:** Source changes committed; browser acceptance checks pending  
**Date:** 2026-10-26  
**Target:** `main`  
**Previous maintenance record:** `Maintenance-v0.6.0.md`

## Request

- Allow canvas zoom high enough to draw small shapes precisely.
- Fix output that becomes too small or unusable when drawing a small rectangle.
- Use different ASCII techniques suited to different shape types.
- Investigate established rendering approaches before inventing a new converter.

## Changes

- Raised canvas zoom maximum from 4× to 32×; cursor-centered zoom behavior is retained.
- Replaced workspace-origin bounds with actual object bounds plus padding.
- Added aspect-aware adaptive output sizing, capped at 140 columns by 60 rows.
- Rectangles now use Unicode box-drawing corners and edges.
- Existing line, arrow, text, and freehand handling remain distinct renderer paths on a shared output grid.
- Text continues to render after non-text objects to preserve label readability.
- Updated README and added `docs/Design-Refinement-v0.2.0.md` to record design decisions and acceptance criteria.

## Source checks

- [x] Fixed grid constants and fixed-size mapping removed.
- [x] Zoom maximum updated to 32×.
- [x] Content bounds derive from actual object bounds and padding.
- [x] Grid sizing derives from content aspect ratio within documented limits.
- [x] Rectangle renderer uses Unicode box-drawing characters.
- [x] Text remains drawn after non-text objects.
- [ ] JavaScript syntax/runtime check unavailable through the repository connector.
- [ ] Browser test: draw small rectangles near the origin and far from it.
- [ ] Browser test: check wide, tall, diagonal, arrow, text, and freehand examples.
- [ ] Browser test: zoom to 32× and verify cursor-centered zoom and drawing interactions.
- [ ] Browser test: verify preview and copy output, plus existing select/edit/undo behavior.

## Acceptance gate

Do not treat this candidate as accepted until browser checks pass. Bounds and adaptive-grid logic have only been inspected at source level in this environment.
