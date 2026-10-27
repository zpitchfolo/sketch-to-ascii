# SketchText Working Copy

**Status:** Candidate implementation; browser acceptance pending  
**Working branch:** `main`  
**Last updated:** 2026-10-26  
**Workflow:** [Development State Machine Workflow v1.3.0](https://github.com/zpitchfolo/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow-v1.3.0.md)

This is the single current working document. Historical design and maintenance files are removed from the working tree; Git history remains the source for comparisons and recovery. Use `git diff` or GitHub's commit comparison when a change needs review. Update this document in place instead of creating a new versioned copy for every iteration.

## Purpose

SketchText lets a person draw a simple sketch and turn it into compact, copyable ASCII for text-based conversations. It is a lightweight browser app with no backend or account.

## Current behavior

- Freehand drawing, rectangles, lines, arrows, and text labels.
- Select, move, and resize objects; undo the last action; clear the canvas.
- Text can be edited in place. Consecutive labels can be placed without switching tools.
- Drawing workspace uses a fixed 1:1 scale. Mouse-wheel input does not zoom the drawing; middle-drag pans.
- The drawing world expands in 2000-unit increments when panning near its edges. This is practically expandable, not mathematically infinite.
- ASCII preview can be panned and zoomed independently of the drawing canvas.
- Generated output is retained internally and copied either alone or with an optional descriptor.

## Chat-ready output rules

- Target maximum: 72 columns by 28 rows. This is conservative for common chat panes, not a universal guarantee across clients, fonts, or display zoom.
- Use content bounds rather than the full canvas bounds, and trim globally empty outer rows and columns.
- Preserve relative spacing wherever possible and use aspect-aware grid sizing.
- Give rectangles a minimum 2-by-2 character footprint if their mapped bounds would collapse.
- Extend a line or arrow by a character-cell footprint if both endpoints map to the same cell.
- Resolve rectangle and horizontal/vertical line overlaps using shared edge masks and Unicode box-drawing junctions.
- Render text last so labels remain readable.
- Freehand strokes, diagonals, and some overlaps remain approximate. Minimum visible footprints may distort tiny objects slightly; readability takes priority over silent disappearance.

## Acceptance criteria

- [ ] Mouse-wheel movement never changes the drawing canvas scale.
- [ ] Middle-drag pan and drawing interactions still work at fixed scale.
- [ ] A tiny rectangle still produces a recognizable outline in ASCII.
- [ ] A very short line or arrow remains visible in ASCII.
- [ ] Normal rectangles, lines, arrows, freehand strokes, and text still generate output.
- [ ] Output remains within 72 columns and 28 rows.
- [ ] Rectangle/line intersections use junction glyphs where compatible.
- [ ] Preview and copy actions use the same generated output.
- [ ] Undo, clear, select, resize, and consecutive text entry still work.

## Verification record

**Source checks performed for this candidate**
- Fixed scale remains set to 1 and canvas wheel handling returns without changing zoom.
- Rectangle output includes a minimum 2-by-2 grid footprint.
- A collapsed line/arrow endpoint pair is extended along its dominant canvas direction.
- Existing output grid cap and edge-mask intersection renderer are retained.
- README points to this working document.

**Not yet verified**
- Browser/runtime tests and visual inspection.
- Whether every shape remains readable in different chat clients.
- Regression checks for drawing, selection, resize, undo, text editing, and preview/copy interactions.

Do not mark this candidate accepted until the relevant browser acceptance checks are actually run. Record test evidence here and use Git diffs to inspect changes instead of preserving duplicate document versions.
