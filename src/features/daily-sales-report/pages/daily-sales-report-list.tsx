import React, { useState, useMemo } from 'react';
import { Space } from 'antd';
import { useDailySalesReport, useDailySalesReportSummary } from '../api/queries';
import { DailySalesReportTable } from '../components/daily-sales-report-table';
import { DateFilter } from '../components/date-filter';
import { ActionBar, ListPageLayout } from '../../../shared/components';
import { useExport } from '../../../shared/hooks';
import { ExportColumn } from '../../../shared/utils/export/exportService';
import type { DailySalesReportFilters, DailySalesReportItem } from '../types';
import dayjs from 'dayjs';

export const DailySalesReportListPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<DailySalesReportFilters>({
    fromDate: dayjs().startOf('day').toDate(),
    toDate: dayjs().endOf('day').toDate(),
  });

  // Set up export functionality
  const exportFileName = 'daily-sales-report';
  const exportTitle = 'Daily Sales Report (DSR)';

  const { exportData, isExporting } = useExport({
    fileName: exportFileName,
    title: exportTitle,
  });

  // Load data
  const {
    data: reportData,
    isLoading,
  } = useDailySalesReport(filters);

  const {
    data: summary,
  } = useDailySalesReportSummary(filters);

  // Filter data based on search text
  const filteredData = useMemo(() => {
    if (!reportData) return [];
    if (!searchText.trim()) return reportData;

    const searchLower = searchText.toLowerCase();
    return reportData.filter(item =>
      item.productName.toLowerCase().includes(searchLower)
    );
  }, [reportData, searchText]);

  const handleDateFilterChange = (newFilters: DailySalesReportFilters) => {
    setFilters(newFilters);
  };

  // Export functionality
  const getExportColumns = (): ExportColumn[] => [
    { title: 'Product Name', dataIndex: 'productName' },
    {
      title: 'Sale Price',
      dataIndex: 'sellPrice',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    { title: 'Total Cartons', dataIndex: 'totalCartons' },
    { title: 'Return Cartons', dataIndex: 'returnCartons' },
    { title: 'Net Cartons', dataIndex: 'netCartons' },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Return Amount',
      dataIndex: 'returnAmount',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Net Amount',
      dataIndex: 'netAmount',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Profit Margin (%)',
      dataIndex: 'profitMargin',
      render: (value) => `${value.toFixed(2)}%`,
    },
  ];

  const handleExport = async (format: string) => {
    const exportItems = filteredData || [];
    
    // Add summary row to export data
    const exportDataWithSummary = summary ? [
      ...exportItems,
      {
        productName: 'TOTAL',
        sellPrice: 0,
        costPrice: 0,
        totalCartons: summary.totalCartons,
        returnCartons: summary.totalReturnCartons,
        netCartons: summary.totalNetCartons,
        totalAmount: summary.totalAmount,
        returnAmount: summary.totalReturnAmount,
        netAmount: summary.totalNetAmount,
        profit: summary.totalProfit,
        profitMargin: summary.overallProfitMargin,
      } as DailySalesReportItem
    ] : exportItems;

    await exportData(format, exportDataWithSummary, getExportColumns());
  };

  const renderExtraActions = () => (
    <Space wrap>
      <DateFilter
        value={filters}
        onChange={handleDateFilterChange}
        loading={isLoading}
      />
    </Space>
  );

  return (
    <ListPageLayout
      title="DSR"
      extraActions={
        <ActionBar
          onSearch={setSearchText}
          searchValue={searchText}
          searchPlaceholder="Search products..."
          onExport={handleExport}
          exportLabel="Export DSR"
          showAdd={false}
          extraActions={renderExtraActions()}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <DailySalesReportTable
          data={filteredData}
          loading={isLoading || isExporting}
          summary={summary}
        />
      </Space>
    </ListPageLayout>
  );
};
