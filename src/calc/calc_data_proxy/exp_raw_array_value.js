import { SYN_RAW_ARRAY } from '../calc_utils/config';
import { RawValueParser } from './parser_base';
import { ERROR_SYNTAX, FAIL_PARSE } from '../calc_utils/error_config';
import { CellVError } from '../../internal_module/basic_cell_value';

/**
 * 直接写出来的数组，例如：{1,3,4}
 */
export class RawArray {
  constructor(rawStr) { // "1,3" 或 1,3;3,4
    this.rawStr = rawStr;
    this.cellVError = null;
    this.solution = null;
    this.unitType = SYN_RAW_ARRAY;
  }

  parse2Array() {
    let rowStrArray = this.rawStr.split(';');
    return rowStrArray.map((rowStr) => {
        let elementStrArray = rowStr.split(',');
        let elementArray = elementStrArray.map((elementStr) => {
          let res = new RawValueParser(elementStr).parse2NumberOrString();
          this.cellVError = res === FAIL_PARSE ? new CellVError(new Error(ERROR_SYNTAX)) : this.cellVError; // 解析出错时返回错误
          return res;
        });
        return elementArray;
      }
    );
  }

  solveExpression() { // 得到结果
    let res = this.parse2Array();
    if (this.cellVError instanceof CellVError) {
      return this.cellVError;
    }
    this.solution = res;
    return res;
  }
}
