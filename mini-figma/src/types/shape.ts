/**
 * Единый язык проекта: фигуры, инструменты и координаты.
 * Все модули импортируют типы отсюда, чтобы говорить об одних сущностях одинаково.
 */

/** Точка. Может быть в экранных или в координатах канваса — зависит от контекста (см. utils/geometry). */
export interface Point {
  x: number;
  y: number;
}

/** Прямоугольная область в координатах канваса. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Камера холста: сдвиг (панорама) в экранных пикселях и масштаб (1 = 100%). */
export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

/** Инструменты редактора. Клавиши, которые их включают, — в src/constants/tools.ts. */
export type Tool = 'select' | 'rectangle' | 'ellipse';

/** Какие фигуры умеет рисовать редактор. */
export type ShapeType = 'rectangle' | 'ellipse';

/** Общие свойства любой фигуры. Координаты — в системе канваса, не экрана. */
export interface ShapeBase {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Градусы, поворот вокруг центра фигуры. */
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  /** Прозрачность от 0 до 1. */
  opacity: number;
}

export interface RectangleShape extends ShapeBase {
  type: 'rectangle';
}

export interface EllipseShape extends ShapeBase {
  type: 'ellipse';
}

/** Фигура — union из прямоугольника и эллипса. */
export type Shape = RectangleShape | EllipseShape;

/** Данные для новой фигуры: тип + геометрия, остальное подставит useShapes. */
export interface ShapeInit extends Rect {
  type: ShapeType;
}

/** Что можно поменять в фигуре через updateShape(). */
export type ShapePatch = Partial<Omit<ShapeBase, 'id'>>;
