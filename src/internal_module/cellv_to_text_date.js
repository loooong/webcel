const LOCALES = "zh-CN"
export class BaseDateTimeCellVToText {
  constructor(valueToTextOption) {
    this.valueToTextOption = valueToTextOption;
  }
  getLocaleOpt(){
    let optObj = {hour12: this.valueToTextOption.hour12}
    optObj.hour = TWO_DIGIT
    optObj.minute = TWO_DIGIT
    if(this.valueToTextOption.nonOrMinuteOrSecond === 2){
      optObj.second = TWO_DIGIT
    }
    return optObj

  }

  /**
   *
   * @param {Date} aDate
   * @return {string}
   */
  dealADate(aDate) {
    return String(aDate);
  }

  /**
   * 把单元格计算结果转化为Text
   * @param cellV
   * @return {string}
   */
  convertCellVToText(cellV) {
    let aDate = cellV.toDate();
    if (aDate instanceof Date) {
      return this.dealADate(aDate);
    } else {
      return cellV.toString();
    }
  }
}

export class DateValueToTextOption{
  constructor(nonOrMinuteOrSecond =0 , hour12= false) {
    this.nonOrMinuteOrSecond = nonOrMinuteOrSecond
    this.hour12 = hour12
  }

}
const TWO_DIGIT = "2-digit"
/**
 * 转化为日期
 */
export class DateCellVToText extends BaseDateTimeCellVToText{
   dealADate(aDate: Date): string {
     if(this.valueToTextOption.nonOrMinuteOrSecond === 0){
       return aDate.toLocaleString(LOCALES)
     }
     else {
       let optObj = this.getLocaleOpt()
       return aDate.toLocaleDateString(LOCALES,optObj)
     }
   }
}
export class TimeValueToTextOption{
  constructor(nonOrMinuteOrSecond =0 , hour12= false) {
    this.nonOrMinuteOrSecond = nonOrMinuteOrSecond
    this.hour12 = hour12
  }
}

/**
 * 转化为时间
 */
export class TimeCellVToText extends BaseDateTimeCellVToText{
  dealADate(aDate: Date): string {
    let optObj = this.getLocaleOpt()
    return aDate.toLocaleTimeString("en-US", optObj)
  }
}

