import { useState, useMemo } from 'react';
import type { TableProps } from 'antd';

interface UseTableOptions<T> {
  data: T[];
  pageSize?: number;
  searchableFields?: (keyof T)[];
}

export function useTable<T extends Record<string, any>>({
  data,
  pageSize = 10,
  searchableFields = [],
}: UseTableOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    
    return data.filter((item) =>
      searchableFields.some((field) =>
        String(item[field]).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [data, searchText, searchableFields]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  const tableProps: TableProps<T> = {
    dataSource: paginatedData,
    pagination: {
      current: currentPage,
      pageSize,
      total: filteredData.length,
      onChange: setCurrentPage,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    },
    onChange: (_, __, sorter) => {
      if (Array.isArray(sorter)) return;
      setSortField(sorter.field as keyof T);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    },
  };

  return {
    tableProps,
    searchText,
    setSearchText,
    currentPage,
    setCurrentPage,
    filteredData,
    totalItems: filteredData.length,
  };
}
