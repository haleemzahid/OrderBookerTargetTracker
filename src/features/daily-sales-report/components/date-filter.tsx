import React, { useState } from 'react';
import { DatePicker, Space, Segmented } from 'antd';
import type { DateFilterProps } from '../types';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export const DateFilter: React.FC<DateFilterProps> = ({ value, onChange, loading = false }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);

  // Segmented control options
  const periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Prev Week', value: 'prevWeek' },
    { label: 'This Month', value: 'thisMonth' },
  ];

  const dateRange: [Dayjs, Dayjs] | null =
    value?.fromDate && value?.toDate ? [dayjs(value.fromDate), dayjs(value.toDate)] : null;

  const getDateRange = (period: string): [Dayjs, Dayjs] => {
    switch (period) {
      case 'today':
        return [dayjs().startOf('day'), dayjs().endOf('day')];
      case 'yesterday':
        return [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')];
      case 'thisWeek':
        return [dayjs().startOf('week'), dayjs().endOf('week')];
      case 'prevWeek':
        return [
          dayjs().subtract(1, 'week').startOf('week'),
          dayjs().subtract(1, 'week').endOf('week'),
        ];
      case 'thisMonth':
        return [dayjs().startOf('month'), dayjs().endOf('month')];
      default:
        return [dayjs().startOf('day'), dayjs().endOf('day')];
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onChange({
        fromDate: dates[0].toDate(),
        toDate: dates[1].toDate(),
      });
      setSelectedPeriod(undefined);
    } else {
      onChange({});
      setSelectedPeriod(undefined);
    }
  };

  const handlePeriodChange = (period: string) => {
    const [fromDate, toDate] = getDateRange(period);
    onChange({
      fromDate: fromDate.toDate(),
      toDate: toDate.toDate(),
    });
    setSelectedPeriod(period);
  };

  return (
    <Space direction="horizontal" size="small">
      <RangePicker
        placeholder={['From Date', 'To Date']}
        value={dateRange}
        onChange={handleDateRangeChange}
        format="DD/MM/YYYY"
        disabled={loading}
        allowClear={true}
        style={{ width: 280 }}
      />
      <Segmented
        options={periodOptions}
        value={selectedPeriod}
        onChange={handlePeriodChange}
        disabled={loading}
      />
    </Space>
  );
};
