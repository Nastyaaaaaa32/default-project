import { useMemo, useState } from 'react';
import type { Tool } from './types/shape';
import { DEFAULT_TOOL, EDIT_HOTKEYS, TOOLS } from './constants/tools';
import { useHotkeys, type HotkeyMap } from './hooks/useHotkeys';
import { useShapes } from './hooks/useShapes';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';

/**
 * Собирает холст и три панели.
 * Данные фигур живут здесь (useShapes), камера — внутри Canvas (useViewport):
 * так каждая забота остаётся в своём хуке.
 */
export default function App() {
  const {
    shapes,
    selectedId,
    selectedShape,
    selectShape,
    addShape,
    updateShape,
    beginDrag,
    dragTo,
    endDrag,
    undo,
    redo,
  } = useShapes();
  const [activeTool, setActiveTool] = useState<Tool>(DEFAULT_TOOL);

  // Раскладка целиком собирается из констант: клавиши инструментов (V / R / O)
  // и комбинации истории — всё из src/constants/tools.ts, обработка — useHotkeys.
  const hotkeys = useMemo<HotkeyMap>(() => {
    const map: HotkeyMap = {};
    for (const tool of TOOLS) {
      map[tool.key] = () => setActiveTool(tool.id);
    }
    map[EDIT_HOTKEYS.undo.combo] = undo;
    map[EDIT_HOTKEYS.redo.combo] = redo;
    return map;
  }, [undo, redo]);
  useHotkeys(hotkeys);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <Canvas
        tool={activeTool}
        shapes={shapes}
        selectedId={selectedId}
        onSelect={selectShape}
        addShape={addShape}
        beginDrag={beginDrag}
        dragTo={dragTo}
        endDrag={endDrag}
      />
      <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} />
      <PropertiesPanel
        shape={selectedShape}
        onFillChange={(fill) => {
          if (selectedShape) updateShape(selectedShape.id, { fill });
        }}
      />
      <LayersPanel shapes={shapes} selectedId={selectedId} onSelect={selectShape} />
    </div>
  );
}
