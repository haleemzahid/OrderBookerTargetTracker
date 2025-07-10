import React from 'react';
import { Table, Space, Tag, Progress, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import { TableActions, FormatNumber } from '../../../shared/components';
import dayjs from 'dayjs';
import type { MonthlyTarget, MonthlyTargetWithOrderBooker } from '../types';

const { Text } = Typography;

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

  const columns = [
    {
      title: 'Month',
      key: 'month',
      sorter: true,
      render: (record: MonthlyTarget) => (
        <Space>
          <CalendarOutlined />
          {dayjs()
            .year(record.year)
            .month(record.month - 1)
            .format('MMM YYYY')}
        </Space>
      ),
    },
    {
      title: 'Order Booker',
      key: 'orderBooker',
      render: (record: MonthlyTargetWithOrderBooker) => <div>{record.orderBooker?.name}</div>,
    },
    {
      title: 'Target Amount',
      dataIndex: 'targetAmount',
      key: 'targetAmount',
      sorter: true,
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          <FormatNumber value={value} />
        </Text>
      ),
    },
    {
      title: 'Achieved Amount',
      dataIndex: 'achievedAmount',
      key: 'achievedAmount',
      sorter: true,
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          <FormatNumber value={value} />
        </Text>
      ),
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      sorter: true,
      render: (value: number) => (
        <Text strong style={{ color: value > 0 ? '#fa8c16' : '#52c41a' }}>
          <FormatNumber value={value} />
        </Text>
      ),
    },
    {
      title: 'Achievement',
      key: 'achievement',
      sorter: (a: MonthlyTarget, b: MonthlyTarget) =>
        a.achievementPercentage - b.achievementPercentage,
      render: (record: MonthlyTarget) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={Math.min(record.achievementPercentage, 100)}
            size="small"
            showInfo={false}
            strokeColor={
              record.achievementPercentage >= 100
                ? '#52c41a'
                : record.achievementPercentage >= 80
                  ? '#faad14'
                  : '#ff4d4f'
            }
          />
          <Text style={{ fontSize: '12px' }}>
            <FormatNumber value={record.achievementPercentage} suffix="%"></FormatNumber>
          </Text>
        </div>
      ),
    },
    {
      title: 'Daily Target',
      dataIndex: 'dailyTargetAmount',
      key: 'dailyTargetAmount',
      render: (value: number) => (
        <div>
          <Text>
            <FormatNumber value={value} />
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            per day
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: MonthlyTarget) => {
        let color = 'default';
        let text = 'Not Started';

        if (record.achievementPercentage >= 100) {
          color = 'green';
          text = 'Achieved';
        } else if (record.achievementPercentage >= 80) {
          color = 'blue';
          text = 'On Track';
        } else if (record.achievementPercentage >= 50) {
          color = 'orange';
          text = 'Behind';
        } else if (record.achievementPercentage > 0) {
          color = 'red';
          text = 'At Risk';
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: MonthlyTarget) => (
        <Space>
          <TableActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} />
        </Space>
      ),
    },
  ];

  return (
    <Table
      {...tableProps}
      columns={columns}
      loading={loading}
      rowKey="id"
      size="small"
      scroll={{ x: 1000 }}
    />
  );
};
