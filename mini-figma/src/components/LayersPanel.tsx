import type { ReactElement } from 'react';
import type { Shape as ShapeModel } from '../types/shape';

interface LayersPanelProps {
  shapes: ShapeModel[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const LAYER_ICONS: Record<ShapeModel['type'], ReactElement> = {
  rectangle: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
  ellipse: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
    </svg>
  ),
};

/** Панель слоёв справа. Пока каркас: список фигур и выделение. */
export function LayersPanel({ shapes, selectedId, onSelect }: LayersPanelProps) {
  // Сверху — то, что «ближе» к зрителю, как в Figma.
  const ordered = [...shapes].reverse();

  return (
    <aside
      data-nozoom
      className="fixed right-4 bottom-4 z-10 flex max-h-64 w-72 flex-col rounded-2xl border border-white/10 bg-zinc-900/85 shadow-xl backdrop-blur"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Слои</span>
        <span className="text-xs text-zinc-600">{shapes.length}</span>
      </header>

      <div className="overflow-y-auto p-1.5">
        {ordered.length === 0 ? (
          <p className="px-2.5 py-4 text-sm text-zinc-600">Фигур пока нет</p>
        ) : (
          ordered.map((shape) => {
            const isActive = shape.id === selectedId;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  onSelect(shape.id);
                }}
                aria-pressed={shape.id === selectedId}
                title={`${shape.name} — нажмите, чтобы выделить на холсте`}
                className={`flex w-full items-center gap-2 rounded-lg border-l-2 px-2.5 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                    : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <span className={isActive ? 'text-blue-300' : 'text-zinc-500'}>{LAYER_ICONS[shape.type]}</span>
                <span className="truncate">{shape.name}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
