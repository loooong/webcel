import { CellRangeProxy } from '../../internal_module/cell_range';
import { CoreSheet } from './core_sheet_change';
import { isHave } from '../../global_utils/check_value';
import { CoreSort, ValueForSort } from './core_sort';
import { getArrayByEqualStep } from '../../global_utils/func_for_calc_core';
import { CellPstDetail } from './position_detail';
import {
  FILTER_BUTTON_HEIGHT,
  FILTER_BUTTON_WIDTH
} from '../../component/comp_table/table_canvas_comp';
import { SortFilterComp } from '../../component/comp_single_file/sort_filter';
import { myLog, PRINT_LEVEL3 } from '../../log/new_log';
// operator: all|eq|neq|gt|gte|lt|lte|in|be
// value:
//   in => []
//   be => [min, max]

export const TEXT_FILTER_ALL = 'all';
export const TEXT_FILTER_IN = 'in';
export const SORT_ASC = 'asc';
export const SORT_DESC = 'desc';
export const SORT_FAILED_OBJ = { msg: '无法对合并单元格进行排序！' };

export class CoreTextFilter { // 先只做文本筛选：根据cell的text属性来做筛选。
  ci: number; // 所在的列
  filterExpression: TEXT_FILTER_ALL | TEXT_FILTER_IN;
  allowValues: Array;

  constructor(ci, filterExpression, allowValues = []) {
    this.ci = ci;
    this.filterExpression = filterExpression;
    this.allowValues = allowValues;
  }

  updateByExpressionAndAllowValues(filterExpression, allowValues) {
    if (filterExpression === TEXT_FILTER_ALL) {
      this.filterExpression = TEXT_FILTER_ALL;
      this.allowValues = [];
    } else {
      this.filterExpression = filterExpression;
      this.allowValues = allowValues;
    }
  }

  getFilteredAllowValues(allValues: Array) {
    return this.allowValues.filter(value => allValues.includes(value));
  }

  isAllowCurText(v) {
    const { filterExpression, allowValues } = this;
    if (filterExpression === TEXT_FILTER_ALL) {
      return true;
    }
    if (filterExpression === TEXT_FILTER_IN) {
      return allowValues.includes(v);
    }
    return false;
  }

  isAllowAll() {
    return this.filterExpression === TEXT_FILTER_ALL;
  }

  // vlength() {
  //     const {operator, value} = this;
  //     if (operator === 'in') {
  //         return value.length;
  //     }
  //     return 0;
  // }

  getData() {
    const { ci, filterExpression, allowValues } = this;
    return {
      ci,
      filterExpression: filterExpression,
      allowValues: allowValues
    };
  }
}


export class SortFilterSetting {
  refA1A2Str: string;
  filterArray: Array<{ filterColID: number, filterExpr: string, allowValues: Array }>;
  sortConfig: { sortColID: number, sortOrder: string };

  constructor(aObj = {}) {
    this.refA1A2Str = '';
    this.filterArray = [];
    this.sortConfig = {};
    Object.assign(this, aObj);
  }
}

export function getCellLocByRiCi(ri, ci) {
  return [ri, ci].join('_');
}

export class SingleSortFilterDetail {
  text2Count: Object;
  coreFilter: CoreTextFilter;
  coreSort: CoreSort;
  curChoosingAllowValues: Array;
  curColID: number;

  constructor(aObj = {}) {
    Object.assign(this, aObj);
  }

  get textChoiceArray() {
    return Object.keys(this.text2Count);
  }

  isChoosingAll() {
    return this.curChoosingAllowValues.length === this.textChoiceArray.length;
  }

  initCurChoosingValues() {
    this.curChoosingAllowValues = this.coreFilter.isAllowAll() ? this.textChoiceArray : this.coreFilter.getFilteredAllowValues(this.textChoiceArray);
  }

  // ======== 更新数据
  applyToEveryTextAndCount(aFunc = (uniqueText, textCount, textID) => {
  }) {
    let textID = 0;
    for (let [uniqueText, textCount] of Object.entries(this.text2Count)) {
      aFunc(uniqueText, textCount, textID);
      textID += 1;
    }
  }

  removeTextFromChoosingArray(aText) {
    this.curChoosingAllowValues.splice(this.curChoosingAllowValues.indexOf(aText), 1);
  }

  updateChoosingArray(newValue: Array = []) {
    this.curChoosingAllowValues = newValue;
  }

  updateByNewSortOrder(newSortOrder) {
    this.coreSort.sortOrder = newSortOrder;
  }

  updateCoreFilterByChoosingArray() {
    if (this.isChoosingAll()) { // 全选
      this.coreFilter.updateByExpressionAndAllowValues(TEXT_FILTER_ALL);
    } else {
      this.coreFilter.updateByExpressionAndAllowValues(TEXT_FILTER_IN, this.curChoosingAllowValues);
    }
  }
}

export class CoreSortFilter {
  coreFilterArray: Array<CoreTextFilter>;
  coreSheet: CoreSheet;
  coreSort: CoreSort; // 只允许一列有sort
  refA1A2Str: string;
  ci2CoreFilter: Object;
  new2OldRowIDMap: Map;
  old2NewRowIDMap: Map;


  constructor(coreSheet) {
    this.coreSheet = coreSheet;
    this.refA1A2Str = '';
    this.coreSort = new CoreSort(); // 空的sort
    this.new2OldRowIDMap = new Map();
    this.old2NewRowIDMap = new Map();
  }

  // 根据setting创建类
  static fromSortFilterSetting(sortFilterSetting: SortFilterSetting, coreSheet) {
    let theCoreSortFilter = new CoreSortFilter(coreSheet);
    theCoreSortFilter.refreshBySortFilterSetting(sortFilterSetting);
    return theCoreSortFilter;
  }

  get coreFilterArray() {
    return Object.values(this.ci2CoreFilter);
  }


  // =========== 数据查询 ================
  isHaveSort() {
    return isHave(this.coreSort.sortColID);
  }

  isHaveFilter() {
    return this.coreFilterArray.length > 0;
  }

  isHaveRefRange() {
    return this.refA1A2Str !== '';
  }

  isAutoFillHead(ri, ci) {
    if (this.isSortFilterActive()) {
      return this.getHeadRange()
        .includes(ri, ci);
    }
    return false;
  }
  isClickOnSortFilterButton(firstSelectCellPst:CellPstDetail):boolean{
    if(this.isAutoFillHead(firstSelectCellPst.ri, firstSelectCellPst.ci) === false){
      return false
    }
    // 是否点击在右下角
    return firstSelectCellPst.isMousePstInRightBottom(FILTER_BUTTON_WIDTH,FILTER_BUTTON_HEIGHT)
  }



  isRowIDInFilteringRange(rowID) {
    if (this.coreSheet.exceptRowSet.size === 0) { // 没有过滤任何的row
      return false;
    } else {
      let cellRange = CellRangeProxy.fromRangeExpr(this.refA1A2Str);
      return rowID > cellRange.sri && rowID <= cellRange.eri; // 不包含首行
    }
  }


  ensureGetSortByCi(ci): CoreSort {
    if (this.coreSort.sortColID === ci) {
      return this.coreSort;
    } else {
      return new CoreSort(ci);
    }
  }

  ensureGetFilterByCi(ci): CoreTextFilter {
    return this.ci2CoreFilter[ci] || new CoreTextFilter(ci, TEXT_FILTER_ALL);
  }

  getText2CountObjByCi(ci) {
    // 获取排序后的结果
    if (this.isSortFilterActive() === false) {
      return {};
    }
    let aCoreSort = new CoreSort(ci, SORT_ASC);
    let sortedArray = aCoreSort.getSortedArrayByMultiRowAndRowIDArray(this.coreSheet.coreRows.multiCoreRow, this.getRowIDArrayExceptHeader());
    const text2Count = {};
    sortedArray.forEach(
      (valueForSort: ValueForSort) => {
        text2Count[valueForSort.cellText] = (text2Count[valueForSort.cellText] || 0) + 1;
      }
    );
    return text2Count;
  }

  getCoreRange(): CellRangeProxy {
    return CellRangeProxy.fromRangeExpr(this.refA1A2Str);
  }

  getRowIDArrayExceptHeader(): Array<number> {
    let coreRange = this.getCoreRange();
    return getArrayByEqualStep(coreRange.sri + 1, coreRange.eri - coreRange.sri);
  }

  getHeadRange(): CellRangeProxy { // 获取头部
    const r = this.getCoreRange();
    r.eri = r.sri;
    return r;
  }

  getHeaderRowID() {
    return this.getCoreRange().sri;
  }

  getCellLoc2FilterType(getNextCellLocFunc = (x) => x + 1) { // 得到cell_loc -> "all", 这样的形式
    let cellLoc2FilterType = {};
    let ci2CoreFilterObj = this.ci2CoreFilter;
    let cellRangeProxy = this.getCoreRange();
    for (let curCowID = cellRangeProxy.sci; curCowID <= cellRangeProxy.eci; curCowID = getNextCellLocFunc(curCowID)) {
      let curCellLoc = getCellLocByRiCi(cellRangeProxy.sri, curCowID);
      let curCoreFilter = ci2CoreFilterObj[curCowID];
      if (curCoreFilter) {
        cellLoc2FilterType[curCellLoc] = curCoreFilter.filterExpression;
      } else {
        cellLoc2FilterType[curCellLoc] = TEXT_FILTER_ALL;
      }
    }
    return cellLoc2FilterType;
  }

  getCellLoc2SortAscOrDesc() {
    let cellLoc2SortType = {};
    if (this.coreSort.isSortValid() === false) {
      return;
    }
    let cellLoc = getCellLocByRiCi(this.getHeaderRowID(), this.coreSort.sortColID);
    cellLoc2SortType[cellLoc] = this.coreSort.isAsc() ? 0 : 1;
    return cellLoc2SortType;
  }

  isSortFilterActive() {
    return isHave(this.refA1A2Str);
  }

  isOverlapWithMerge() {
    return this.coreSheet.multiCoreMerge.getOverlapMergeArray(this.getCoreRange()).length > 0;
  }

  isFiltersAllowCurRow(rowID): boolean {
    for (let i = 0; i < this.coreFilterArray.length; i += 1) {
      const filter = this.coreFilterArray[i];
      const formatCell = this.coreSheet.coreRows.multiCoreRow.getFormatCellByRowIDColID(rowID, filter.ci);
      let curText = isHave(formatCell) ? formatCell.getText() : '';
      if (!filter.isAllowCurText(curText)) {
        return false;
      }
    }
    return true;
  }

  // =========== 创建 SingleSortFilterDetail ===================
  getDetailForFilterCompByCi(curColID): SingleSortFilterDetail {
    let singleSortFilterDetail = new SingleSortFilterDetail();
    singleSortFilterDetail.text2Count = this.getText2CountObjByCi(curColID);
    singleSortFilterDetail.coreFilter = this.ensureGetFilterByCi(curColID);
    singleSortFilterDetail.coreSort = this.ensureGetSortByCi(curColID);
    singleSortFilterDetail.initCurChoosingValues();
    return singleSortFilterDetail;
  }

  // ========== 数据变化更新 =============
  refreshBySortFilterSetting(sortFilterSetting: SortFilterSetting) {
    this.new2OldRowIDMap = new Map();
    this.old2NewRowIDMap = new Map();
    this.refA1A2Str = sortFilterSetting.refA1A2Str;
    this.ci2CoreFilter = {};
    sortFilterSetting.filterArray.map(filterObj =>
      this.ci2CoreFilter[filterObj.filterColID] = new CoreTextFilter(filterObj.filterColID, filterObj.filterExpr, filterObj.allowValues));
    this.coreSort.updateBySortConfig(sortFilterSetting.sortConfig);
  }


  getRemoveAndAllowRowSetAfterFilter(): { removeRowSet: Set, allowRowSet: Set } {
    // const ary = [];
    // let lastSelectRi = 0;
    const removeRowSet = new Set();
    const allowRowSet = new Set();
    if (this.isSortFilterActive()) {
      const { sri, eri } = this.getCoreRange();
      for (let ri = sri + 1; ri <= eri; ri += 1) {
        if (this.isFiltersAllowCurRow(ri)) {
          allowRowSet.add(ri);
        } else {
          removeRowSet.add(ri);
        }
      }
    }

    return {
      removeRowSet,
      allowRowSet
    };
  }

  clearSortFilter() {
    this.refreshBySortFilterSetting(new SortFilterSetting()); // 清空
  }

  updateByCoreFilter(coreFilter: CoreTextFilter) {
    if (coreFilter.isAllowAll() === false) { // 确实起到筛选功能才会加入
      this.ci2CoreFilter[coreFilter.ci] = coreFilter;
    }
  }


  setSort(ci, order) {
    this.coreSort = isHave(order) ? new CoreSort(ci, order) : null;
  }

  // 对coreSheet执行sort与filter
  applyFilterAndSortToRows() {
    let coreSortFilter = this;
    if (!coreSortFilter.isSortFilterActive()) return;
    const { removeRowSet, allowRowSet } = coreSortFilter.getRemoveAndAllowRowSetAfterFilter();
    this.coreSheet.exceptRowSet = removeRowSet;
    this.new2OldRowIDMap = new Map();
    this.old2NewRowIDMap = new Map();
    const oldAry = Array.from(allowRowSet);
    if (this.isOverlapWithMerge()) {
      return SORT_FAILED_OBJ;
    }
    let sortedArray;
    if (this.coreSort.isSortValid()) {
      sortedArray = this.coreSort.getSortedArrayByMultiRowAndRowIDArray(this.coreSheet.coreRows.multiCoreRow, oldAry);
      sortedArray.forEach((valueForSort, index) => {
        this.new2OldRowIDMap.set(oldAry[index], valueForSort.oriRowID);
        this.old2NewRowIDMap.set(valueForSort.oriRowID, oldAry[index]);// oriRowID -> newRowID
      });
    } else {
      oldAry.forEach((newRowID) => { // 更新sortedRowMap与unsortedRowMap
        this.new2OldRowIDMap.set(newRowID, newRowID);// 原先的RowID替换为新的rowID;
        this.old2NewRowIDMap.set(newRowID, newRowID);
      });
    }
    myLog.myPrint(PRINT_LEVEL3, this.old2NewRowIDMap)
    return this.coreSheet.editUpdateBySortingRow(this.old2NewRowIDMap);
  }

  updateBySingleCoreSortFilter(singleSortFilterDetail: SingleSortFilterDetail) {
    this.updateByCoreFilter(singleSortFilterDetail.coreFilter);
    if (singleSortFilterDetail.coreSort.isSortValid()) {
      this.coreSort = singleSortFilterDetail.coreSort;
    }
    return this.applyFilterAndSortToRows();
  }

}
