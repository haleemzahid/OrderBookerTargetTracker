import { Table, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import { FormatNumber, TableActions } from '../../../shared/components';
import dayjs from 'dayjs';
import type { MonthlyTarget, MonthlyTargetWithOrderBooker } from '../types';

interface MonthlyTargetTableProps {
  data: MonthlyTargetWithOrderBooker[];
  loading?: boolean;
  onEdit: (monthlyTarget: MonthlyTarget) => void;
  onDelete: (monthlyTarget: MonthlyTarget) => void;
}

export const MonthlyTargetTable: React.FC<MonthlyTargetTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
}) => {
  const { tableProps } = useTable({
    data,
  });

  // Define columns for display
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

  return (
    <Table
        {...tableProps}
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        size="small"
        scroll={{ x: 1000 }}
      />
  );
};
