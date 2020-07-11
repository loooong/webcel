// 所有的算符都会转化为函数
import { ERROR_DIV0 } from '../calc_utils/error_config';
import {
  NotConvertEmptyExpFunction, OnlyNumberExpFunction,
  StringExpFunction, TryConvertToNumberExpFunction
} from './exp_fn_warp';
import { CellVTypeObj } from '../calc_utils/config';

export function opIsLessThan(a, b) {
  return a < b;
}


export function opIsGreaterThan(a, b) {
  return a > b;
}

export function opIsGreaterOrEqual(a, b) {
  return a >= b;
}

export function opIsLessOrEqual(a, b) {
  return a <= b;
}

// -- 是否相同
function opIsEqual_(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 0.001; // 可能存在浮点数的问题
  } else if (a.cellVTypeName === b.cellVTypeName === CellVTypeObj.CellVEmpty) {
    return true;
  }
  return a === b;
}
export const opIsEqual = new NotConvertEmptyExpFunction(opIsEqual_);

function opIsNotEqual_(a, b) {
  return opIsEqual_(a, b) === false;
}
export const opIsNotEqual = new NotConvertEmptyExpFunction(opIsNotEqual_);

// ---- 只允许数字的运算
function opAdd_(a, b) {
  return a + b;
}
export const opAdd = new TryConvertToNumberExpFunction(opAdd_)

function opSubtract_(a, b) {
  return a - b;
}
export const opSubtract = new TryConvertToNumberExpFunction(opSubtract_)

function opMultiply_(a, b) {
  return a * b;
}
export const opMultiply = new TryConvertToNumberExpFunction(opMultiply_)


function opDivide_(a, b) {
  if (b === 0) {
    return new Error(ERROR_DIV0);
  }
  return a / b;
}
export const opDivide = new TryConvertToNumberExpFunction(opDivide_)


function opPower_(a, b) {
  return Math.pow(a, b);
}
export const opPower = new TryConvertToNumberExpFunction(opPower_)


// ---- 转化为字符串之后再运算
function opJoinString_(a, b) {
  return String(a) + String(b);
}
export const opJoinString = new StringExpFunction(opJoinString_);
export const OPERATOR_OBJ = {
  plus: '+', //双元运算符
  dash: '-', //双元运算符 或单元运算符
  star: '*', //双元运算符
  slash: '/', //双元运算符
  caret: '^', //双元运算符
  ampersand: '&', //双元运算符
  lessThen: '<', //双元运算符
  greaterThen: '>', //双元运算符
  equal: '=', // 双元运算符是否等于
  notEqual: '<>',
  greaterEqual: '>=',
  lessEqual: '<=',
};
