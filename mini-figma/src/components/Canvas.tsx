import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Point, Rect, Shape as ShapeModel, ShapeBase, ShapeInit, ShapeType, Tool } from '../types/shape';
import { comboLabel, EDIT_HOTKEYS } from '../constants/tools';
import { useViewport } from '../hooks/useViewport';
import { normalizeRect, screenToCanvas, viewportTransform } from '../utils/geometry';
import { Shape } from './Shape';

/** Шаг сетки в координатах канваса: 1 клетка = 24px при зуме 100%. */
const GRID_SIZE = 24;
const GRID_COLOR = 'rgba(148, 163, 184, 0.14)';
/** Ниже этого размера клетки мельчают в кашу — прячем сетку. */
const MIN_GRID_PX = 6;
/** Рисунок меньше этого размера — считаем кликом и фигуру не создаём. */
const MIN_SHAPE = 2;

interface CanvasProps {
  tool: Tool;
  shapes: ShapeModel[];
  selectedId: string | null;
  /** null — снять выделение. */
  onSelect: (id: string | null) => void;
  addShape: (init: ShapeInit) => ShapeModel;
  /** Перетаскивание: точки приходят в координатах канваса (см. hooks/useShapes). */
  beginDrag: (id: string, point: Point) => void;
  dragTo: (point: Point) => void;
  endDrag: () => void;
}

/** Начало и текущий курсор рисуемой фигуры. */
interface DrawState {
  pointerId: number;
  type: ShapeType;
  from: Point;
}

interface DraftState {
  type: ShapeType;
  from: Point;
  to: Point;
}

/** Превью рисуемой фигуры — тот же компонент Shape, что и для настоящих фигур. */
function draftShape(draft: DraftState, rect: Rect, zoom: number): ShapeModel {
  const base: ShapeBase = {
    id: '__draft',
    name: 'черновик',
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    rotation: 0,
    fill: 'rgba(59, 130, 246, 0.15)',
    stroke: '#3b82f6',
    strokeWidth: 1 / zoom,
    opacity: 1,
  };
  return draft.type === 'rectangle' ? { ...base, type: 'rectangle' } : { ...base, type: 'ellipse' };
}

/**
 * Холст на весь экран: сетка на фоне, фигуры поверх, вся мышь здесь.
 * Камера живёт в useViewport, данные фигур — в useShapes (через App).
 */
export function Canvas({
  tool,
  shapes,
  selectedId,
  onSelect,
  addShape,
  beginDrag,
  dragTo,
  endDrag,
}: CanvasProps) {
  const { viewport, isSpacePressed, isPanning, center, handlers } = useViewport();
  const { panX, panY, zoom } = viewport;

  const drawRef = useRef<DrawState | null>(null);
  const dragPointerRef = useRef<number | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);

  // Сетка едет и зумится вместе с камерой, иначе фон «отстаёт» от фигур.
  const gridStyle = useMemo(() => {
    const cell = GRID_SIZE * zoom;
    if (cell < MIN_GRID_PX) return undefined;
    return {
      backgroundImage: `linear-gradient(to right, ${GRID_COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_COLOR} 1px, transparent 1px)`,
      backgroundSize: `${cell}px ${cell}px`,
      backgroundPosition: `${panX}px ${panY}px`,
    };
  }, [panX, panY, zoom]);

  /** Экранные координаты события → координаты канваса (та же математика, что у зума). */
  const toCanvas = (event: { clientX: number; clientY: number }): Point =>
    screenToCanvas({ x: event.clientX, y: event.clientY }, viewport);

  // --- Фигура под курсором: выделение кликом + перетаскивание ---
  const handleShapePointerDown = (event: ReactPointerEvent<SVGElement>) => {
    // Пробел или средняя кнопка — приоритет у камеры, фигуру не трогаем.
    if (isSpacePressed || isPanning || event.button !== 0) return;
    const id = event.currentTarget.getAttribute('data-shape-id');
    if (!id) return;

    event.stopPropagation(); // фон не должен снять выделение
    onSelect(id);
    beginDrag(id, toCanvas(event));
    dragPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  // --- Пустой холст: панорама / начало рисования / снятие выделения ---
  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    handlers.onPointerDown(event); // пробел или средняя кнопка → камера
    if (isSpacePressed || isPanning || event.button !== 0) return;

    if (tool === 'rectangle' || tool === 'ellipse') {
      const point = toCanvas(event);
      drawRef.current = { pointerId: event.pointerId, type: tool, from: point };
      setDraft({ type: tool, from: point, to: point });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    // Инструмент «Перемещение»: клик мимо любой фигуры — снимаем выделение.
    if (!(event.target as Element).closest('[data-shape-id]')) onSelect(null);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    handlers.onPointerMove(event);
    const point = toCanvas(event);

    if (dragPointerRef.current === event.pointerId) {
      dragTo(point);
      return;
    }

    const drawing = drawRef.current;
    if (drawing && drawing.pointerId === event.pointerId) {
      setDraft({ type: drawing.type, from: drawing.from, to: point });
    }
  };

  /** Снять захват указателя, если он был (камера снимает свой сама). */
  const releaseCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (typeof target.hasPointerCapture === 'function' && target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    handlers.onPointerUp(event);
    releaseCapture(event);

    if (dragPointerRef.current === event.pointerId) {
      dragPointerRef.current = null;
      endDrag();
    }

    const drawing = drawRef.current;
    if (drawing && drawing.pointerId === event.pointerId) {
      drawRef.current = null;
      const rect = normalizeRect(drawing.from, toCanvas(event));
      setDraft(null);
      if (rect.width >= MIN_SHAPE && rect.height >= MIN_SHAPE) {
        addShape({ type: drawing.type, ...rect });
      }
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    handlers.onPointerCancel(event);
    releaseCapture(event);
    dragPointerRef.current = null;
    drawRef.current = null;
    setDraft(null);
    endDrag();
  };

  const draftRect = draft ? normalizeRect(draft.from, draft.to) : null;

  const cursor = isPanning
    ? 'grabbing'
    : isSpacePressed
      ? 'grab'
      : tool === 'select'
        ? 'default'
        : 'crosshair';

  return (
    <div
      className="fixed inset-0 touch-none overflow-hidden bg-zinc-950"
      style={{ cursor }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Сетка */}
      <div data-canvas-bg className="absolute inset-0" style={gridStyle} />

      {/* Фигуры: одна SVG-сцена, камера применяется одним transform */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect data-canvas-bg x="0" y="0" width="100%" height="100%" fill="transparent" />
        <g transform={viewportTransform(viewport)}>
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedId}
              zoom={zoom}
              onPointerDown={tool === 'select' ? handleShapePointerDown : undefined}
            />
          ))}
          {draft && draftRect && (
            <Shape shape={draftShape(draft, draftRect, zoom)} isSelected={false} zoom={zoom} />
          )}
        </g>
      </svg>

      {/* Подсказка + текущий масштаб */}
      <div
        data-nozoom
        className="absolute bottom-5 left-1/2 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-2 text-center text-xs text-zinc-400 shadow-xl backdrop-blur"
      >
        <span>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-zinc-200">Пробел</kbd> + перетаскивание —
          панорама
        </span>
        <span className="text-zinc-600">•</span>
        <span>колесо — зум</span>
        <span className="text-zinc-600">•</span>
        <span>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-zinc-200">
            {comboLabel(EDIT_HOTKEYS.undo.combo)}
          </kbd>{' '}
          — {EDIT_HOTKEYS.undo.label.toLowerCase()},{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-zinc-200">
            {comboLabel(EDIT_HOTKEYS.redo.combo)}
          </kbd>{' '}
          — {EDIT_HOTKEYS.redo.label.toLowerCase()}
        </span>
        <span className="text-zinc-600">•</span>
        <button
          type="button"
          onClick={center}
          title="Центрировать холст"
          className="rounded-md bg-white/10 px-2 py-0.5 font-mono tabular-nums text-zinc-200 transition hover:bg-white/20"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
    </div>
  );
}
