import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Switch, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useOrderBookers, useCreateOrderBooker, useUpdateOrderBooker, useDeleteOrderBooker } from '../hooks/useOrderBookers';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { OrderBooker, CreateOrderBookerRequest, UpdateOrderBookerRequest } from '../types';

const OrderBookers: React.FC = () => {
  const { language } = useApp();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrderBooker, setEditingOrderBooker] = useState<OrderBooker | null>(null);

  const { data: orderBookers, isLoading, error } = useOrderBookers();
  const createMutation = useCreateOrderBooker();
  const updateMutation = useUpdateOrderBooker();
  const deleteMutation = useDeleteOrderBooker();

  const handleAdd = () => {
    setEditingOrderBooker(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (orderBooker: OrderBooker) => {
    setEditingOrderBooker(orderBooker);
    form.setFieldsValue({
      name: orderBooker.name,
      nameUrdu: orderBooker.nameUrdu,
      phone: orderBooker.phone,
      email: orderBooker.email,
      territory: orderBooker.territory,
      monthlyTarget: orderBooker.monthlyTarget,
      isActive: orderBooker.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (orderBooker: OrderBooker) => {
    Modal.confirm({
      title: language === 'ur' ? 'آرڈر بکر کو ڈیلیٹ کریں' : 'Delete Order Booker',
      content: language === 'ur' 
        ? `کیا آپ واقعی ${orderBooker.name} کو ڈیلیٹ کرنا چاہتے ہیں؟`
        : `Are you sure you want to delete ${orderBooker.name}?`,
      okText: language === 'ur' ? 'ہاں' : 'Yes',
      cancelText: language === 'ur' ? 'نہیں' : 'No',
      onOk: () => {
        deleteMutation.mutate(orderBooker.id, {
          onSuccess: () => {
            message.success(language === 'ur' ? 'آرڈر بکر کامیابی سے ڈیلیٹ ہو گیا' : 'Order booker deleted successfully');
          },
          onError: () => {
            message.error(language === 'ur' ? 'آرڈر بکر ڈیلیٹ کرنے میں ناکامی' : 'Failed to delete order booker');
          },
        });
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingOrderBooker) {
        const updateData: UpdateOrderBookerRequest = {
          name: values.name,
          nameUrdu: values.nameUrdu,
          phone: values.phone,
          email: values.email,
          territory: values.territory,
          monthlyTarget: values.monthlyTarget,
          isActive: values.isActive,
        };
        await updateMutation.mutateAsync({ id: editingOrderBooker.id, data: updateData });
        message.success(language === 'ur' ? 'آرڈر بکر کامیابی سے اپ ڈیٹ ہو گیا' : 'Order booker updated successfully');
      } else {
        const createData: CreateOrderBookerRequest = {
          name: values.name,
          nameUrdu: values.nameUrdu,
          phone: values.phone,
          email: values.email,
          territory: values.territory,
          monthlyTarget: values.monthlyTarget,
        };
        await createMutation.mutateAsync(createData);
        message.success(language === 'ur' ? 'آرڈر بکر کامیابی سے شامل ہو گیا' : 'Order booker created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(language === 'ur' ? 'آپریشن ناکام' : 'Operation failed');
    }
  };

  const columns = [
    {
      title: language === 'ur' ? 'نام' : 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: OrderBooker) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.nameUrdu}</div>
        </div>
      ),
    },
    {
      title: language === 'ur' ? 'رابطہ' : 'Contact',
      key: 'contact',
      render: (record: OrderBooker) => (
        <div>
          <div>
            <PhoneOutlined /> {record.phone}
          </div>
          {record.email && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <MailOutlined /> {record.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: language === 'ur' ? 'علاقہ' : 'Territory',
      dataIndex: 'territory',
      key: 'territory',
      render: (text: string) => text || '-',
    },
    {
      title: language === 'ur' ? 'ماہانہ ٹارگٹ' : 'Monthly Target',
      dataIndex: 'monthlyTarget',
      key: 'monthlyTarget',
      render: (amount: number) => `${amount}`,
    },
    {
      title: language === 'ur' ? 'حالت' : 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? (language === 'ur' ? 'فعال' : 'Active') : (language === 'ur' ? 'غیر فعال' : 'Inactive')}
        </Tag>
      ),
    },
    {
      title: language === 'ur' ? 'عمل' : 'Actions',
      key: 'actions',
      render: (record: OrderBooker) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {language === 'ur' ? 'تبدیل کریں' : 'Edit'}
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            {language === 'ur' ? 'ڈیلیٹ' : 'Delete'}
          </Button>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner tip={language === 'ur' ? 'ڈیٹا لوڈ ہو رہا ہے...' : 'Loading data...'} />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>{language === 'ur' ? 'خرابی' : 'Error'}</h3>
        <p>{language === 'ur' ? 'ڈیٹا لوڈ کرنے میں ناکامی' : 'Failed to load data'}</p>
      </div>
    );
  }

  return (
    <div>
      <Card
        title={language === 'ur' ? 'آرڈر بکر منیجمنٹ' : 'Order Booker Management'}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            {language === 'ur' ? 'نیا آرڈر بکر' : 'Add Order Booker'}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={orderBookers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              language === 'ur'
                ? `${range[0]}-${range[1]} کل ${total} میں سے`
                : `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      <Modal
        title={editingOrderBooker 
          ? (language === 'ur' ? 'آرڈر بکر تبدیل کریں' : 'Edit Order Booker')
          : (language === 'ur' ? 'نیا آرڈر بکر شامل کریں' : 'Add New Order Booker')
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label={language === 'ur' ? 'نام' : 'Name'}
            name="name"
            rules={[{ required: true, message: language === 'ur' ? 'نام درکار ہے' : 'Name is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={language === 'ur' ? 'اردو نام' : 'Name in Urdu'}
            name="nameUrdu"
            rules={[{ required: true, message: language === 'ur' ? 'اردو نام درکار ہے' : 'Urdu name is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={language === 'ur' ? 'فون نمبر' : 'Phone Number'}
            name="phone"
            rules={[{ required: true, message: language === 'ur' ? 'فون نمبر درکار ہے' : 'Phone number is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={language === 'ur' ? 'ای میل' : 'Email'}
            name="email"
            rules={[{ type: 'email', message: language === 'ur' ? 'درست ای میل درج کریں' : 'Invalid email format' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={language === 'ur' ? 'علاقہ' : 'Territory'}
            name="territory"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={language === 'ur' ? 'ماہانہ ٹارگٹ' : 'Monthly Target'}
            name="monthlyTarget"
            rules={[{ required: true, message: language === 'ur' ? 'ماہانہ ٹارگٹ درکار ہے' : 'Monthly target is required' }]}
          >
            <Input type="number" />
          </Form.Item>

          {editingOrderBooker && (
            <Form.Item
              label={language === 'ur' ? 'فعال' : 'Active'}
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingOrderBooker 
                  ? (language === 'ur' ? 'اپ ڈیٹ کریں' : 'Update')
                  : (language === 'ur' ? 'شامل کریں' : 'Add')
                }
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                {language === 'ur' ? 'منسوخ' : 'Cancel'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderBookers;
