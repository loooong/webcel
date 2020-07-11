import { CellVTypeObj } from './config';

export const ERROR_NULL = '#NULL!';
export const ERROR_DIV0 = '#DIV/0!';
export const ERROR_VALUE = '#VALUE!';
export const ERROR_REF = '#REF!';
export const ERROR_NAME = '#NAME?';
export const ERROR_NUM = '#NUM!';
export const ERROR_NA = '#N/A';
export const ERROR_GETTING_DATA = '#GETTING_DATA!';
export const ERROR_DATE_STR = '#DATE!';
export const ERROR_CIRCULAR = '#CIRCULA!';
export const ERROR_ERROR = '#ERROR!';
export const ERROR_SYNTAX = "#SYNTAX" // 语法错误
export const ERROR_NON_SOLVED = "NON_SOLVED"


export const FAIL_PARSE = "FAIL_PARSE"
export const FAIL_OBJ_PARSE = {msg: "FAIL_PARSE"}
export const FAIL_OBJ_EDIT = {msg: "EDIT_FAIL"} // 编辑发生错误
export const FAIL_OBJ_SELECT = {msg: "您必须选中整块的单元格才可执行此操作"}
export const FAIL_OBJ_INTERSECT_MERGE = {msg: "您可以先取消有交叉的合并单元格之后，再执行此操作。"}
export const FAIL_OBJ_INSERT_RANGE_OVERLAP = {msg: "复制区域与黏贴区域不能有重叠。"}
export const FAIL_OBJ_SHIFT_RANGE_OVERLAP_CUT_RANGE= {msg: "移动方向会打散被剪切的区域。无法执行。"}

export const MSG = "msg"

export const errorMsgArr = [ERROR_NULL, ERROR_DIV0, ERROR_VALUE, ERROR_REF, ERROR_NAME,
  ERROR_NUM, ERROR_NA, ERROR_GETTING_DATA, ERROR_DATE_STR, ERROR_CIRCULAR,
  ERROR_ERROR, ERROR_SYNTAX];

export const errorObj = {
  ERROR_NULL: new Error(ERROR_NULL),
  ERROR_DIV0: new Error(ERROR_DIV0),
  ERROR_VALUE: new Error(ERROR_VALUE),
  ERROR_REF: new Error(ERROR_REF),
  ERROR_NAME: new Error(ERROR_NAME),
  ERROR_NUM: new Error(ERROR_NUM),
  ERROR_NA: new Error(ERROR_NA),
  ERROR_GETTING_DATA: new Error(ERROR_GETTING_DATA),
  ERROR_DATE_STR: new Error(ERROR_DATE_STR),
  ERROR_CIRCULAR: new Error(ERROR_CIRCULAR),
  ERROR_ERROR: new Error(ERROR_ERROR),
  ERROR_SYNTAX: new Error(ERROR_SYNTAX),
  ERROR_NON_SOLVED: new Error(ERROR_NON_SOLVED)
};

export function reportError(errorStr){
  console.log(new Error(errorStr))
  return  new Error(errorStr)
}

export function reportConvertFail(instance){
  return {msg: "CONVERT_FAIL", instance: instance}
}

export function isValueError(value){
  if (typeof value === 'undefined') {
    return false;
  }
  return (value instanceof Error) || (value.cellVTypeName === CellVTypeObj.CellVError);
}
