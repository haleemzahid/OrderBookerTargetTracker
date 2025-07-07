import { faker } from '@faker-js/faker';
import type { MonthlyTarget, CreateMonthlyTargetRequest, UpdateMonthlyTargetRequest } from '../../features/monthly-targets/types';

export const createMockMonthlyTarget = (overrides?: Partial<MonthlyTarget>): MonthlyTarget => {
  const targetAmount = faker.number.int({ min: 10000, max: 100000 });
  const achievedAmount = faker.number.int({ min: 0, max: targetAmount });
  const remainingAmount = targetAmount - achievedAmount;
  const achievementPercentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;

  return {
    id: faker.string.uuid(),
    orderBookerId: faker.string.uuid(),
    year: faker.number.int({ min: 2020, max: 2030 }),
    month: faker.number.int({ min: 1, max: 12 }),
    targetAmount,
    achievedAmount,
    remainingAmount,
    achievementPercentage,
    daysInMonth: faker.number.int({ min: 28, max: 31 }),
    workingDaysInMonth: faker.number.int({ min: 20, max: 23 }),
    dailyTargetAmount: targetAmount / 22, // Approximate working days
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

export const createMockCreateMonthlyTargetRequest = (
  overrides?: Partial<CreateMonthlyTargetRequest>
): CreateMonthlyTargetRequest => ({
  orderBookerId: faker.string.uuid(),
  year: faker.number.int({ min: 2020, max: 2030 }),
  month: faker.number.int({ min: 1, max: 12 }),
  targetAmount: faker.number.int({ min: 10000, max: 100000 }),
  ...overrides,
});

export const createMockUpdateMonthlyTargetRequest = (
  overrides?: Partial<UpdateMonthlyTargetRequest>
): UpdateMonthlyTargetRequest => ({
  targetAmount: faker.number.int({ min: 10000, max: 100000 }),
  ...overrides,
});

export const createMockMonthlyTargetList = (count: number = 5): MonthlyTarget[] => {
  return Array.from({ length: count }, () => createMockMonthlyTarget());
};

export const createMockMonthlyTargetsByMonth = (
  year: number,
  month: number,
  count: number = 3
): MonthlyTarget[] => {
  return Array.from({ length: count }, () => 
    createMockMonthlyTarget({ year, month })
  );
};

export const createMockMonthlyTargetsByOrderBooker = (
  orderBookerId: string,
  count: number = 3
): MonthlyTarget[] => {
  return Array.from({ length: count }, () => 
    createMockMonthlyTarget({ orderBookerId })
  );
};
