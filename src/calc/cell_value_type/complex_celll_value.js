import { MatrixValue } from '../calc_data_proxy/basic_matrix';
import { ERROR_NA, ERROR_VALUE, reportConvertFail, reportError } from '../calc_utils/error_config';
import { CellVTypeObj } from '../calc_utils/config';
import { CellVBool, CellVDateTime, CellVError, CellVNumber, CellVString } from '../../internal_module/basic_cell_value';

/** todo: 未来可以做成多值函数
 * @property {Array} aArray
 */
export class CellVArray {
  constructor(aArray) {
    if (aArray instanceof Array) {
      this.aArray = this.to2DArray(aArray); // 1维数组会转化为2维数组
    } else if (aArray instanceof MatrixValue || aArray instanceof CellVArray) {
      this.aArray = aArray.aArray; //属性
    } else if (['number', 'string'].includes(typeof aArray)) { // 单个数字与字符串
      this.aArray = [[aArray]];
    } else {
      throw new Error(ERROR_VALUE);
    }
    this.matrixValue = new MatrixValue(this.aArray);
    this.isCellV = true;
    this.cellVTypeName = CellVTypeObj.CellVArray;
  }

  to2DArray(aArray) {
    if (typeof aArray[0][0] === 'undefined') {
      let newArray = [];
      newArray.push(aArray);
      return newArray;
    } else {
      return aArray;
    }
  }

  applyToAll(func) {
    return this.aArray.map(f => {
      if (f instanceof Array) {
        return f.map(func);
      } else {
        return func(f);
      }
    });
  }

  toNumber() {
    return this.applyToAll(aValue => {
      let res;
      try {
        return aValue.toNumber();
      } catch (e) {
        return reportConvertFail(this);
      }
    }); // 转化为浮点数
  }

  toString() {
    return this.applyToAll(aValue => aValue.toString()); // 转化为字符串
  }// 只支持2019/01/01这样的形式； Excel中不支持直接用字符串的方式输入日期
  toDate() {
    return this.applyToAll(aValue => aValue.toDate());
  }

  convertAValueToNumberOrString(aValue) {
    if (aValue.isCellV) {
      return aValue.toNumberOrString();
    } else if (typeof aValue === 'number' || typeof aValue === 'string') {
      return aValue;
    } else {
      return new Error(ERROR_NA);
    }

  }

  toNumberOrString() {
    return this.applyToAll(aValue => this.convertAValueToNumberOrString(aValue)
    );
  }

  convertToStringAndNumberExceptEmpty() {
    return this.applyToAll(aValue => {
        if (aValue.cellVTypeName === CellVTypeObj.CellVEmpty) {
          return aValue;
        }
        return this.convertAValueToNumberOrString(aValue);
      }
    );
  }

  convertToStringAndNumberExceptEmptyBool() {
    return this.applyToAll(aValue => {
        if (aValue.cellVTypeName === CellVTypeObj.CellVEmpty || aValue.cellVTypeName === CellVTypeObj.CellVBool) {
          return aValue;
        }
        return this.convertAValueToNumberOrString(aValue);
      }
    );
  }


  exeElementOperator(other, operator) {
    return this.matrixValue.exeElementWiseOperator(other.matrixValue, operator);
  }
}

export function convertToCellV(originValue) {
  if (originValue instanceof Date) {
    return new CellVDateTime(originValue);
  } else if (typeof originValue === 'string') {
    return new CellVString(originValue);
  } else if (originValue instanceof Array) {
    return new CellVArray(originValue);
  } else if (typeof originValue === 'number' && !isNaN(originValue)) {
    return new CellVNumber(originValue);
  } else if (typeof originValue === 'boolean') { // 布尔类型
    return new CellVBool(originValue);
  } else if (originValue instanceof Error) { // 错误类型
    return new CellVError(originValue);
  }
  if (originValue.isCellV === true) {
    return originValue; // 不进行转换
  } else {
    reportError(ERROR_VALUE); // 无法返回cellV的类型
  }
}
