import React, { useState } from 'react';
import { Card, Typography, Space, Button, DatePicker } from 'antd';
import { PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { useStockTransactions } from '../api/queries';
import { StockTransactionsTable } from '../components/stock-transactions-table';
import { StockAdjustmentForm } from '../components/stock-adjustment-form';
import type { StockFilterOptions } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const StockTransactions: React.FC = () => {
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [filters, setFilters] = useState<StockFilterOptions>({});
  
  const { data: transactions, isLoading, refetch } = useStockTransactions(filters);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters(prev => ({
        ...prev,
        dateFrom: dates[0].toDate(),
        dateTo: dates[1].toDate(),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        dateFrom: undefined,
        dateTo: undefined,
      }));
    }
  };

  const handleAdjustmentSuccess = () => {
    refetch();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Stock Transactions</Title>
        <Text type="secondary">
          View and track all stock movements and adjustments
        </Text>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              onChange={handleDateRangeChange}
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </Space>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAdjustmentModalVisible(true)}
          >
            New Adjustment
          </Button>
        </Space>
      </Card>

      {/* Transactions Table */}
      <Card>
        <StockTransactionsTable
          data={transactions || []}
          loading={isLoading}
          productFilter={true}
        />
      </Card>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentForm
        visible={adjustmentModalVisible}
        onClose={() => setAdjustmentModalVisible(false)}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
};
