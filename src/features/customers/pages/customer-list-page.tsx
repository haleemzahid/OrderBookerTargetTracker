import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Modal, 
  Row, 
  Col,
  Statistic,
  Alert,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  DollarOutlined, 
  UserOutlined, 
  ExclamationCircleOutlined,
  CreditCardOutlined 
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { CustomerList, CustomerForm, PaymentForm } from '../components';
import { useCustomers, useDashboardStats } from '../api/queries';
import { Customer, CustomerWithCredit } from '../types';
import { formatCurrency } from '../utils/formatters';

const { Title } = Typography;

export const CustomerListPage: React.FC = () => {
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCredit | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const navigate = useNavigate();

  // Queries
  const customersQuery = useCustomers();
  const dashboardStats = useDashboardStats();

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleRecordPayment = (customer: CustomerWithCredit) => {
    setSelectedCustomer(customer);
    setShowPaymentForm(true);
  };
  
  const handleNavigateToCustomerDetail = (customer: CustomerWithCredit) => {
    navigate({ to: '/customers/$customerId', params: { customerId: customer.id } });
  };
  
  const handleRecordPaymentClick = () => {
    setShowPaymentForm(true);
  };

  const handleCustomerFormSuccess = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
    customersQuery.refetch();
  };

  const handlePaymentFormSuccess = () => {
    setShowPaymentForm(false);
    setSelectedCustomer(null);
    customersQuery.refetch();
    dashboardStats.refetch();
  };

  const stats = dashboardStats.data;

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: '8px' }} />
            Customer Management
          </Title>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateCustomer}
            >
              Add Customer
            </Button>
            <Button 
              type="default" 
              icon={<DollarOutlined />}
              onClick={handleRecordPaymentClick}
            >
              Record Payment
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Credit Dashboard Stats */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Outstanding"
                value={stats.totalOutstanding}
                precision={0}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CreditCardOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Overdue Customers"
                value={stats.overdueCustomers}
                valueStyle={{ color: stats.overdueCustomers > 0 ? '#cf1322' : '#3f8600' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Today's Collections"
                value={stats.todayCollections}
                precision={0}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="High Risk Customers"
                value={stats.highRiskCustomers}
                valueStyle={{ color: stats.highRiskCustomers > 0 ? '#cf1322' : '#3f8600' }}
                prefix={<ExclamationCircleOutlined />}
              />
              {stats.alertsRequiringAction > 0 && (
                <Tag color="red" style={{ marginTop: '8px' }}>
                  {stats.alertsRequiringAction} alerts
                </Tag>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Alerts */}
      {stats && stats.overdueCustomers > 0 && (
        <Alert
          message="Collection Alert"
          description={`You have ${stats.overdueCustomers} customers with overdue payments totaling ${formatCurrency(stats.totalOutstanding)}. Please follow up on collections.`}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button size="small" danger>
              View Overdue
            </Button>
          }
        />
      )}

      {/* Customer List */}
      <Card>
        <CustomerList 
          onEditCustomer={handleEditCustomer}
          onCustomerSelect={handleNavigateToCustomerDetail}
          onRecordPayment={handleRecordPayment}
          showActions={true}
          showFilters={true}
        />
      </Card>

      {/* Customer Form Modal */}
      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        open={showCustomerForm}
        onCancel={() => {
          setShowCustomerForm(false);
          setEditingCustomer(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CustomerForm
          customer={editingCustomer || undefined}
          onSuccess={handleCustomerFormSuccess}
          onCancel={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
        />
      </Modal>

      {/* Payment Form Modal */}
      <Modal
        title="Record Payment"
        open={showPaymentForm}
        onCancel={() => {
          setShowPaymentForm(false);
          setSelectedCustomer(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <PaymentForm
          customer={selectedCustomer || undefined}
          onSuccess={handlePaymentFormSuccess}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedCustomer(null);
          }}
        />
      </Modal>
    </div>
  );
};
