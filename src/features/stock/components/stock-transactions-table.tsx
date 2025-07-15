import React, { useState } from 'react';
import { Table, Tag, Space, Input, Select, DatePicker, Button, Tooltip } from 'antd';
import { SearchOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { StockTransaction, StockTransactionsTableProps, StockFilterOptions } from '../types';
import { useProducts } from '../../products/api/queries';
import dayjs from 'dayjs';

const { Option } = Select;

export const StockTransactionsTable: React.FC<StockTransactionsTableProps> = ({
  data,
  loading,
  productFilter = true
}) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<StockFilterOptions>({});
  
  const { data: products } = useProducts();

  const getTransactionTypeColor = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'IN':
        return 'green';
      case 'OUT':
        return 'red';
      case 'ADJUSTMENT':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getReasonColor = (reason: StockTransaction['reason']) => {
    switch (reason) {
      case 'PURCHASE':
        return 'blue';
      case 'SALE':
        return 'green';
      case 'EXPIRED':
        return 'red';
      case 'DAMAGED':
        return 'volcano';
      case 'LOST':
        return 'magenta';
      case 'OTHER':
        return 'default';
      default:
        return 'default';
    }
  };

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Date/Time',
      'Product',
      'Transaction Type',
      'Quantity',
      'Reason',
      'Reference',
      'Purchase Cost',
      'Comments'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(transaction => [
        transaction.createdAt.toISOString(),
        `"${getProductName(transaction.productId)}"`,
        transaction.transactionType,
        transaction.quantity,
        transaction.reason,
        transaction.referenceId || '',
        transaction.purchaseCost || '',
        `"${transaction.comments || ''}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock-transactions-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = data.filter(transaction => {
    const productName = getProductName(transaction.productId).toLowerCase();
    const matchesSearch = !searchText || 
      productName.includes(searchText.toLowerCase()) ||
      transaction.comments?.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.reason.toLowerCase().includes(searchText.toLowerCase());

    const matchesProductFilter = !filters.productId || transaction.productId === filters.productId;
    const matchesTypeFilter = !filters.transactionType || transaction.transactionType === filters.transactionType;
    const matchesReasonFilter = !filters.reason || transaction.reason === filters.reason;

    return matchesSearch && matchesProductFilter && matchesTypeFilter && matchesReasonFilter;
  });

  const columns: ColumnsType<StockTransaction> = [
    {
      title: 'Date/Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: Date) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(date).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    ...(productFilter ? [{
      title: 'Product',
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
      render: (productId: string) => (
        <span>{getProductName(productId)}</span>
      ),
      sorter: (a: StockTransaction, b: StockTransaction) => getProductName(a.productId).localeCompare(getProductName(b.productId)),
    }] : []),
    {
      title: 'Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 100,
      render: (type: StockTransaction['transactionType']) => (
        <Tag color={getTransactionTypeColor(type)}>
          {type}
        </Tag>
      ),
      filters: [
        { text: 'IN', value: 'IN' },
        { text: 'OUT', value: 'OUT' },
        { text: 'ADJUSTMENT', value: 'ADJUSTMENT' },
      ],
      onFilter: (value, record) => record.transactionType === value,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number, record) => (
        <span style={{ 
          color: record.transactionType === 'IN' ? '#52c41a' : 
                 record.transactionType === 'OUT' ? '#ff4d4f' : '#fa8c16',
          fontWeight: 'bold'
        }}>
          {record.transactionType === 'OUT' || 
           (record.transactionType === 'ADJUSTMENT' && ['EXPIRED', 'DAMAGED', 'LOST'].includes(record.reason))
            ? `-${quantity}` : `+${quantity}`}
        </span>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 120,
      render: (reason: StockTransaction['reason']) => (
        <Tag color={getReasonColor(reason)}>
          {reason}
        </Tag>
      ),
      filters: [
        { text: 'Purchase', value: 'PURCHASE' },
        { text: 'Sale', value: 'SALE' },
        { text: 'Expired', value: 'EXPIRED' },
        { text: 'Damaged', value: 'DAMAGED' },
        { text: 'Lost', value: 'LOST' },
        { text: 'Other', value: 'OTHER' },
      ],
      onFilter: (value, record) => record.reason === value,
    },
    {
      title: 'Purchase Cost',
      dataIndex: 'purchaseCost',
      key: 'purchaseCost',
      width: 120,
      render: (cost: number | undefined) => (
        cost ? (
          <span style={{ color: '#1890ff' }}>
            Rs. {cost.toFixed(2)}
          </span>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        )
      ),
      sorter: (a, b) => (a.purchaseCost || 0) - (b.purchaseCost || 0),
    },
    {
      title: 'Comments',
      dataIndex: 'comments',
      key: 'comments',
      ellipsis: true,
      render: (comments: string | undefined) => (
        comments ? (
          <Tooltip title={comments}>
            <span>{comments}</span>
          </Tooltip>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        )
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search transactions..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          
          {productFilter && (
            <Select
              placeholder="Filter by product"
              style={{ width: 200 }}
              allowClear
              value={filters.productId}
              onChange={(value) => setFilters(prev => ({ ...prev, productId: value }))}
            >
              {products?.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name}
                </Option>
              ))}
            </Select>
          )}
          
          <Select
            placeholder="Filter by type"
            style={{ width: 150 }}
            allowClear
            value={filters.transactionType}
            onChange={(value) => setFilters(prev => ({ ...prev, transactionType: value }))}
          >
            <Option value="IN">IN</Option>
            <Option value="OUT">OUT</Option>
            <Option value="ADJUSTMENT">ADJUSTMENT</Option>
          </Select>
          
          <Select
            placeholder="Filter by reason"
            style={{ width: 150 }}
            allowClear
            value={filters.reason}
            onChange={(value) => setFilters(prev => ({ ...prev, reason: value }))}
          >
            <Option value="PURCHASE">Purchase</Option>
            <Option value="SALE">Sale</Option>
            <Option value="EXPIRED">Expired</Option>
            <Option value="DAMAGED">Damaged</Option>
            <Option value="LOST">Lost</Option>
            <Option value="OTHER">Other</Option>
          </Select>
          
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={filteredData.length === 0}
          >
            Export CSV
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('');
              setFilters({});
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} transactions`,
        }}
        size="small"
      />
    </div>
  );
};
