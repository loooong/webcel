export class BaseNumCellVToText {
  constructor(valueToTextOption) {
    this.valueToTextOption = valueToTextOption;
  }
  getLocalStringObjByDigitNumber(){
    let localeStringObj = {};
    if (this.valueToTextOption.digitNumber === -1) {
      localeStringObj = { minimumFractionDigits: 2 };
    } else {
      localeStringObj = {
        minimumFractionDigits: this.valueToTextOption.digitNumber,
        maximumFractionDigits: this.valueToTextOption.digitNumber
      };
    }
    return localeStringObj
  }

  dealANumber(aNumber) {
    return String(aNumber);
  }

  /**
   * 把单元格计算结果转化为Text
   * @param cellV
   * @return {string}
   */
  convertCellVToText(cellV) {
    let aNumber = cellV.toNumber();
    if (typeof aNumber !== 'number') {
      return cellV.toString();
    } else {
      return this.dealANumber(aNumber);
    }
  }
}


/**
 * 货币，数值
 */
export class PlainNumValueToTextOption {
  constructor(digitNumber = -1, hasComma = true, isMinusAsParen = false, prefix = '') {
    this.digitNumber = digitNumber; // 小数点位数
    this.hasComma = hasComma; // 无，或千分位，或百分比
    this.isMinusAsParen = isMinusAsParen; // 负号是否用括号表示
    this.prefix = prefix;// 货币符号
  }
}

/**
 * 用来转化为数字形式的
 * @property {PlainNumValueToTextOption} valueToTextOption
 */
export class PlainNumCellVToText extends BaseNumCellVToText {

  /**
   *
   * @return {string}
   * @param aNumber
   */
  dealANumber(aNumber) {
    // 首先处理小数点
    let localeStringObj = this.getLocalStringObjByDigitNumber()
    localeStringObj.useGrouping = this.valueToTextOption.hasComma;

    // 处理千位符号
    let str1 = aNumber.toLocaleString(undefined, localeStringObj);
    // 处理负号
    if(this.valueToTextOption.isMinusAsParen && str1[0] === "-"){
      str1 = "(" + str1.slice(1) + ")"
    }
    // 处理prefix
    return this.valueToTextOption.prefix + str1;
  }
}

/**
 * 百分比
 */
export class PercentValueToTextOption {
  constructor(digitNumber = 1) {
    this.digitNumber = digitNumber; // 小数点位数
  }
}

/**
 * 用来转化为百分比
 * @property {PercentValueToTextOption} valueToTextOption
 */
export class PercentCellVToText extends BaseNumCellVToText {
  /**
   * 把单元格计算结果转化为Text
   * @return {string}
   * @param aNumber
   */
  dealANumber(aNumber) {
    let newNumber = aNumber * 100
    let localeStringObj = this.getLocalStringObjByDigitNumber()
    localeStringObj.useGrouping = false
    let str1 = newNumber.toLocaleString(undefined, localeStringObj)
    return str1 + "%"
  }
}

/**
 * 科学计数
 */
export class SciNumberValueToTextOption {
  constructor(digitNumber = 1) {
    this.digitNumber = digitNumber; // 小数点位数
  }
}

/**
 * 用来转化为科学计数法
 * @property {SciNumberValueToTextOption} valueToTextOption
 */
export class SciNumberCellVToText extends BaseNumCellVToText {
  valueToTextOption: SciNumberCellVToText
  /**
   * 把单元格计算结果转化为Text
   * @return {string}
   * @param aNumber
   */
  dealANumber(aNumber) {
    let localeStringObj = this.getLocalStringObjByDigitNumber()
    localeStringObj.notation ="scientific"
    let str1 = aNumber.toLocaleString(undefined, localeStringObj)
    // 处理
    if(aNumber > 1 || aNumber < -1){
      str1 = str1.replace("E","E+") // 1.5E3 -> 1.5E+3
    }
    return str1

  }
}
