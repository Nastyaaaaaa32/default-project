import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Point, Shape, ShapeInit, ShapePatch, ShapeType } from '../types/shape';
import { dragPosition, grabOffsetFor } from '../utils/geometry';
import { DEFAULT_FILL } from '../constants/colors';

/**
 * Состояние фигур — забота №2, отдельно от камеры и клавиатуры:
 * список, добавление, изменение, выделение, перетаскивание.
 * Координаты при перетаскивании приходят уже пересчёными из экранных
 * (см. utils/geometry.screenToCanvas) — хук работает только с канвасом.
 *
 * Здесь же живёт история изменений: текущее состояние окружено двумя
 * стеками — «прошлое» (что уже сделали) и «будущее» (что отменили).
 * Ctrl+Z забирает последний шаг из прошлого, Ctrl+Shift+Z возвращает
 * первый из будущего (комбинации — в constants/EDIT_HOTKEYS, обвязка — в App).
 */

const TYPE_LABEL: Record<ShapeType, string> = {
  rectangle: 'Прямоугольник',
  ellipse: 'Эллипс',
};

/** Стартовый вид новых фигур. Свою геометрию передают через ShapeInit. */
const DEFAULT_STYLE = {
  rotation: 0,
  fill: DEFAULT_FILL,
  stroke: 'none',
  strokeWidth: 0,
  opacity: 1,
} as const;

/** Сколько шагов истории держим: старшие отрезаем, чтобы память не росла бесконечно. */
const HISTORY_LIMIT = 100;

/** Момент до изменения — ровно то, что вернёт undo: фигуры и выделение. */
interface Snapshot {
  shapes: Shape[];
  selectedId: string | null;
}

/** Всё, что помнит хук: текущее состояние плюс две кучки истории. */
interface DocState {
  shapes: Shape[];
  selectedId: string | null;
  /** Сделанные шаги, ближайший в конце — undo берёт последний. */
  past: Snapshot[];
  /** Отменённые шаги, redo берёт первый. */
  future: Snapshot[];
}

/** Что помнит хук, пока фигуру тащат мышью. */
interface DragState {
  id: string;
  /** Смещение точки захвата от начала фигуры, в координатах канваса. */
  offset: Point;
  /** Снимок до перетаскивания: весь драг превращается в один шаг истории. */
  before: Snapshot;
}

/** Снимок состояния — записывается в историю как шаг. */
function snapshotOf(doc: DocState): Snapshot {
  return { shapes: doc.shapes, selectedId: doc.selectedId };
}

/** Добавить шаг в историю. Новое действие всегда обнуляет «будущее». */
function pushHistory(doc: DocState, snapshot: Snapshot): DocState {
  return {
    ...doc,
    past: [...doc.past.slice(-(HISTORY_LIMIT - 1)), snapshot],
    future: [],
  };
}

/** Совпадают ли списки фигур по значению (фигуры плоские, сравнение через JSON). */
function sameShapes(a: Shape[], b: Shape[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((shape, index) => JSON.stringify(shape) === JSON.stringify(b[index]));
}

export interface UseShapesApi {
  shapes: Shape[];
  selectedId: string | null;
  selectedShape: Shape | null;
  /** Создать фигуру и выделить её. */
  addShape: (init: ShapeInit) => Shape;
  /** Точечно поменять свойства фигуры. */
  updateShape: (id: string, patch: ShapePatch) => void;
  removeShape: (id: string) => void;
  /** null — снять выделение. */
  selectShape: (id: string | null) => void;
  /** Взять фигуру в точке канваса — запоминаем, за что её схватили. */
  beginDrag: (id: string, point: Point) => void;
  /** Передвинуть захваченную фигуру в точку канваса (без захвата — no-op). */
  dragTo: (point: Point) => void;
  /** Отпустить фигуру: драг целиком становится одним шагом истории. */
  endDrag: () => void;
  /** Ctrl+Z — откатить последнее изменение (шагов нет — no-op). */
  undo: () => void;
  /** Ctrl+Shift+Z — вернуть то, что отменили. */
  redo: () => void;
  /** Есть ли что откатывать — для состояния кнопок и подсказок. */
  canUndo: boolean;
  canRedo: boolean;
}

export function useShapes(): UseShapesApi {
  const [doc, setDoc] = useState<DocState>(() => ({
    shapes: [],
    selectedId: null,
    past: [],
    future: [],
  }));
  const { shapes, selectedId, past, future } = doc;

  const dragRef = useRef<DragState | null>(null);

  // Зеркало списка в ref, чтобы addShape/beginDrag видели актуальные данные
  // и оставались стабильными (без пересоздания на каждый рендер).
  const shapesRef = useRef<Shape[]>(shapes);
  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  const addShape = useCallback((init: ShapeInit): Shape => {
    const id = `shape-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    const count = shapesRef.current.filter((shape) => shape.type === init.type).length + 1;

    const base = {
      id,
      name: `${TYPE_LABEL[init.type]} ${count}`,
      x: init.x,
      y: init.y,
      width: init.width,
      height: init.height,
      ...DEFAULT_STYLE,
    };

    const shape: Shape =
      init.type === 'rectangle'
        ? { ...base, type: 'rectangle' }
        : { ...base, type: 'ellipse' };

    setDoc((prev) =>
      pushHistory({ ...prev, shapes: [...prev.shapes, shape], selectedId: id }, snapshotOf(prev)),
    );
    return shape;
  }, []);

  const updateShape = useCallback((id: string, patch: ShapePatch) => {
    setDoc((prev) => {
      const shape = prev.shapes.find((item) => item.id === id);
      if (!shape) return prev;

      // Изменений нет — не создаём ни ререндера, ни шага истории.
      const changed = (Object.keys(patch) as (keyof ShapePatch)[]).some(
        (key) => shape[key] !== patch[key],
      );
      if (!changed) return prev;

      const next: DocState = {
        ...prev,
        shapes: prev.shapes.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      };

      // Пока фигуру тащат, историю не пишем: иначе один драг разложится
      // на сотни мелких шагов. Сводка — в endDrag.
      return dragRef.current ? next : pushHistory(next, snapshotOf(prev));
    });
  }, []);

  const removeShape = useCallback((id: string) => {
    setDoc((prev) => {
      if (!prev.shapes.some((shape) => shape.id === id)) return prev;
      return pushHistory(
        {
          ...prev,
          shapes: prev.shapes.filter((shape) => shape.id !== id),
          selectedId: prev.selectedId === id ? null : prev.selectedId,
        },
        snapshotOf(prev),
      );
    });
  }, []);

  // Выделение — не правка документа, в историю его не пишем.
  const selectShape = useCallback((id: string | null) => {
    setDoc((prev) => (prev.selectedId === id ? prev : { ...prev, selectedId: id }));
  }, []);

  // --- Перетаскивание -------------------------------------------------

  const beginDrag = useCallback((id: string, point: Point) => {
    const shape = shapesRef.current.find((item) => item.id === id);
    if (!shape) return;
    dragRef.current = {
      id,
      offset: grabOffsetFor(point, shape),
      before: { shapes: shapesRef.current, selectedId: id },
    };
  }, []);

  const dragTo = useCallback(
    (point: Point) => {
      const drag = dragRef.current;
      if (!drag) return;
      const position = dragPosition(point, drag.offset);
      updateShape(drag.id, { x: position.x, y: position.y });
    },
    [updateShape],
  );

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    setDoc((prev) =>
      // Фигуру увёли и вернули на место — шага в истории не появляется,
      // иначе первый же Ctrl+Z выглядел бы как «ничего не сделал».
      sameShapes(prev.shapes, drag.before.shapes) ? prev : pushHistory(prev, drag.before),
    );
  }, []);

  // --- История изменений -----------------------------------------------

  const undo = useCallback(() => {
    setDoc((prev) => {
      const snapshot = prev.past[prev.past.length - 1];
      // Пока тащат фигуру, откатывать нельзя: шаг драга ещё не закрыт.
      if (!snapshot || dragRef.current) return prev;

      return {
        shapes: snapshot.shapes,
        // Выделение возвращаем, только если оно всё ещё про существующую фигуру.
        selectedId: snapshot.shapes.some((shape) => shape.id === snapshot.selectedId)
          ? snapshot.selectedId
          : null,
        past: prev.past.slice(0, -1),
        future: [snapshotOf(prev), ...prev.future].slice(0, HISTORY_LIMIT),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setDoc((prev) => {
      const snapshot = prev.future[0];
      if (!snapshot || dragRef.current) return prev;

      // Куда вернулись — это уже новый «последний шаг» для undo.
      return {
        ...snapshot,
        past: [...prev.past.slice(-(HISTORY_LIMIT - 1)), snapshotOf(prev)],
        future: prev.future.slice(1),
      };
    });
  }, []);

  const selectedShape = useMemo(
    () => shapes.find((shape) => shape.id === selectedId) ?? null,
    [shapes, selectedId],
  );

  return {
    shapes,
    selectedId,
    selectedShape,
    addShape,
    updateShape,
    removeShape,
    selectShape,
    beginDrag,
    dragTo,
    endDrag,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
