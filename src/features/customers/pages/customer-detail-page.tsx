import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tabs,
  Descriptions,
  Tag,
  Alert,
  Modal,
  Statistic,
  Progress,
  List,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DollarOutlined,
  PhoneOutlined,
  MessageOutlined,
  CreditCardOutlined,
  WarningOutlined,
  ShopOutlined,
  TruckOutlined
} from '@ant-design/icons';
import {
  CustomerCreditWidget,
  CustomerForm,
  PaymentForm
} from '../components';
import {
  useCustomerWithCredit,
  useCustomerTransactions,
  useCustomerOrders,
  useCustomerAlerts
} from '../api/queries';
import { formatCurrency, getPaymentBehaviorIcon } from '../utils/formatters';
import { Customer } from '../types';

// Helper function for date formatting
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Queries
  const customerQuery = useCustomerWithCredit(customerId || '', !!customerId);
  const transactionsQuery = useCustomerTransactions(customerId || '', undefined, !!customerId);
  const ordersQuery = useCustomerOrders(customerId || '', !!customerId);
  const alertsQuery = useCustomerAlerts(customerId || '', !!customerId);

  const customer = customerQuery.data;
  const transactions = transactionsQuery.data || [];
  const orders = ordersQuery.data || [];
  const alerts = alertsQuery.data || [];

  if (!customer) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={4}>Customer not found</Title>
        <Button onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const handleEditSuccess = () => {
    setShowEditForm(false);
    customerQuery.refetch();
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    customerQuery.refetch();
    transactionsQuery.refetch();
  };

  const handleWhatsAppContact = () => {
    if (customer.whatsappNumber) {
      const message = `Assalam o Alaikum ${customer.name}, this is regarding your account with us.`;
      const whatsappUrl = `https://wa.me/${customer.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Filter critical alerts safely
  const criticalAlerts = alerts.filter((alert: any) => 
    alert?.priority === 'urgent' || alert?.priority === 'high'
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/customers')}
            >
              Back
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {customer.name}
            </Title>
            {customer.businessName && (
              <Tag color="blue">{customer.businessName}</Tag>
            )}
          </Space>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => setShowEditForm(true)}
            >
              Edit
            </Button>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => setShowPaymentForm(true)}
            >
              Record Payment
            </Button>
            {customer.whatsappNumber && (
              <Button
                icon={<MessageOutlined />}
                onClick={handleWhatsAppContact}
                style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: 'white' }}
              >
                WhatsApp
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert
          message={`${criticalAlerts.length} Critical Alert${criticalAlerts.length > 1 ? 's' : ''}`}
          description={
            <div>
              {criticalAlerts.map((alert: any) => (
                <div key={alert?.id || Math.random()} style={{ marginBottom: '4px' }}>
                  <Tag color={alert?.priority === 'urgent' ? 'red' : 'orange'}>
                    {alert?.alertType?.replace('_', ' ')?.toUpperCase() || 'ALERT'}
                  </Tag>
                  {alert?.description || 'No description available'}
                </div>
              ))}
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Row gutter={[24, 24]}>
        {/* Left Column - Customer Info & Credit Widget */}
        <Col xs={24} lg={8}>
          {/* Credit Status Widget */}
          <div style={{ marginBottom: '24px' }}>
            <CustomerCreditWidget customer={customer} />
          </div>

          {/* Customer Information */}
          <Card title="Customer Information" style={{ marginBottom: '24px' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Full Name">
                {customer.name}
              </Descriptions.Item>
              <Descriptions.Item label="Business Name">
                {customer.businessName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="CNIC">
                {customer.cnic || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {customer.phone}
                </Space>
              </Descriptions.Item>
              {customer.whatsappNumber && (
                <Descriptions.Item label="WhatsApp">
                  <Space>
                    <MessageOutlined />
                    {customer.whatsappNumber}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Address">
                {customer.address}
              </Descriptions.Item>
              <Descriptions.Item label="Area">
                {customer.area}
              </Descriptions.Item>
              <Descriptions.Item label="City">
                {customer.city}
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                <Tag color="purple">{customer.shopType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer Type">
                <Tag color="blue">{customer.customerType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Behavior">
                <Space>
                  {getPaymentBehaviorIcon(customer.paymentBehavior)}
                  <Text>{customer.paymentBehavior}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Credit Limit">
                <Text strong>{formatCurrency(customer.creditLimit)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Member Since">
                {formatDate(customer.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Quick Stats */}
          <Card title="Quick Stats">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Orders"
                  value={orders.length}
                  prefix={<ShopOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Risk Score"
                  value={customer.riskScore}
                  suffix="/ 100"
                  valueStyle={{
                    color: customer.riskScore > 70 ? '#cf1322' :
                           customer.riskScore > 40 ? '#fa8c16' : '#3f8600'
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column - Tabs Content */}
        <Col xs={24} lg={16}>
          <Card>
            <Tabs defaultActiveKey="transactions" size="large">
              <TabPane tab="Transactions" key="transactions">
                <List
                  dataSource={transactions}
                  renderItem={(transaction) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={transaction.transactionType === 'PAYMENT' ? <DollarOutlined /> : <CreditCardOutlined />}
                            style={{
                              backgroundColor: transaction.transactionType === 'PAYMENT' ? '#52c41a' : '#1890ff'
                            }}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>
                              {transaction.transactionType === 'PAYMENT' ? 'Payment' : 'Sale'}
                            </Text>
                            <Text type="secondary">
                              {formatDate(transaction.createdAt)}
                            </Text>
                          </Space>
                        }
                        description={
                          <div>
                            <Text>
                              Amount: <Text strong>{formatCurrency(transaction.amount)}</Text>
                            </Text>
                            {transaction.paymentMethod && (
                              <Tag style={{ marginLeft: '8px' }}>
                                {transaction.paymentMethod}
                              </Tag>
                            )}
                            {transaction.notes && (
                              <Paragraph style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                                {transaction.notes}
                              </Paragraph>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </TabPane>

              <TabPane tab="Orders" key="orders">
                {orders.length > 0 ? (
                  <List
                    dataSource={orders}
                    renderItem={(order: any) => (
                      <List.Item
                        actions={[
                          <Button size="small" type="link">View Details</Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              icon={<TruckOutlined />}
                              style={{ backgroundColor: '#722ed1' }}
                            />
                          }
                          title={
                            <Space>
                              <Text strong>Order #{order?.orderNumber || 'N/A'}</Text>
                              <Tag color={
                                order?.status === 'completed' ? 'green' :
                                order?.status === 'pending' ? 'orange' : 'blue'
                              }>
                                {order?.status || 'unknown'}
                              </Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <Text>
                                Total: <Text strong>{formatCurrency(order?.totalAmount || 0)}</Text>
                              </Text>
                              <Text type="secondary" style={{ marginLeft: '16px' }}>
                                {formatDate(order?.createdAt || new Date())}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <TruckOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <Title level={4} type="secondary">No Orders Yet</Title>
                    <Text type="secondary">This customer hasn't placed any orders yet.</Text>
                  </div>
                )}
              </TabPane>

              <TabPane tab="Credit Terms" key="credit-terms">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Credit Limit">
                    {formatCurrency(customer.creditLimit)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Available Credit">
                    {formatCurrency(customer.availableCredit)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Outstanding">
                    {formatCurrency(customer.currentOutstanding)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Credit Utilization">
                    <Progress 
                      percent={customer.creditUtilization} 
                      size="small"
                      status={customer.creditUtilization > 80 ? 'exception' : 'normal'}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Collection Difficulty">
                    <Tag color={
                      customer.collectionDifficulty === 'easy' ? 'green' :
                      customer.collectionDifficulty === 'moderate' ? 'blue' :
                      customer.collectionDifficulty === 'difficult' ? 'orange' : 'red'
                    }>
                      {customer.collectionDifficulty}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Payment">
                    {customer.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'No payments yet'}
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              <TabPane tab="Alerts" key="alerts">
                {alerts.length > 0 ? (
                  <List
                    dataSource={alerts}
                    renderItem={(alert: any) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              icon={<WarningOutlined />}
                              style={{
                                backgroundColor: 
                                  alert?.priority === 'urgent' ? '#ff4d4f' :
                                  alert?.priority === 'high' ? '#fa8c16' :
                                  alert?.priority === 'medium' ? '#fadb14' : '#52c41a'
                              }}
                            />
                          }
                          title={
                            <Space>
                              <Text strong>{alert?.alertType?.replace('_', ' ')?.toUpperCase() || 'ALERT'}</Text>
                              <Tag color={
                                alert?.priority === 'urgent' ? 'red' :
                                alert?.priority === 'high' ? 'orange' :
                                alert?.priority === 'medium' ? 'yellow' : 'green'
                              }>
                                {alert?.priority || 'normal'}
                              </Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <Paragraph>{alert?.description || 'No description available'}</Paragraph>
                              {alert?.amountInvolved > 0 && (
                                <Text>Amount: <Text strong>{formatCurrency(alert.amountInvolved)}</Text></Text>
                              )}
                              <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                                Created: {formatDate(alert?.createdAt || new Date())}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <WarningOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <Title level={4} type="secondary">No Active Alerts</Title>
                    <Text type="secondary">This customer has no active collection alerts.</Text>
                  </div>
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Edit Customer Modal */}
      <Modal
        title="Edit Customer"
        open={showEditForm}
        onCancel={() => setShowEditForm(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CustomerForm
          customer={customer as Customer}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditForm(false)}
        />
      </Modal>

      {/* Payment Form Modal */}
      <Modal
        title="Record Payment"
        open={showPaymentForm}
        onCancel={() => setShowPaymentForm(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <PaymentForm
          customer={customer}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentForm(false)}
        />
      </Modal>
    </div>
  );
};
