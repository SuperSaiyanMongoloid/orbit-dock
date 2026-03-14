'use client';

import { useState, useCallback, useMemo } from "react";

export interface SectionGroup<T> {
  id: string;
  label: string;
  items: T[];
}

export interface UseListSelectionOptions<T> {
  /** Items grouped by section */
  groups: SectionGroup<T>[];
  /** Extract unique ID from item */
  getItemId: (item: T) => string;
  /** Called when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export type FocusTarget =
  | { type: "section"; sectionIndex: number }
  | { type: "item"; sectionIndex: number; itemIndex: number };

export interface UseListSelectionReturn<T> {
  /** Currently selected item IDs */
  selectedIds: Set<string>;
  /** Current focus target (section or item) */
  focusTarget: FocusTarget;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Number of selected items */
  selectionCount: number;
  /** All flat items for reference */
  allItems: T[];
  /** Get items in a section */
  getSectionItems: (sectionIndex: number) => T[];
  /** Get IDs of items in a section */
  getSectionItemIds: (sectionIndex: number) => string[];
  /** Check if entire section is selected */
  isSectionFullySelected: (sectionIndex: number) => boolean;
  /** Check if all items are selected */
  isAllSelected: () => boolean;
  /** Select items in current section (first Shift+A) */
  selectCurrentSection: () => void;
  /** Select all items (second Shift+A) */
  selectAll: () => void;
  /** Hierarchical select (Shift+A behavior) */
  hierarchicalSelect: () => void;
  /** Toggle selection of a single item */
  toggleItem: (sectionIndex: number, itemIndex: number) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Set focus to a specific target */
  setFocus: (target: FocusTarget) => void;
  /** Set focus to an item and clear selection (for click behavior) */
  focusItemOnly: (sectionIndex: number, itemIndex: number) => void;
  /** Check if an item is selected */
  isSelected: (id: string) => boolean;
  /** Check if focus is on a specific section */
  isSectionFocused: (sectionIndex: number) => boolean;
  /** Check if focus is on a specific item */
  isItemFocused: (sectionIndex: number, itemIndex: number) => boolean;
  /** Get the focused item (if focus is on an item) */
  getFocusedItem: () => T | null;
  /** Handle keyboard navigation */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Move focus in a direction */
  moveFocus: (direction: "up" | "down", extendSelection?: boolean) => void;
}

export function useListSelection<T>({
  groups,
  getItemId,
  onSelectionChange,
}: UseListSelectionOptions<T>): UseListSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusTarget, setFocusTarget] = useState<FocusTarget>({ type: "section", sectionIndex: 0 });
  const [anchorTarget, setAnchorTarget] = useState<FocusTarget | null>(null);

  // Memoize all items flat list
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const allItemIds = useMemo(() => allItems.map(getItemId), [allItems, getItemId]);

  const getSectionItems = useCallback(
    (sectionIndex: number) => groups[sectionIndex]?.items ?? [],
    [groups]
  );

  const getSectionItemIds = useCallback(
    (sectionIndex: number) => getSectionItems(sectionIndex).map(getItemId),
    [getSectionItems, getItemId]
  );

  const updateSelection = useCallback(
    (newSelection: Set<string>) => {
      setSelectedIds(newSelection);
      onSelectionChange?.(newSelection);
    },
    [onSelectionChange]
  );

  // Check if entire section is selected
  const isSectionFullySelected = useCallback(
    (sectionIndex: number) => {
      const sectionIds = getSectionItemIds(sectionIndex);
      if (sectionIds.length === 0) return false;
      return sectionIds.every((id) => selectedIds.has(id));
    },
    [getSectionItemIds, selectedIds]
  );

  // Check if all items are selected
  const isAllSelected = useCallback(() => {
    if (allItemIds.length === 0) return false;
    return allItemIds.every((id) => selectedIds.has(id));
  }, [allItemIds, selectedIds]);

  // Select all items in current section
  const selectCurrentSection = useCallback(() => {
    const sectionIndex = focusTarget.sectionIndex;
    const sectionIds = getSectionItemIds(sectionIndex);
    const newSelection = new Set(selectedIds);
    sectionIds.forEach((id) => newSelection.add(id));
    updateSelection(newSelection);
  }, [focusTarget.sectionIndex, getSectionItemIds, selectedIds, updateSelection]);

  // Select all items
  const selectAll = useCallback(() => {
    updateSelection(new Set(allItemIds));
  }, [allItemIds, updateSelection]);

  // Hierarchical Shift+A behavior
  const hierarchicalSelect = useCallback(() => {
    const sectionIndex = focusTarget.sectionIndex;
    
    // If current section is not fully selected, select the section
    if (!isSectionFullySelected(sectionIndex)) {
      selectCurrentSection();
      return;
    }
    
    // If section is selected but not all items, select all
    if (!isAllSelected()) {
      selectAll();
      return;
    }
    
    // All already selected - do nothing or toggle off (keeping selected for now)
  }, [focusTarget.sectionIndex, isSectionFullySelected, isAllSelected, selectCurrentSection, selectAll]);

  // Toggle single item
  const toggleItem = useCallback(
    (sectionIndex: number, itemIndex: number) => {
      const item = groups[sectionIndex]?.items[itemIndex];
      if (!item) return;
      
      const id = getItemId(item);
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      updateSelection(newSelection);
      setFocusTarget({ type: "item", sectionIndex, itemIndex });
      setAnchorTarget({ type: "item", sectionIndex, itemIndex });
    },
    [groups, getItemId, selectedIds, updateSelection]
  );

  const clearSelection = useCallback(() => {
    updateSelection(new Set());
    setAnchorTarget(null);
  }, [updateSelection]);

  const setFocus = useCallback((target: FocusTarget) => {
    setFocusTarget(target);
  }, []);

  // Set focus to item and clear any existing selection (for click behavior)
  const focusItemOnly = useCallback(
    (sectionIndex: number, itemIndex: number) => {
      setFocusTarget({ type: "item", sectionIndex, itemIndex });
      setAnchorTarget({ type: "item", sectionIndex, itemIndex });
      updateSelection(new Set());
    },
    [updateSelection]
  );

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const isSectionFocused = useCallback(
    (sectionIndex: number) =>
      focusTarget.type === "section" && focusTarget.sectionIndex === sectionIndex,
    [focusTarget]
  );

  const isItemFocused = useCallback(
    (sectionIndex: number, itemIndex: number) =>
      focusTarget.type === "item" &&
      focusTarget.sectionIndex === sectionIndex &&
      focusTarget.itemIndex === itemIndex,
    [focusTarget]
  );

  const getFocusedItem = useCallback((): T | null => {
    if (focusTarget.type !== "item") return null;
    return groups[focusTarget.sectionIndex]?.items[focusTarget.itemIndex] ?? null;
  }, [focusTarget, groups]);

  // Compute linear index for an item (for range selection)
  const getLinearIndex = useCallback(
    (target: FocusTarget): number => {
      if (target.type === "section") return -1; // Sections don't have linear indices
      let index = 0;
      for (let s = 0; s < target.sectionIndex; s++) {
        index += groups[s]?.items.length ?? 0;
      }
      return index + target.itemIndex;
    },
    [groups]
  );

  // Select range of items between two linear indices
  const selectRange = useCallback(
    (fromTarget: FocusTarget, toTarget: FocusTarget) => {
      if (fromTarget.type === "section" || toTarget.type === "section") return;
      
      const fromLinear = getLinearIndex(fromTarget);
      const toLinear = getLinearIndex(toTarget);
      const start = Math.min(fromLinear, toLinear);
      const end = Math.max(fromLinear, toLinear);
      
      const newSelection = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        const id = allItemIds[i];
        if (id) newSelection.add(id);
      }
      updateSelection(newSelection);
    },
    [getLinearIndex, selectedIds, allItemIds, updateSelection]
  );

  // Move focus with navigation hierarchy
  const moveFocus = useCallback(
    (direction: "up" | "down", extendSelection = false) => {
      const { type, sectionIndex } = focusTarget;

      if (type === "section") {
        if (direction === "down") {
          // From section header, move to first item in section
          const sectionItems = groups[sectionIndex]?.items ?? [];
          if (sectionItems.length > 0) {
            const newTarget: FocusTarget = { type: "item", sectionIndex, itemIndex: 0 };
            setFocusTarget(newTarget);
            if (extendSelection && anchorTarget?.type === "item") {
              selectRange(anchorTarget, newTarget);
            } else if (!extendSelection) {
              setAnchorTarget(newTarget);
            }
          } else if (sectionIndex < groups.length - 1) {
            // Empty section, move to next section header
            setFocusTarget({ type: "section", sectionIndex: sectionIndex + 1 });
          }
        } else {
          // Up from section header goes to last item of previous section
          if (sectionIndex > 0) {
            const prevSectionItems = groups[sectionIndex - 1]?.items ?? [];
            if (prevSectionItems.length > 0) {
              const newTarget: FocusTarget = {
                type: "item",
                sectionIndex: sectionIndex - 1,
                itemIndex: prevSectionItems.length - 1,
              };
              setFocusTarget(newTarget);
              if (extendSelection && anchorTarget?.type === "item") {
                selectRange(anchorTarget, newTarget);
              }
            } else {
              setFocusTarget({ type: "section", sectionIndex: sectionIndex - 1 });
            }
          }
        }
      } else {
        // Focus is on an item
        const { itemIndex } = focusTarget;
        const sectionItems = groups[sectionIndex]?.items ?? [];

        if (direction === "down") {
          if (itemIndex < sectionItems.length - 1) {
            // Move to next item in section
            const newTarget: FocusTarget = { type: "item", sectionIndex, itemIndex: itemIndex + 1 };
            setFocusTarget(newTarget);
            if (extendSelection) {
              const anchor = anchorTarget ?? focusTarget;
              if (anchor.type === "item") selectRange(anchor, newTarget);
            } else {
              setAnchorTarget(newTarget);
            }
          } else if (sectionIndex < groups.length - 1) {
            // Move to next section header
            setFocusTarget({ type: "section", sectionIndex: sectionIndex + 1 });
          }
        } else {
          if (itemIndex > 0) {
            // Move to previous item in section
            const newTarget: FocusTarget = { type: "item", sectionIndex, itemIndex: itemIndex - 1 };
            setFocusTarget(newTarget);
            if (extendSelection) {
              const anchor = anchorTarget ?? focusTarget;
              if (anchor.type === "item") selectRange(anchor, newTarget);
            } else {
              setAnchorTarget(newTarget);
            }
          } else {
            // Move to section header
            setFocusTarget({ type: "section", sectionIndex });
          }
        }
      }
    },
    [focusTarget, groups, anchorTarget, selectRange]
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
        case "Tab":
          e.preventDefault();
          if (shiftKey) {
            moveFocus("up", false);
          } else {
            moveFocus("down", false);
          }
          break;
        case " ":
          // Space toggles selection on focused item
          e.preventDefault();
          if (focusTarget.type === "item") {
            toggleItem(focusTarget.sectionIndex, focusTarget.itemIndex);
          }
          break;
        case "Escape":
          e.preventDefault();
          clearSelection();
          break;
      }
    },
    [moveFocus, toggleItem, focusTarget, clearSelection]
  );

  return {
    selectedIds,
    focusTarget,
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size,
    allItems,
    getSectionItems,
    getSectionItemIds,
    isSectionFullySelected,
    isAllSelected,
    selectCurrentSection,
    selectAll,
    hierarchicalSelect,
    toggleItem,
    clearSelection,
    setFocus,
    focusItemOnly,
    isSelected,
    isSectionFocused,
    isItemFocused,
    getFocusedItem,
    handleKeyDown,
    moveFocus,
  };
}
