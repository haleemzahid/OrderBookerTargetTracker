import React, { useEffect, useState, useMemo } from 'react';
import { Form, Select, DatePicker, Input, Card, Row, Col, Divider, message, Radio, Space, Modal, Alert } from 'antd';
import { useOrderBookers } from '../../order-bookers/api/queries';
import { useProducts } from '../../products/api/queries';
import { useCreateOrder, useUpdateOrderWithItems } from '../api/mutations';
import { useOrderItems } from '../api/queries';
import { FormActions } from '../../../shared/components';
import type { Order, CreateOrderRequest } from '../types';
import dayjs from 'dayjs';
import { OrderItemsTable, type OrderItemData } from './order-items-table';
import { mergeOrderItems } from '../utils/merge-items';
import { CustomerSelect } from '../../customers/components/customer-select';
import { CustomerWithCredit } from '../../customers/types';
import { OrderCreditValidation } from './order-credit-validation';

const { Option } = Select;
const { TextArea } = Input;

interface OrderFormProps {
  order?: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  order,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCredit | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<string>('cash');

  const { data: orderBookers, isLoading: isLoadingOrderBookers } = useOrderBookers();
  const { data: products, isLoading: isLoadingProducts } = useProducts();

  // Load order items when editing
  const { data: existingOrderItems, isLoading: isLoadingOrderItems } = useOrderItems(order?.id || '');

  const createMutation = useCreateOrder();
  const updateWithItemsMutation = useUpdateOrderWithItems();

  const isEditing = !!order;
  const isLoading = createMutation.isPending  || updateWithItemsMutation.isPending || (isEditing && (isLoadingOrderItems || isLoadingProducts));

  useEffect(() => {
    if (order) {
      const paymentTermsValue = order.paymentTerms || 'cash';
      form.setFieldsValue({
        orderBookerId: order.orderBookerId,
        orderDate: dayjs(order.orderDate),
        notes: order.notes,
        customerId: order.customerId,
        paymentTerms: paymentTermsValue,
      });
      setPaymentTerms(paymentTermsValue);
    } else {
      form.setFieldsValue({
        orderDate: dayjs(),
        paymentTerms: 'cash',
      });
      setPaymentTerms('cash');
      setOrderItems([]);
    }
  }, [order, form]);

  // Calculate total order amount
  const totalOrderAmount = useMemo(() => {
    return orderItems.reduce((total, item) => total + (item.totalAmount || 0), 0);
  }, [orderItems]);

  // Load existing order items when editing
  useEffect(() => {
    if (existingOrderItems && order && products) {
      console.log(existingOrderItems);
      const mappedItems: OrderItemData[] = existingOrderItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          key: item.id,
          id: item.id,
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          cartons: item.cartons,
          costPrice: item.costPrice,
          sellPrice: item.sellPrice,
          totalCost: item.totalCost,
          totalAmount: item.totalAmount,
          profit: item.profit,
          returnCartons: item.returnCartons,
        };
      });
      // Apply merging logic to the loaded items
      const mergedItems = mergeOrderItems(mappedItems);
      setOrderItems(mergedItems);
    }
  }, [existingOrderItems, order, products]);

  const handleSubmit = async (values: any) => {
    try {
      // Validate that we have at least one item
      if (orderItems.length === 0) {
        message.error('Please add at least one product to the order');
        return;
      }

      // Validate customer selection for credit orders
      if (values.paymentTerms === 'credit' && !values.customerId) {
        message.error('Please select a customer for credit orders');
        return;
      }

      const requestData: CreateOrderRequest = {
        orderBookerId: values.orderBookerId,
        orderDate: values.orderDate.toDate(),
        notes: values.notes,
        customerId: values.customerId,
        paymentTerms: values.paymentTerms,
        creditApprovalReason: approvalReason,
        items: orderItems.map(item => ({
          productId: item.productId!,
          cartons: item.cartons!,
          costPrice: item.costPrice!,
          sellPrice: item.sellPrice!,
          returnCartons: item.returnCartons
        })),
      };

      if (isEditing) {
        // Use the new mutation that updates both order and items
        await updateWithItemsMutation.mutateAsync({
          id: order.id,
          data: {
            orderBookerId: requestData.orderBookerId,
            orderDate: requestData.orderDate,
            notes: requestData.notes,
            items: requestData.items,
          }
        });
        message.success('Order updated successfully');
      } else {
        await createMutation.mutateAsync(requestData);
        message.success('Order created successfully');
      }

      form.resetFields();
      setOrderItems([]);
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(isEditing ? 'Failed to update order' : 'Failed to create order');
    }
  };

  const handleItemsChange = (items: OrderItemData[]) => {
    // Apply merging logic to ensure items with same product, cost, and sell price are merged
    const mergedItems = mergeOrderItems(items);
    setOrderItems(mergedItems);
  };

  // Handle customer selection
  const handleCustomerSelect = (_customerId: string, customer: CustomerWithCredit) => {
    setSelectedCustomer(customer);
  };

  // Handle payment terms change
  const handlePaymentTermsChange = (e: any) => {
    setPaymentTerms(e.target.value);
  };

  // Handle credit approval request
  const handleRequestApproval = () => {
    setShowApprovalModal(true);
  };

  // Handle alternatives suggestion
  const handleSuggestAlternative = () => {
    setShowAlternativesModal(true);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        orderDate: dayjs(),
        paymentTerms: 'cash',
      }}
    >
      <Card title="Order Information" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="orderBookerId"
              label="Order Booker"
              rules={[
                { required: true, message: 'Please select an order booker' },
              ]}
            >
              <Select
                placeholder="Select Order Booker"
                loading={isLoadingOrderBookers}
                showSearch
                optionFilterProp="children"
              >
                {orderBookers?.map(orderBooker => (
                  <Option key={orderBooker.id} value={orderBooker.id}>
                    {orderBooker.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="orderDate"
              label="Order Date"
              rules={[
                { required: true, message: 'Please select order date' },
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerId"
              label="Customer"
            >
              <CustomerSelect 
                showCreateNew
                orderAmount={totalOrderAmount}
                showCreditStatus
                onChange={handleCustomerSelect}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="paymentTerms"
              label="Payment Terms"
              rules={[
                { required: true, message: 'Please select payment terms' },
              ]}
            >
              <Radio.Group buttonStyle="solid" onChange={handlePaymentTermsChange}>
                <Radio.Button value="cash">Cash</Radio.Button>
                <Radio.Button value="credit">Credit</Radio.Button>
                <Radio.Button value="advance">Advance</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="notes"
              label="Notes (Optional)"
            >
              <TextArea
                rows={2}
                placeholder="Enter any additional notes..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Credit Validation Section - shown when customer is selected and payment terms are credit */}
      {selectedCustomer && paymentTerms === 'credit' && (
        <div style={{ marginTop: '16px' }}>
          <OrderCreditValidation 
            customerId={selectedCustomer.id}
            orderAmount={totalOrderAmount}
            onRequestApproval={handleRequestApproval}
            onSuggestAlternative={handleSuggestAlternative}
          />
        </div>
      )}

      <Divider />

      <Card title="Order Items" size="small">
        <OrderItemsTable
          items={orderItems}
          onItemsChange={handleItemsChange}
          loading={isLoading}
        />
      </Card>
      <div style={{ marginTop: 10 }}>
        <FormActions
          isLoading={isLoading}
          onCancel={onCancel}
          submitLabel={isEditing ? 'Update Order' : 'Create Order'}
        />
      </div>

      {/* Credit Approval Modal */}
      <Modal
        title="Request Credit Approval"
        open={showApprovalModal}
        onOk={() => {
          if (approvalReason.trim() === '') {
            message.error('Please provide a reason for approval');
            return;
          }
          setShowApprovalModal(false);
          form.submit(); // Submit the form after setting the approval reason
        }}
        onCancel={() => setShowApprovalModal(false)}
      >
        <Alert
          message="Credit Approval Required"
          description="This order exceeds the customer's available credit and requires management approval."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form layout="vertical">
          <Form.Item
            label="Approval Reason"
            rules={[{ required: true, message: 'Please provide a reason for approval' }]}
          >
            <TextArea 
              rows={4}
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              placeholder="Explain why this order should be approved despite credit limits..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Alternative Payment Options Modal */}
      <Modal
        title="Alternative Payment Options"
        open={showAlternativesModal}
        onOk={() => {
          setShowAlternativesModal(false);
          form.setFieldsValue({ paymentTerms: 'cash' });
        }}
        onCancel={() => setShowAlternativesModal(false)}
      >
        <Alert
          message="Credit Not Available"
          description="This customer does not have sufficient credit available for this order."
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card size="small" title="Suggested Alternatives">
            <p><strong>Cash Payment:</strong> Process order with cash payment instead of credit.</p>
            <p><strong>Advance Payment:</strong> Collect payment before processing the order.</p>
            <p><strong>Split Order:</strong> Break this into smaller orders that stay within credit limits.</p>
            <p><strong>Collect Outstanding:</strong> Collect pending payments to free up credit limit.</p>
          </Card>
        </Space>
      </Modal>
    </Form >
  );
};
