// Customer List Filters Component
// Advanced filtering for Pakistani wholesale business context

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  Slider,
  Switch,
  Button,
  Space,
  Card
} from 'antd';
import {
  FilterOutlined,
  ClearOutlined} from '@ant-design/icons';
import { CustomerFilters } from '..';

const { Option } = Select;
const { RangePicker } = DatePicker;



interface CustomerListFiltersProps {
  visible: boolean;
  onClose: () => void;
  onFiltersChange: (filters: CustomerFilters) => void;
  onClearFilters: () => void;
  currentFilters?: CustomerFilters;
}

export const CustomerListFilters: React.FC<CustomerListFiltersProps> = ({
  visible,
  onClose,
  onFiltersChange,
  onClearFilters,
  currentFilters = {}
}) => {
  const [form] = Form.useForm();
  const [tempFilters, setTempFilters] = useState<CustomerFilters>(currentFilters);

  // Handle form changes
  const handleFieldChange = (field: string, value: any) => {
    setTempFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply filters
  const handleApply = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  // Clear all filters
  const handleClear = () => {
    setTempFilters({});
    form.resetFields();
    onClearFilters();
  };

  // Reset to current filters
  const handleReset = () => {
    setTempFilters(currentFilters);
    form.setFieldsValue(currentFilters);
  };

  return (
    <Modal
      title={
        <Space>
          <FilterOutlined />
          Customer Filters
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={handleClear} icon={<ClearOutlined />}>
            Clear All
          </Button>
          <Button onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleApply}>
            Apply Filters
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={currentFilters}
        size="small"
      >
        {/* Basic Information Filters */}
        <Card size="small" title="Basic Information" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Form.Item label="Customer Type" name="customerType">
                <Select
                  mode="multiple"
                  placeholder="Select customer types"
                  onChange={(value) => handleFieldChange('customerType', value)}
                >
                  <Option value="cash">Cash Only</Option>
                  <Option value="credit">Credit Customer</Option>
                  <Option value="special">Special Customer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Shop Type" name="shopType">
                <Select
                  mode="multiple"
                  placeholder="Select shop types"
                  onChange={(value) => handleFieldChange('shopType', value)}
                >
                  <Option value="retail">Retail</Option>
                  <Option value="distributor">Distributor</Option>
                  <Option value="sub_distributor">Sub Distributor</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Payment Behavior" name="paymentBehavior">
                <Select
                  mode="multiple"
                  placeholder="Select payment behaviors"
                  onChange={(value) => handleFieldChange('paymentBehavior', value)}
                >
                  <Option value="new">New Customer</Option>
                  <Option value="excellent">Excellent</Option>
                  <Option value="good">Good</Option>
                  <Option value="delayed">Delayed</Option>
                  <Option value="problematic">Problematic</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Credit Status" name="creditStatus">
                <Select
                  mode="multiple"
                  placeholder="Select credit status"
                  onChange={(value) => handleFieldChange('creditStatus', value)}
                >
                  <Option value="good">Good</Option>
                  <Option value="warning">Warning</Option>
                  <Option value="blocked">Blocked</Option>
                  <Option value="cash_only">Cash Only</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Credit and Financial Filters */}
        <Card size="small" title="Credit & Financial" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Form.Item label="Credit Limit Range (PKR)" name="creditLimitRange">
                <Slider
                  range
                  min={0}
                  max={5000000}
                  step={50000}
                  tipFormatter={(value) => `₹${(value! / 1000).toFixed(0)}K`}
                  onChange={(value) => handleFieldChange('creditLimitRange', value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Outstanding Amount Range (PKR)" name="outstandingRange">
                <Slider
                  range
                  min={0}
                  max={2000000}
                  step={10000}
                  tipFormatter={(value) => `₹${(value! / 1000).toFixed(0)}K`}
                  onChange={(value) => handleFieldChange('outstandingRange', value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Credit Utilization %" name="creditUtilizationRange">
                <Slider
                  range
                  min={0}
                  max={100}
                  tipFormatter={(value) => `${value}%`}
                  onChange={(value) => handleFieldChange('creditUtilizationRange', value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Credit Days Range" name="creditDaysRange">
                <Slider
                  range
                  min={0}
                  max={120}
                  step={5}
                  tipFormatter={(value) => `${value} days`}
                  onChange={(value) => handleFieldChange('creditDaysRange', value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Risk Assessment Filters */}
        <Card size="small" title="Risk Assessment" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item label="Show Overdue Only" name="isOverdue">
                <Switch
                  onChange={(value) => handleFieldChange('isOverdue', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Days Since Payment" name="daysSincePaymentRange">
                <Slider
                  range
                  min={0}
                  max={365}
                  step={5}
                  tipFormatter={(value) => `${value} days`}
                  onChange={(value) => handleFieldChange('daysSincePaymentRange', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Average Delay (Days)" name="averageDelayRange">
                <Slider
                  range
                  min={0}
                  max={60}
                  tipFormatter={(value) => `${value} days`}
                  onChange={(value) => handleFieldChange('averageDelayRange', value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Business Performance Filters */}
        <Card size="small" title="Business Performance" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Form.Item label="Total Orders Range" name="totalOrdersRange">
                <Slider
                  range
                  min={0}
                  max={1000}
                  step={10}
                  tipFormatter={(value) => `${value} orders`}
                  onChange={(value) => handleFieldChange('totalOrdersRange', value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lifetime Value Range (PKR)" name="lifetimeValueRange">
                <Slider
                  range
                  min={0}
                  max={10000000}
                  step={100000}
                  tipFormatter={(value) => `₹${(value! / 100000).toFixed(1)}L`}
                  onChange={(value) => handleFieldChange('lifetimeValueRange', value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Location and Communication Filters */}
        <Card size="small" title="Location & Communication" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item label="Preferred Contact" name="preferredContactMethod">
                <Select
                  mode="multiple"
                  placeholder="Contact methods"
                  onChange={(value) => handleFieldChange('preferredContactMethod', value)}
                >
                  <Option value="call">Phone Call</Option>
                  <Option value="whatsapp">WhatsApp</Option>
                  <Option value="visit">Visit</Option>
                  <Option value="sms">SMS</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Has WhatsApp" name="hasWhatsapp">
                <Switch
                  onChange={(value) => handleFieldChange('hasWhatsapp', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Relationship Type" name="relationshipType">
                <Select
                  mode="multiple"
                  placeholder="Relationship types"
                  onChange={(value) => handleFieldChange('relationshipType', value)}
                >
                  <Option value="business">Business</Option>
                  <Option value="family">Family</Option>
                  <Option value="friend">Friend</Option>
                  <Option value="reference">Reference</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Date Range Filters */}
        <Card size="small" title="Date Ranges">
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Form.Item label="Customer Registration Date" name="createdDateRange">
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={(dates) => handleFieldChange('createdDateRange', 
                    dates ? [dates[0]?.toDate(), dates[1]?.toDate()] : undefined
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Payment Date" name="lastPaymentDateRange">
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={(dates) => handleFieldChange('lastPaymentDateRange',
                    dates ? [dates[0]?.toDate(), dates[1]?.toDate()] : undefined
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  );
};
