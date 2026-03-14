'use client';

import { useState, useCallback, useMemo } from "react";

export interface UseListSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  /** Called when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export interface UseListSelectionReturn {
  /** Currently selected item IDs */
  selectedIds: Set<string>;
  /** Currently focused item index */
  focusedIndex: number;
  /** Anchor index for shift-selection */
  anchorIndex: number | null;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Number of selected items */
  selectionCount: number;
  /** Select a single item (clears others) */
  selectItem: (index: number) => void;
  /** Toggle selection of an item */
  toggleItem: (index: number) => void;
  /** Select all items */
  selectAll: () => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Move focus up/down, optionally extending selection with shift */
  moveFocus: (direction: "up" | "down", extendSelection?: boolean) => void;
  /** Set focus to specific index */
  setFocusedIndex: (index: number) => void;
  /** Check if an item is selected */
  isSelected: (id: string) => boolean;
  /** Check if an item is focused */
  isFocused: (index: number) => boolean;
  /** Handle keyboard events for the list */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useListSelection<T>({
  items,
  getItemId,
  onSelectionChange,
}: UseListSelectionOptions<T>): UseListSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);

  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId]);

  const updateSelection = useCallback(
    (newSelection: Set<string>) => {
      setSelectedIds(newSelection);
      onSelectionChange?.(newSelection);
    },
    [onSelectionChange]
  );

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, items.length - 1)),
    [items.length]
  );

  const selectItem = useCallback(
    (index: number) => {
      const clamped = clampIndex(index);
      const id = itemIds[clamped];
      if (id) {
        updateSelection(new Set([id]));
        setFocusedIndex(clamped);
        setAnchorIndex(clamped);
      }
    },
    [clampIndex, itemIds, updateSelection]
  );

  const toggleItem = useCallback(
    (index: number) => {
      const clamped = clampIndex(index);
      const id = itemIds[clamped];
      if (id) {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        updateSelection(newSelection);
        setFocusedIndex(clamped);
        setAnchorIndex(clamped);
      }
    },
    [clampIndex, itemIds, selectedIds, updateSelection]
  );

  const selectAll = useCallback(() => {
    updateSelection(new Set(itemIds));
  }, [itemIds, updateSelection]);

  const clearSelection = useCallback(() => {
    updateSelection(new Set());
    setAnchorIndex(null);
  }, [updateSelection]);

  const selectRange = useCallback(
    (fromIndex: number, toIndex: number) => {
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const newSelection = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        const id = itemIds[i];
        if (id) newSelection.add(id);
      }
      updateSelection(newSelection);
    },
    [itemIds, selectedIds, updateSelection]
  );

  const moveFocus = useCallback(
    (direction: "up" | "down", extendSelection = false) => {
      const delta = direction === "up" ? -1 : 1;
      const newIndex = clampIndex(focusedIndex + delta);

      if (extendSelection) {
        // Shift+Arrow: extend selection from anchor
        const anchor = anchorIndex ?? focusedIndex;
        selectRange(anchor, newIndex);
      } else {
        // Just move focus, clear selection
        setAnchorIndex(null);
      }

      setFocusedIndex(newIndex);
    },
    [anchorIndex, clampIndex, focusedIndex, selectRange]
  );

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const isFocused = useCallback(
    (index: number) => index === focusedIndex,
    [focusedIndex]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { key, shiftKey } = e;

      switch (key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          moveFocus("down", shiftKey);
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          moveFocus("up", shiftKey);
          break;
        case " ":
          // Space toggles selection on focused item
          e.preventDefault();
          toggleItem(focusedIndex);
          break;
        case "Escape":
          e.preventDefault();
          clearSelection();
          break;
      }
    },
    [moveFocus, toggleItem, focusedIndex, clearSelection]
  );

  return {
    selectedIds,
    focusedIndex,
    anchorIndex,
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size,
    selectItem,
    toggleItem,
    selectAll,
    clearSelection,
    moveFocus,
    setFocusedIndex,
    isSelected,
    isFocused,
    handleKeyDown,
  };
}
