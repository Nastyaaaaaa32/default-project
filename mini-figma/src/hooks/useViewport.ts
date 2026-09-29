import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEventHandler } from 'react';
import type { Viewport } from '../types/shape';
import { clampZoom, zoomViewportAt } from '../utils/geometry';

/**
 * Камера холста — забота №1, отдельно от фигур и клавиатуры:
 * - панорамирование при зажатом пробеле + перетаскивании мышью (средняя кнопка тоже работает);
 * - зум колесом от 10% до 400% с «якорем» под курсором;
 * - центрирование начала координат канваса при старте.
 */

export const MIN_ZOOM = 0.1; // 10%
export const MAX_ZOOM = 4; // 400%

/** Как быстро крутится колесо: deltaY → множитель масштаба. */
const ZOOM_SENSITIVITY = 0.0015;

interface PanState {
  pointerId: number;
  lastX: number;
  lastY: number;
}

export interface ViewportApi {
  viewport: Viewport;
  /** Пробел зажат — курсор «рука», холст можно таскать. */
  isSpacePressed: boolean;
  /** Камера прямо сейчас едет. */
  isPanning: boolean;
  /** Поставить (0,0) канваса в центр экрана. */
  center: () => void;
  handlers: {
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerMove: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
    onPointerCancel: PointerEventHandler<HTMLElement>;
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

export function useViewport(): ViewportApi {
  const [viewport, setViewport] = useState<Viewport>({ panX: 0, panY: 0, zoom: 1 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const spaceRef = useRef(false);
  const panRef = useRef<PanState | null>(null);

  const center = useCallback(() => {
    setViewport((current) => ({
      ...current,
      panX: window.innerWidth / 2,
      panY: window.innerHeight / 2,
    }));
  }, []);

  // Центрируем холст при старте.
  useEffect(() => {
    center();
  }, [center]);

  // Пробел: зажали — включили режим панорамы, отпустили — выключили.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || isEditableTarget(event.target)) return;
      // Не даём пробелу скроллить страницу и «нажимать» кнопки под фокусом.
      event.preventDefault();
      if (spaceRef.current) return;
      spaceRef.current = true;
      setIsSpacePressed(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      spaceRef.current = false;
      setIsSpacePressed(false);
    };

    // Потеря фокуса окном: сбрасываем и пробел, и текущую панораму.
    const onBlur = () => {
      spaceRef.current = false;
      setIsSpacePressed(false);
      panRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Зум колесом: свой слушатель с passive: false, иначе браузер скроллит страницу вместо холста.
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      // Над панелями и подсказками колесо не зумит (иначе ломается скролл списков).
      if (event.target instanceof Element && event.target.closest('[data-nozoom]')) return;
      event.preventDefault();

      setViewport((current) => {
        const nextZoom = clampZoom(
          current.zoom * Math.exp(-event.deltaY * ZOOM_SENSITIVITY),
          MIN_ZOOM,
          MAX_ZOOM,
        );
        if (nextZoom === current.zoom) return current;
        return zoomViewportAt({ x: event.clientX, y: event.clientY }, current, nextZoom);
      });
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = useCallback<PointerEventHandler<HTMLElement>>((event) => {
    const wantsPan = spaceRef.current || event.button === 1;
    if (!wantsPan) return;

    event.preventDefault();
    panRef.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>((event) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;

    const dx = event.clientX - pan.lastX;
    const dy = event.clientY - pan.lastY;
    pan.lastX = event.clientX;
    pan.lastY = event.clientY;
    if (dx === 0 && dy === 0) return;

    setViewport((current) => ({ ...current, panX: current.panX + dx, panY: current.panY + dy }));
  }, []);

  const endPan = useCallback<PointerEventHandler<HTMLElement>>((event) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;

    panRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return {
    viewport,
    isSpacePressed,
    isPanning,
    center,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPan,
      onPointerCancel: endPan,
    },
  };
}
