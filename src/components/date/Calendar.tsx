import { Calendar } from 'antd';
import dateFnsGenerateConfig from 'rc-picker/lib/generate/dateFns';

const MyCalendar = Calendar.generateCalendar<Date>(dateFnsGenerateConfig);

export default MyCalendar;
