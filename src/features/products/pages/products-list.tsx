import React, { useState, useMemo } from 'react';
import { Modal, message, Space, Select } from 'antd';
import { useProducts } from '../api/queries';
import { useDeleteProduct } from '../api/mutations';
import { useCompanies } from '../../companies/hooks/queries';
import { ProductTable } from '../components/product-table';
import { ProductForm } from '../components/product-form';
import { ActionBar, ListPageLayout } from '../../../shared/components';
import { useExport } from '../../../shared/hooks';
import { ExportColumn } from '../../../shared/utils/export/exportService';
import type { Product } from '../types';

const { Option } = Select;

interface FilterState {
  companyId?: string;
}

export const ProductsListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    companyId: undefined,
  });

  // Load companies data
  const { data: companies, isLoading: isLoadingCompanies } = useCompanies();

  // Set up export functionality
  const exportFileName = 'products';
  const exportTitle = 'Products';

  const { exportData, isExporting } = useExport({
    fileName: exportFileName,
    title: exportTitle,
  });

  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    searchTerm: searchText,
    companyId: filters.companyId,
  });
  const deleteMutation = useDeleteProduct();

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteMutation.mutateAsync(product.id);
      message.success('Product deleted successfully');
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!products) return [];
    return products;
  }, [products]);

  const handleCompanyFilter = (companyId?: string) => {
    setFilters((prev) => ({ ...prev, companyId }));
  };

  // Export functionality
  const getExportColumns = (): ExportColumn[] => [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Company ID', dataIndex: 'companyId' },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Sell Price',
      dataIndex: 'sellPrice',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Profit Margin',
      dataIndex: 'sellPrice',
      render: (_, record) => {
        const margin = record.sellPrice - record.costPrice;
        const marginPercentage = (margin / record.costPrice) * 100;
        return `Rs. ${margin.toLocaleString()} (${marginPercentage.toFixed(2)}%)`;
      },
    },
    { title: 'Units/Carton', dataIndex: 'unitPerCarton' },
  ];

  const handleExport = async (format: string) => {
    await exportData(format, filteredData, getExportColumns());
  };

  if (error) {
    return <div>Error loading products</div>;
  }

  const renderExtraActions = () => {
    return (
      <Space size="small">
        <Select
          placeholder="Filter by Company"
          value={filters.companyId}
          onChange={handleCompanyFilter}
          style={{ width: 180 }}
          allowClear
          loading={isLoadingCompanies}
        >
          <Option value={undefined}>All Companies</Option>
          {companies?.map(company => (
            <Option key={company.id} value={company.id}>{company.name}</Option>
          ))}
        </Select>
      </Space>
    );
  };

  return (
    <ListPageLayout
      title="Products"
      extraActions={
        <ActionBar
          onSearch={setSearchText}
          searchValue={searchText}
          searchPlaceholder="Search products..."
          onAdd={handleAdd}
          addLabel="Add Product"
          onExport={handleExport}
          extraActions={renderExtraActions()}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <ProductTable
          data={filteredData}
          loading={isLoading || isExporting}
          onEdit={handleEdit}
          onDelete={handleDelete}
          companyFilter={false}
        />
      </Space>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <ProductForm
          product={editingProduct || undefined}
          onCancel={handleModalClose}
          onSuccess={handleModalClose}
        />
      </Modal>
    </ListPageLayout>
  );
};
