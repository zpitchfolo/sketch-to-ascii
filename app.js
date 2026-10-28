(() => {
  'use strict';

  const canvas = document.getElementById('drawingCanvas');
  const ctx = canvas.getContext('2d');
  const asciiPreview = document.getElementById('asciiPreview');
  const descriptor = document.getElementById('descriptor');
  const statusMessage = document.getElementById('statusMessage');
  const undoButton = document.getElementById('undoButton');
  const inkColor = document.getElementById('inkColor');
  const textEditor = document.getElementById('textEditor');
  const canvasWorld = document.querySelector('.canvas-world');
  const asciiViewport = document.querySelector('.ascii-viewport');
  let generatedAscii = '';
  // Fixed drawing coordinate system; keep the bitmap dimensions stable while drawing.


  const state = {
    tool: 'select',
    objects: [],
    undoStack: [],
    selectedId: null,
    drawing: false,
    start: null,
    draft: null,
    moving: false,
    moveOrigin: null,
    movedObjectSnapshot: null,
    resizing: false,
    resizeHandle: null,
    resizeSnapshot: null,
    editingTextId: null,
    erasing: false,
    erasedInGesture: false,
    nextId: 1
  };

  // Conservative plain-text limits: designed to fit typical chat panes without horizontal scrolling.
  const MAX_GRID_COLUMNS = 72;
  const MAX_GRID_ROWS = 28;
  const FONT = '16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  function cloneObjects(objects) {
    return objects.map(object => JSON.parse(JSON.stringify(object)));
  }

  function saveUndo() {
    state.undoStack.push(cloneObjects(state.objects));
    if (state.undoStack.length > 60) state.undoStack.shift();
    undoButton.disabled = state.undoStack.length === 0;
  }

  function undo() {
    if (!state.undoStack.length) return;
    state.objects = state.undoStack.pop();
    state.selectedId = null;
    undoButton.disabled = state.undoStack.length === 0;
    render();
    statusMessage.textContent = 'Last action undone.';
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function getObject(id) {
    return state.objects.find(object => object.id === id);
  }

  function normalizedRect(a, b) {
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
  }

  // Structural strokes follow the visible character-grid guide and snap to one axis.
  const DRAW_GRID = 36;
  function snapGridPoint(point) {
    return { x: Math.round(point.x / DRAW_GRID) * DRAW_GRID, y: Math.round(point.y / DRAW_GRID) * DRAW_GRID };
  }
  function snapStructuralEndpoint(start, point) {
    const a = snapGridPoint(start), b = snapGridPoint(point);
    if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) b.y = a.y;
    else b.x = a.x;
    return { start: a, end: b };
  }

  function routePoints(object) {
    const a = { x: object.x1, y: object.y1 }, b = { x: object.x2, y: object.y2 };
    if (a.x === b.x || a.y === b.y) return [a, b];
    return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? [a, { x: b.x, y: a.y }, b] : [a, { x: a.x, y: b.y }, b];
  }
  function drawArrow(context, points) {
    context.beginPath(); context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => context.lineTo(point.x, point.y)); context.stroke();
    const end = points[points.length - 1], previous = points[points.length - 2];
    const angle = Math.atan2(end.y - previous.y, end.x - previous.x), headLength = 15;
    context.beginPath(); context.moveTo(end.x, end.y);
    context.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
    context.moveTo(end.x, end.y);
    context.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
    context.stroke();
  }

  function fontSize(object) { return Number.parseFloat(object.font || FONT) || 16; }
  function lineHeight(object) { return fontSize(object) * 1.2; }

  function drawObject(context, object) {
    context.save();
    context.strokeStyle = object.color || '#252833';
    context.fillStyle = object.color || '#252833';
    context.lineWidth = object.width || 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (object.type === 'freehand') {
      // ASCIIFlow-inspired draw brush: stamp one X at each visited grid point.
      object.points.forEach(point => {
        const size = 7;
        context.beginPath();
        context.moveTo(point.x - size, point.y - size);
        context.lineTo(point.x + size, point.y + size);
        context.moveTo(point.x + size, point.y - size);
        context.lineTo(point.x - size, point.y + size);
        context.stroke();
      });
    } else if (object.type === 'rect') {
      context.strokeRect(object.x, object.y, object.w, object.h);
    } else if (object.type === 'markX') {
      context.beginPath();
      context.moveTo(object.x, object.y); context.lineTo(object.x + object.w, object.y + object.h);
      context.moveTo(object.x + object.w, object.y); context.lineTo(object.x, object.y + object.h);
      context.stroke();
    } else if (object.type === 'line') {
      const points = routePoints(object);
      context.beginPath(); context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => context.lineTo(point.x, point.y)); context.stroke();
    } else if (object.type === 'arrow') {
      drawArrow(context, routePoints(object));
    } else if (object.type === 'text') {
      context.font = object.font || FONT;
      context.textBaseline = 'top';
      object.text.split('\n').forEach((line, index) => context.fillText(line, object.x, object.y + index * lineHeight(object)));
    }

    if (object.id === state.selectedId) {
      const bounds = getBounds(object);
      context.strokeStyle = '#6b5ce7';
      context.lineWidth = 1.5;
      context.setLineDash([5, 4]);
      context.strokeRect(bounds.x - 5, bounds.y - 5, bounds.w + 10, bounds.h + 10);
      context.setLineDash([]);
      const handles = getHandlePoints(bounds, object);
      context.fillStyle = '#ffffff';
      context.strokeStyle = '#5d4bd6';
      context.lineWidth = 1.5;
      handles.forEach(handle => { context.fillRect(handle.x - 5, handle.y - 5, 10, 10); context.strokeRect(handle.x - 5, handle.y - 5, 10, 10); });
    }
    context.restore();
  }

  function getBounds(object) {
    if (object.type === 'rect' || object.type === 'markX') return { x: object.x, y: object.y, w: object.w, h: object.h };
    if (object.type === 'line' || object.type === 'arrow') {
      const points = routePoints(object), xs = points.map(p => p.x), ys = points.map(p => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    if (object.type === 'freehand') {
      const xs = object.points.map(p => p.x), ys = object.points.map(p => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    ctx.save(); ctx.font = object.font || FONT;
    const width = Math.max(...object.text.split('\n').map(line => ctx.measureText(line).width)); ctx.restore();
    return { x: object.x, y: object.y, w: width, h: object.text.split('\n').length * lineHeight(object) };
  }

  function getHandlePoints(bounds, object = null) {
    if (object && (object.type === 'line' || object.type === 'arrow')) {
      const points = routePoints(object);
      return [{ name: 'p1', x: points[0].x, y: points[0].y }, { name: 'p2', x: points[points.length - 1].x, y: points[points.length - 1].y }];
    }
    const left = bounds.x, right = bounds.x + bounds.w, top = bounds.y, bottom = bounds.y + bounds.h;
    const midX = (left + right) / 2, midY = (top + bottom) / 2;
    return [
      { name: 'nw', x: left, y: top }, { name: 'n', x: midX, y: top },
      { name: 'ne', x: right, y: top }, { name: 'e', x: right, y: midY },
      { name: 'se', x: right, y: bottom }, { name: 's', x: midX, y: bottom },
      { name: 'sw', x: left, y: bottom }, { name: 'w', x: left, y: midY }
    ];
  }

  function findResizeHandle(point) {
    if (!state.selectedId) return null;
    const object = getObject(state.selectedId);
    if (!object) return null;
    const handle = getHandlePoints(getBounds(object), object).find(item => Math.abs(point.x - item.x) <= 9 && Math.abs(point.y - item.y) <= 9);
    return handle ? handle.name : null;
  }

  function resizeObjectFromSnapshot(object, snapshot, handle, point) {
    if ((object.type === 'line' || object.type === 'arrow') && (handle === 'p1' || handle === 'p2')) {
      const snapped = snapGridPoint(point);
      if (handle === 'p1') { object.x1 = snapped.x; object.y1 = snapped.y; }
      else { object.x2 = snapped.x; object.y2 = snapped.y; }
      return;
    }
    const original = getBounds(snapshot);
    let left = original.x, top = original.y, right = original.x + original.w, bottom = original.y + original.h;
    if (handle.includes('w')) left = point.x;
    if (handle.includes('e')) right = point.x;
    if (handle.includes('n')) top = point.y;
    if (handle.includes('s')) bottom = point.y;
    if (right - left < 8) { if (handle.includes('w')) left = right - 8; else right = left + 8; }
    if (bottom - top < 8) { if (handle.includes('n')) top = bottom - 8; else bottom = top + 8; }
    const sx = (right - left) / (original.w || 1), sy = (bottom - top) / (original.h || 1);
    const mapX = x => left + (x - original.x) * sx;
    const mapY = y => top + (y - original.y) * sy;
    if (object.type === 'rect' || object.type === 'markX') {
      object.x = left; object.y = top; object.w = right - left; object.h = bottom - top;
    } else if (object.type === 'line' || object.type === 'arrow') {
      object.x1 = mapX(snapshot.x1); object.y1 = mapY(snapshot.y1);
      object.x2 = mapX(snapshot.x2); object.y2 = mapY(snapshot.y2);
    } else if (object.type === 'freehand') {
      object.points = snapshot.points.map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
    } else if (object.type === 'text') {
      object.x = left; object.y = top;
      const size = Math.max(8, Math.min(96, fontSize(snapshot) * ((Math.abs(sx) + Math.abs(sy)) / 2)));
      object.font = size + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    }
  }

  function openTextEditor(point, existingObject = null) {
    state.editingTextId = existingObject ? existingObject.id : null;
    const x = existingObject ? existingObject.x : point.x;
    const y = existingObject ? existingObject.y : point.y;
    textEditor.value = existingObject ? existingObject.text : '';
    textEditor.dataset.x = String(x);
    textEditor.dataset.y = String(y);
    const scaleX = canvas.getBoundingClientRect().width / canvas.width;
    const scaleY = canvas.getBoundingClientRect().height / canvas.height;
    textEditor.style.left = (x * scaleX) + 'px';
    textEditor.style.top = (y * scaleY) + 'px';
    textEditor.style.width = Math.max(60, Math.min(320, existingObject ? getBounds(existingObject).w * scaleX + 24 : 220 * scaleX)) + 'px';
    textEditor.style.height = Math.max(24, existingObject ? getBounds(existingObject).h * scaleY + 12 : 38 * scaleY) + 'px';
    textEditor.style.fontSize = ((existingObject ? fontSize(existingObject) : 16) * scaleX) + 'px';
    textEditor.hidden = false;
    textEditor.focus();
    textEditor.setSelectionRange(textEditor.value.length, textEditor.value.length);
  }

  function finishTextEditing(commit = true) {
    if (textEditor.hidden) return;
    const value = textEditor.value;
    const oldId = state.editingTextId;
    textEditor.hidden = true;
    state.editingTextId = null;
    if (!commit) { render(); return; }
    if (oldId !== null) {
      const object = getObject(oldId);
      if (object && value.trim() && object.text !== value) {
        saveUndo();
        object.text = value;
      }
    } else if (value.trim()) {
      saveUndo();
      addObject({ type: 'text', x: Number.parseFloat(textEditor.dataset.x), y: Number.parseFloat(textEditor.dataset.y), text: value, font: '16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' });
    }
    render();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.objects.forEach(object => drawObject(ctx, object));
    if (state.draft) drawObject(ctx, state.draft);
    generatedAscii = generateAscii(state.draft ? [...state.objects, state.draft] : state.objects);
    updateAsciiPreview(generatedAscii);
  }

  function distanceToSegment(point, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return Math.hypot(point.x - a.x, point.y - a.y);
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
    return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
  }

  function hitTest(point) {
    // Prioritize text so overlapping shapes never make labels inaccessible.
    for (let index = state.objects.length - 1; index >= 0; index--) {
      const object = state.objects[index];
      if (object.type !== 'text') continue;
      const b = getBounds(object);
      if (point.x >= b.x - 7 && point.x <= b.x + b.w + 7 && point.y >= b.y - 7 && point.y <= b.y + b.h + 7) return object;
    }
    for (let index = state.objects.length - 1; index >= 0; index--) {
      const object = state.objects[index];
      const b = getBounds(object);
      if (object.type === 'line' || object.type === 'arrow') {
        const route = routePoints(object);
        for (let i = 1; i < route.length; i++) if (distanceToSegment(point, route[i - 1], route[i]) < 12) return object;
      } else if (object.type === 'freehand') {
        for (let i = 1; i < object.points.length; i++) {
          if (distanceToSegment(point, object.points[i - 1], object.points[i]) < 12) return object;
        }
        if (object.points.length === 1 && Math.hypot(point.x - object.points[0].x, point.y - object.points[0].y) < 12) return object;
      } else if (point.x >= b.x - 7 && point.x <= b.x + b.w + 7 && point.y >= b.y - 7 && point.y <= b.y + b.h + 7) return object;
    }
    return null;
  }

  function translateObject(object, dx, dy) {
    if (object.type === 'rect' || object.type === 'markX') { object.x += dx; object.y += dy; }
    else if (object.type === 'line' || object.type === 'arrow') { object.x1 += dx; object.y1 += dy; object.x2 += dx; object.y2 += dy; }
    else if (object.type === 'text') { object.x += dx; object.y += dy; }
    else if (object.type === 'freehand') object.points.forEach(point => { point.x += dx; point.y += dy; });
  }

  function addObject(object) {
    object.id = state.nextId++;
    object.color = inkColor.value;
    object.width = 3;
    state.objects.push(object);
    state.selectedId = object.id;
  }

  function updateAsciiPreview(value = generatedAscii) {
    const empty = !value || value === '(empty drawing)';
    asciiPreview.textContent = empty ? 'Your ASCII drawing will appear here…' : value;
    asciiPreview.classList.toggle('is-empty', empty);
  }

  function eraseAt(point) {
    const hit = hitTest(point);
    if (!hit || !state.erasing) return;
    if (!state.erasedInGesture) saveUndo();
    state.erasedInGesture = true;
    state.objects = state.objects.filter(object => object.id !== hit.id);
    if (state.selectedId === hit.id) state.selectedId = null;
    render();
  }

  // Resizing panes changes screen space only, never drawing coordinates.
  const workspace = document.querySelector('.workspace');
  const workspaceDivider = document.querySelector('.workspace-divider');
  if (workspace && workspaceDivider) {
    let splitDrag = null;
    workspaceDivider.addEventListener('pointerdown', event => {
      if (window.matchMedia('(max-width: 900px)').matches) return;
      splitDrag = { pointerId: event.pointerId, startX: event.clientX, startWidth: workspace.children[0].getBoundingClientRect().width };
      workspaceDivider.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    workspaceDivider.addEventListener('pointermove', event => {
      if (!splitDrag || splitDrag.pointerId !== event.pointerId) return;
      const total = workspace.clientWidth, dividerWidth = workspaceDivider.getBoundingClientRect().width;
      const minDrawing = 260, minOutput = 280;
      const desired = Math.max(minDrawing, Math.min(total - minOutput - dividerWidth - 16, splitDrag.startWidth + event.clientX - splitDrag.startX));
      const available = Math.max(1, total - dividerWidth - 16);
      workspace.style.gridTemplateColumns = `${desired}px 10px minmax(${minOutput}px, ${Math.max(minOutput, available - desired)}px)`;
    });
    const stopSplitDrag = event => {
      if (!splitDrag || splitDrag.pointerId !== event.pointerId) return;
      splitDrag = null;
      if (workspaceDivider.hasPointerCapture(event.pointerId)) workspaceDivider.releasePointerCapture(event.pointerId);
    };
    workspaceDivider.addEventListener('pointerup', stopSplitDrag);
    workspaceDivider.addEventListener('pointercancel', stopSplitDrag);
    workspaceDivider.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const first = workspace.children[0].getBoundingClientRect().width;
      const next = Math.max(260, Math.min(workspace.clientWidth - 310, first + (event.key === 'ArrowRight' ? 24 : -24)));
      workspace.style.gridTemplateColumns = `${next}px 10px minmax(280px, 1fr)`;
    });
  }

  updateAsciiPreview();

  canvas.addEventListener('pointerdown', event => {
    // Textarea clicks are for caret placement, not canvas actions.
    if (textEditor.contains(event.target)) return;
    if (event.button !== 0) return;
    // Commit the previous label before handling the next canvas click. Do not
    // rely solely on blur ordering, which varies with pointer/focus sequences.
    if (!textEditor.hidden) finishTextEditing(true);
    const point = getPoint(event);
    canvas.setPointerCapture(event.pointerId);
    state.start = point;
    state.drawing = true;

    if (state.tool === 'eraser') {
      state.erasing = true;
      state.erasedInGesture = false;
      eraseAt(point);
      return;
    }

    if (state.tool === 'select') {
      const handle = findResizeHandle(point);
      if (handle) {
        const selected = getObject(state.selectedId);
        saveUndo();
        state.resizing = true;
        state.resizeHandle = handle;
        state.resizeSnapshot = cloneObjects([selected])[0];
        return;
      }
      const hit = hitTest(point);
      if (hit && hit.type === 'text' && event.detail >= 2) {
        state.drawing = false;
        state.selectedId = hit.id;
        openTextEditor(point, hit);
        render();
        return;
      }
      state.selectedId = hit ? hit.id : null;
      if (hit) {
        saveUndo();
        state.moving = true;
        state.moveOrigin = point;
        state.movedObjectSnapshot = cloneObjects([hit])[0];
      } else {
        state.moving = false;
      }
      render();
      return;
    }

    if (state.tool === 'text') {
      event.preventDefault();
      state.drawing = false;
      openTextEditor(point);
      return;
    }

    if (state.tool === 'freehand') {
      state.start = snapGridPoint(point);
      state.draft = { id: -1, type: 'freehand', points: [state.start], color: inkColor.value, width: 3 };
    } else if (state.tool === 'rect') {
      state.draft = { id: -1, type: 'rect', x: point.x, y: point.y, w: 0, h: 0, color: inkColor.value, width: 3 };
    } else if (state.tool === 'xmark') {
      const snapped = snapGridPoint(point); state.start = snapped;
      state.draft = { id: -1, type: 'markX', x: snapped.x, y: snapped.y, w: 0, h: 0, color: inkColor.value, width: 3 };
    } else if (state.tool === 'line' || state.tool === 'arrow') {
      const snapped = snapGridPoint(point); state.start = snapped;
      state.draft = { id: -1, type: state.tool, x1: snapped.x, y1: snapped.y, x2: snapped.x, y2: snapped.y, color: inkColor.value, width: 3 };
    }
  });

  canvas.addEventListener('pointermove', event => {
    if (!state.drawing) return;
    const point = getPoint(event);
    if (state.tool === 'eraser' && state.erasing) {
      eraseAt(point);
      return;
    }
    if (state.tool === 'select' && state.resizing && state.selectedId && state.resizeSnapshot) {
      const object = getObject(state.selectedId);
      if (object) { resizeObjectFromSnapshot(object, state.resizeSnapshot, state.resizeHandle, point); render(); }
      return;
    }
    if (state.tool === 'select' && state.moving && state.selectedId) {
      const object = getObject(state.selectedId);
      if (object && state.moveOrigin) {
        if ((object.type === 'line' || object.type === 'arrow') && state.movedObjectSnapshot) {
          // Move structural strokes by whole grid cells, preserving their axis and length.
          const dx = Math.round((point.x - state.moveOrigin.x) / DRAW_GRID) * DRAW_GRID;
          const dy = Math.round((point.y - state.moveOrigin.y) / DRAW_GRID) * DRAW_GRID;
          object.x1 = state.movedObjectSnapshot.x1 + dx;
          object.y1 = state.movedObjectSnapshot.y1 + dy;
          object.x2 = state.movedObjectSnapshot.x2 + dx;
          object.y2 = state.movedObjectSnapshot.y2 + dy;
        } else {
          translateObject(object, point.x - state.moveOrigin.x, point.y - state.moveOrigin.y);
          state.moveOrigin = point;
        }
        render();
      }
      return;
    }
    if (!state.draft) return;
    if (state.draft.type === 'freehand') {
      const snapped = snapGridPoint(point);
      const last = state.draft.points[state.draft.points.length - 1];
      if (snapped.x !== last.x || snapped.y !== last.y) {
        // Fill skipped cells between pointer events so fast strokes remain continuous.
        let x0 = Math.round(last.x / DRAW_GRID), y0 = Math.round(last.y / DRAW_GRID);
        const x1 = Math.round(snapped.x / DRAW_GRID), y1 = Math.round(snapped.y / DRAW_GRID);
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let error = dx + dy;
        while (x0 !== x1 || y0 !== y1) {
          const twiceError = 2 * error;
          if (twiceError >= dy) { error += dy; x0 += sx; }
          if (twiceError <= dx) { error += dx; y0 += sy; }
          const stamp = { x: x0 * DRAW_GRID, y: y0 * DRAW_GRID };
          const previous = state.draft.points[state.draft.points.length - 1];
          if (stamp.x !== previous.x || stamp.y !== previous.y) state.draft.points.push(stamp);
        }
      }
    }
    else if (state.draft.type === 'rect' || state.draft.type === 'markX') Object.assign(state.draft, normalizedRect(state.start, point));
    else {
      const start = snapGridPoint(state.start), end = snapGridPoint(point);
      state.draft.x1 = start.x; state.draft.y1 = start.y;
      state.draft.x2 = end.x; state.draft.y2 = end.y;
    }
    render();
  });

  function finishDrawing() {
    if (!state.drawing) return;
    state.drawing = false;
    if (state.draft) {
      const draft = state.draft;
      state.draft = null;
      const b = getBounds(draft);
      if (b.w > 2 || b.h > 2 || draft.type === 'freehand') {
        saveUndo();
        addObject(draft);
      }
    }
    state.moving = false;
    state.erasing = false;
    state.erasedInGesture = false;
    state.resizing = false;
    state.resizeHandle = null;
    state.resizeSnapshot = null;
    state.start = null;
    state.moveOrigin = null;
    state.movedObjectSnapshot = null;
    render();
  }
  textEditor.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); finishTextEditing(false); }
    else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); finishTextEditing(true); }
  });
  textEditor.addEventListener('blur', () => finishTextEditing(true));

  canvas.addEventListener('pointerup', finishDrawing);
  canvas.addEventListener('pointercancel', finishDrawing);

  document.querySelectorAll('[data-tool]').forEach(button => {
    button.addEventListener('click', () => {
      state.tool = button.dataset.tool;
      document.querySelectorAll('[data-tool]').forEach(item => item.classList.toggle('active', item === button));
      canvas.style.cursor = state.tool === 'select' ? 'default' : state.tool === 'text' ? 'text' : state.tool === 'eraser' ? 'not-allowed' : 'crosshair';
    });
  });

  function getDrawingBounds(objects) {
    const bounds = objects.map(getBounds);
    if (!bounds.length) return { x: 0, y: 0, w: 1000, h: 620 };
    const left = Math.min(...bounds.map(b => b.x));
    const top = Math.min(...bounds.map(b => b.y));
    const right = Math.max(...bounds.map(b => b.x + b.w));
    const bottom = Math.max(...bounds.map(b => b.y + b.h));
    const padding = Math.max(18, Math.max(right - left, bottom - top) * 0.04);
    return { x: left - padding, y: top - padding, w: Math.max(1, right - left) + padding * 2, h: Math.max(1, bottom - top) + padding * 2 };
  }

  function getGridSize(bounds) {
    // Use one scale and no artificial minimum dimensions so the output fits
    // conservative chat-pane limits without stretching extreme aspect ratios.
    const characterAspect = 1.7;
    const ratio = Math.max(0.05, Math.min(24, bounds.w / Math.max(1, bounds.h) * characterAspect));
    const scale = Math.min(MAX_GRID_ROWS, MAX_GRID_COLUMNS / ratio);
    const rows = Math.max(1, Math.min(MAX_GRID_ROWS, Math.round(scale)));
    const columns = Math.max(1, Math.min(MAX_GRID_COLUMNS, Math.round(rows * ratio)));
    return { columns, rows };
  }

  let conversion = { bounds: { x: 0, y: 0, w: 1000, h: 620 }, columns: MAX_GRID_COLUMNS, rows: 36 };

  function mapPoint(point) {
    const { bounds, columns, rows } = conversion;
    const marginX = Math.min(1, Math.floor((columns - 1) / 2));
    const marginY = Math.min(1, Math.floor((rows - 1) / 2));
    return {
      x: marginX + Math.round((point.x - bounds.x) / Math.max(1, bounds.w) * Math.max(0, columns - 1 - marginX * 2)),
      y: marginY + Math.round((point.y - bounds.y) / Math.max(1, bounds.h) * Math.max(0, rows - 1 - marginY * 2))
    };
  }

  const EDGE = { left: 1, right: 2, up: 4, down: 8 };
  const EDGE_GLYPHS = {
    1: '╴', 2: '╶', 3: '─', 4: '╵', 5: '┘', 6: '└', 7: '┴',
    8: '╷', 9: '┐', 10: '┌', 11: '┬', 12: '│', 13: '┤', 14: '├', 15: '┼'
  };

  function makeGrid() {
    const grid = Array.from({ length: conversion.rows }, () => Array(conversion.columns).fill(' '));
    grid.edges = Array.from({ length: conversion.rows }, () => Array(conversion.columns).fill(0));
    return grid;
  }

  function put(grid, x, y, char) {
    x = Math.round(x); y = Math.round(y);
    if (y >= 0 && y < conversion.rows && x >= 0 && x < conversion.columns) {
      if (grid.edges[y][x] && char !== ' ' && !['-', '|', '─', '│'].includes(char)) {
        if (char === '/' || char === '\\') grid[y][x] = char === '/' ? '╱' : '╲';
        else grid[y][x] = char;
      } else if (!grid.edges[y][x] || char === ' ' || char === '/' || char === '\\') {
        grid[y][x] = char;
      }
    }
  }

  function putEdge(grid, x, y, directions) {
    x = Math.round(x); y = Math.round(y);
    if (y < 0 || y >= conversion.rows || x < 0 || x >= conversion.columns) return;
    let mask = grid.edges[y][x];
    directions.forEach(direction => { mask |= EDGE[direction]; });
    grid.edges[y][x] = mask;
    grid[y][x] = EDGE_GLYPHS[mask] || '┼';
  }

  function plotLine(grid, a, b, char) {
    let x0 = Math.round(a.x), y0 = Math.round(a.y), x1 = Math.round(b.x), y1 = Math.round(b.y);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    const isHorizontal = y0 === y1;
    const isVertical = x0 === x1;
    const startX = x0, startY = y0;
    while (true) {
      if (isHorizontal) {
        putEdge(grid, x0, y0, ['left', 'right']);
      } else if (isVertical) {
        putEdge(grid, x0, y0, ['up', 'down']);
      } else {
        const chosen = Math.abs(x1 - startX) > Math.abs(y1 - startY) ? (char === '|' ? '-' : char) : (char === '-' ? '|' : char);
        put(grid, x0, y0, chosen);
      }
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * error;
      if (e2 >= dy) { error += dy; x0 += sx; }
      if (e2 <= dx) { error += dx; y0 += sy; }
    }
  }

  function putText(grid, point, text) {
    const mapped = mapPoint(point);
    text.split('\n').forEach((line, row) => {
      for (let i = 0; i < line.length; i++) put(grid, mapped.x + i, mapped.y + row, line[i]);
    });
  }

  function drawObjectToGrid(grid, object) {
    if (object.type === 'markX') {
      const point = mapPoint({ x: object.x + object.w / 2, y: object.y + object.h / 2 });
      put(grid, point.x, point.y, 'X');
      return;
    }
    if (object.type === 'text') {
      putText(grid, { x: object.x, y: object.y }, object.text);
      return;
    }
    if (object.type === 'rect') {
      const a = mapPoint({ x: object.x, y: object.y });
      const b = mapPoint({ x: object.x + object.w, y: object.y + object.h });
      // Give every rectangle a minimum 2-by-2 character footprint.
      if (b.x - a.x < 2) {
        if (a.x + 2 < conversion.columns) b.x = a.x + 2;
        else a.x = Math.max(0, b.x - 2);
      }
      if (b.y - a.y < 2) {
        if (a.y + 2 < conversion.rows) b.y = a.y + 2;
        else a.y = Math.max(0, b.y - 2);
      }
      for (let x = a.x + 1; x < b.x; x++) { putEdge(grid, x, a.y, ['left', 'right']); putEdge(grid, x, b.y, ['left', 'right']); }
      for (let y = a.y + 1; y < b.y; y++) { putEdge(grid, a.x, y, ['up', 'down']); putEdge(grid, b.x, y, ['up', 'down']); }
      putEdge(grid, a.x, a.y, ['right', 'down']);
      putEdge(grid, b.x, a.y, ['left', 'down']);
      putEdge(grid, a.x, b.y, ['right', 'up']);
      putEdge(grid, b.x, b.y, ['left', 'up']);
      return;
    }
    if (object.type === 'line' || object.type === 'arrow') {
      const route = routePoints(object).map(mapPoint);
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1], b = route[i];
        if (a.x !== b.x || a.y !== b.y) plotLine(grid, a, b, a.y === b.y ? '-' : '|');
      }
      if (object.type === 'arrow') {
        const end = route[route.length - 1], previous = route[route.length - 2];
        if (end.y === previous.y) put(grid, end.x, end.y, end.x >= previous.x ? '>' : '<');
        else put(grid, end.x, end.y, end.y >= previous.y ? 'v' : '^');
      }
      return;
    }
    if (object.type === 'freehand') {
      // Each brush stamp becomes an X in the generated text, like ASCIIFlow's draw tool.
      object.points.map(mapPoint).forEach(point => put(grid, point.x, point.y, 'X'));
    }
  }

  function generateAscii(objects = state.objects) {
    conversion.bounds = getDrawingBounds(objects);
    Object.assign(conversion, getGridSize(conversion.bounds));
    const grid = makeGrid();
    // Text is rendered last so labels remain visible over intersecting shapes.
    objects.filter(object => object.type !== 'text').forEach(object => drawObjectToGrid(grid, object));
    objects.filter(object => object.type === 'text').forEach(object => drawObjectToGrid(grid, object));
    let top = 0, bottom = grid.length - 1;
    while (top < grid.length && grid[top].every(char => char === ' ')) top++;
    while (bottom >= top && grid[bottom].every(char => char === ' ')) bottom--;
    if (top > bottom) return '(empty drawing)';

    // Crop only globally empty outer columns. This removes wasted canvas margin
    // without changing the relative spacing between any objects in the sketch.
    let left = 0, right = grid[0].length - 1;
    while (left < grid[0].length && grid.slice(top, bottom + 1).every(row => row[left] === ' ')) left++;
    while (right >= left && grid.slice(top, bottom + 1).every(row => row[right] === ' ')) right--;
    const rows = grid.slice(top, bottom + 1)
      .map(row => row.slice(left, right + 1).join('').replace(/\s+$/u, ''));
    return rows.join('\n');
  }

  function getCombinedText() {
    const drawing = generatedAscii || generateAscii();
    const note = descriptor.value.trim();
    return note ? `${drawing}\n\nDescription:\n${note}` : drawing;
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const temporary = document.createElement('textarea');
        temporary.value = text;
        temporary.style.position = 'fixed';
        temporary.style.opacity = '0';
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand('copy');
        temporary.remove();
        if (!copied) throw new Error('Clipboard copy was rejected by the browser.');
      }
      statusMessage.textContent = successMessage;
    } catch (error) {
      statusMessage.textContent = 'Copy failed. Your browser blocked clipboard access; try allowing clipboard access and copying again.';
    }
  }

  document.getElementById('copyButton').addEventListener('click', () => {
    if (!generatedAscii) {
      generatedAscii = generateAscii();
      updateAsciiPreview();
    }
    copyText(getCombinedText(), 'Copied drawing and descriptor.');
  });
  document.getElementById('copyAsciiButton').addEventListener('click', () => {
    if (!generatedAscii) {
      generatedAscii = generateAscii();
      updateAsciiPreview();
    }
    copyText(generatedAscii, 'Copied ASCII.');
  });

  document.getElementById('copyMarkdownButton').addEventListener('click', () => {
    if (!generatedAscii) {
      generatedAscii = generateAscii();
      updateAsciiPreview();
    }
    const longestBacktickRun = Math.max(0, ...Array.from(generatedAscii.matchAll(/`+/gu), match => match[0].length));
    const fence = '`'.repeat(Math.max(3, longestBacktickRun + 1));
    copyText(`${fence}text\n${generatedAscii}\n${fence}`, 'Copied ASCII in a Markdown code block.');
  });

  document.getElementById('clearButton').addEventListener('click', () => {
    if (!state.objects.length) return;
    saveUndo();
    state.objects = [];
    state.selectedId = null;
    render();
    generatedAscii = '';
    updateAsciiPreview();
    statusMessage.textContent = 'Canvas cleared.';
  });
  undoButton.addEventListener('click', undo);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) return;
    if (!state.selectedId) return;
    const index = state.objects.findIndex(object => object.id === state.selectedId);
    if (index < 0) return;
    saveUndo();
    state.objects.splice(index, 1);
    state.selectedId = null;
    render();
    statusMessage.textContent = 'Selected object deleted.';
    event.preventDefault();
  });

  render();
})();
