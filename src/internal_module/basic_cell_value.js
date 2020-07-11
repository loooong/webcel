import * as cf from '../calc/calc_utils/config';
import { CellVTypeObj, d18991230MS, d18991230STR } from '../calc/calc_utils/config';
import { FAIL_OBJ_PARSE } from '../calc/calc_utils/error_config';
import { dayNum2Date } from '../calc/calc_utils/parse_helper';

// ======= 基本的数据类型，与其他模块没有依赖 ==========
// 如果格式转化失败，会调用reportConvertFail方法来汇报错误
/**
 * 代表一个日期概念
 * @property {Date} dateInstance
 */
export class CellVDateTime { // 单元格值的值属性
  constructor(aDate) { // 加法, 加入天数
    this.dateInstance = aDate;
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVDateTime;
  };


  subtractOther(other) {
    // 两个日期之间的差
    console.assert(other instanceof CellVDateTime);
    return this.toNumber() - other.toNumber();
  }

  toString() { // 默认的输出
    let hour = this.dateInstance.getHours(),
      minute = this.dateInstance.getMinutes(),
      second = this.dateInstance.getSeconds();
    if (this.toTotalSeconds(hour, minute, second) > 5) {
      let curStr = this.dateInstance.toLocaleDateString('Chinese') + ` ${hour}:${minute}`;
      if (second > 0.01) {
        curStr = curStr + `:${second}`;
      }
      return curStr;
    }
    return this.dateInstance.toLocaleDateString('Chinese');
  }

  toNumber() { // 转化为数字，逻辑与Excel保持一致
    let diff = (this.dateInstance.getTime() - d18991230MS);
    return diff / cf.MS_PER_DAY;
  }

  toDate() {
    return this.dateInstance;
  }

  toTotalSeconds(hour, minute, second) {
    return hour * 3600 + minute * 60 + second;
  }

  toNumberOrString() {
    return this.toNumber();
  }

  /**
   *
   * @return {CellVEmpty}
   */
  getACopy() {
    return new CellVEmpty(this.dateInstance);
  }
}

/**
 * 代表一个Error
 * @property {Error} errInstance
 */
export class CellVError {
  constructor(errInstance) {
    this.err = errInstance; //
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVError;
  }

  toNumber() {
    return this.err; // 报错
  }

  toString() {
    return this.err.message; // 把error信息拿到
  }

  toDate() {
    return this.err; // 报错
  }

  toObject() {
    return {
      msg: this.err.message,
      isError: true
    }; // 转化为一个objct
  }

  toNumberOrString() {
    return this.toString();
  }

}

/**
 * 代表一个空值，空值在运算的时候可以转化为0，或一个空字符串，或者在average中不进入计算
 */
export class CellVEmpty {
  constructor() {
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVEmpty;
  }

  toString() {
    return '';
  }

  toNumber() {
    return 0;
  }

  toDate() {
    return new Date(d18991230STR);
  }

  toNumberOrString() {
    return this.toNumber();
  }

}

/**
 * @property {Number} number
 */
export class CellVNumber {
  constructor(aNum) {
    this.number = aNum;
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVNumber;
  }

  toNumber() {
    return this.number;
  }

  toString() {
    return String(parseFloat(this.number.toPrecision(6))); // 转化为字符串,保留6位有效数字，去掉末尾的0
  }

  toStringWithDecimal(decimal_num = 2) {
    return this.number.toFixed(decimal_num);// 转化为字符串,保留decimal_num那么位小数
  }

  toDate() { // 转化日期
    return dayNum2Date(this.number);
  }

  toNumberOrString() {
    return this.toNumber();
  }

}

/**
 * @property {String} theString
 */
export class CellVString {
  constructor(aString) {
    this.theString = aString;
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVString;
  }

  toNumber() {
    let theRes = parseFloat(this.theString); // 转化为浮点数
    // "12+"这样的形式也会被parseFloat
    return isNaN(theRes) || (theRes.toString() !== this.theString) ? FAIL_OBJ_PARSE : theRes;
  }

  toString() {
    return this.theString; // 转化为字符串
  }// 只支持2019/01/01这样的形式； Excel中不支持直接用字符串的方式输入日期

  toDate() {
    let theDate = Date(this.theString);
    return isNaN(theDate.getTime()) ? FAIL_OBJ_PARSE : theDate;
  }

  toNumberOrString() {
    return this.toString();
  }

}

/**
 * 代表一个超链接类型
 */
export class CellVHyperLink {
  constructor(linkStr, showStr = '') {
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVHyperLink;
    this.linkStr = linkStr;
    if (showStr === '') {
      this.showStr = linkStr;
    } else {
      this.showStr = showStr;
    }
  }

  toString() {
    return this.showStr;
  }

  toNumber() {
    let res = parseInt(this.showStr);
    return isNaN(res) ? FAIL_OBJ_PARSE : res;
  }

  toDate() {
    let res = dayNum2Date(this.toNumber());
    return isNaN(res) ? FAIL_OBJ_PARSE : res;
  }

  joinWithStr(aStr) {
    this.showStr = this.showStr + aStr;
    this.linkStr = this.linkStr + aStr;
  }

  toNumberOrString() {
    return this.toString();
  }

}

/**
 * @property {Boolean} aBool
 */
export class CellVBool {
  constructor(aBool) {
    this.aBool = aBool;
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVBool;


  }

  toNumber() {
    return this.aBool ? 1 : 0;
  }

  toString() {
    return this.aBool.toString()
      .toUpperCase();
  }

  toDate() {
    return dayNum2Date(this.toNumber());
  }

  toNumberOrString() {
    return this.toNumber();
  }

}


