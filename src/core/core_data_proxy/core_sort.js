import {
  SORT_VALUE_TYPE_EMPTY,
  SORT_VALUE_TYPE_NUM,
  SORT_VALUE_TYPE_STR
} from '../../global_utils/config_for_core_and_component';
import { FormatCell } from './cell_format_cell';
import { isHave } from '../../global_utils/check_value';
import { SORT_ASC, SORT_DESC } from './core_sort_filter';
import { MultiCoreRow } from './multi_core_row';

export class ValueForSort {
  sortValueType: SORT_VALUE_TYPE_EMPTY | SORT_VALUE_TYPE_NUM | SORT_VALUE_TYPE_STR;
  sortValue: number | string;
  oriRowID: number;
  cellText:string

  constructor(aObj = {}) {
    Object.assign(this, aObj);
  }

  static fromCellAndRowID( curCell: FormatCell,rowID) {
    if (isHave(curCell) === false || curCell.getText().trim() === '') {
      return new ValueForSort({
        sortValueType: SORT_VALUE_TYPE_EMPTY,
        sortValue: '',
        cellText:"",
        oriRowID: rowID
      });
    } else if (typeof curCell.associatedCalcCell.cellObj.v.toNumber() === 'number') {
      return new ValueForSort({
        sortValueType: SORT_VALUE_TYPE_NUM,
        sortValue: curCell.associatedCalcCell.cellObj.v.toNumber(),
        cellText: curCell.textInCalcCell,
        oriRowID: rowID
      });
    } else {
      return new ValueForSort({
        sortValueType: SORT_VALUE_TYPE_STR,
        sortValue: curCell.textInCalcCell,
        cellText: curCell.textInCalcCell,
        oriRowID: rowID
      });
    }
  }
}

export class CoreSort {
  sortColID: number;
  sortOrder: string;

  constructor(sortColID, sortOrder) {
    this.sortColID = sortColID;
    this.sortOrder = sortOrder;
  }

  updateBySortConfig(sortConfig) {
    this.sortColID = sortConfig.sortColID;
    this.sortOrder = sortConfig.sortOrder;
  }

  isAsc() {
    return this.sortOrder === SORT_ASC;
  }

  isDesc() {
    return this.sortOrder === SORT_DESC;
  }

  isSortValid() {
    return isHave(this.sortOrder);
  }

  compareTwoValue(value1, value2) {
    let res = value1 - value2;
    if (this.sortOrder === SORT_ASC) return res;
    if (this.sortOrder === SORT_DESC) return res === false;
  }
  getSortedArrayByMultiRowAndRowIDArray(multiRow:MultiCoreRow, rowIDArray){
    let arrayForSort = multiRow.getArrayForSort(this.sortColID, rowIDArray)
    return this._sortArrayForSort(arrayForSort)
  }

  _sortArrayForSort(arrayForSort: Array<ValueForSort>) {
    arrayForSort.sort((value1, value2) => {
      if (value1.sortValueType === SORT_VALUE_TYPE_EMPTY || value2.sortValueType === SORT_VALUE_TYPE_EMPTY) {
        return value1.sortValueType - value2.sortValueType; // 空格排到末尾
      } else if (value1.sortValueType !== value2.sortValueType) {
        return this.isAsc() ? value1.sortValueType - value2.sortValueType : value2.sortValueType - value1.sortValueType;
      } else if (value1.sortValueType === SORT_VALUE_TYPE_NUM) {// valueType相同,数字
        return this.isAsc() ? value1.sortValue - value2.sortValue : value2.sortValue - value1.sortValue;
      } else { // 字符串比较
        return this.isAsc() ? value1.sortValue.localeCompare(value2.sortValue) : value2.sortValue.localeCompare(value1.sortValue);
      }
    });
    return arrayForSort
  }
}
