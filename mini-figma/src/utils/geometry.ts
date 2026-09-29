import type { Point, Rect, Viewport } from '../types/shape';

/** Ограничить значение диапазоном. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Ограничить масштаб диапазоном (границы держит камера — см. hooks/useViewport). */
export function clampZoom(zoom: number, min: number, max: number): number {
  return clamp(zoom, min, max);
}

/** Экранные координаты (клиент) → координаты канваса с учётом зума и панорамирования. */
export function screenToCanvas(screen: Point, viewport: Viewport): Point {
  return {
    x: (screen.x - viewport.panX) / viewport.zoom,
    y: (screen.y - viewport.panY) / viewport.zoom,
  };
}

/** Обратное преобразование: координаты канваса → экранные. */
export function canvasToScreen(canvas: Point, viewport: Viewport): Point {
  return {
    x: canvas.x * viewport.zoom + viewport.panX,
    y: canvas.y * viewport.zoom + viewport.panY,
  };
}

/**
 * Новый вьюпорт при зуме: держим точку screen неподвижной под курсором.
 * Без этого пересчёта колесо «уводит» холст в сторону от мыши.
 */
export function zoomViewportAt(screen: Point, viewport: Viewport, nextZoom: number): Viewport {
  const ratio = nextZoom / viewport.zoom;
  return {
    zoom: nextZoom,
    panX: screen.x - (screen.x - viewport.panX) * ratio,
    panY: screen.y - (screen.y - viewport.panY) * ratio,
  };
}

/** Атрибут transform для SVG-группы: сначала сдвиг, потом масштаб. */
export function viewportTransform(viewport: Viewport): string {
  return `translate(${viewport.panX} ${viewport.panY}) scale(${viewport.zoom})`;
}

/** Прямоугольник из двух углов любой диагонали — при рисовании фигуры. */
export function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

/**
 * Смещение точки захвата от начала фигуры (в координатах канваса).
 * Без него фигура «прыгала» бы верхним левым углом под курсор при взятии.
 */
export function grabOffsetFor(point: Point, origin: Point): Point {
  return { x: point.x - origin.x, y: point.y - origin.y };
}

/** Новое начало фигуры при перетаскивании: курсор минус смещение захвата. */
export function dragPosition(cursor: Point, grabOffset: Point): Point {
  return { x: cursor.x - grabOffset.x, y: cursor.y - grabOffset.y };
}
