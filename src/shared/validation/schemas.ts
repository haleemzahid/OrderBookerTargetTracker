import { z } from 'zod';

export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export const paginationSchema = z.object({
  page: z.number().min(1),
  pageSize: z.number().min(1).max(100),
});

export const phoneSchema = z.string().regex(/^\+92-\d{3}-\d{7}$/, 'Invalid phone format');
export const emailSchema = z.string().email().optional();
