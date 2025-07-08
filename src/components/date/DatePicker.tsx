import { DatePicker } from 'antd';
import dateFnsGenerateConfig from 'rc-picker/lib/generate/dateFns';

const MyDatePicker = DatePicker.generatePicker<Date>(dateFnsGenerateConfig);

export default MyDatePicker;
