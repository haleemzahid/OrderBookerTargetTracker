import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import { useI18n } from '../hooks/useI18n';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { dashboard } = useI18n();

  const mockData = {
    totalOrderBookers: 25,
    activeSales: 150000,
    monthlyReturns: 5000,
    targetAchievement: 85,
  };

  return (
    <div>
      <Title level={2}>
        {dashboard('title')}
      </Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={dashboard('totalOrderBookers')}
              value={mockData.totalOrderBookers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={dashboard('thisMonthSales')}
              value={mockData.activeSales}
              prefix={<DollarOutlined />}
              suffix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={dashboard('thisMonthReturns')}
              value={mockData.monthlyReturns}
              prefix={<DollarOutlined />}
              suffix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={dashboard('targetAchievement')}
              value={mockData.targetAchievement}
              suffix="%"
              valueStyle={{ color: mockData.targetAchievement >= 80 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title={dashboard('topPerformers')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ahmed Ali</span>
                <span style={{ color: '#3f8600' }}>95%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fatima Khan</span>
                <span style={{ color: '#3f8600' }}>92%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Muhammad Hassan</span>
                <span style={{ color: '#3f8600' }}>88%</span>
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title={dashboard('needsAttention')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ali Ahmed</span>
                <span style={{ color: '#cf1322' }}>65%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sara Khan</span>
                <span style={{ color: '#cf1322' }}>58%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Omar Sheikh</span>
                <span style={{ color: '#cf1322' }}>52%</span>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
