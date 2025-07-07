export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type Status = 'pending' | 'approved' | 'rejected';
export type Language = 'en' | 'ur';
export type Theme = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';
