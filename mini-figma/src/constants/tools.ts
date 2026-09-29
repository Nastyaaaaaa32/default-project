import type { Tool } from '../types/shape';

/** Описание одного инструмента: подпись для панели и клавиша, которая его включает. */
export interface ToolMeta {
  id: Tool;
  label: string;
  /** Буква-серия в нижнем регистре: v / r / o */
  key: string;
  hint: string;
}

/** Порядок кнопок в панели инструментов. Меняете клавиши или добавляете инструмент — правите только этот список. */
export const TOOLS: ToolMeta[] = [
  { id: 'select', label: 'Перемещение', key: 'v', hint: 'Выбор и перемещение фигур' },
  { id: 'rectangle', label: 'Прямоугольник', key: 'r', hint: 'Рисование прямоугольника' },
  { id: 'ellipse', label: 'Эллипс', key: 'o', hint: 'Рисование эллипса' },
];

/** Инструмент, с которого стартуем. */
export const DEFAULT_TOOL: Tool = 'select';

/**
 * Комбинации правки документом — они же весь список клавиш проекта.
 * 'mod' — Cmd на macOS, Ctrl везде else (так же парсит hooks/useHotkeys).
 */
export const EDIT_HOTKEYS = {
  undo: { combo: 'mod+z', label: 'Отменить' },
  redo: { combo: 'mod+shift+z', label: 'Вернуть' },
} as const;

/** Подпись комбинации для подсказок: 'mod+z' → '⌘Z' на macOS, 'Ctrl+Z' в остальных. */
export function comboLabel(combo: string): string {
  const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const parts = combo.split('+').map((part) => {
    if (part === 'mod') return isApple ? '⌘' : 'Ctrl';
    if (part === 'shift') return isApple ? '⇧' : 'Shift';
    if (part === 'alt') return isApple ? '⌥' : 'Alt';
    if (part === 'cmd') return '⌘';
    return part.toUpperCase();
  });
  return parts.join(isApple ? '' : '+');
}

/** Соответствие «клавиша → инструмент», собранное из TOOLS. */
export const TOOL_BY_KEY: Record<string, Tool> = TOOLS.reduce<Record<string, Tool>>((acc, tool) => {
  acc[tool.key] = tool.id;
  return acc;
}, {});

/** Найти инструмент по нажатой клавише ('R' и 'r' — одно и то же). */
export function toolByKey(key: string): Tool | null {
  return TOOL_BY_KEY[key.toLowerCase()] ?? null;
}

/** Подпись инструмента для панелей и подсказок. */
export function toolMeta(id: Tool): ToolMeta {
  return TOOLS.find((tool) => tool.id === id) ?? TOOLS[0];
}
