import Calendar from '../comp_single_file/calendar';
import { h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import {DASH_DATE_PATTERN, str2Re} from "../../global_utils/config_reg_pattern";

export class DatepickerComp {
  constructor() {
    this.calendar = new Calendar(new Date());
    this.el = h('div', `${CSS_PREFIX}-datepicker`).appendChildByStrOrEl(
      this.calendar.el,
    ).hide();
  }

  setValue(date) {
    const { calendar } = this;
    if (typeof date === 'string') {
      if (str2Re(DASH_DATE_PATTERN).test(date)) { // jobs: todo: 正则表达式抽取出来
        calendar.setValue(new Date(date.replace(new RegExp('-', 'g'), '/')));
      }
    } else if (date instanceof Date) {
      calendar.setValue(date);
    }
    return this;
  }

  change(cb) {
    this.calendar.selectChange = (d) => {
      cb(d);
      this.hide();
    };
  }

  show() {
    this.el.updateDisplayToBlock();
  }

  hide() {
    this.el.hide();
  }
  dateFormat(d) {
    let month = d.getMonth() + 1;
    let date = d.getDate();
    if (month < 10) month = `0${month}`;
    if (date < 10) date = `0${date}`;
    return `${d.getFullYear()}-${month}-${date}`;
  }

}
