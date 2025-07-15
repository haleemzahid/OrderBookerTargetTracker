import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Statistic, 
  Button, 
  Input, 
  Space, 
  Alert,
  Spin,
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  DownloadOutlined, 
  SearchOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStockOverview, useStockSummary } from '../api/queries';
import { StockAdjustmentForm } from '../components/stock-adjustment-form';
import { StockLevelIndicator } from '../components/stock-level-indicator';
import type { ProductStock } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Title, Text } = Typography;

export const StockOverview: React.FC = () => {
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  
  const { data: stockOverview, isLoading, refetch } = useStockOverview();
  const { data: stockSummary, isLoading: summaryLoading } = useStockSummary();

  const handleQuickAdjustment = (productId: string) => {
    setSelectedProductId(productId);
    setAdjustmentModalVisible(true);
  };

  const handleAdjustmentSuccess = () => {
    refetch();
  };

  const handleExport = () => {
    if (!stockOverview) return;

    const headers = [
      'Product Name',
      'Current Stock',
      'Low Stock Threshold',
      'Stock Status',
      'Last Updated'
    ];
    
    const csvContent = [
      headers.join(','),
      ...stockOverview.map(item => [
        `"${item.productName}"`,
        item.currentStock,
        item.lowStockThreshold,
        item.stockStatus,
        item.lastUpdated.toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock-overview-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = stockOverview?.filter(item =>
    item.productName.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  const lowStockItems = filteredData.filter(item => item.isLowStock && item.currentStock > 0);
  const outOfStockItems = filteredData.filter(item => item.currentStock <= 0);

  const columns: ColumnsType<ProductStock> = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      sorter: (a, b) => a.productName.localeCompare(b.productName),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 150,
      render: (currentStock: number, record) => (
        <StockLevelIndicator
          currentStock={currentStock}
          lowStockThreshold={record.lowStockThreshold}
          showText={true}
        />
      ),
      sorter: (a, b) => a.currentStock - b.currentStock,
    },
    {
      title: 'Low Stock Threshold',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      width: 150,
      render: (threshold: number) => <Text>{threshold}</Text>,
      sorter: (a, b) => a.lowStockThreshold - b.lowStockThreshold,
    },
    {
      title: 'Stock Status',
      dataIndex: 'stockStatus',
      key: 'stockStatus',
      width: 120,
      filters: [
        { text: 'In Stock', value: 'IN_STOCK' },
        { text: 'Low Stock', value: 'LOW_STOCK' },
        { text: 'Out of Stock', value: 'OUT_OF_STOCK' },
      ],
      onFilter: (value, record) => record.stockStatus === value,
      render: (status: string) => {
        const config = {
          'IN_STOCK': { text: 'In Stock', color: '#52c41a' },
          'LOW_STOCK': { text: 'Low Stock', color: '#faad14' },
          'OUT_OF_STOCK': { text: 'Out of Stock', color: '#ff4d4f' },
        }[status] || { text: status, color: '#666' };
        
        return <Text style={{ color: config.color, fontWeight: 'bold' }}>{config.text}</Text>;
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 150,
      render: (date: Date) => (
        <Text type="secondary">
          {dayjs(date).format('MMM DD, YYYY HH:mm')}
        </Text>
      ),
      sorter: (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleQuickAdjustment(record.productId)}
        >
          Adjust
        </Button>
      ),
    },
  ];

  if (isLoading || summaryLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Stock Overview</Title>
        <Text type="secondary">
          Monitor your inventory levels and manage stock adjustments
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={stockSummary?.totalProducts || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="In Stock"
              value={stockSummary?.inStockCount || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stockSummary?.lowStockCount || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stockSummary?.outOfStockCount || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {outOfStockItems.length > 0 && (
        <Alert
          message={`${outOfStockItems.length} product${outOfStockItems.length !== 1 ? 's' : ''} out of stock`}
          description="These products need immediate restocking"
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {lowStockItems.length > 0 && (
        <Alert
          message={`${lowStockItems.length} product${lowStockItems.length !== 1 ? 's' : ''} running low on stock`}
          description="Consider restocking these products soon"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAdjustmentModalVisible(true)}
            >
              Stock Adjustment
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={!stockOverview || stockOverview.length === 0}
            >
              Export CSV
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Stock Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="productId"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} products`,
          }}
          scroll={{ x: 800 }}
          rowClassName={(record) => {
            if (record.currentStock <= 0) return 'stock-out-row';
            if (record.isLowStock) return 'stock-low-row';
            return '';
          }}
        />
      </Card>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentForm
        visible={adjustmentModalVisible}
        onClose={() => {
          setAdjustmentModalVisible(false);
          setSelectedProductId(undefined);
        }}
        onSuccess={handleAdjustmentSuccess}
        initialProductId={selectedProductId}
      />
    </div>
  );
};
