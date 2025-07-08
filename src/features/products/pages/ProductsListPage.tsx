import React, { useState } from 'react';
import { Card, Button, Table, Space, Input, message, Modal, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useProductsWithCompany } from '../hooks/queries';
import { useDeleteProduct } from '../api/mutations';
import { useCompanies } from '../../companies/hooks/queries';
import { ProductForm } from '../components/ProductForm';
import { formatRupees } from '../../../shared/utils/currency';
import type { ProductWithCompany } from '../types';

const { Search } = Input;
const { Option } = Select;

export const ProductsListPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCompany | null>(null);

  const { data: products, isLoading } = useProductsWithCompany({ 
    search: searchText,
    companyIds: selectedCompanyIds.length > 0 ? selectedCompanyIds : undefined,
  });
  const { data: companies } = useCompanies();
  const deleteMutation = useDeleteProduct();

  const handleEdit = (product: ProductWithCompany) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (product: ProductWithCompany) => {
    Modal.confirm({
      title: 'Delete Product',
      content: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(product.id);
          message.success('Product deleted successfully');
        } catch (error) {
          message.error('Failed to delete product');
        }
      },
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const columns: ColumnsType<ProductWithCompany> = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Company',
      dataIndex: ['company', 'name'],
      key: 'companyName',
      sorter: (a, b) => a.company.name.localeCompare(b.company.name),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => formatRupees(price),
      sorter: (a, b) => a.costPrice - b.costPrice,
    },
    {
      title: 'Sell Price',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      render: (price: number) => formatRupees(price),
      sorter: (a, b) => a.sellPrice - b.sellPrice,
    },
    {
      title: 'Units per Carton',
      dataIndex: 'unitPerCarton',
      key: 'unitPerCarton',
      sorter: (a, b) => a.unitPerCarton - b.unitPerCarton,
    },
    {
      title: 'Margin',
      key: 'margin',
      render: (_, record) => {
        const margin = record.sellPrice - record.costPrice;
        const marginPercent = record.costPrice > 0 ? (margin / record.costPrice) * 100 : 0;
        return (
          <div>
            <div>{formatRupees(margin)}</div>
            <small style={{ color: margin >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {marginPercent.toFixed(1)}%
            </small>
          </div>
        );
      },
      sorter: (a, b) => (a.sellPrice - a.costPrice) - (b.sellPrice - b.costPrice),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => date.toLocaleDateString(),
      sorter: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Products Management">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <Space>
              <Search
                placeholder="Search products..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={setSearchText}
                onChange={(e) => {
                  if (!e.target.value) {
                    setSearchText('');
                  }
                }}
                style={{ width: 300 }}
              />
              <Select
                mode="multiple"
                placeholder="Filter by company"
                style={{ width: 250 }}
                value={selectedCompanyIds}
                onChange={setSelectedCompanyIds}
                allowClear
              >
                {companies?.map(company => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setIsModalOpen(true)}
            >
              Add Product
            </Button>
          </div>

          <Table
            dataSource={products}
            columns={columns}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} products`,
            }}
          />
        </Space>
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={700}
      >
        <ProductForm
          initialData={editingProduct}
          onSuccess={handleModalClose}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};
