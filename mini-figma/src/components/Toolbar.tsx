import type { ReactElement } from 'react';
import type { Tool } from '../types/shape';
import { TOOLS, toolMeta } from '../constants/tools';

/** Иконки инструментов. Подпись и клавиша приходят из constants/tools.ts. */
const TOOL_ICONS: Record<Tool, ReactElement> = {
  select: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M5 3l13 8.3-6.1 1.4L9.6 19z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
    </svg>
  ),
  ellipse: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
    </svg>
  ),
};

interface ToolbarProps {
  activeTool: Tool;
  onSelectTool: (tool: Tool) => void;
}

/** Панель инструментов слева. Список и клавиши — из constants/tools.ts. */
export function Toolbar({ activeTool, onSelectTool }: ToolbarProps) {
  return (
    <div
      data-nozoom
      className="fixed top-4 left-4 z-10 flex flex-col gap-1 rounded-2xl border border-white/10 bg-zinc-900/85 p-1.5 shadow-xl backdrop-blur"
    >
      {TOOLS.map((tool) => {
        const meta = toolMeta(tool.id);
        const isActive = tool.id === activeTool;
        return (
          <button
            key={tool.id}
            type="button"
            title={`${meta.label} (${meta.key.toUpperCase()}) — ${meta.hint}`}
            aria-pressed={isActive}
            onClick={(event) => {
              // Убираем фокус, чтобы пробел не «нажимал» кнопку вместо панорамы.
              event.currentTarget.blur();
              onSelectTool(tool.id);
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              isActive
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
            }`}
          >
            {TOOL_ICONS[tool.id]}
            <kbd
              className={`absolute right-1 bottom-0.5 font-sans text-[9px] leading-none ${
                isActive ? 'text-blue-100' : 'text-zinc-500'
              }`}
            >
              {tool.key.toUpperCase()}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
