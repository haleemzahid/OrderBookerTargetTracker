import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Switch, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useOrderBookers, useCreateOrderBooker, useUpdateOrderBooker, useDeleteOrderBooker } from '../hooks/useOrderBookers';
import { useI18n } from '../hooks/useI18n';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { OrderBooker, CreateOrderBookerRequest, UpdateOrderBookerRequest } from '../types';

const OrderBookers: React.FC = () => {
  const { orderBookers: t, common } = useI18n();
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
      title: t('deleteOrderBooker'),
      content: t('confirmDelete', { name: orderBooker.name }),
      okText: common('yes'),
      cancelText: common('no'),
      onOk: () => {
        deleteMutation.mutate(orderBooker.id, {
          onSuccess: () => {
            message.success(t('deleteSuccess'));
          },
          onError: () => {
            message.error(t('deleteError'));
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
        message.success(t('updateSuccess'));
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
        message.success(t('createSuccess'));
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(t('operationFailed'));
    }
  };

  const columns = [
    {
      title: t('name'),
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
      title: t('contact'),
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
      title: t('territory'),
      dataIndex: 'territory',
      key: 'territory',
      render: (text: string) => text || '-',
    },
    {
      title: t('monthlyTarget'),
      dataIndex: 'monthlyTarget',
      key: 'monthlyTarget',
      render: (amount: number) => `${amount}`,
    },
    {
      title: t('status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('active') : t('inactive')}
        </Tag>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (record: OrderBooker) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('edit')}
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            {t('delete')}
          </Button>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner tip={common('loading')} />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>{common('error')}</h3>
        <p>{common('failedToLoadData')}</p>
      </div>
    );
  }

  return (
    <div>
      <Card
        title={t('title')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            {t('addOrderBooker')}
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
              `${range[0]}-${range[1]} ${t('of')} ${total} ${t('items')}`,
          }}
        />
      </Card>

      <Modal
        title={editingOrderBooker ? t('editOrderBooker') : t('addNewOrderBooker')}
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
            label={t('name')}
            name="name"
            rules={[{ required: true, message: t('nameRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('nameUrdu')}
            name="nameUrdu"
            rules={[{ required: true, message: t('nameUrduRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('phoneNumber')}
            name="phone"
            rules={[{ required: true, message: t('phoneRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('email')}
            name="email"
            rules={[{ type: 'email', message: t('emailInvalid') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('territory')}
            name="territory"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('monthlyTarget')}
            name="monthlyTarget"
            rules={[{ required: true, message: t('monthlyTargetRequired') }]}
          >
            <Input type="number" />
          </Form.Item>

          {editingOrderBooker && (
            <Form.Item
              label={t('active')}
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingOrderBooker ? t('update') : t('add')}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                {t('cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderBookers;
