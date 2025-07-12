import React from 'react';
import { Card, Row, Col, Descriptions, Tag, Divider } from 'antd';
import { OrderItemsTable } from './order-items-table';
import { useOrderBookers } from '../../order-bookers/api/queries';
import { FormatNumber } from '../../../shared/components';
import type { Order } from '../types';
import dayjs from 'dayjs';

interface OrderDetailProps {
  order: Order;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ order }) => {
  const { data: orderBookers } = useOrderBookers();

  const getOrderBookerName = (orderBookerId: string) => {
    const orderBooker = orderBookers?.find(ob => ob.id === orderBookerId);
    return orderBooker?.name || orderBookerId;
  };

  const profitMargin = order.totalCost > 0 ? (order.totalProfit / order.totalCost) * 100 : 0;

  return (
    <div>
      <Card title="Order Information" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Order Booker">
                {getOrderBookerName(order.orderBookerId)}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {dayjs(order.orderDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Total Amount">
                <FormatNumber value={order.totalAmount} prefix="Rs. " decimalPlaces={2} />
              </Descriptions.Item>
              <Descriptions.Item label="Total Cost">
                <FormatNumber value={order.totalCost} prefix="Rs. " decimalPlaces={2} />
              </Descriptions.Item>
              <Descriptions.Item label="Total Profit">
                <span style={{ color: order.totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  <FormatNumber value={order.totalProfit} prefix="Rs. " decimalPlaces={2} />
                  {order.totalCost > 0 && (
                    <span style={{ marginLeft: 8, fontSize: '0.9em' }}>
                      ({profitMargin.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Total Cartons">
                {order.totalCartons.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        {order.returnAmount > 0 && (
          <>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} size="small" title="Returns Information">
                  <Descriptions.Item label="Return Amount">
                    <Tag color="red">
                      <FormatNumber value={order.returnAmount} prefix="Rs. " decimalPlaces={2} />
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Return Cartons">
                    <Tag color="red">
                      {order.returnCartons.toFixed(2)}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </>
        )}

        {order.notes && (
          <>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Notes">
                {order.notes}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Card title="Order Items" size="small">
        <OrderItemsTable
          orderId={order.id}
          items={[]} // Will be loaded by the component
          products={[]} // Will be loaded by the component
          onItemAdd={() => {}}
          onItemUpdate={() => {}}
          onItemDelete={() => {}}
          editable={false} // View-only mode
        />
      </Card>
    </div>
  );
};
