import React, { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Card, Button, Space, Tooltip } from 'antd';
import { 
  DragOutlined, 
  SettingOutlined, 
  EyeInvisibleOutlined,
  ReloadOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { useDashboardStore, useDashboardActions, useVisibleWidgets } from '../stores/dashboard-store';
import type { DashboardWidget, DashboardLayout } from '../types';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  onWidgetConfig?: (widget: DashboardWidget) => void;
  renderWidget: (widget: DashboardWidget) => React.ReactNode;
}

interface WidgetWrapperProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  onConfig?: (widget: DashboardWidget) => void;
  onHide: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  widget,
  children,
  onConfig,
  onHide,
  onRefresh
}) => {
  const handleConfig = useCallback(() => {
    onConfig?.(widget);
  }, [onConfig, widget]);

  const handleHide = useCallback(() => {
    onHide(widget.id);
  }, [onHide, widget.id]);

  const handleRefresh = useCallback(() => {
    onRefresh?.(widget.id);
  }, [onRefresh, widget.id]);

  return (
    <Card
      title={
        <Space>
          <DragOutlined className="drag-handle" style={{ cursor: 'grab' }} />
          <span>{widget.title}</span>
        </Space>
      }
      extra={
        <Space>
          {onRefresh && (
            <Tooltip title="Refresh">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              />
            </Tooltip>
          )}
          {onConfig && (
            <Tooltip title="Configure">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={handleConfig}
              />
            </Tooltip>
          )}
          <Tooltip title="Hide Widget">
            <Button
              type="text"
              size="small"
              icon={<EyeInvisibleOutlined />}
              onClick={handleHide}
            />
          </Tooltip>
          <Tooltip title="Drag to move">
            <Button
              type="text"
              size="small"
              icon={<FullscreenOutlined />}
              className="drag-handle"
              style={{ cursor: 'grab' }}
            />
          </Tooltip>
        </Space>
      }
      size="small"
      style={{ 
        height: '100%',
        borderColor: widget.priority === 'critical' ? '#ff4d4f' : 
                    widget.priority === 'high' ? '#fa8c16' : '#d9d9d9'
      }}
      bodyStyle={{ 
        height: 'calc(100% - 57px)', 
        overflow: 'auto',
        padding: '12px'
      }}
    >
      {children}
    </Card>
  );
};

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  onWidgetConfig,
  renderWidget
}) => {
  const layout = useDashboardStore(state => state.layout);
  const visibleWidgets = useVisibleWidgets();
  const { updateWidgetPosition, setWidgetVisibility, saveLayout } = useDashboardActions();

  // Convert widgets to grid layouts
  const layouts = useMemo(() => {
    const createLayout = (widgets: DashboardWidget[]) => 
      widgets
        .filter(widget => widget.isVisible)
        .map(widget => ({
          i: widget.id,
          x: widget.position.x,
          y: widget.position.y,
          w: widget.position.w,
          h: widget.position.h,
          minW: 2,
          minH: 2,
          maxW: 12,
          maxH: 10
        }));

    return {
      lg: createLayout(visibleWidgets),
      md: createLayout(visibleWidgets),
      sm: createLayout(visibleWidgets)
    };
  }, [visibleWidgets]);

  // Handle layout changes from drag and resize
  const handleLayoutChange = useCallback((newLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // Update widget positions in store
    newLayout.forEach(layoutItem => {
      const widget = visibleWidgets.find(w => w.id === layoutItem.i);
      if (widget) {
        const newPosition = {
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
        
        // Only update if position actually changed
        if (
          widget.position.x !== newPosition.x ||
          widget.position.y !== newPosition.y ||
          widget.position.w !== newPosition.w ||
          widget.position.h !== newPosition.h
        ) {
          updateWidgetPosition(widget.id, newPosition);
        }
      }
    });

    // Save the updated layout with proper typing
    const updatedLayout: DashboardLayout = {
      ...layout,
      layouts: {
        lg: allLayouts.lg?.map(item => ({ x: item.x, y: item.y, w: item.w, h: item.h })) || layout.layouts.lg,
        md: allLayouts.md?.map(item => ({ x: item.x, y: item.y, w: item.w, h: item.h })) || layout.layouts.md,
        sm: allLayouts.sm?.map(item => ({ x: item.x, y: item.y, w: item.w, h: item.h })) || layout.layouts.sm
      },
      lastModified: new Date()
    };
    saveLayout(updatedLayout);
  }, [visibleWidgets, updateWidgetPosition, saveLayout, layout]);

  // Handle widget hiding
  const handleWidgetHide = useCallback((widgetId: string) => {
    setWidgetVisibility(widgetId, false);
  }, [setWidgetVisibility]);

  // Handle widget refresh (placeholder for now)
  const handleWidgetRefresh = useCallback((widgetId: string) => {
    console.log(`Refreshing widget: ${widgetId}`);
    // This will trigger individual widget refresh in the future
  }, []);

  // Breakpoints for responsive design (desktop only)
  const breakpoints = { lg: 1200, md: 996, sm: 768 };
  const cols = { lg: 12, md: 10, sm: 6 };

  return (
    <div className="dashboard-grid">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        draggableHandle=".drag-handle"
        useCSSTransforms={true}
        measureBeforeMount={false}
        compactType="vertical"
        preventCollision={false}
      >
        {visibleWidgets.map(widget => (
          <div key={widget.id} data-grid={widget.position}>
            <WidgetWrapper
              widget={widget}
              onConfig={onWidgetConfig}
              onHide={handleWidgetHide}
              onRefresh={handleWidgetRefresh}
            >
              {renderWidget(widget)}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>

      <style dangerouslySetInnerHTML={{
        __html: `
          .dashboard-grid {
            width: 100%;
            min-height: 100vh;
            background-color: #f5f5f5;
          }
          
          .layout {
            width: 100%;
          }
          
          .react-grid-item {
            transition: all 200ms ease;
            transition-property: left, top;
          }
          
          .react-grid-item.cssTransforms {
            transition-property: transform;
          }
          
          .react-grid-item.resizing {
            transition: none;
            z-index: 1;
          }
          
          .react-grid-item.react-draggable-dragging {
            transition: none;
            z-index: 3;
          }
          
          .react-grid-placeholder {
            background: #1890ff;
            opacity: 0.2;
            transition-duration: 100ms;
            z-index: 2;
            border-radius: 6px;
          }
          
          .drag-handle {
            cursor: grab !important;
          }
          
          .drag-handle:active {
            cursor: grabbing !important;
          }
          
          /* Hide drag handle on small widgets */
          .react-grid-item[data-grid*='"w":2'] .drag-handle:last-child {
            display: none;
          }
          
          /* Priority-based styling */
          .ant-card-bordered[style*="border-color: rgb(255, 77, 79)"] {
            box-shadow: 0 2px 8px rgba(255, 77, 79, 0.15);
          }
          
          .ant-card-bordered[style*="border-color: rgb(250, 140, 22)"] {
            box-shadow: 0 2px 8px rgba(250, 140, 22, 0.15);
          }
        `
      }} />
    </div>
  );
};

export default DashboardGrid;
