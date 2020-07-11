import {
  TEXT_TO_VALUE_DATE_TIME,
  TEXT_TO_VALUE_NUMBER,
  TEXT_TO_VALUE_PERCENTAGE,
  TEXT_TO_VALUE_SCI,
  TEXT_TO_VALUE_TIME
} from '../global_utils/config_for_calc_and_core';
import {
  BaseNumCellVToText,
  PercentCellVToText,
  PercentValueToTextOption,
  PlainNumCellVToText,
  PlainNumValueToTextOption,
  SciNumberCellVToText,
  SciNumberValueToTextOption
} from './cellv_to_text_num';
import { DefaultCellVToText, DefaultValueToTextOption } from './cellv_to_text_default';
import {
  DateCellVToText,
  DateValueToTextOption,
  TimeCellVToText,
  TimeValueToTextOption
} from './cellv_to_text_date';
export class ValueToTextSetting{
    valueToTextType: string
    digitNumber : number // 小数点位数
    hasComma: boolean // 无，或千分位，或百分比
    isMinusAsParen: boolean // 负号是否用括号表示
    prefix: string// 货币符号
    nonOrMinuteOrSecond: 0|1|2
    hour12: boolean
  constructor(aObj){
    Object.assign(this, aObj)
  }
}

export class ValueToTextFactory {
  createValueToTextBhv(aObj:ValueToTextSetting = {}):BaseNumCellVToText {
    if (aObj.valueToTextType === TEXT_TO_VALUE_NUMBER) {
      return this.createInstanceByCls(PlainNumCellVToText, PlainNumValueToTextOption,aObj);
    } else if (aObj.valueToTextType === TEXT_TO_VALUE_PERCENTAGE) {
      return this.createInstanceByCls(PercentCellVToText, PercentValueToTextOption,aObj);
    } else if (aObj.valueToTextType === TEXT_TO_VALUE_SCI) {
      return this.createInstanceByCls(SciNumberCellVToText, SciNumberValueToTextOption,aObj);
    } else if (aObj.valueToTextType === TEXT_TO_VALUE_DATE_TIME) {
      return this.createInstanceByCls(DateCellVToText, DateValueToTextOption,aObj);
    } else if (aObj.valueToTextType === TEXT_TO_VALUE_TIME) {
      return this.createInstanceByCls(TimeCellVToText, TimeValueToTextOption,aObj);
    } else { // 默认情况
      return this.createInstanceByCls(DefaultCellVToText, DefaultValueToTextOption,aObj);
    }
  }

  createInstanceByCls(cellVToTextCls, valueToTextOptCls,aObj) {
    return new cellVToTextCls(this.createOption(valueToTextOptCls,aObj));
  }

  createOption(cls,aObj) {
    let theOption = new cls();
    Object.assign(theOption, aObj);
    return theOption;
  }

}
