import React from 'react';
import { Table, Typography, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DailySalesReportTableProps, DailySalesReportItem } from '../types';
import { FormatNumber } from '../../../shared/components';

const { Text } = Typography;

export const DailySalesReportTable: React.FC<DailySalesReportTableProps> = ({
  data,
  loading,
  summary,
}) => {
  const columns: ColumnsType<DailySalesReportItem> = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      sorter: (a, b) => a.productName.localeCompare(b.productName),
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Sale Price',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      render: (price: number) => (
        <Tag color="blue">
          <FormatNumber value={price} prefix="Rs. " decimalPlaces={2} />
        </Tag>
      ),
      sorter: (a, b) => a.sellPrice - b.sellPrice,
      width: 120,
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => (
        <span style={{ color: '#8c8c8c' }}>
          <FormatNumber value={price} prefix="Rs. " decimalPlaces={2} />
        </span>
      ),
      sorter: (a, b) => a.costPrice - b.costPrice,
      width: 120,
    },
    {
      title: 'Total Cartons',
      dataIndex: 'totalCartons',
      key: 'totalCartons',
      render: (cartons: number) => (
        <FormatNumber value={cartons} decimalPlaces={1} />
      ),
      sorter: (a, b) => a.totalCartons - b.totalCartons,
      width: 120,
    },
    {
      title: 'Return Cartons',
      dataIndex: 'returnCartons',
      key: 'returnCartons',
      render: (cartons: number) => (
        <span style={{ color: cartons > 0 ? '#ff7875' : '#8c8c8c' }}>
          <FormatNumber value={cartons} decimalPlaces={1} />
        </span>
      ),
      sorter: (a, b) => a.returnCartons - b.returnCartons,
      width: 120,
    },
    {
      title: 'Net Cartons',
      dataIndex: 'netCartons',
      key: 'netCartons',
      render: (cartons: number) => (
        <Text strong>
          <FormatNumber value={cartons} decimalPlaces={1} />
        </Text>
      ),
      sorter: (a, b) => a.netCartons - b.netCartons,
      width: 120,
    },
    {
      title: 'Return Amount',
      dataIndex: 'returnAmount',
      key: 'returnAmount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff7875' : '#8c8c8c' }}>
          <FormatNumber value={amount} prefix="Rs. " decimalPlaces={2} />
        </span>
      ),
      sorter: (a, b) => a.returnAmount - b.returnAmount,
      width: 140,
    },
    {
      title: 'Net Amount',
      dataIndex: 'netAmount',
      key: 'netAmount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          <FormatNumber value={amount} prefix="Rs. " decimalPlaces={2} />
        </Text>
      ),
      sorter: (a, b) => a.netAmount - b.netAmount,
      width: 140,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <FormatNumber value={amount} prefix="Rs. " decimalPlaces={2} />
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      width: 140,
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit: number, record) => (
        <Tooltip title={`Profit Margin: ${record.profitMargin.toFixed(2)}%`}>
          <span style={{ 
            color: profit >= 0 ? '#52c41a' : '#ff7875',
            fontWeight: 'bold'
          }}>
            <FormatNumber value={profit} prefix="Rs. " decimalPlaces={2} />
          </span>
        </Tooltip>
      ),
      sorter: (a, b) => a.profit - b.profit,
      width: 140,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data || []}
      loading={loading}
      scroll={{ x: 1400 }}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        pageSize: 50,
        pageSizeOptions: ['25', '50', '100', '200'],
      }}
      rowKey={(record) => `${record.productId}-${record.sellPrice}`}
      size="small"
      summary={() => {
        if (!summary || !data?.length) return null;
        
        return (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
              <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
              <Table.Summary.Cell index={1}></Table.Summary.Cell>
              <Table.Summary.Cell index={2}></Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <FormatNumber value={summary.totalCartons} decimalPlaces={1} />
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <span style={{ color: summary.totalReturnCartons > 0 ? '#ff7875' : '#8c8c8c' }}>
                  <FormatNumber value={summary.totalReturnCartons} decimalPlaces={1} />
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <Text strong>
                  <FormatNumber value={summary.totalNetCartons} decimalPlaces={1} />
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                <span style={{ color: summary.totalReturnAmount > 0 ? '#ff7875' : '#8c8c8c' }}>
                  <FormatNumber value={summary.totalReturnAmount} prefix="Rs. " decimalPlaces={2} />
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <Text strong style={{ color: '#1890ff' }}>
                  <FormatNumber value={summary.totalNetAmount} prefix="Rs. " decimalPlaces={2} />
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8}>
                <FormatNumber value={summary.totalAmount} prefix="Rs. " decimalPlaces={2} />
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9}>
                <Tooltip title={`Overall Profit Margin: ${summary.overallProfitMargin.toFixed(2)}%`}>
                  <span style={{ 
                    color: summary.totalProfit >= 0 ? '#52c41a' : '#ff7875',
                    fontWeight: 'bold'
                  }}>
                    <FormatNumber value={summary.totalProfit} prefix="Rs. " decimalPlaces={2} />
                  </span>
                </Tooltip>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        );
      }}
    />
  );
};
