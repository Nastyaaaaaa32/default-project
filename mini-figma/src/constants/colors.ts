/**
 * Базовая палитра заливок — цвета, как в Figma: белый, чёрный, серый,
 * красный, оранжевый, жёлтый, зелёный, голубой, синий, фиолетовый, розовый.
 *
 * Одна группа — одна шкала оттенков (светлый → базовый → тёмный),
 * кнопки в панели свойств рисуются прямо из этого списка:
 * добавить цвет = записать строку здесь, руками в JSX ничего не правим.
 */

/** Один цвет в группе. */
export interface ColorSwatch {
  /** Подпись в подсказке, например «Красный 500». */
  name: string;
  /** HEX в формате #rrggbb — ровно то, что ложится в shape.fill. */
  hex: string;
}

/** Шкала одного оттенка. */
export interface ColorGroup {
  id: string;
  /** Короткая подпись ряда в панели. */
  label: string;
  swatches: ColorSwatch[];
}

export const FILL_GROUPS: ColorGroup[] = [
  {
    id: 'neutral',
    label: 'Нейтральные',
    swatches: [
      { name: 'Белый', hex: '#ffffff' },
      { name: 'Серый 100', hex: '#f4f4f5' },
      { name: 'Серый 300', hex: '#d4d4d8' },
      { name: 'Серый 500', hex: '#a1a1aa' },
      { name: 'Серый 600', hex: '#71717a' },
      { name: 'Серый 800', hex: '#3f3f46' },
      { name: 'Серый 900', hex: '#18181b' },
      { name: 'Чёрный', hex: '#000000' },
    ],
  },
  {
    id: 'red',
    label: 'Красный',
    swatches: [
      { name: 'Красный 100', hex: '#fee9e4' },
      { name: 'Красный 500', hex: '#f24822' },
      { name: 'Красный 700', hex: '#b3210c' },
    ],
  },
  {
    id: 'orange',
    label: 'Оранжевый',
    swatches: [
      { name: 'Оранжевый 100', hex: '#fff0de' },
      { name: 'Оранжевый 500', hex: '#ff8a00' },
      { name: 'Оранжевый 700', hex: '#b25e00' },
    ],
  },
  {
    id: 'yellow',
    label: 'Жёлтый',
    swatches: [
      { name: 'Жёлтый 100', hex: '#fff6d6' },
      { name: 'Жёлтый 500', hex: '#ffcd29' },
      { name: 'Жёлтый 700', hex: '#9a7b00' },
    ],
  },
  {
    id: 'green',
    label: 'Зелёный',
    swatches: [
      { name: 'Зелёный 100', hex: '#dff7ec' },
      { name: 'Зелёный 500', hex: '#14ae5c' },
      { name: 'Зелёный 700', hex: '#0a6b3e' },
    ],
  },
  {
    id: 'cyan',
    label: 'Голубой',
    swatches: [
      { name: 'Голубой 100', hex: '#e3f2ff' },
      { name: 'Голубой 500', hex: '#0d99ff' },
      { name: 'Голубой 700', hex: '#0b66c2' },
    ],
  },
  {
    id: 'blue',
    label: 'Синий',
    swatches: [
      { name: 'Синий 100', hex: '#dbeafe' },
      { name: 'Синий 500', hex: '#3b82f6' },
      { name: 'Синий 700', hex: '#1d4ed8' },
    ],
  },
  {
    id: 'purple',
    label: 'Фиолетовый',
    swatches: [
      { name: 'Фиолетовый 100', hex: '#efe6ff' },
      { name: 'Фиолетовый 500', hex: '#9747ff' },
      { name: 'Фиолетовый 700', hex: '#6b21c7' },
    ],
  },
  {
    id: 'pink',
    label: 'Розовый',
    swatches: [
      { name: 'Розовый 100', hex: '#ffe7f4' },
      { name: 'Розовый 500', hex: '#ff66c4' },
      { name: 'Розовый 700', hex: '#c1308a' },
    ],
  },
];

/** Цвет фигур по умолчанию — синий из палитры (тот же, что в useShapes/DEFAULT_STYLE). */
export const DEFAULT_FILL = '#3b82f6';

/** HEX в нижнем регистре для сравнения: '#FF0000' === '#ff0000'. */
export function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase();
}
