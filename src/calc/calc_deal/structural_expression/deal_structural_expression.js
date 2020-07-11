// 这里是公式解析算法
import { StructuralExp } from '../../calc_data_proxy/exp_structural_exp';
import { RawValue } from '../../calc_data_proxy/exp_raw_value';
import {
  A1A2,
  AA,
  BOOL,
  SYN_CONTAINER,
  SYN_EXP_FN,
  MARK_OBJ,
  SYN_OPERATOR,
  SYN_RANG_REF,
  SYN_RAW_VALUE_NUM,
  SHEET1A1,
  SHEET1A1A2,
  SHEET1AA,
  SINGLE_CHAR_OPERATOR,
  SYN_SINGLE_REF,
  SYN_SPLIT_MARK,
  A1,
  SYN_RAW_VALUE_BOOL,
  SYN_RAW_VALUE_ERROR,
  SYN_UNKNOWN,
  VARIABLE_NAME_PATTERN,
  SYN_VAR_NAME,
  SYN_RAW_VALUE_STR
} from '../../calc_utils/config';
import { SUnitRangeRef } from '../../calc_data_proxy/exp_range_value';
import { SUnitRefValue } from '../../calc_data_proxy/exp_ref_value';
import { BoolParser } from '../../calc_data_proxy/parser_proxy';
import {
  ERROR_DIV0,
  ERROR_NA, ERROR_NAME,
  ERROR_SYNTAX,
  errorMsgArr,
  FAIL_PARSE
} from '../../calc_utils/error_config';
import { CellVBool, CellVEmpty, CellVError } from '../../../internal_module/basic_cell_value';
import { SyntaxStructureBuilder } from '../../../internal_module/syntax_builder_core';
import { ExpSyntaxUnitProxy } from '../../calc_data_proxy/syntax_builder_for_exp';
import { RawArray } from '../../calc_data_proxy/exp_raw_array_value';
import { CalcCell } from '../../calc_data_proxy/calc_cell';

class StackProxy {
  constructor(stackArray = []) {
    this.stackArray = stackArray;
  }

  addStack(expressionORFnExecutor) {
    this.stackArray.push(expressionORFnExecutor);
  }

  popStack() {
    return this.stackArray.pop();
  }

  isFnExecutorValid(fnExecutor) {
    let theType = typeof fnExecutor;
    return ['number', 'undefined'].includes(theType) === false;
  }

  getLastStack() {
    return this.stackArray[this.stackArray.length - 1]; // 最后一个元素
  }

  getLastExpression() {
    return this.getLastStack();
  }

  getLastFnExecutor() {
    return this.getLastStack();
  }

  isLastFnExecutorValid() {
    return this.isFnExecutorValid(this.getLastFnExecutor());
  }
}

const STATE_NAME_NORMAL = "Normal"
const STATE_NAME_STRING = "StringState";
const STATE_NAME_SHEET_NAME = "sheetName"
const STATE_STRING_MAY_END = "stringMayEnd";
const STATE_NAME_END_OPERATOR = "endOperator"

/**
 * @property {CalcCell} calcCell
 * @property {MultiCollExpFn} multiCollFn
 * @property {SyntaxStructureBuilder} synUnitBuilder
 */
export class StructuralExpressionBuilder {
  calcCell: CalcCell;
  char: string;

  constructor(calcCell, multiCollFn) {
    this.multiCollFn = multiCollFn;
    this.calcCell = calcCell;
    this.root_exp = new StructuralExp(calcCell);  // 封装公式实例
    this.root_exp.isRoot = true;
    // 下面应该是状态
    this.curExpression = this.root_exp;
    this.buffer = '';
    this.stackProxy = new StackProxy();
    this.stackProxy.addStack(this.curExpression);
    this.position_i = 0;
    this.state = this.normalState;
    this.stateName = STATE_NAME_NORMAL
    this.last_arg = '';
    this.trimmedStrDetailObj = {};
    this.lastUnitTypeArray = [];
    // ExpSyntaxUnitProxy会依赖syntax_builder_for_reference,做更细的解析
    this.synUnitBuilder = new SyntaxStructureBuilder(ExpSyntaxUnitProxy);
    this.char = '';
    this.toParseStr = ''; // 需要解析的字符串
  }

  addUseLessStringIfNotEmpty(aStr) {
    if (aStr !== '') {
      this.synUnitBuilder.addUseLessUnit(aStr);
    }
  }

  addInitContainer(char) {
    this.synUnitBuilder.addUseLessUnit(this.buffer);
    this.synUnitBuilder.addContainerUnit(char, [SYN_CONTAINER], false);
  }


  returnToNormalState(char) {
    this.state = this.normalState;
    this.stateName = STATE_NAME_NORMAL
    this.normalState(char);
  }

  // 最后的arg是否是operator
  isLastArgOperator() {
    return this.last_arg !== '' && typeof this.last_arg === 'string';
  }

  isBufferEmpty(isTrim = true) {
    if (isTrim) {
      return this.buffer.trim() === '';
    }
    return this.buffer === '';
  }

  pushOperator2ExpArgs(toAddStr) {
    this.curExpression.args.push(toAddStr);
    this.last_arg = toAddStr;
  }

  ////////////////////////// all state method
  initDoubleQuo() {
    this.state = this.stringState;
    this.stateName = STATE_NAME_STRING
    this.addInitContainer(this.char);
    this.buffer = '';
  }

  /**
   * state pattern in functional way
   */
  stringState(char) {
    if (char === MARK_OBJ.doubleQue) {
      this.state = this.stringMayEndState;
      this.stateName = STATE_STRING_MAY_END
    } else {
      this.buffer += char;
    }
  }

  dealStringEnd() {
    let theRawValue = new RawValue(this.buffer);
    this.push2ExpArgs(this.curExpression, theRawValue);
    this.synUnitBuilder.addValueToCurUnit(theRawValue, this.buffer, [SYN_RAW_VALUE_STR]);
    this.synUnitBuilder.addContainerUnit('"', [SYN_CONTAINER], true);
    this.buffer = '';
  }


  stringMayEndState(char) {
    if (char === MARK_OBJ.doubleQue) { // 两个双引号代表一个双引号
      this.buffer += MARK_OBJ.doubleQue;
      this.state = this.stringState;
      this.stateName = STATE_NAME_STRING

    } else { // 双引号之后不是双引号
      this.dealStringEnd();
      this.returnToNormalState(char);
    }
  }

  initSingleQuo(char) {
    this.buffer += char;
    this.state = this.sheetNameState;
    this.stateName = STATE_NAME_SHEET_NAME

  }

  sheetNameState(char) { // 处理单引号
    if (char === '\'') {
      this.state = this.sheetNameMayEndState;
    }
    this.buffer += char;
  }

  sheetNameMayEndState(char) {
    this.buffer += '\'';
    if (char === '\'') { // 两个单引号代表一个但引号
      this.state = this.sheetNameState;
      this.state = STATE_NAME_SHEET_NAME
    } else { // 单引号之后不是单引号，使用正常normalState进行处理
      this.returnToNormalState(char);
    }
  }

  // [注意] 在解析过程中会保留原有的空格。这个跟Excel的逻辑不太一样（Excel是不会保留无意义的空格）
  addStartSpace() {
    if (typeof this.trimmedStrDetailObj.startSpace !== 'undefined') {
      this.addUseLessStringIfNotEmpty(this.trimmedStrDetailObj.startSpace);
    }
  }

  addEndSpace() {
    if (typeof this.trimmedStrDetailObj.endSpace !== 'undefined') {
      this.addUseLessStringIfNotEmpty(this.trimmedStrDetailObj.endSpace);
    }
  }

  getTrimmedStr() {
    return this.trimmedStrDetailObj.trimmedStr;
  }

  initOperator(char) {
    if (this.isBufferEmpty(true) === false) {
      this.push2ExpArgs(this.curExpression, this.buffer, this.position_i);
      this.addStartSpace();
      this.synUnitBuilder.addValueToCurUnit(this.last_arg, this.getTrimmedStr(), this.lastUnitTypeArray);
      this.addEndSpace();
    } else if (this.isBufferEmpty(false) === false) { // 纯空格
      this.addUseLessStringIfNotEmpty(this.buffer);
    }
    this.buffer = char;
    this.state = this.endOperator;
    this.stateName = STATE_NAME_END_OPERATOR
  }

  endOperator(char) {
    if (this.buffer + char in ['>=', '<=', '<>']) { // 双元运算符
      let wholeStr = this.buffer + char;
      this.pushOperator2ExpArgs(wholeStr);
      this.synUnitBuilder.addStringToCurUnit(wholeStr, [SYN_OPERATOR]);
      this.buffer = '';
    } else {
      this.pushOperator2ExpArgs(this.buffer);// 单元运算符
      this.synUnitBuilder.addStringToCurUnit(this.buffer, [SYN_OPERATOR]);
      this.buffer = '';
      this.returnToNormalState(char);
    }
  }

  initParentheses() { // 情况1：之前是运算符或一开头就是左括号的时候this.buff为空。情况3：之前是一个字符表达式
    let fnExecutor;
    if (this.isBufferEmpty()) {
      fnExecutor = NaN;
    } else {
      this.trimmedStrDetailObj = this.getTrimmedStrDetailObj(this.buffer);
      fnExecutor = this.multiCollFn.getFnExecutorByName(this.getTrimmedStr()); // 获取expression 函数; 没有获取到怎么办？会得到一个会返回ERROR_NAME的函数
      this.addStartSpace();
      this.synUnitBuilder.addValueToCurUnit(fnExecutor, this.getTrimmedStr(), [SYN_EXP_FN]);
      this.addEndSpace();
    }
    this.synUnitBuilder.addContainerUnit(this.char, [SYN_CONTAINER]); // 加入左括号
    this.stackProxy.addStack(fnExecutor);
    this.curExpression = new StructuralExp(this.calcCell);
    this.stackProxy.addStack(this.curExpression);
    this.synUnitBuilder.createNewStack();
    this.buffer = '';
  }

  endFnArg() { // 逗号结束
    this.push2ExpArgs(this.curExpression, this.buffer, this.position_i);  // (arg1,arg2)中的arg1
    this.addStartSpace();
    this.synUnitBuilder.addValueToCurUnit(this.last_arg, this.getTrimmedStr(), this.lastUnitTypeArray);
    this.addEndSpace();
    this.stackProxy.popStack();

    this.stackProxy.getLastFnExecutor()
      .push(this.curExpression);
    this.curExpression = new StructuralExp(this.calcCell); // this.curExpression 状态变为一个新的expression
    this.stackProxy.addStack(this.curExpression);
    this.synUnitBuilder.returnToPreStack();
    this.synUnitBuilder.addStringToCurUnit(this.char, [SYN_SPLIT_MARK]);
    this.synUnitBuilder.createNewStack();
    this.buffer = '';
  }

  endParentheses() { // 小括号结束
    // 处理 （arg1， arg2）中的arg2
    let lastExp = this.stackProxy.popStack();
    if (this.isBufferEmpty() === false) { // 处理括号之前的语法单元。如果是连续两个右括号，则buffer为空
      this.push2ExpArgs(this.curExpression, this.buffer);
      this.addStartSpace();
      this.synUnitBuilder.addValueToCurUnit(this.last_arg, this.getTrimmedStr(), this.lastUnitTypeArray);
      this.addEndSpace();
    }

    let fnExecutor = this.stackProxy.popStack(); // 当前栈结束
    this.curExpression = this.stackProxy.getLastStack(); // 改变当前exp_obj的状态
    if (this.stackProxy.isFnExecutorValid(fnExecutor)) {
      fnExecutor.push(lastExp);
      this.push2ExpArgs(this.curExpression, fnExecutor, this.position_i);
    } else {
      this.push2ExpArgs(this.curExpression, lastExp, this.position_i);
    }
    this.synUnitBuilder.returnToPreStack();
    this.synUnitBuilder.addContainerUnit(this.char, [SYN_CONTAINER], true);
    this.buffer = '';
  }

  initBrace() {
    if (this.buffer.trim() !== '') {
      this.push2ExpArgs(this.curExpression, this.buffer);
    }
    this.addInitContainer(this.char);
    this.state = this.insideBrace;
    this.buffer = '';
  }

  insideBrace(char) {
    char = this.replaceChineseCharToEnChar(char); // 中英文替换
    if (char === '}') {
      let theRawArray = new RawArray(this.buffer); // 这里的buff里面可能有空格的，会在RawArray内部进行处理
      this.push2ExpArgs(this.curExpression, theRawArray);
      this.synUnitBuilder.addValueToCurUnit(this.last_arg, this.buffer, this.lastUnitTypeArray);
      this.synUnitBuilder.addContainerUnit(char, [SYN_CONTAINER], true);
      this.buffer = '';
      this.state = this.normalState; // 恢复到正常的结果
    } else {
      this.buffer += char;
    }
  }


  endWholeFormula() {
    if (this.stateName === STATE_STRING_MAY_END) { // 字符串结束
      this.dealStringEnd();
    } else if(this.stateName === STATE_NAME_END_OPERATOR){
      this.pushOperator2ExpArgs(this.buffer);// 单元运算符
      this.synUnitBuilder.addStringToCurUnit(this.buffer, [SYN_OPERATOR]);
    } else if (this.buffer !== '') {
      this.push2ExpArgs(this.curExpression, this.buffer, this.position_i); // root_exp 是一个Exp实例，这个实例会引用一个Exp数组; 最后的处理
      this.addStartSpace();
      this.synUnitBuilder.addValueToCurUnit(this.last_arg, this.getTrimmedStr(), this.lastUnitTypeArray);
      this.addEndSpace();
    }
  }

  dealSlash(char) { // 对于 / 需要特殊处理，存在#N/A与#DIV/0! 这两种情况
    let notParseStr = this.buffer + this.toParseStr.slice(this.position_i);
    let notParseStrUpper = notParseStr.toUpperCase();
    if (notParseStrUpper.startsWith(ERROR_NA) || notParseStrUpper.startsWith(ERROR_DIV0)) {
      this.buffer += char;
    } else {
      this.initOperator(char); // 判定为除号
    }
  }

  replaceChineseCharToEnChar(char) {
    let chineseCharArray = ['，', '（', '）', '｛', '｝'];
    let enCharArray = [',', '(', ')', '{', '}'];
    let theIndex = chineseCharArray.indexOf(char);
    if (theIndex !== -1) {
      this.char = enCharArray[theIndex]; // 发生变化
      return this.char;
    } else {
      return char; // 不变
    }
  }

  normalState(char) { // 处理一个字符
    char = this.replaceChineseCharToEnChar(char); // 中英文替换
    if (char === '"') {          // 双引号 --> 进入string状态
      this.initDoubleQuo();
    } else if (char === '\'') { // 单引号 --> 进入single_quote状态
      this.initSingleQuo(char);
    } else if (char === '{') { // 左大括号
      this.initBrace();
    } else if (char === '(') { // 左括号 --> 进入ini_parentheses状态
      this.initParentheses();
    } else if (char === ')') { // 右括号 --> 进入end_parentheses状态
      this.endParentheses();
    } else if (char === '/') {
      this.dealSlash(char);
    } else if (char !== '%' && Object.values(SINGLE_CHAR_OPERATOR)
      .includes(char)) { // 百分号会push2ExpArgs中解析，在运算符 --> 进入add_operation状态
      this.initOperator(char);
    } else if (char === ',' && this.stackProxy.isLastFnExecutorValid()) { // 逗号且fn_stack有函数栈， 此时应该要结束掉逗号前的哪个参数
      this.endFnArg();
    } else {
      this.buffer += char;
    }
  }

  getTrimmedStrDetailObj(astNodeStr) {
    let startSpace = '';
    let endSpace = '';
    if (astNodeStr.startsWith(' ')) {
      startSpace = astNodeStr.match(/^ +/)[0];
    }
    if (startSpace.length < astNodeStr.length && astNodeStr.endsWith(' ')) { // 可能存在全部空格的情况
      endSpace = astNodeStr.match(/ +$/)[0];
    }
    let trimmedStr = astNodeStr.slice(startSpace.length, astNodeStr.length - endSpace.length);
    return {
      startSpace: startSpace,
      endSpace: endSpace,
      trimmedStr: trimmedStr
    };
  }

  getValueByVarName(varName){
    return new RawValue(
      new Error(ERROR_NAME) //  暂时没有自定义名称
    );
  }

  str2Value(astNodeStr, calcCell, position_i) { // todo: 可以设计parseArray
    console.assert(typeof astNodeStr === 'string');
    let v;
    let trimmedStrDetailObj = this.trimmedStrDetailObj = this.getTrimmedStrDetailObj(astNodeStr);
    let boolParserRes = new BoolParser(calcCell, astNodeStr).parseString();
    if (boolParserRes.msg !== FAIL_PARSE) { // true, false --> boll 变量
      v = new RawValue(new CellVBool(boolParserRes));
      this.lastUnitTypeArray = [SYN_RAW_VALUE_BOOL];

    } else if (trimmedStrDetailObj.trimmedStr // 表示一个Range
      .replace(/\$/g, '')
      .match(/^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/)) {
      this.lastUnitTypeArray = [SYN_RANG_REF, A1A2];
      v = new SUnitRangeRef(trimmedStrDetailObj.trimmedStr
        .replace(/\$/g, ''), calcCell, position_i);

    } else if (trimmedStrDetailObj.trimmedStr // 跨sheet引用的Range
      .replace(/\$/g, '')
      .match(/^[^!]+![A-Z]+[0-9]+:[A-Z]+[0-9]+$/)) {
      this.lastUnitTypeArray = [SYN_RANG_REF, SHEET1A1A2];
      v = new SUnitRangeRef(trimmedStrDetailObj.trimmedStr
        .replace(/\$/g, ''), calcCell, position_i);

    } else if (trimmedStrDetailObj.trimmedStr // A:A 这样形式的Range
      .replace(/\$/g, '')
      .match(/^[A-Z]+:[A-Z]+$/)) {
      this.lastUnitTypeArray = [SYN_RANG_REF, AA];
      v = new SUnitRangeRef(trimmedStrDetailObj.trimmedStr
        .replace(/\$/g, ''), calcCell, position_i);

    } else if (trimmedStrDetailObj.trimmedStr // sheet1!A:A 这样形式的Range
      .replace(/\$/g, '')
      .match(/^[^!]+![A-Z]+:[A-Z]+$/)) {
      this.lastUnitTypeArray = [SYN_RANG_REF, AA, SHEET1AA];
      v = new SUnitRangeRef(trimmedStrDetailObj.trimmedStr
        .replace(/\$/g, ''), calcCell, position_i);

    } else if (trimmedStrDetailObj.trimmedStr // 单元格引用
      .replace(/\$/g, '')
      .match(/^[A-Z]+[0-9]+$/)) {
      this.lastUnitTypeArray = [SYN_SINGLE_REF, A1];
      v = new SUnitRefValue(trimmedStrDetailObj.trimmedStr
        .replace(/\$/g, ''), calcCell);

    } else if (trimmedStrDetailObj.trimmedStr // 跨sheet单元格引用
      .replace(/\$/g, '')
      .match(/^[^!]+![A-Z]+[0-9]+$/)) {
      this.lastUnitTypeArray = [SYN_SINGLE_REF, SHEET1A1];
      v = new SUnitRefValue(trimmedStrDetailObj.trimmedStr
        .replace(/\$/g, ''), calcCell);
    } else if (!isNaN(trimmedStrDetailObj.trimmedStr)) { // 纯数字
      this.lastUnitTypeArray = [SYN_RAW_VALUE_NUM];
      v = new RawValue(+trimmedStrDetailObj.trimmedStr);
    } else if (!isNaN(trimmedStrDetailObj.trimmedStr // 数字，允许百分号
      .replace(/%$/, ''))) { // 处理公式中的百分号
      this.lastUnitTypeArray = [SYN_RAW_VALUE_NUM];
      v = new RawValue(+(trimmedStrDetailObj.trimmedStr
        .replace(/%$/, '')) / 100.0);

    } else if (errorMsgArr.includes(trimmedStrDetailObj.trimmedStr.toUpperCase())) { // 错误标志，例如 #REF!, #N/A
      this.lastUnitTypeArray = [SYN_RAW_VALUE_ERROR];
      v = new RawValue(
        new Error(trimmedStrDetailObj.trimmedStr.toUpperCase())
      );
    }
      else if(VARIABLE_NAME_PATTERN.test(trimmedStrDetailObj.trimmedStr)){ // 自定义名称
      this.lastUnitTypeArray = [SYN_VAR_NAME];
      v = this.getValueByVarName(trimmedStrDetailObj.trimmedStr)
    }
    else {
      this.lastUnitTypeArray = [SYN_UNKNOWN];
      v = new RawValue(
        new Error(ERROR_NAME) //  不属于以上任何一种情况，返回#NAME! 错误
      );
    }
    return v;
  }

  push2ExpArgs(structuralExp, toAddUnit, position_i) { // 这个使用来做解析； todo：考虑把这个转移
    let curExp = structuralExp;
    if (toAddUnit !== '') {
      let v = toAddUnit;
      if (typeof toAddUnit === 'string') {
        v = this.str2Value(toAddUnit, curExp.calcCell, position_i);
      } else {
        v = toAddUnit;
      }
      curExp.args.push(v); // 只有运算符号保持string形式
      this.last_arg = v;
    }
  }


  /**
   *
   * @param {CalcCell} calcCell
   * @return {StructuralExp}
   */
  parseFormula() { // 实际的解析逻辑
    // 主执行语句在这里，上面是定义一系列方法
    this.toParseStr = this.calcCell.formulaString.slice(1); // 去掉首字符（'='）
    let toParseStr = this.toParseStr;
    if (toParseStr[0] === '{' && toParseStr[toParseStr.length - 1] === '}') { // todo: 可以转化为arrayformula
      this.push2ExpArgs(this.root_exp, new RawValue(new Error(ERROR_SYNTAX)));
      return this.root_exp;
    }
    for (; this.position_i < toParseStr.length; this.position_i++) {
      this.char = toParseStr[this.position_i];
      this.state(this.char); // 逐字符解析函数; self.state代表当前的解析状态
    }
    this.endWholeFormula();
    this.calcCell.rootSyntaxUnit = this.synUnitBuilder.rootUnit;
    return this.root_exp;
  }

}
