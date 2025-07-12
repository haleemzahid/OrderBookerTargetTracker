import { useMemo, useCallback } from 'react';
import { Layout } from 'react-grid-layout';
import { 
  useVisibleWidgets, 
  useUpdateWidgetPosition, 
  useSetWidgetVisibility 
} from '../stores/dashboard-store';
import type { DashboardWidget } from '../types';

/**
 * Custom hook for managing dashboard grid layout
 * Follows React Grid Layout best practices and prevents infinite loops
 */
export const useDashboardGrid = () => {
  const allWidgets = useVisibleWidgets();
  const updateWidgetPosition = useUpdateWidgetPosition();
  const setWidgetVisibility = useSetWidgetVisibility();

  // Memoize visible widgets to prevent unnecessary re-renders
  const visibleWidgets = useMemo(() => 
    allWidgets.filter(widget => widget.isVisible),
    [allWidgets]
  );

  // Convert widgets to grid layouts - memoized to prevent recreation
  const layouts = useMemo(() => {
    const createLayout = (widgets: DashboardWidget[], scaleFactor = 1) => 
      widgets.map(widget => ({
        i: widget.id,
        x: Math.floor(widget.position.x * scaleFactor),
        y: widget.position.y,
        w: Math.max(1, Math.floor(widget.position.w * scaleFactor)),
        h: widget.position.h,
        minW: 1,
        minH: 2,
        maxW: 12,
        maxH: 6
      }));

    return {
      lg: createLayout(visibleWidgets, 1),      // 12 columns
      md: createLayout(visibleWidgets, 0.83),   // 10 columns
      sm: createLayout(visibleWidgets, 0.5)     // 6 columns
    };
  }, [visibleWidgets]);

  // Handle layout changes from drag and resize - prevent infinite loops
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    // Use requestAnimationFrame to batch updates and prevent infinite loops
    requestAnimationFrame(() => {
      // Check if there are actual changes
      const hasChanges = newLayout.some(layoutItem => {
        const widget = visibleWidgets.find(w => w.id === layoutItem.i);
        return widget && (
          widget.position.x !== layoutItem.x ||
          widget.position.y !== layoutItem.y ||
          widget.position.w !== layoutItem.w ||
          widget.position.h !== layoutItem.h
        );
      });

      if (!hasChanges) {
        return; // Exit early if no actual changes
      }

      // Update each widget position
      newLayout.forEach(layoutItem => {
        const widget = visibleWidgets.find(w => w.id === layoutItem.i);
        if (widget) {
          const newPosition = {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          };
          updateWidgetPosition(widget.id, newPosition);
        }
      });
    });
  }, [visibleWidgets, updateWidgetPosition]);

  // Handle widget hiding
  const handleWidgetHide = useCallback((widgetId: string) => {
    setWidgetVisibility(widgetId, false);
  }, [setWidgetVisibility]);

  // Static configuration to prevent unnecessary re-renders
  const gridConfig = useMemo(() => ({
    breakpoints: { lg: 1200, md: 996, sm: 768 },
    cols: { lg: 12, md: 10, sm: 6 },
    margin: [12, 12] as [number, number],
    containerPadding: [16, 16] as [number, number]
  }), []);

  return {
    visibleWidgets,
    layouts,
    gridConfig,
    handleLayoutChange,
    handleWidgetHide
  };
};
