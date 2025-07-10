import { Table, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import { FormatNumber, TableActions } from '../../../shared/components';
import { useExport } from '../../../shared/hooks';
import { ExportColumn } from '../../../shared/utils/export/exportService';
import dayjs from 'dayjs';
import type { MonthlyTarget, MonthlyTargetWithOrderBooker } from '../types';

interface EnhancedMonthlyTargetTableProps {
  data: MonthlyTargetWithOrderBooker[];
  loading?: boolean;
  onEdit: (monthlyTarget: MonthlyTarget) => void;
  onDelete: (monthlyTarget: MonthlyTarget) => void;
  exportFileName?: string;
  exportTitle?: string;
  year?: number;
  month?: number;
}

export const EnhancedMonthlyTargetTable: React.FC<EnhancedMonthlyTargetTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  exportFileName = 'monthly-targets',
  exportTitle = 'Monthly Targets',
  year,
  month,
}) => {
  const { tableProps } = useTable({
    data,
  });

  const { exportData, isExporting } = useExport({
    fileName: exportFileName,
    title: exportTitle,
  });

  // Define columns for display and export
  const columns = [
    {
      title: 'Month',
      dataIndex: 'monthDisplay',
      key: 'month',
      render: (_: any, record: MonthlyTargetWithOrderBooker) => (
        <Space>
          <CalendarOutlined />
          {dayjs().year(record.year).month(record.month - 1).format('MMM YYYY')}
        </Space>
      ),
    },
    {
      title: 'Order Booker',
      dataIndex: 'orderBookerName',
      key: 'orderBooker',
      render: (_: any, record: MonthlyTargetWithOrderBooker) => record.orderBooker?.name || '-',
    },
    {
      title: 'Target Amount',
      dataIndex: 'targetAmount',
      key: 'targetAmount',
      sorter: true,
      render: (value: number) => <FormatNumber value={value} />,
    },
    {
      title: 'Achieved Amount',
      dataIndex: 'achievedAmount',
      key: 'achievedAmount',
      sorter: true,
      render: (value: number) => <FormatNumber value={value} />,
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      sorter: true,
      render: (value: number) => <FormatNumber value={value} />,
    },
    {
      title: 'Achievement %',
      dataIndex: 'achievementPercentage',
      key: 'achievement',
      sorter: true,
      render: (value: number) => <FormatNumber value={value} suffix="%" />,
    },
    {
      title: 'Daily Target',
      dataIndex: 'dailyTargetAmount',
      key: 'dailyTargetAmount',
      render: (value: number) => <FormatNumber value={value} />,
    },
    {
      title: 'Status',
      dataIndex: 'statusDisplay',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: MonthlyTarget) => (
        <TableActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} />
      ),
    },
  ];

  // Create export columns without JSX elements
  const getExportColumns = (): ExportColumn[] => [
    { title: 'Month', dataIndex: 'monthDisplay' },
    { title: 'Order Booker', dataIndex: 'orderBookerName' },
    { title: 'Target Amount', dataIndex: 'targetAmount' },
    { title: 'Achieved Amount', dataIndex: 'achievedAmount' },
    { title: 'Remaining', dataIndex: 'remainingAmount' },
    { title: 'Achievement %', dataIndex: 'achievementPercentage' },
    { title: 'Daily Target', dataIndex: 'dailyTargetAmount' },
    { title: 'Status', dataIndex: 'statusDisplay' },
  ];

  const handleExport = async (format: string) => {
    await exportData(format, data, getExportColumns());
  };

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Space>
          <button 
            className="ant-btn ant-btn-default"
            onClick={() => handleExport('excel')}
            disabled={isExporting || !data.length}
          >
            Export to Excel
          </button>
          <button 
            className="ant-btn ant-btn-default"
            onClick={() => handleExport('pdf')}
            disabled={isExporting || !data.length}
          >
            Export to PDF
          </button>
          <button 
            className="ant-btn ant-btn-default"
            onClick={() => handleExport('word')}
            disabled={isExporting || !data.length}
          >
            Export to Word
          </button>
        </Space>
      </div>
      
      <Table
        {...tableProps}
        columns={columns}
        dataSource={data}
        loading={loading || isExporting}
        rowKey="id"
        size="small"
        scroll={{ x: 1000 }}
      />
    </div>
  );
};
