


export const MS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000
export const common_operations = { // todo: 需要把这个常数放到config里面
  '*': 'multiply',
  '+': 'plus',
  '-': 'subtractDays',
  '/': 'divide',
  '^': 'power',
  '&': 'concat',
  '<': 'lt',
  '>': 'gt',
  '=': 'eq'
};

export const FORMULA_STATUS = {
  created: "created",// 被修改或新建
  recalculate:"recalculate", // 需要重新计算
  working: "working",
  solved: "solved",
}

export const MARK_OBJ= { // todo: 需要把这个常数放到config里面
  percent: "%", // 单元运算符
  star : '*', //双元运算符
  plus: '+', //双元运算符
  dash: '-', //双元运算符 或单元运算符
  slash: '/', //双元运算符
  caret: '^', //双元运算符
  ampersand: '&', //双元运算符
  lessThen: '<', //双元运算符
  greaterThen: '>', //双元运算符
  equal: "=", // 双元运算符是否等于

  exclamation: '!', // ok

  leftParentheses: '(',
  rightParentheses: ')',
  comma: ',',
  leftBracket: '[',
  rightBracket: ']',
  leftBrace : '{',
  rightBrace : '}',
  colon: ":",
  hash: "#", // 可以用作溢出运算符，新的溢出功能
  at:'@', // 引用运算符，我也不是很理解
  space: " ", // 代表可以忽略的空白，或者为交集运算符
  doubleQue: '"',
};

export const MULTI_CHAR_OPERATOR ={
  notEqual: "<>",
  greaterEqual: ">=",
  lessEqual: "<=",
}

export const SINGLE_CHAR_OPERATOR ={
  percent: "%", // 单元运算符
  minus: "-", // 单元或双元运算符
  star : '*', //双元运算符
  plus: '+', //双元运算符
  slash: '/', //双元运算符
  caret: '^', //双元运算符
  ampersand: '&', //双元运算符
  lessThen: '<', //双元运算符
  greaterThen: '>', //双元运算符
  equal: "=", // 双元运算符是否等于
}

export const PRE_DEFINED_CONST={
  true: "TRUE",
  false:"FALSE"
}

export const MONEY_UNIT_OBJ = {
  dollar:"$",
}

export const FORCE_STR_MARK ="'"

// 这个日期作为日期的起点
export const d18991230 = new Date(1899, 11, 30); // js中0代表1月，11代表12月; 有误差

export const d18991230MS = -2209161600000 - 8 * 3600 * 1000 // 东八区
export const d18991230STR = "1899/12/30"
export const ALL_DIGIT_PATTERN_STR = `^\\d+$`;
export const INT_WITH_COMMA_PATTERN = /^0*[1-9]\d*(,\d{3})+$/;
export const FLOAT_WITH_COMMA_PATTERN = /^0*[1-9]\d*(,\d{3})+(\.\d+)?$/;
export const CLEAN_FLOAT_PATTERN = /^\d*(\.\d+)?$/;
export const E_PATTERN = /[eE]/;
export const TO_PARA_TYPE = { // 可以转换成的数据类型
  date: 'date',
  string: 'string',
  number: 'number'
};

export function createEmptySheets() {
  return { Sheet1: { A1: { f: '' } } }
}

export const INVALID_MATRIX = 'INVALID_MATRIX';
export const NOT_NUMBER = 'NOT_NUMBER';
export const SHAPE_DIFF = 'SHARPE_DIFF';
export const NOT_SUPPORT = 'NOT_SUPPORT';
export const EmptyMultiSheetObj = createEmptySheets();
export const NOT_CONVERT = 'NOT_CONVERT';

// 语单元类型
export const SYN_OPERATOR = 'operator';
export const SYN_SPLIT_MARK = 'split_mark';// 逗号，感叹号，冒号这样分割不同语法单元的标记
export const SYN_CONTAINER = 'op_container';// 括号双引号能包含其他单元这样的标记， 以及标志起始结尾的双引号
export const SYN_RAW_VALUE_NUM = 'raw_value_num';// 直接输入的数字。 {1,2,3}这样的矩阵属于复合型单元。
export const SYN_RAW_VALUE_STR = 'raw_value_str';// 直接输入的字符串
export const SYN_RAW_VALUE_BOOL = 'raw_value_bool';// 直接输入的布尔值
export const SYN_RAW_VALUE_ERROR = 'raw_value_error' // 直接输入的Error值
export const SYN_UNKNOWN = 'unknown' // 未知的语法单元
export const SYN_RAW_ARRAY = 'raw_array'
export const SYN_SINGLE_REF = 'single_ref';// 单一引用，associatedValue有isColAbsolute, isRowAbsolute 这样的方法
export const SYN_RANG_REF = 'range_ref';// 范围引用associatedValue有isBeginColAbsolute, isBeginRowAbsolute 这样的方法
export const SYN_USELESS = 'useless';// 被忽略的部分
export const SYN_EXP_FN = 'exp_fn';// 表达式函数
export const SYN_VAR_NAME = 'value_name';// 变量或常量的名字


export const SOLVE_FAIL_OBJ = { msg: 'solve_fail' };// 求解不成功
export const SHEET_NAME = 'sheet_name';
export const COL_NAME = 'col_name';
export const ROW_NAME = 'row_name';
export const ABSOLUTE_MARK = 'absolute_mark';
export const CellVTypeObj = {
  CellVDateTime: 'CellVDateTime',
  CellVError: 'CellVError',
  CellVEmpty: 'CellVEmpty',
  CellVNumber: 'CellVNumber',
  CellVString: 'CellVString',
  CellVHyperLink: 'CellVHyperLink',
  CellVBool: 'CellVBool',
  CellVArray: 'CellVArray',
};
export const SHEET1A1 = "sheet1!A1"
export const A1 = "A1"
export const BOOL = 'bool';
export const A1A2 = 'A1:A2';
export const SHEET1A1A2 = 'sheet1!A1:A2';
export const SHEET1AA = 'sheet1!A:A';
export const AA = 'AA';
export const REF_TYPE = {
  AA: AA,
  A1A2: "A1A2",
  A1:"A1"
}
export const DEFAULT_MAX_COL = 25;
export const DEFAULT_MAX_ROW = 999;
export const TO_DELETE = '-';
export const DEFAULT_ROW_HEIGHT = 10

// // 1、有效字符 名称中的第一个字符必须是字母、汉字、下划线 (_) 或反斜杠 (\)。名称中的其余字符可以是字母、汉字、数字、句点和下划线。
export const VARIABLE_NAME_PATTERN = /^[a-zA-Z0-9_\u4e00-\u9fa5\\][a-zA-Z0-9_\u4e00-\u9fa5.]*$/
