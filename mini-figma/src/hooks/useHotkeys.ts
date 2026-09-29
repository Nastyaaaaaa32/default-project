import { useEffect, useRef } from 'react';

/**
 * Горячие клавиши — забота №3 (камера, данные, клавиатура).
 * Раскладка собирается в App из constants/tools.ts (инструменты R / O / V)
 * и EDIT_HOTKEYS (история Ctrl+Z / Ctrl+Shift+Z), здесь — только механизм:
 * разбор комбинации, сопоставление с событием и подписка на window.
 */

export type HotkeyHandler = (event: KeyboardEvent) => void;

/** Ключ — комбинация: 'r', 'mod+z', 'shift+delete'. 'mod' — Cmd на macOS, Ctrl везде else. */
export type HotkeyMap = Record<string, HotkeyHandler>;

export interface UseHotkeysOptions {
  enabled?: boolean;
  /** Не срабатывать, когда фокус в поле ввода (по умолчанию true). */
  skipInputs?: boolean;
}

interface ParsedCombo {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
}

function parseCombo(combo: string): ParsedCombo {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  const key = parts.pop() ?? '';
  const mods = new Set(parts);
  return {
    key,
    mod: mods.has('mod') || mods.has('ctrl') || mods.has('meta') || mods.has('cmd'),
    shift: mods.has('shift'),
    alt: mods.has('alt'),
  };
}

function matches(event: KeyboardEvent, combo: ParsedCombo): boolean {
  const keyOk = event.key.toLowerCase() === combo.key || event.code.toLowerCase() === combo.key;
  if (!keyOk) return false;

  const primaryPressed = event.ctrlKey || event.metaKey;
  if (combo.mod !== primaryPressed) return false;
  if (combo.shift !== event.shiftKey) return false;
  if (combo.alt !== event.altKey) return false;
  return true;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

/**
 * Регистрирует раскладку на window.
 * map может меняться каждый рендер — внутри он живёт в ref, поэтому эффект не переподписывается.
 */
export function useHotkeys(map: HotkeyMap, options: UseHotkeysOptions = {}): void {
  const { enabled = true, skipInputs = true } = options;

  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  });

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (skipInputs && isEditableTarget(event.target)) return;

      for (const [combo, handler] of Object.entries(mapRef.current)) {
        if (!matches(event, parseCombo(combo))) continue;
        event.preventDefault();
        handler(event);
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, skipInputs]);
}
