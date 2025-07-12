import React, { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Card, Button, Space, Tooltip } from 'antd';
import { 
  DragOutlined, 
  SettingOutlined, 
  EyeInvisibleOutlined,
  ReloadOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { useDashboardGrid } from '../hooks/use-dashboard-grid';
import type { DashboardWidget } from '../types';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Create ResponsiveGridLayout at module level (this is safe and recommended)
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

const WidgetWrapper: React.FC<WidgetWrapperProps> = React.memo(({
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
});

WidgetWrapper.displayName = 'WidgetWrapper';

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  onWidgetConfig,
  renderWidget
}) => {
  const { 
    visibleWidgets, 
    layouts, 
    gridConfig, 
    handleLayoutChange, 
    handleWidgetHide 
  } = useDashboardGrid();

  const handleWidgetRefresh = useCallback((widgetId: string) => {
    console.log(`Refreshing widget: ${widgetId}`);
  }, []);

  const renderedChildren = useMemo(() => 
    visibleWidgets.map(widget => (
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
    ))
  , [visibleWidgets, onWidgetConfig, handleWidgetHide, handleWidgetRefresh, renderWidget]);

  return (
    <div className="dashboard-grid">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={gridConfig.breakpoints}
        cols={gridConfig.cols}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={gridConfig.margin}
        containerPadding={gridConfig.containerPadding}
        draggableHandle=".drag-handle"
        useCSSTransforms={true}
        measureBeforeMount={false}
        compactType={null}
        preventCollision={false}
        allowOverlap={false}
        rowHeight={60}
      >
        {renderedChildren}
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
