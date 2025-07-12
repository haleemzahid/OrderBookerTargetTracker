import React from 'react';
import { DatePicker, Space, Button } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import type { DateFilterProps } from '../types';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export const DateFilter: React.FC<DateFilterProps> = ({
  value,
  onChange,
  loading = false,
}) => {
  // Convert date range to dayjs for RangePicker
  const dateRange: [Dayjs, Dayjs] | null = value?.fromDate && value?.toDate 
    ? [dayjs(value.fromDate), dayjs(value.toDate)]
    : null;

  // Default to current month if no value is provided
  const defaultDateRange: [Dayjs, Dayjs] = [
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ];

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onChange({
        fromDate: dates[0].toDate(),
        toDate: dates[1].toDate(),
      });
    } else {
      onChange({});
    }
  };

  const handleClear = () => {
    onChange({});
  };

  const handleSetCurrentMonth = () => {
    onChange({
      fromDate: defaultDateRange[0].toDate(),
      toDate: defaultDateRange[1].toDate(),
    });
  };

  return (
    <Space.Compact>
      <RangePicker
        placeholder={['From Date', 'To Date']}
        value={dateRange}
        onChange={handleDateRangeChange}
        format="DD/MM/YYYY"
        disabled={loading}
        allowClear={true}
        style={{ width: 280 }}
      />
      <Button
        icon={<ClearOutlined />}
        onClick={handleClear}
        disabled={loading || (!value?.fromDate && !value?.toDate)}
        title="Clear dates"
      />
      <Button
        onClick={handleSetCurrentMonth}
        disabled={loading}
        type="default"
        size="small"
      >
        This Month
      </Button>
    </Space.Compact>
  );
};
