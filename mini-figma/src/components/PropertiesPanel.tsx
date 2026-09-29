import type { Shape as ShapeModel } from '../types/shape';
import { DEFAULT_FILL, FILL_GROUPS, normalizeHex } from '../constants/colors';

interface PropertiesPanelProps {
  shape: ShapeModel | null;
  /** Сменить заливку фигуры — сюда приходит updateShape из useShapes. */
  onFillChange: (fill: string) => void;
}

const TYPE_LABEL: Record<ShapeModel['type'], string> = {
  rectangle: 'Прямоугольник',
  ellipse: 'Эллипс',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-sm tabular-nums text-zinc-200">{value}</span>
    </div>
  );
}

/** Панель свойств справа: геометрия выделенной фигуры и выбор заливки из базовой палитры. */
export function PropertiesPanel({ shape, onFillChange }: PropertiesPanelProps) {
  return (
    <aside
      data-nozoom
      className="fixed top-4 right-4 z-10 w-72 rounded-2xl border border-white/10 bg-zinc-900/85 shadow-xl backdrop-blur"
    >
      <header className="border-b border-white/10 px-4 py-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
        Свойства
      </header>

      {!shape ? (
        <div className="px-4 py-6">
          <p className="text-sm text-zinc-400">Ничего не выбрано</p>
          <p className="mt-1 text-xs text-zinc-600">Кликните по фигуре на холсте</p>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">Тип</span>
            <span className="text-zinc-200">{TYPE_LABEL[shape.type]}</span>
          </div>
          <Row label="X" value={String(Math.round(shape.x))} />
          <Row label="Y" value={String(Math.round(shape.y))} />
          <Row label="Ширина" value={String(Math.round(shape.width))} />
          <Row label="Высота" value={String(Math.round(shape.height))} />
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Заливка</span>
              <span className="flex items-center gap-2 font-mono text-sm text-zinc-200">
                <span
                  className="inline-block h-4 w-4 rounded border border-white/20"
                  style={{ background: shape.fill }}
                />
                {shape.fill}
              </span>
            </div>

            {/* Базовая палитра — ряды из constants/colors, как в Figma. */}
            <div className="space-y-1.5 pt-1">
              {FILL_GROUPS.map((group) => (
                <div key={group.id} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 truncate text-xs text-zinc-600">
                    {group.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.swatches.map((swatch, index) => {
                      const active = normalizeHex(shape.fill) === normalizeHex(swatch.hex);
                      return (
                        <button
                          key={`${group.id}-${index}`}
                          type="button"
                          title={swatch.name}
                          aria-label={swatch.name}
                          aria-pressed={active}
                          onClick={() => onFillChange(swatch.hex)}
                          className={`h-5 w-5 rounded-md border transition-transform hover:scale-110 focus:outline-none ${
                            active
                              ? 'border-white ring-2 ring-white/60'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                          style={{ background: swatch.hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-center justify-between gap-3 pt-1 text-xs text-zinc-500">
              Свой цвет
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(shape.fill) ? shape.fill : DEFAULT_FILL}
                onChange={(event) => onFillChange(event.target.value)}
                className="h-6 w-10 cursor-pointer rounded border border-white/10 bg-transparent p-0"
              />
            </label>
          </div>
        </div>
      )}
    </aside>
  );
}
