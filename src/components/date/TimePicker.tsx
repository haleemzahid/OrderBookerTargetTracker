import * as React from 'react';
import type { PickerProps } from 'antd/es/date-picker/generatePicker';
import DatePicker from './DatePicker';

export interface TimePickerProps extends Omit<PickerProps<Date>, 'picker'> {}

const TimePicker = React.forwardRef<any, TimePickerProps>((props, ref) => (
  <DatePicker {...props} picker="time" mode={undefined} ref={ref} />
));

TimePicker.displayName = 'TimePicker';

export default TimePicker;
