import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DashboardStore,
  DashboardWidget,
  GlobalDashboardFilters,
  DashboardLayout,
  DashboardTemplate
} from '../types';

// Default filter values
const defaultFilters: GlobalDashboardFilters = {
  dateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    end: new Date() // Today
  },
  orderBookerIds: undefined,
  productIds: undefined,
  companyIds: undefined
};

// Default widget configurations with priority-based positioning
const defaultWidgets: DashboardWidget[] = [
  {
    id: 'revenue-performance',
    title: 'Revenue Performance',
    type: 'metric',
    size: 'large',
    position: { x: 0, y: 0, w: 3, h: 2 },
    isVisible: true,
    refreshInterval: 1800000, // 30 minutes
    priority: 'critical'
  },
  {
    id: 'profit-margin',
    title: 'Profit Margin',
    type: 'gauge',
    size: 'medium',
    position: { x: 3, y: 0, w: 3, h: 2 },
    isVisible: true,
    refreshInterval: 1800000, // 30 minutes
    priority: 'critical'
  },
  {
    id: 'alert-center',
    title: 'Alert Center',
    type: 'alert',
    size: 'medium',
    position: { x: 6, y: 0, w: 3, h: 2 },
    isVisible: true,
    refreshInterval: 300000, // 5 minutes
    priority: 'critical'
  },
  {
    id: 'target-progress',
    title: 'Target Achievement Progress',
    type: 'progress',
    size: 'large',
    position: { x: 9, y: 0, w: 3, h: 2 },
    isVisible: true,
    refreshInterval: 900000, // 15 minutes
    priority: 'high'
  },
  {
    id: 'top-performers',
    title: 'Top Performers',
    type: 'table',
    size: 'medium',
    position: { x: 0, y: 2, w: 6, h: 3 },
    isVisible: true,
    refreshInterval: 900000, // 15 minutes
    priority: 'high'
  },
  {
    id: 'sales-trend',
    title: 'Sales Trend',
    type: 'chart',
    size: 'large',
    position: { x: 6, y: 2, w: 6, h: 3 },
    isVisible: true,
    refreshInterval: 1800000, // 30 minutes
    priority: 'high'
  },
  {
    id: 'return-rate',
    title: 'Return Rate Monitor',
    type: 'metric',
    size: 'medium',
    position: { x: 0, y: 5, w: 4, h: 2 },
    isVisible: true,
    refreshInterval: 900000, // 15 minutes
    priority: 'medium'
  },
  // Optional widgets (hidden by default)
  {
    id: 'product-performance',
    title: 'Product Performance Matrix',
    type: 'chart',
    size: 'large',
    position: { x: 4, y: 5, w: 8, h: 3 },
    isVisible: false,
    refreshInterval: 3600000, // 60 minutes
    priority: 'low'
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Summary',
    type: 'metric',
    size: 'medium',
    position: { x: 0, y: 8, w: 4, h: 2 },
    isVisible: false,
    refreshInterval: 1800000, // 30 minutes
    priority: 'low'
  },
  {
    id: 'order-velocity',
    title: 'Order Velocity',
    type: 'metric',
    size: 'medium',
    position: { x: 4, y: 8, w: 4, h: 2 },
    isVisible: false,
    refreshInterval: 1800000, // 30 minutes
    priority: 'low'
  }
];

// Simplified default layout - just responsive grid configurations
const defaultLayout: DashboardLayout = {
  layouts: {
    lg: defaultWidgets.map(w => ({ ...w.position, i: w.id })),
    md: defaultWidgets.map(w => ({
      ...w.position,
      i: w.id,
      w: Math.max(2, Math.floor(w.position.w * 0.8)),
      h: Math.max(2, Math.floor(w.position.h * 0.9))
    })),
    sm: defaultWidgets.map(w => ({
      ...w.position,
      i: w.id,
      w: Math.max(2, Math.floor(w.position.w * 0.6)),
      h: Math.max(2, Math.floor(w.position.h * 0.8))
    }))
  },
  widgets: [], // Remove duplicate storage
  lastModified: new Date()
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      // Initial state
      filters: defaultFilters,
      widgets: defaultWidgets,
      layout: defaultLayout,
      isLoading: false,
      lastRefresh: null,

      // Filter actions
      setFilters: (newFilters: Partial<GlobalDashboardFilters>) => {
        set((state) => ({
          filters: {
            ...state.filters,
            ...newFilters
          }
        }));
      },

      // Widget management actions
      setWidgetVisibility: (widgetId: string, isVisible: boolean) => {
        set((state) => {
          const updatedWidgets = state.widgets.map(widget =>
            widget.id === widgetId ? { ...widget, isVisible } : widget
          );
          
          return {
            widgets: updatedWidgets,
            layout: {
              ...state.layout,
              lastModified: new Date()
            }
          };
        });
      },

      updateWidgetPosition: (widgetId: string, position: DashboardWidget['position']) => {
        set((state) => {
          // Check if position actually changed to prevent unnecessary updates
          const existingWidget = state.widgets.find(w => w.id === widgetId);
          if (existingWidget && 
              existingWidget.position.x === position.x &&
              existingWidget.position.y === position.y &&
              existingWidget.position.w === position.w &&
              existingWidget.position.h === position.h) {
            return state; // No change, return current state
          }

          const updatedWidgets = state.widgets.map(widget =>
            widget.id === widgetId ? { ...widget, position } : widget
          );

          return {
            widgets: updatedWidgets,
            layout: {
              ...state.layout,
              lastModified: new Date()
            }
          };
        });
      },

      updateWidgetConfig: (widgetId: string, config: Record<string, any>) => {
        set((state) => ({
          widgets: state.widgets.map(widget =>
            widget.id === widgetId ? { ...widget, config: { ...widget.config, ...config } } : widget
          ),
          layout: {
            ...state.layout,
            lastModified: new Date()
          }
        }));
      },

      // Layout management
      saveLayout: (layout: DashboardLayout) => {
        set(() => ({
          layout: {
            ...layout,
            lastModified: new Date()
          }
        }));
      },

      loadTemplate: (template: DashboardTemplate) => {
        set(() => ({
          widgets: template.widgets,
          layout: {
            layouts: {
              lg: template.widgets.map(w => ({ ...w.position, i: w.id })),
              md: template.widgets.map(w => ({
                ...w.position,
                i: w.id,
                w: Math.max(2, Math.floor(w.position.w * 0.8)),
                h: Math.max(2, Math.floor(w.position.h * 0.9))
              })),
              sm: template.widgets.map(w => ({
                ...w.position,
                i: w.id,
                w: Math.max(2, Math.floor(w.position.w * 0.6)),
                h: Math.max(2, Math.floor(w.position.h * 0.8))
              }))
            },
            widgets: [], // Simplified - no duplicate storage
            lastModified: new Date()
          }
        }));
      },

      resetToDefault: () => {
        // Clear persisted data to force reload of default configuration
        localStorage.removeItem('dashboard-store');
        set(() => ({
          filters: defaultFilters,
          widgets: defaultWidgets,
          layout: defaultLayout,
          isLoading: false,
          lastRefresh: null
        }));
      },

      // Global refresh action
      refreshAll: () => {
        set(() => ({
          lastRefresh: new Date()
        }));
      }
    }),
    {
      name: 'dashboard-store',
      // Only persist layout and widget configurations, not filters or loading state
      partialize: (state) => ({
        widgets: state.widgets,
        layout: state.layout
      }),
      // Migrate old stored data if structure changes
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic for version 0 to 1
          return {
            ...persistedState,
            layout: defaultLayout,
            widgets: defaultWidgets
          };
        }
        return persistedState;
      }
    }
  )
);

// Optimized selector hooks - return raw data for components to memoize
export const useDashboardFilters = () => useDashboardStore(state => state.filters);
export const useDashboardWidgets = () => useDashboardStore(state => state.widgets);
export const useDashboardLayout = () => useDashboardStore(state => state.layout);

// These will be memoized in the consuming components
export const useVisibleWidgets = () => useDashboardStore(state => state.widgets);
export const useCriticalWidgets = () => useDashboardStore(state => state.widgets);

// Individual action hooks to prevent object recreation and infinite re-renders
export const useSetFilters = () => useDashboardStore(state => state.setFilters);
export const useSetWidgetVisibility = () => useDashboardStore(state => state.setWidgetVisibility);
export const useUpdateWidgetPosition = () => useDashboardStore(state => state.updateWidgetPosition);
export const useUpdateWidgetConfig = () => useDashboardStore(state => state.updateWidgetConfig);
export const useSaveLayout = () => useDashboardStore(state => state.saveLayout);
export const useLoadTemplate = () => useDashboardStore(state => state.loadTemplate);
export const useResetToDefault = () => useDashboardStore(state => state.resetToDefault);
export const useRefreshAll = () => useDashboardStore(state => state.refreshAll);

// Backward compatibility - but use individual hooks above to prevent re-renders
export const useDashboardActions = () => ({
  setFilters: useSetFilters(),
  setWidgetVisibility: useSetWidgetVisibility(),
  updateWidgetPosition: useUpdateWidgetPosition(),
  updateWidgetConfig: useUpdateWidgetConfig(),
  saveLayout: useSaveLayout(),
  loadTemplate: useLoadTemplate(),
  resetToDefault: useResetToDefault(),
  refreshAll: useRefreshAll()
});
