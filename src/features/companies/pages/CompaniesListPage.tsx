import React, { useState } from 'react';
import { Modal, message, Space, Button } from 'antd';
import { useCompanies } from '../hooks/queries';
import { useDeleteCompany } from '../api/mutations';
import { CompanyTable } from '../components/company-table';
import { CompanyForm } from '../components/CompanyForm';
import { ActionBar, ListPageLayout, GuidedTour } from '../../../shared/components';
import { useExport } from '../../../shared/hooks';
import { ExportColumn } from '../../../shared/utils/export/exportService';
import type { Company } from '../types';
import type { TourProps } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

export const CompaniesListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchText, setSearchText] = useState('');
  const [tourOpen, setTourOpen] = useState(false);


  // Set up export functionality
  const exportFileName = 'companies';
  const exportTitle = 'Companies';

  const { exportData, isExporting } = useExport({
    fileName: exportFileName,
    title: exportTitle,
  });

  const {
    data: companies,
    isLoading,
    error,
  } = useCompanies({
    search: searchText,
  });
  const deleteMutation = useDeleteCompany();

  const handleAdd = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = async (company: Company) => {
    Modal.confirm({
      title: 'Delete Company',
      content: `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(company.id);
          message.success('Company deleted successfully');
        } catch (error) {
          message.error('Failed to delete company');
        }
      },
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    message.success(
      editingCompany ? 'Company updated successfully' : 'Company created successfully'
    );
  };

  // Export functionality
  const getExportColumns = (): ExportColumn[] => [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Address', dataIndex: 'address' },
    { 
      title: 'Created At', 
      dataIndex: 'createdAt', 
      render: (value) => value ? new Date(value).toLocaleDateString() : '-' 
    },
  ];

  const handleExport = async (format: string) => {
    await exportData(format, companies || [], getExportColumns());
  };

  // // Define tour steps
  // const steps: TourProps['steps'] = [
  //   {
  //     title: 'Companies Management',
  //     description: 'This page helps you manage all your company records.',
  //     target: () => document.querySelector('.ant-layout-content') as HTMLElement,
  //   },
  //   {
  //     title: 'Search Companies',
  //     description: 'Type here to search for companies by name, email, phone, or address.',
  //     target: () => document.querySelector('.ant-input-search') as HTMLElement,
  //   },
  //   {
  //     title: 'Add New Company',
  //     description: 'Click here to add a new company to your system.',
  //     target: () => document.querySelector('.ant-btn-primary') as HTMLElement,
  //   },
  //   {
  //     title: 'Export Data',
  //     description: 'Click here to export your company data to Excel or PDF format.',
  //     target: () => document.querySelector('[data-tour="export-button"]') as HTMLElement,
  //   },
  //   {
  //     title: 'Company Table',
  //     description: 'This table displays all your companies with their key information.',
  //     target: () => document.querySelector('.ant-table-wrapper') as HTMLElement,
  //   },
  //   {
  //     title: 'Edit or Delete',
  //     description: 'Use these actions to edit company details or remove companies from your system.',
  //     target: () => document.querySelector('.ant-table-cell:last-child .ant-space') as HTMLElement,
  //   },
  // ];

  if (error) {
    return <div>Error loading companies</div>;
  }

  return (
    <ListPageLayout
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          Companies
          <Button 
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={() => setTourOpen(true)}
            style={{ marginLeft: 8 }}
          />
        </div>
      }
      extraActions={
        <ActionBar
          onSearch={setSearchText}
          searchValue={searchText}
          searchPlaceholder="Search companies..."
          onAdd={handleAdd}
          addLabel="Add Company"
          onExport={handleExport}
          exportButtonProps={{ 'data-tour': 'export-button' }}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <CompanyTable
          data={companies || []}
          loading={isLoading || isExporting}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Space>

      <Modal
        title={editingCompany ? 'Edit Company' : 'Add Company'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <CompanyForm
          initialData={editingCompany}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>

      {/* <GuidedTour
        steps={steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        tourKey="companies-page"
      /> */}
    </ListPageLayout>
  );
};
