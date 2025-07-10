import { useState } from 'react';
import { useProducts } from '../api/queries';
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '../api/mutations';
import { message } from 'antd';
import type { Product, ProductFilterOptions } from '../types';

export const useProductsManagement = (initialFilters?: ProductFilterOptions) => {
  const [filters, setFilters] = useState<ProductFilterOptions>(initialFilters || {});
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const { data: products, isLoading, error } = useProducts(filters);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  };
  
  const handleCompanyFilter = (companyId?: string) => {
    setFilters(prev => ({ ...prev, companyId }));
  };
  
  const handleSort = (sortBy: string, sortOrder: 'ascend' | 'descend') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };
  
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalVisible(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalVisible(true);
  };
  
  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Product deleted successfully');
      
      // Remove from selection if selected
      if (selectedProductIds.includes(id)) {
        setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
      }
    } catch (error) {
      message.error('Failed to delete product');
      console.error(error);
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedProductIds.length === 0) return;
    
    try {
      await Promise.all(selectedProductIds.map(id => deleteMutation.mutateAsync(id)));
      message.success(`${selectedProductIds.length} products deleted successfully`);
      setSelectedProductIds([]);
    } catch (error) {
      message.error('Failed to delete some products');
      console.error(error);
    }
  };
  
  const handleSubmit = async (values: any) => {
    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          data: {
            name: values.name,
            costPrice: values.costPrice,
            sellPrice: values.sellPrice,
            unitPerCarton: values.unitPerCarton
          }
        });
        message.success('Product updated successfully');
      } else {
        await createMutation.mutateAsync({
          companyId: values.companyId,
          name: values.name,
          costPrice: values.costPrice,
          sellPrice: values.sellPrice,
          unitPerCarton: values.unitPerCarton
        });
        message.success('Product created successfully');
      }
      setIsModalVisible(false);
    } catch (error) {
      message.error('Operation failed');
      console.error(error);
    }
  };
  
  return {
    products,
    isLoading,
    error,
    filters,
    selectedProductIds,
    editingProduct,
    isModalVisible,
    setSelectedProductIds,
    setIsModalVisible,
    handleSearch,
    handleCompanyFilter,
    handleSort,
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleBatchDelete,
    handleSubmit,
  };
};
