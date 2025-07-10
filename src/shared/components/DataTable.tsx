import { Table, TableProps } from 'antd';
import { ActionBar } from '../components/ActionBar';
import { useExport } from '../hooks';
import { ExportColumn } from '../utils/export/exportService';

interface DataTableProps<RecordType> extends Omit<TableProps<RecordType>, 'columns'> {
  columns: ExportColumn[];
  searchValue?: string;
  onSearch?: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  loading?: boolean;
  exportFileName?: string;
  exportTitle?: string;
  hideActionColumn?: boolean;
}

/**
 * DataTable component with built-in export functionality
 */
export function DataTable<RecordType extends Record<string, any>>({
  columns,
  dataSource,
  searchValue = '',
  onSearch,
  onAdd,
  addLabel = 'Add New',
  loading = false,
  exportFileName = 'data-export',
  exportTitle = 'Data Export',
  hideActionColumn = false,
  ...tableProps
}: DataTableProps<RecordType>) {
  // Use the export hook
  const { exportData, isExporting } = useExport<RecordType>({
    fileName: exportFileName,
    title: exportTitle,
  });

  // Handle export based on selected format
  const handleExport = async (format: string) => {
    if (!dataSource) return;
    
    // Get only the visible columns for export (excluding action column)
    const exportColumns = hideActionColumn 
      ? columns.filter(col => col.dataIndex !== 'actions')
      : columns;
    
    await exportData(format, dataSource as RecordType[], exportColumns);
  };

  return (
    <div>
      <ActionBar
        searchValue={searchValue}
        onSearch={onSearch}
        onAdd={onAdd}
        addLabel={addLabel}
        onExport={handleExport}
        exportLabel="Export"
        showSearch={!!onSearch}
        showAdd={!!onAdd}
        showExport={true}
      />
      
      <Table<RecordType>
        columns={columns}
        dataSource={dataSource}
        loading={loading || isExporting}
        rowKey={(record) => (record as any).id || (record as any).key || JSON.stringify(record)}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        {...tableProps}
      />
    </div>
  );
}
