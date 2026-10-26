# SketchText: Initial Design v0.1.0

**Artifact:** Initial Design  
**Version:** 0.1.0  
**Status:** Design draft; prototype implementation is separate and not yet accepted.

## 1. Purpose

SketchText is a small browser-based drawing tool for turning visual ideas into ASCII art that can be pasted into ChatGPT or other text-based conversations instead of uploading images.

**Core loop:** Draw → Generate ASCII → optionally add a descriptor → Copy → Paste into chat.

The ASCII drawing is the primary output. The descriptor is optional context, not the main feature.

## 2. Goals and scope

### Initial goals

- Freehand drawing, rectangles, lines, arrows, and text labels.
- Select and move drawn objects; clear the canvas and undo the last action.
- Generate a text-based visual representation of the drawing.
- Preserve spatial relationships and recognizable layout as well as practical.
- Optionally add a descriptor beneath the ASCII drawing.
- Copy ASCII alone or ASCII plus descriptor as plain text.
- Run locally in a modern browser without a backend, account, or AI service.

### Explicitly out of scope for the first version

- Image importing or screenshot interpretation.
- AI-generated descriptions or external AI APIs.
- Live ASCII preview as a requirement.
- Cloud sync, collaboration, database, or mandatory persistence.
- Advanced vector editing, multi-select, or desktop packaging.

## 3. User experience

The interface has a compact toolbar, drawing canvas, ASCII output area, optional descriptor field, and copy actions. The canvas is the main workspace. The user explicitly generates the ASCII output, inspects it, optionally adds context, then copies it.

ASCII output must be actual visual text, not merely a list of detected objects. It should use a consistent character grid and line breaks. The conversion is an approximation: curves, diagonals, and small details may be simplified.

Arrows do not imply a particular behavior by themselves. Users can clarify meanings in the optional descriptor.

## 4. Technology and architecture

| Layer | Technology | Responsibility |
|---|---|---|
| Structure | HTML5 | Workspace, controls, output fields |
| Styling | CSS | Layout and presentation |
| Application logic | Vanilla JavaScript | Tools, editing, conversion, copying |
| Drawing | Canvas 2D API | Render the drawing |
| ASCII conversion | Custom JavaScript | Map drawing objects to a character grid |
| Clipboard | Browser Clipboard API with fallback | Copy plain text |
| Version control | Git and GitHub | History and recoverable versions |

No framework, bundler, backend, or AI service is required.

### Initial project structure

```text
sketch-to-ascii/
├── index.html
├── style.css
├── app.js
├── README.md
└── docs/
    └── Initial-Design-v0.1.0.md
```

### Drawing representation

Represent strokes, rectangles, lines, arrows, and text as typed JavaScript objects. Keep their coordinates and content available to the ASCII converter instead of relying solely on a flattened screenshot. Render the objects onto the canvas for visual editing.

### Conversion approach

Map the drawing coordinate space onto a character grid. Render rectangles with box characters, lines and arrows with text characters, labels as text, and freehand strokes as approximate character paths. Trim empty outer rows and trailing whitespace without destroying meaningful horizontal spacing. Use a monospaced output field and preserve newlines when copying.

A live preview is optional. The first version uses an explicit **Generate ASCII** action; if live preview is added later, it should reuse the same converter.

## 5. Development state machine workflow

This project adopts the reusable **Development State Machine Workflow v1.3.0**:

https://github.com/zpitchfolo/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow-v1.3.0.md

The reusable workflow governs how the project is developed. This design defines the app and its project-specific acceptance criteria. The workflow version is referenced rather than copied wholesale, so its independently maintained source remains authoritative.

### States

| State | Name | Activity |
|---|---|---|
| S0 | Request / idea | Understand goal, constraints, and success criteria. |
| S1 | Initial design | Record scope, behavior, architecture, and workflow adoption. |
| S2 | Design refinement | Resolve ambiguity, risks, and acceptance checks. |
| S3 | Ready to implement | Confirm design and preserve a recoverable baseline. |
| S4 | Implementation | Build a uniquely versioned candidate. |
| S5 | Source inspection | Review changes and run available static checks. |
| S6 | Runtime and acceptance testing | Execute the app and test real behavior. |
| S7 | Acceptance gate | Compare actual evidence with criteria. |
| S8 | Repair and iteration | Preserve failure evidence, fix the cause, version anew, and retest. |
| S9 | Maintenance update | Record accepted version, evidence, limitations, and next steps. |
| S10 | Accepted feature / next decision | Choose further work or stop at desired scope. |
| S11 | Milestone document | Record a reconciled accepted state when the user declares the desired milestone complete. |

### Transitions

```text
S0 -> S1 -> S2 -> S3 -> S4 -> S5 -> S6 -> S7
                                      ^         |
                                      |         +-- pass --> S9 -> S10
                                      |                         |       |
                                      +-- S8 <-- failure        |       +-- more work --> S0/S1
                                           |                    |
                                           +-- design issue --> S2
                                                                +-- declared complete --> S11
```

Transition rules:

- Move from S2 to S3 only when scope and observable acceptance criteria are clear enough to implement.
- Preserve the last accepted baseline before changing code.
- Each changed candidate receives a distinct artifact version. Version numbers and acceptance status are separate.
- Source inspection alone is not runtime verification.
- Run all feasible checks against the exact candidate and record actual outcomes.
- Record unavailable checks as **BLOCKED / NOT RUN**, not as passed.
- A failed candidate remains identifiable. Repairs create a new candidate and repeat inspection and testing.
- Update maintenance documentation only from verified results.
- Do not claim acceptance until required acceptance checks pass.

### Versioning and artifacts

Use independent SemVer sequences for code and each versioned document. The initial design begins at `0.1.0`; the code has its own sequence. A maintenance document should be introduced when there is meaningful implementation state to record. A milestone document is optional until the user declares the desired completion scope.

Development artifacts as needed:

- Initial Design: intended app and acceptance criteria.
- Application code: implementation.
- Maintenance Document: accepted code version, test inventory, evidence, known issues, and next work.
- Test records: candidate version, environment, checks, results, and gaps.
- Milestone Document: reconstruction-oriented snapshot of a significant accepted state.

## 6. Acceptance criteria

### Drawing

- The page opens in a modern browser.
- Freehand strokes, rectangles, lines, arrows, and text labels can be created.
- Existing objects can be selected, moved, and deleted or cleared.
- Undo restores the previous drawing state.

### ASCII output

- Generate ASCII creates a visual text representation, not only an object list.
- Layout and important relationships are recognizable.
- Basic shapes, lines, arrows, and labels are represented where practical.
- Output spacing and line breaks remain stable when copied.
- Overlapping content has a deterministic result.
- Generating output does not modify the original drawing.

### Descriptor and clipboard

- The descriptor is optional.
- The user can copy ASCII only or the drawing plus descriptor.
- The combined output separates the descriptor clearly.
- Clipboard failure produces understandable feedback and a manual-copy fallback.

### Scope and reliability

- No backend or AI service is required.
- Image importing is not required.
- Live preview is not required.
- Actual results are recorded before acceptance.

## 7. Initial implementation order

1. Build the page and canvas.
2. Implement freehand and basic shape tools.
3. Add selection, movement, deletion, and undo.
4. Implement the character-grid ASCII converter.
5. Add the optional descriptor and combined output.
6. Add clipboard actions and feedback.
7. Test drawing, conversion, alignment, and copying.
8. Repair failures and rerun relevant checks.
9. Create/update maintenance documentation after acceptance.

The converter is the defining feature. A functional drawing canvas alone does not meet the project's purpose.

## 8. Risks and trade-offs

- **ASCII fidelity:** curves and fine details are approximated. Prioritize recognizable layout.
- **Font alignment:** proportional fonts can distort ASCII. Preserve whitespace and recommend fenced code blocks when pasting.
- **Large output:** use a practical grid width and avoid excessive blank margins.
- **Overlap:** establish deterministic draw order and test overlapping elements.
- **Scope creep:** defer image interpretation, AI, persistence, and advanced editing until actual use demonstrates need.

## 9. Current status

- **Designed:** purpose, initial scope, stack, architecture, workflow, and acceptance criteria.
- **Implemented as a prototype:** initial browser interface and basic drawing/conversion workflow are present in the accompanying source files.
- **Not yet accepted:** runtime and acceptance checks must be executed and recorded before calling this an accepted release.

The success criterion is simple: draw a visual idea and obtain readable ASCII art that can be pasted into chat instead of uploading an image.
