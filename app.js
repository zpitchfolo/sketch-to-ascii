(() => {
  'use strict';

  const canvas = document.getElementById('drawingCanvas');
  const ctx = canvas.getContext('2d');
  const asciiOutput = document.getElementById('asciiOutput');
  const descriptor = document.getElementById('descriptor');
  const statusMessage = document.getElementById('statusMessage');
  const undoButton = document.getElementById('undoButton');
  const inkColor = document.getElementById('inkColor');
  const textEditor = document.getElementById('textEditor');
  const canvasFrame = document.querySelector('.canvas-frame');
  const view = { zoom: 1, panX: 0, panY: 0, panning: false, panStart: null };

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
    nextId: 1
  };

  const GRID_COLUMNS = 100;
  const GRID_ROWS = 36;
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

  function drawArrow(context, a, b) {
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const headLength = 15;
    context.beginPath();
    context.moveTo(b.x, b.y);
    context.lineTo(b.x - headLength * Math.cos(angle - Math.PI / 6), b.y - headLength * Math.sin(angle - Math.PI / 6));
    context.moveTo(b.x, b.y);
    context.lineTo(b.x - headLength * Math.cos(angle + Math.PI / 6), b.y - headLength * Math.sin(angle + Math.PI / 6));
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
      if (object.points.length > 1) {
        context.beginPath();
        context.moveTo(object.points[0].x, object.points[0].y);
        object.points.slice(1).forEach(point => context.lineTo(point.x, point.y));
        context.stroke();
      } else if (object.points.length === 1) {
        context.beginPath();
        context.arc(object.points[0].x, object.points[0].y, 1.5, 0, Math.PI * 2);
        context.fill();
      }
    } else if (object.type === 'rect') {
      context.strokeRect(object.x, object.y, object.w, object.h);
    } else if (object.type === 'line') {
      context.beginPath(); context.moveTo(object.x1, object.y1); context.lineTo(object.x2, object.y2); context.stroke();
    } else if (object.type === 'arrow') {
      drawArrow(context, { x: object.x1, y: object.y1 }, { x: object.x2, y: object.y2 });
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
    if (object.type === 'rect') return { x: object.x, y: object.y, w: object.w, h: object.h };
    if (object.type === 'line' || object.type === 'arrow') {
      return { x: Math.min(object.x1, object.x2), y: Math.min(object.y1, object.y2), w: Math.abs(object.x2 - object.x1), h: Math.abs(object.y2 - object.y1) };
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
      return [
        { name: 'p1', x: object.x1, y: object.y1 },
        { name: 'p2', x: object.x2, y: object.y2 }
      ];
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
      if (handle === 'p1') { object.x1 = point.x; object.y1 = point.y; }
      else { object.x2 = point.x; object.y2 = point.y; }
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
    if (object.type === 'rect') {
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
    const canvasRect = canvas.getBoundingClientRect();
    const x = existingObject ? existingObject.x : point.x;
    const y = existingObject ? existingObject.y : point.y;
    textEditor.value = existingObject ? existingObject.text : '';
    textEditor.dataset.x = String(x);
    textEditor.dataset.y = String(y);
    textEditor.style.left = Math.max(4, (x / canvas.width) * canvas.offsetWidth) + 'px';
    textEditor.style.top = Math.max(4, (y / canvas.height) * canvas.offsetHeight) + 'px';
    textEditor.style.width = Math.max(140, Math.min(320, existingObject ? getBounds(existingObject).w + 24 : 220)) + 'px';
    textEditor.style.height = Math.max(32, existingObject ? getBounds(existingObject).h + 12 : 38) + 'px';
    textEditor.style.fontSize = (existingObject ? fontSize(existingObject) : 16) + 'px';
    textEditor.style.transform = `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`;
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
      if (!value.trim()) {
        saveUndo();
        state.objects = state.objects.filter(item => item.id !== oldId);
        if (state.selectedId === oldId) state.selectedId = null;
      } else if (object && object.text !== value) {
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
  }

  function distanceToSegment(point, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return Math.hypot(point.x - a.x, point.y - a.y);
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
    return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
  }

  function hitTest(point) {
    for (let index = state.objects.length - 1; index >= 0; index--) {
      const object = state.objects[index];
      const b = getBounds(object);
      if (object.type === 'line' || object.type === 'arrow') {
        if (distanceToSegment(point, { x: object.x1, y: object.y1 }, { x: object.x2, y: object.y2 }) < 12) return object;
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
    if (object.type === 'rect') { object.x += dx; object.y += dy; }
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

  function applyViewTransform() {
    const transform = `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`;
    canvas.style.transform = transform;
    textEditor.style.transform = transform;
    let indicator = canvasFrame.querySelector('.canvas-zoom-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'canvas-zoom-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      canvasFrame.appendChild(indicator);
    }
    indicator.textContent = `${Math.round(view.zoom * 100)}%`;
  }

  canvasFrame.addEventListener('pointerdown', event => {
    if (event.button !== 1) return;
    event.preventDefault();
    view.panning = true;
    view.panStart = { x: event.clientX, y: event.clientY, panX: view.panX, panY: view.panY };
    canvasFrame.classList.add('is-panning');
    canvasFrame.setPointerCapture(event.pointerId);
  });
  canvasFrame.addEventListener('pointermove', event => {
    if (!view.panning || !view.panStart) return;
    view.panX = view.panStart.panX + event.clientX - view.panStart.x;
    view.panY = view.panStart.panY + event.clientY - view.panStart.y;
    applyViewTransform();
  });
  function endPan(event) {
    if (!view.panning) return;
    view.panning = false;
    view.panStart = null;
    canvasFrame.classList.remove('is-panning');
    if (canvasFrame.hasPointerCapture(event.pointerId)) canvasFrame.releasePointerCapture(event.pointerId);
  }
  canvasFrame.addEventListener('pointerup', endPan);
  canvasFrame.addEventListener('pointercancel', endPan);
  canvasFrame.addEventListener('auxclick', event => { if (event.button === 1) event.preventDefault(); });
  canvasFrame.addEventListener('contextmenu', event => event.preventDefault());
  canvasFrame.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = canvasFrame.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const oldZoom = view.zoom;
    const nextZoom = Math.max(0.25, Math.min(4, oldZoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1)));
    const canvasX = (localX - view.panX) / oldZoom;
    const canvasY = (localY - view.panY) / oldZoom;
    view.zoom = nextZoom;
    view.panX = localX - canvasX * nextZoom;
    view.panY = localY - canvasY * nextZoom;
    applyViewTransform();
  }, { passive: false });

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const point = getPoint(event);
    canvas.setPointerCapture(event.pointerId);
    state.start = point;
    state.drawing = true;

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
      state.draft = { id: -1, type: 'freehand', points: [point], color: inkColor.value, width: 3 };
    } else if (state.tool === 'rect') {
      state.draft = { id: -1, type: 'rect', x: point.x, y: point.y, w: 0, h: 0, color: inkColor.value, width: 3 };
    } else if (state.tool === 'line' || state.tool === 'arrow') {
      state.draft = { id: -1, type: state.tool, x1: point.x, y1: point.y, x2: point.x, y2: point.y, color: inkColor.value, width: 3 };
    }
  });

  canvas.addEventListener('pointermove', event => {
    if (!state.drawing) return;
    const point = getPoint(event);
    if (state.tool === 'select' && state.resizing && state.selectedId && state.resizeSnapshot) {
      const object = getObject(state.selectedId);
      if (object) { resizeObjectFromSnapshot(object, state.resizeSnapshot, state.resizeHandle, point); render(); }
      return;
    }
    if (state.tool === 'select' && state.moving && state.selectedId) {
      const object = getObject(state.selectedId);
      if (object && state.moveOrigin) {
        translateObject(object, point.x - state.moveOrigin.x, point.y - state.moveOrigin.y);
        state.moveOrigin = point;
        render();
      }
      return;
    }
    if (!state.draft) return;
    if (state.draft.type === 'freehand') state.draft.points.push(point);
    else if (state.draft.type === 'rect') Object.assign(state.draft, normalizedRect(state.start, point));
    else { state.draft.x2 = point.x; state.draft.y2 = point.y; }
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
      canvas.style.cursor = state.tool === 'select' ? 'default' : state.tool === 'text' ? 'text' : 'crosshair';
    });
  });

  function mapPoint(point) {
    return {
      x: Math.max(0, Math.min(GRID_COLUMNS - 1, Math.round(point.x / canvas.width * (GRID_COLUMNS - 1)))),
      y: Math.max(0, Math.min(GRID_ROWS - 1, Math.round(point.y / canvas.height * (GRID_ROWS - 1))))
    };
  }

  function makeGrid() { return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLUMNS).fill(' ')); }
  function put(grid, x, y, char) {
    x = Math.round(x); y = Math.round(y);
    if (y >= 0 && y < GRID_ROWS && x >= 0 && x < GRID_COLUMNS) grid[y][x] = char;
  }

  function plotLine(grid, a, b, char) {
    let x0 = Math.round(a.x), y0 = Math.round(a.y), x1 = Math.round(b.x), y1 = Math.round(b.y);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      const chosen = Math.abs(x1 - x0) > Math.abs(y1 - y0) ? (char === '|' ? '-' : char) : (char === '-' ? '|' : char);
      put(grid, x0, y0, chosen);
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
    if (object.type === 'text') {
      putText(grid, { x: object.x, y: object.y }, object.text);
      return;
    }
    if (object.type === 'rect') {
      const a = mapPoint({ x: object.x, y: object.y });
      const b = mapPoint({ x: object.x + object.w, y: object.y + object.h });
      if (b.x - a.x < 2 || b.y - a.y < 2) { plotLine(grid, a, b, '-'); return; }
      for (let x = a.x + 1; x < b.x; x++) { put(grid, x, a.y, '-'); put(grid, x, b.y, '-'); }
      for (let y = a.y + 1; y < b.y; y++) { put(grid, a.x, y, '|'); put(grid, b.x, y, '|'); }
      put(grid, a.x, a.y, '+'); put(grid, b.x, a.y, '+'); put(grid, a.x, b.y, '+'); put(grid, b.x, b.y, '+');
      return;
    }
    if (object.type === 'line' || object.type === 'arrow') {
      const a = mapPoint({ x: object.x1, y: object.y1 });
      const b = mapPoint({ x: object.x2, y: object.y2 });
      let char = '-';
      if (Math.abs(b.x - a.x) < 2) char = '|';
      else if ((b.y - a.y) / (b.x - a.x) > 0.35) char = '\\';
      else if ((b.y - a.y) / (b.x - a.x) < -0.35) char = '/';
      plotLine(grid, a, b, char);
      if (object.type === 'arrow') {
        if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) {
          put(grid, b.x, b.y, b.x >= a.x ? '>' : '<');
        } else {
          put(grid, b.x, b.y, b.y >= a.y ? 'v' : '^');
        }
      }
      return;
    }
    if (object.type === 'freehand') {
      const points = object.points.map(mapPoint);
      if (points.length === 1) { put(grid, points[0].x, points[0].y, '*'); return; }
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        const char = Math.abs(b.x - a.x) < 2 ? '|' : ((b.y - a.y) / ((b.x - a.x) || 1) > 0.35 ? '\\' : ((b.y - a.y) / ((b.x - a.x) || 1) < -0.35 ? '/' : '-'));
        plotLine(grid, a, b, char);
      }
    }
  }

  function generateAscii() {
    const grid = makeGrid();
    state.objects.forEach(object => drawObjectToGrid(grid, object));
    let top = 0, bottom = grid.length - 1;
    while (top < grid.length && grid[top].every(char => char === ' ')) top++;
    while (bottom >= top && grid[bottom].every(char => char === ' ')) bottom--;
    if (top > bottom) return '(empty drawing)';
    const rows = grid.slice(top, bottom + 1).map(row => row.join('').replace(/\s+$/u, ''));
    return rows.join('\n');
  }

  document.getElementById('generateButton').addEventListener('click', () => {
    asciiOutput.value = generateAscii();
    statusMessage.textContent = 'ASCII generated.';
  });

  function getCombinedText() {
    const drawing = asciiOutput.value || generateAscii();
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
      statusMessage.textContent = 'Copy failed. Select the text output and copy it manually.';
    }
  }

  document.getElementById('copyButton').addEventListener('click', () => {
    if (!asciiOutput.value) asciiOutput.value = generateAscii();
    copyText(getCombinedText(), 'Copied drawing and descriptor.');
  });
  document.getElementById('copyAsciiButton').addEventListener('click', () => {
    if (!asciiOutput.value) asciiOutput.value = generateAscii();
    copyText(asciiOutput.value, 'Copied ASCII.');
  });

  document.getElementById('clearButton').addEventListener('click', () => {
    if (!state.objects.length) return;
    saveUndo();
    state.objects = [];
    state.selectedId = null;
    render();
    asciiOutput.value = '';
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

  applyViewTransform();
  render();
})();
