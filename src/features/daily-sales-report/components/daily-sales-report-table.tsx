import React from 'react';
import { Table, Typography, Tooltip, Tag } from 'antd';
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
      ellipsis: false,
      render: (text: string) => (
        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {text}
        </div>
      ),
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
      
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => (
        <span style={{ color: '#8c8c8c' }}>
          <FormatNumber value={price} prefix="Rs. " decimalPlaces={0} />
        </span>
      ),
      sorter: (a, b) => a.costPrice - b.costPrice,
      
    },
    {
      title: 'Total Cartons',
      dataIndex: 'totalCartons',
      key: 'totalCartons',
      render: (cartons: number) => (
        <FormatNumber value={cartons} decimalPlaces={2} />
      ),
      sorter: (a, b) => a.totalCartons - b.totalCartons,
      
    },
    {
      title: 'Return Cartons',
      dataIndex: 'returnCartons',
      key: 'returnCartons',
      render: (cartons: number) => (
        <span style={{ color: cartons > 0 ? '#ff7875' : '#8c8c8c' }}>
          <FormatNumber value={cartons} decimalPlaces={2} />
        </span>
      ),
      sorter: (a, b) => a.returnCartons - b.returnCartons,
      
    },
    {
      title: 'Net Cartons',
      dataIndex: 'netCartons',
      key: 'netCartons',
      render: (cartons: number) => (
        <Text strong>
          <FormatNumber value={cartons} decimalPlaces={2} />
        </Text>
      ),
      sorter: (a, b) => a.netCartons - b.netCartons,
      
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <FormatNumber value={amount} prefix="Rs. " />
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      
    },
    {
      title: 'Return Amount',
      dataIndex: 'returnAmount',
      key: 'returnAmount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff7875' : '#8c8c8c' }}>
          <FormatNumber value={amount} prefix="Rs. " />
        </span>
      ),
      sorter: (a, b) => a.returnAmount - b.returnAmount,
      
    },
    {
      title: 'Net Amount',
      dataIndex: 'netAmount',
      key: 'netAmount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          <FormatNumber value={amount} prefix="Rs. " />
        </Text>
      ),
      sorter: (a, b) => a.netAmount - b.netAmount,
      
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit: number, record) => (
        <Tooltip title={`Profit Margin: ${record.profitMargin.toFixed(1)}%`}>
          <span style={{ 
            color: profit >= 0 ? '#52c41a' : '#ff7875',
            fontWeight: 'bold'
          }}>
            <FormatNumber value={profit} prefix="Rs. " />
          </span>
        </Tooltip>
      ),
      sorter: (a, b) => a.profit - b.profit,
      
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data || []}
      loading={loading}
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
                <FormatNumber value={summary.totalCartons} decimalPlaces={2} />
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <span style={{ color: summary.totalReturnCartons > 0 ? '#ff7875' : '#8c8c8c' }}>
                  <FormatNumber value={summary.totalReturnCartons} decimalPlaces={2} />
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <Text strong>
                  <FormatNumber value={summary.totalNetCartons} decimalPlaces={2} />
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                <FormatNumber value={summary.totalAmount} prefix="Rs. " decimalPlaces={0} />
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <span style={{ color: summary.totalReturnAmount > 0 ? '#ff7875' : '#8c8c8c' }}>
                  <FormatNumber value={summary.totalReturnAmount} prefix="Rs. " decimalPlaces={0} />
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8}>
                <Text strong style={{ color: '#1890ff' }}>
                  <FormatNumber value={summary.totalNetAmount} prefix="Rs. " decimalPlaces={0} />
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9}>
                <Tooltip title={`Overall Profit Margin: ${summary.overallProfitMargin.toFixed(1)}%`}>
                  <span style={{ 
                    color: summary.totalProfit >= 0 ? '#52c41a' : '#ff7875',
                    fontWeight: 'bold'
                  }}>
                    <FormatNumber value={summary.totalProfit} prefix="Rs. " decimalPlaces={0} />
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
