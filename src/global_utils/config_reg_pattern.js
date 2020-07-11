// jobs: todo: 正则表达式可以统一放到utils/reg_pattern.js文件中去
export const OPERATOR_PATTERN = "([(-\\/,+*，=^&])";
export const BLANK_PATTERN = "(^\\s*)|(\\s*$)";
export const SINGLE_REF_PATTERN = "^[A-Z]+\\d+$";
export const ABS_SINGLE_REF_PATTERN = "^\\$[A-Z]+\\$\\d+$";
export const RANGE_REF_PATTERN = "^[A-Za-z]+\\d+:[A-Za-z]+\\d+$";
export const ROW_ABS_SINGLE_REF_PATTERN = "^[A-Z]+\\$\\d+$";
export const COL_ABS_SINGLE_REF_PATTERN = "^\\$[A-Z]+\\d+$";

export const DATE_PATTERN = ["^(\\d{4})[-\/](\\d{1,2})[-\/](\\d{1,2})$", "^(\\d{4})年(\\d{1,2})月(\\d{1,2})日$"];
export const OLD_DATE_PATTERN = "((^((1[8-9]\\d{2})|([2-9]\\d{3}))([-\\/\\._])(10|12|0?[13578])([-\\/\\._])(3[01]|[12][0-9]|0?[1-9])$)|(^((1[8-9]\\d{2})|([2-9]\\d{3}))([-\\/\\._])(11|0?[469])([-\\/\\._])(30|[12][0-9]|0?[1-9])$)|(^((1[8-9]\\d{2})|([2-9]\\d{3}))([-\\/\\._])(0?2)([-\\/\\._])(2[0-8]|1[0-9]|0?[1-9])$)|(^([2468][048]00)([-\\/\\._])(0?2)([-\\/\\._])(29)$)|(^([3579][26]00)([-\\/\\._])(0?2)([-\\/\\._])(29)$)|(^([1][89][0][48])([-\\/\\._])(0?2)([-\\/\\._])(29)$)|(^([2-9][0-9][0][48])([-\\/\\._])(0?2)([-\\/\\._])(29)$)|(^([1][89][2468][048])([-\\/\\._])(0?2)([-\\/\\._])(29)$)|(^([2-9][0-9][2468][048])([-\\/\\._])(0?2)([-\\/\\._])(29)$)|(^([1][89][13579][26])([-\\/\\._])(0?2)([-\\/\\._])(29)$)|(^([2-9][0-9][13579][26])([-\\/\\._])(0?2)([-\\/\\._])(29)$))";

export const DASH_DATE_PATTERN = "^\\d{4}-\\d{1,2}-\\d{1,2}$";

export function str2Re(str) {
    return new RegExp(str, 'g');
}
