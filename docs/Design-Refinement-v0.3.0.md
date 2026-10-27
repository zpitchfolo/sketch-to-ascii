# SketchText Design Refinement v0.3.0

**Artifact:** Proportion-aware ASCII layout and whitespace trimming  
**Version:** 0.3.0  
**Status:** Implemented as a candidate; runtime acceptance checks pending  
**Date:** 2026-10-26  
**Base design:** `Design-Refinement-v0.2.0.md`  
**Development workflow:** Development State Machine Workflow v1.3.0  
https://github.com/zpitchfolo/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow-v1.3.0.md

## Problem

Generated output can feel badly framed when the converter uses grid minimums that distort extreme aspect ratios or leaves globally empty columns around the drawing. Removing every gap between objects would be a different layout policy: it would destroy meaningful spatial relationships in diagrams.

## Decisions

1. Preserve the sketch's relative object positions and the spaces between objects by default.
2. Crop only rows and columns that are globally empty at the outside edge of the rendered grid. Do not compact gaps between separate objects.
3. Calculate the adaptive grid using one shared scale constrained by the 140-column and 60-row maximums. Avoid independent minimum dimensions that can disproportionately stretch very wide or tall drawings.
4. Keep the existing shape-specific renderers and render text after non-text objects.
5. Treat a future compact-layout mode as a separate explicit feature, not an implicit transformation of normal output.

## Implementation

- `getGridSize(bounds)` uses the content aspect ratio and one constrained scale to choose grid dimensions.
- `generateAscii()` trims globally empty outer rows and columns after rendering.
- Internal spaces between objects remain unchanged, preserving the diagram's layout.
- No new dependency, backend, or AI service is introduced.

## Acceptance criteria

- A single small rectangle renders without unnecessary outer whitespace.
- A drawing with several separated objects preserves their relative positions and internal gaps.
- Wide and tall drawings remain recognizable without avoidable aspect-ratio distortion.
- Text remains visible over shapes and the preview/copy paths use the same output.
- Existing canvas interaction, undo, and zoom behavior are not regressed.

## Verification state

Source-level assertions confirmed the new grid-sizing logic and outer-column trimming are present. Browser interaction and visual checks remain pending. This candidate is not marked accepted until those checks are completed.
