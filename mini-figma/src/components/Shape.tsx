import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Shape as ShapeModel } from '../types/shape';

interface ShapeProps {
  shape: ShapeModel;
  /** Выделена — вокруг рисуем рамку и восемь маркеров. */
  isSelected: boolean;
  /** Зум камеры: маркеры держат размер на экране, а не растут вместе с холстом. */
  zoom: number;
  /**
   * Фигура «слушает» мышь только когда Canvas передал обработчик
   * (инструмент «Перемещение»). Без обработчика она прозрачна для кликов —
   * рисование идёт поверх.
   */
  onPointerDown?: (event: ReactPointerEvent<SVGElement>) => void;
}

/** Один цвет выделения на весь редактор. */
const SELECTION_COLOR = '#3b82f6';

/** Размер маркера выделения в экранных пикселях. */
const HANDLE_PX = 7;

export function Shape({ shape, isSelected, zoom, onPointerDown }: ShapeProps) {
  const { x, y, width: w, height: h } = shape;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const transform = shape.rotation ? `rotate(${shape.rotation} ${cx} ${cy})` : undefined;

  const geometry = {
    fill: shape.fill,
    opacity: shape.opacity,
    // В режиме выделения обводка становится акцентной и не утолщается при зуме.
    stroke: isSelected ? SELECTION_COLOR : shape.stroke,
    strokeWidth: isSelected ? 1.5 : shape.strokeWidth,
    vectorEffect: isSelected ? 'non-scaling-stroke' : undefined,
    transform,
    cursor: onPointerDown ? 'move' : undefined,
    onPointerDown,
    pointerEvents: onPointerDown ? undefined : 'none',
    'data-shape-id': shape.id,
  };

  const body =
    shape.type === 'rectangle' ? (
      <rect x={x} y={y} width={w} height={h} {...geometry} />
    ) : (
      <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} {...geometry} />
    );

  // Рамка + 8 маркеров: углы и середины сторон габаритного прямоугольника.
  const handle = HANDLE_PX / zoom;
  const marks: Array<[number, number]> = [
    [x, y],
    [cx, y],
    [x + w, y],
    [x, cy],
    [x + w, cy],
    [x, y + h],
    [cx, y + h],
    [x + w, y + h],
  ];

  return (
    <>
      {body}
      {isSelected && (
        <g transform={transform} pointerEvents="none">
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill="none"
            stroke={SELECTION_COLOR}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {marks.map(([mx, my], index) => (
            <rect
              key={index}
              x={mx - handle / 2}
              y={my - handle / 2}
              width={handle}
              height={handle}
              rx={handle / 6}
              fill="#ffffff"
              stroke={SELECTION_COLOR}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      )}
    </>
  );
}
