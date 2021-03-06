////////////////////////////////////  新函数 ///////////////////////////////////////////////////////
import { d18991230STR, FORCE_STR_MARK, MARK_OBJ, MONEY_UNIT_OBJ } from '../calc_utils/config';
import { FAIL_PARSE, FAIL_OBJ_PARSE } from '../calc_utils/error_config';
import { Str2NumberParser } from './parser_base';

export class ForceString {
  constructor(calcCell, strToParse) {
    this.strToParse = strToParse;
    this.calcCell = calcCell; //这里没有用到
  }

  parseString() { // asdf+as ;
    if (this.strToParse.startsWith(FORCE_STR_MARK)) {
      return this.strToParse.slice(1);
    } else {
      return FAIL_OBJ_PARSE;
    }
  }

}

export class BoolParser{ // 解析布尔值; 如果首尾有空格不会解析为布尔值
  constructor(calcCell, strToParse) {
    this.strToParse = strToParse;
    this.calcCell = calcCell; //这里没有用到
  }
  parseString() { // asdf+as ;
    let upperCaseStr = this.strToParse.toUpperCase()
    if(upperCaseStr === "TRUE"){
      return true
    }
    else if(upperCaseStr === "FALSE"){
      return false
    }
    else {
      return FAIL_OBJ_PARSE
    }
  }

}

export class DateTimeParser { // todo： 暂时不支持Jan-1这样的形式的日期字符的解析（Excel支持的）
  /**
   * @param {CalcCell} calcCell
   * @param {string} strToParse
   */
  constructor(calcCell, strToParse) {
    this.strToParse = strToParse;
    this.calcCell = calcCell; //这里没有用到
  }

  /**
   * 解析字符串
   * @return {Error|Date}
   */
  convertStrToDate() {
    let firstColonPst = this.strToParse.indexOf(MARK_OBJ.colon);
    let lastSpacePst,
      dateRes;
    if (firstColonPst > 0) { // 存在冒号
      let lastSpacePst = this.strToParse.slice(0, firstColonPst)
        .lastIndexOf(MARK_OBJ.space);
      if (lastSpacePst > 0) { // 存在date与time两个部分
        dateRes = this.convertDateStrToDate(this.strToParse.slice(0, lastSpacePst));
        if (dateRes.msg === FAIL_PARSE) {
          return FAIL_OBJ_PARSE;
        }
        let DateTimeRes = this.dealTimeString(dateRes.toLocaleDateString(), this.strToParse.slice(lastSpacePst + 1));
        if (DateTimeRes.msg === FAIL_PARSE) {
          return FAIL_OBJ_PARSE;
        }
        return DateTimeRes;
      } else { // 只存在time
        let DateTimeRes = this.dealTimeString(d18991230STR, this.strToParse.slice(lastSpacePst + 1));
        if (DateTimeRes.msg === FAIL_PARSE) {
          return FAIL_OBJ_PARSE;
        }
        return DateTimeRes;
      }
    } else {
      // 只可能存在date
      dateRes = this.convertDateStrToDate(this.strToParse.slice(0, lastSpacePst));
      if (dateRes.msg === FAIL_PARSE) {
        return FAIL_OBJ_PARSE;
      }
      return dateRes;
    }
  }

  isValidTime(aStr) {
    return /^\d+:\d+(:\d+(.\d+)?)?$/.test(aStr);
  }

  isSimpleForm(aStr) {
    return /^\d+[-/]\d+([-/]\d+)?$/.test(aStr);

  }

  isNianYueRi(aStr) {
    return /^\d+年\d+月(\d+日)?$/.test(aStr);
  }

  yearStr2Int(yearStr) {
    let theInt = parseInt(yearStr);
    // 29-2-3 ==> 2029/2/3 ; 30/2/3 ==> 1930/2/3; 100/2/3 ==> 不转换, 1899/1/1==> 不转换， 1900/1/1==> 转换
    if ((theInt >= 100 && theInt < 1900) || theInt >= 10000) {
      return FAIL_OBJ_PARSE;
    }
    return theInt;
  }

  monthStr2Int(monthStr) {
    let theInt = parseInt(monthStr);
    if (theInt >= 1 && theInt <= 12) {
      return theInt;
    }
    return FAIL_OBJ_PARSE;

  }


  convertDateStrToDate(dateStr) { // 试图解析日期； 支持-/混合切割，以及年月日切割
    let noSpaceStr = dateStr.replace(/\s+/g, ''); // 去掉所有空格
    let splitArray;
    let adjustNum = 0
    if (this.isSimpleForm(noSpaceStr)) {
      splitArray = noSpaceStr.split(/[-/]/); // 用这个做切割的；之后还要做年月日的切割
    } else {
      if (this.isNianYueRi(noSpaceStr) === false) { // 使用年月日来切割
        return FAIL_OBJ_PARSE;
      } else {
        splitArray = noSpaceStr.split(/[年月日]/);
        adjustNum = 1 //  会被切割为 ["2019","1","10",""]
      }
    }
    let theYearInt = this.yearStr2Int(splitArray[0]);
    if (theYearInt.msg === FAIL_PARSE) {
      return FAIL_OBJ_PARSE;
    }
    let theMonthInt = this.monthStr2Int(splitArray[1]);
    if (theMonthInt.msg === FAIL_PARSE) {
      return FAIL_OBJ_PARSE;
    }
    let theDayInt;
    if (splitArray.length - adjustNum === 3) {
      theDayInt = parseInt(splitArray[2]);
    } else {
      theDayInt = 1;
    }
    let theDateInstance = new Date(theYearInt, theMonthInt - 1, theDayInt);
    if (isNaN(theDateInstance)) {
      return FAIL_OBJ_PARSE;
    }
    return theDateInstance;
  }

  /**
   *
   * @param {Date} dateString
   * @param timeStr
   * @return {Error}
   */
  dealTimeString(dateString, timeStr) { // 试图解析时间
    let noSpaceStr = timeStr.replace(/\s+/g, ''); // 去掉所有空格
    if (this.isValidTime(noSpaceStr) === false) {
      return FAIL_OBJ_PARSE;
    }
    let wholeStr = dateString + ' ' + timeStr;
    let resDate = new Date(wholeStr);
    if (isNaN(resDate)) {
      return FAIL_OBJ_PARSE;
    }
    return resDate;
  }

  parseString() { // asdf+as ;
    return this.convertStrToDate();
  }
}

export class MoneyParser {
  constructor(calcCell, strToParse) {
    this.strToParse = strToParse;
    this.calcCell = calcCell; //这里没有用到
  }

  isStartWithMoneyMark() {
    return this.strToParse.startsWith(MONEY_UNIT_OBJ.dollar);
  }

  getStrToParseAsNum() { // "$  1.5  " ==> "$1.5"
    return this.strToParse.slice(1)
      .trim();
  }

  parseString() {
    if (this.isStartWithMoneyMark() === false) {
      return FAIL_OBJ_PARSE;
    }
    let newStr = this.getStrToParseAsNum();
    if (newStr.length === 0) {
      return FAIL_OBJ_PARSE;
    }
    let numParser = new Str2NumberParser(newStr);
    return numParser.easyParse2Number();
  }

}

export class NumberParser {
  constructor(calcCell, strToParse) {
    this.strToParse = strToParse;
    this.calcCell = calcCell; //这里没有用到
  }

  parseString() {
    let newStr = this.strToParse.trim();
    let multiply = 1;
    if (newStr.endsWith('%')) { // 处理百分号的逻辑
      newStr = newStr.slice(0, -1)
        .trim();
      multiply = 0.01;
    }
    let resNum = new Str2NumberParser(newStr).easyParse2Number();
    if (resNum.msg !== FAIL_PARSE) {
      return resNum * multiply;
    }
    return FAIL_OBJ_PARSE;
  }
}

