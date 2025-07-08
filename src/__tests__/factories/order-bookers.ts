import { faker } from '@faker-js/faker';
import type { OrderBooker, CreateOrderBookerRequest, UpdateOrderBookerRequest } from '../../features/order-bookers/types';

export const createMockOrderBooker = (overrides?: Partial<OrderBooker>): OrderBooker => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  nameUrdu: faker.person.fullName(), // In a real app, this would be actual Urdu text
  phone: faker.helpers.fromRegExp(/\+92-3[0-9]{2}-[0-9]{7}/),
  email: faker.internet.email(),
  joinDate: faker.date.past(),
  isActive: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  currentMonthTarget: faker.number.int({ min: 10000, max: 100000 }),
  currentMonthAchieved: faker.number.int({ min: 0, max: 80000 }),
  currentMonthRemaining: faker.number.int({ min: 0, max: 50000 }),
  currentMonthAchievementPercentage: faker.number.float({ min: 0, max: 150 }),
  ...overrides,
});

export const createMockCreateOrderBookerRequest = (
  overrides?: Partial<CreateOrderBookerRequest>
): CreateOrderBookerRequest => ({
  name: faker.person.fullName(),
  nameUrdu: faker.person.fullName(),
  phone: faker.helpers.fromRegExp(/\+92-3[0-9]{2}-[0-9]{7}/),
  email: faker.internet.email(),
  ...overrides,
});

export const createMockUpdateOrderBookerRequest = (
  overrides?: Partial<UpdateOrderBookerRequest>
): UpdateOrderBookerRequest => ({
  name: faker.person.fullName(),
  nameUrdu: faker.person.fullName(),
  phone: faker.helpers.fromRegExp(/\+92-3[0-9]{2}-[0-9]{7}/),
  email: faker.internet.email(),
  isActive: faker.datatype.boolean(),
  ...overrides,
});

export const createMockOrderBookerList = (count: number = 5): OrderBooker[] => {
  return Array.from({ length: count }, () => createMockOrderBooker());
};

export const createMockActiveOrderBookers = (count: number = 3): OrderBooker[] => {
  return Array.from({ length: count }, () => 
    createMockOrderBooker({ isActive: true })
  );
};

export const createMockInactiveOrderBookers = (count: number = 2): OrderBooker[] => {
  return Array.from({ length: count }, () => 
    createMockOrderBooker({ isActive: false })
  );
};
