import React, { useState } from 'react';
import { Modal, InputNumber, Form, Row, Col, Typography } from 'antd';
import { FormatNumber } from '../../../shared/components';
import type { OrderItemData } from './OrderItemsTable';

const { Text } = Typography;

interface ReturnDialogProps {
  visible: boolean;
  orderItem: OrderItemData | null;
  onConfirm: (returnQuantity: number) => void;
  onCancel: () => void;
}

export const ReturnDialog: React.FC<ReturnDialogProps> = ({
  visible,
  orderItem,
  onConfirm,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [returnQuantity, setReturnQuantity] = useState(0);

  // Early return if orderItem is null
  if (!orderItem) {
    return null;
  }

  const maxReturnQuantity = (orderItem.quantity || 0) - (orderItem.returnQuantity || 0);
  const returnAmount = returnQuantity * (orderItem.sellPrice || 0);

  const handleOk = async () => {
    try {
      await form.validateFields();
      onConfirm(returnQuantity);
      form.resetFields();
      setReturnQuantity(0);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel();
    form.resetFields();
    setReturnQuantity(0);
  };

  return (
    <Modal
      title="Process Return"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Process Return"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Product:</Text>
            <br />
            <Text>{orderItem.productName}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Sell Price:</Text>
            <br />
            <FormatNumber value={orderItem.sellPrice || 0} prefix="Rs. " />
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Text strong>Original Quantity:</Text>
            <br />
            <Text>{orderItem.quantity}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Already Returned:</Text>
            <br />
            <Text>{orderItem.returnQuantity || 0}</Text>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Text strong>Available to Return:</Text>
            <br />
            <Text>{maxReturnQuantity}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Return Amount:</Text>
            <br />
            <FormatNumber value={returnAmount} prefix="Rs. " />
          </Col>
        </Row>

        <Form.Item
          name="returnQuantity"
          label="Return Quantity"
          rules={[
            { required: true, message: 'Please enter return quantity' },
            { type: 'number', min: 1, max: maxReturnQuantity, message: `Quantity must be between 1 and ${maxReturnQuantity}` }
          ]}
          style={{ marginTop: 24 }}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={maxReturnQuantity}
            value={returnQuantity}
            onChange={(value) => setReturnQuantity(value || 0)}
            placeholder="Enter quantity to return"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
