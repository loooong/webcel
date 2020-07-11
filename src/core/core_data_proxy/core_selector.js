import { CellRangeProxy } from '../../internal_module/cell_range';
import { getSortedArray } from '../../global_utils/func_for_calc_core';
import { myLog, PRINT_LEVEL2, PRINT_LEVEL3 } from '../../log/new_log';
import { CoreSheet } from './core_sheet_change';
import { RangePstDetail, RelativePstDetail } from './position_detail';
import { EditingFormatCell } from './cell_editing_cell';
import { isHave } from '../../global_utils/check_value';

// 对一个选择框的数据结构逻辑的封装
export class CoreSelectorProxy {
  ciOfEditingCell: number; // 这里的ri，ci代表是firstSelectCell的ri 与 ci
  riOfEditingCell: number; // 如果存在autoFilter，代表可视范围内的行序号viewRi
  firstSelectMerge: CellRangeProxy;
  selectedCoreRange: CellRangeProxy;
  coreSheet: CoreSheet;

  constructor(coreSheet) {
    this.coreSheet = coreSheet;
    this.riOfEditingCell = 0; //
    this.ciOfEditingCell = 0;
    this.selectedCoreRange = new CellRangeProxy(0, 0, 0, 0);
    this.firstSelectMerge = new CellRangeProxy(0, 0, 0, 0);
    this.isSelecteAllCol = false;
    this.isSelectAllRow = false;
  }

  getFirstSelectMergeRangePstDetail(): RangePstDetail {
    return this.coreSheet.tableViewForEvent.getRangePstDetailNew(this.coreSheet.coreSelector.firstSelectMerge);
  }

  getWholeSelectedRangePstDetail(): RangePstDetail {
    return this.coreSheet.tableViewForEvent.getRangePstDetailNew(this.selectedCoreRange);
  }

  getEditingRi() {
    return this.firstSelectMerge.sri;
  }

  getEditingCi() {
    return this.firstSelectMerge.sci;
  }

  createEditingFormatCell(): EditingFormatCell {
    return this.coreSheet.coreRows.multiCoreRow.createEditingFormatCellByRiCi(this.getEditingRi(), this.getEditingCi());
  }

  updateByNegativeRiCi(ri, ci) { // ri 与ci其中有一个小于0
    if (ri < 0 && ci < 0) {
      // 全选
      this.updateByFirstSelectCell(0, 0);
      this.isSelecteAllCol = true;
      this.isSelectAllRow = true;
      this.selectedCoreRange.eri = this.coreSheet.coreRows.maxRowID;
      this.selectedCoreRange.eci = this.coreSheet.coreCols.maxColID;
      return true;
    } else if (ri < 0) {
      // 选择一列
      this.updateByFirstSelectCell(0, ci);
      this.isSelectAllRow = true;
      this.selectedCoreRange.eri = this.coreSheet.coreRows.maxRowID;
      return true;
    } else if (ci < 0) {
      // 选择一行
      this.updateByFirstSelectCell(ri, 0);
      this.isSelecteAllCol = true;
      this.selectedCoreRange.eci = this.coreSheet.coreCols.maxColID;
      return true;
    }
  }

  _updateRiCiOfFirstSelectCell(ri, ci) {
    this.firstSelectMerge = this.coreSheet.multiCoreMerge.getMergeRangeByCellPst(ri, ci);
    this.riOfEditingCell = this.firstSelectMerge.sri;
    this.ciOfEditingCell = this.firstSelectMerge.sci;
  }


  updateExpandKernelRangeByShiftArray(shiftArray) { // shiftArray是在视图上的变动大小,
    let newRange: CellRangeProxy;
    // 获取起始位置
    let nextRi = shiftArray[0] === 1 ? this.selectedCoreRange.sri : this.selectedCoreRange.eri;
    let nextCi = shiftArray[1] === 1 ? this.selectedCoreRange.sci : this.selectedCoreRange.eci;
    let kernelColRange = this._getExpandedMergeRangeByLastSelectCi(this.ciOfEditingCell, this.ciOfEditingCell);
    let kernelRowRange = this._getExpandedMergeRangeByLastSelectRi(this.riOfEditingCell, this.riOfEditingCell);
    if (shiftArray[1] === 1 && kernelColRange.isCellPstInside(this.selectedCoreRange.sri, this.selectedCoreRange.sci)) {
      nextCi = this.selectedCoreRange.eci;
    } else if (shiftArray[1] === -1 && kernelColRange.isCellPstInside(this.selectedCoreRange.sri, this.selectedCoreRange.eci)) {
      nextCi = this.selectedCoreRange.sci;
    } else if (shiftArray[0] === 1 && kernelRowRange.isCellPstInside(this.selectedCoreRange.sri, this.selectedCoreRange.sci)) {
      nextRi = this.selectedCoreRange.eri;
    } else if (shiftArray[0] === -1 && kernelRowRange.isCellPstInside(this.selectedCoreRange.eri, this.selectedCoreRange.sci)) {
      nextRi = this.selectedCoreRange.sri;
    }
    let preRi = nextRi;
    let preCi = nextCi;
    let preRangeAndNewRange = [this.selectedCoreRange.getCopy(), this.selectedCoreRange.getCopy()];

    while (true) {
      if ([-1, 1].includes(shiftArray[0])) {
        nextRi = this.coreSheet.tableViewForEvent.getNextRowID(preRi, shiftArray[0]);
        if (nextRi < 0 || nextRi > this.coreSheet.coreRows.maxRowID) {
          break; // 此时range不发生变化
        } else {
          // 新的Range必须与之前的range不同才行; 否则还需要继续获取
          newRange = this._getExpandedMergeRangeByLastSelectRi(nextRi, undefined, shiftArray[0]);
        }
      } else if ([-1, 1].includes(shiftArray[1])) {
        nextCi = this.coreSheet.tableViewForEvent.getNextColID(preCi, shiftArray[1]);
        if (nextCi < 0 || nextCi > this.coreSheet.coreCols.maxColID) {
          break; // 此时range不发生变化
        } else {
          // 新的Range必须与之前的range不同才行; 否则还需要继续获取
          newRange = this._getExpandedMergeRangeByLastSelectCi(nextCi, undefined, shiftArray[1]);
        }
      }
      if (newRange.isEqualWithOther(this.selectedCoreRange) === false) {
        preRangeAndNewRange[1] = newRange;
        this.selectedCoreRange = newRange;
        break;
      } else {
        preRi = nextRi;
        preCi = nextCi;
      }
    }
    return preRangeAndNewRange;
  }

  updateByFirstSelectCellShiftInView(shiftArray) { // shiftArray是在视图上的变动大小,
    let nextRi = this._getRawNextRi(shiftArray[0]);
    let nextCi = this._getRawNextCi(shiftArray[1]);
    let newRi = nextRi < 0 || nextRi > this.coreSheet.coreRows.maxRowID ? this.riOfEditingCell : nextRi;
    let newCi = nextCi < 0 || nextCi > this.coreSheet.coreCols.maxColID ? this.ciOfEditingCell : nextCi;
    return this.updateByFirstSelectCell(newRi, newCi);
  }


  _getRawNextCi(shiftValue, preCi) {
    let nextCi = -1;
    if (shiftValue === 1) {
      nextCi = this.coreSheet.tableViewForEvent.getNextColID(preCi || this.firstSelectMerge.eci, shiftValue);
    } else if (shiftValue === -1) {
      nextCi = this.coreSheet.tableViewForEvent.getNextColID(preCi || this.firstSelectMerge.sci, shiftValue);
    }
    return nextCi;
  }

  _getRawNextRi(shiftValue, preRi) {
    let nextRi = -1;
    if (shiftValue === 1) {
      nextRi = this.coreSheet.tableViewForEvent.getNextRowID(preRi || this.firstSelectMerge.eri, shiftValue);
    } else if (shiftValue === -1) {
      nextRi = this.coreSheet.tableViewForEvent.getNextRowID(preRi || this.firstSelectMerge.sri, shiftValue);
    }
    return nextRi;
  }

  updateByFirstSelectCell(ri, ci) {
    if (ri < 0 || ci < 0) {
      throw  new Error('ri，ci不能为负数');
    }
    this._updateRiCiOfFirstSelectCell(ri, ci);
    this.selectedCoreRange = this.firstSelectMerge.getCopy();
    this.isSelecteAllCol = false;
    this.isSelectAllRow = false;
    return this.firstSelectMerge;
  }

  // 按回车键，会移动editingCell
  updateEditingCellUpOrDown(isUp: Boolean) {
    let shiftValue = isUp ? -1 : 1;
    if (this.firstSelectMerge.isEqualWithOther(this.selectedCoreRange)) {
      this.updateByFirstSelectCellShiftInView([shiftValue, 0]);
    } else { // this.selectedCoreRange不动，editingCell会动
      let nextRi = this._getRawNextRi(shiftValue);
      let nextCi = this.ciOfEditingCell;
      while (true) {
        if (nextRi < this.selectedCoreRange.sri) {
          nextRi = this.selectedCoreRange.eri;
          nextCi = nextCi === this.selectedCoreRange.sci ? this.selectedCoreRange.eci : this._getRawNextCi(-1,nextCi);
        } else if (nextRi > this.selectedCoreRange.eri) {
          nextRi = this.selectedCoreRange.sri;
          nextCi = nextCi === this.selectedCoreRange.eci ? this.selectedCoreRange.sci : this._getRawNextCi(1,nextCi);
        }
        let theMerge = this.coreSheet.multiCoreMerge.getMergeRangeByCellPst(nextRi, nextCi);
        if (theMerge.sri === nextRi && theMerge.sci === nextCi) { // 如果单元格在合并范围内，且不是左上角，会被跳过
          break;
        }
        nextRi = this._getRawNextRi(shiftValue, nextRi);
      }
      this._updateRiCiOfFirstSelectCell(nextRi, nextCi);
    }
  }

  // 按Tab键，会移动editingCell
  updateEditingCellLeftOrRight(isLeft: Boolean) {
    let shiftValue = isLeft ? -1 : 1;
    if (this.firstSelectMerge.isEqualWithOther(this.selectedCoreRange)) {
      this.updateByFirstSelectCellShiftInView([0, shiftValue]);
    } else { // this.selectedCoreRange不动，editingCell会动
      let nextRi = this.riOfEditingCell;
      let nextCi = this._getRawNextCi(shiftValue);
      while (true) {
        if (nextCi < this.selectedCoreRange.sci) {
          nextCi = this.selectedCoreRange.eci;
          nextRi = nextRi === this.selectedCoreRange.sri ? this.selectedCoreRange.eri : this._getRawNextRi(-1,nextRi);
        } else if (nextCi > this.selectedCoreRange.eci) {
          nextCi = this.selectedCoreRange.sci;
          nextRi = nextRi === this.selectedCoreRange.eri ? this.selectedCoreRange.sri : this._getRawNextRi(1,nextRi);
        }
        let theMerge = this.coreSheet.multiCoreMerge.getMergeRangeByCellPst(nextRi, nextCi);
        if (theMerge.sri === nextRi && theMerge.sci === nextCi) {
          break;
        }
        nextCi = this._getRawNextCi(shiftValue, nextCi);
      }
      this._updateRiCiOfFirstSelectCell(nextRi, nextCi);
    }
  }

  updateRelativePst(relativePst: RelativePstDetail) {
    let { cellRi, cellCi } = this.coreSheet.tableViewForEvent.getCellPstByMovePst(relativePst); // 获取当前鼠标所在的单元格行列坐标
    this.updateByLastSelectCell(cellRi, cellCi);
  }

  updateBySelectAllCol() {
    this.updateByLastSelectCi(this.coreSheet.coreCols.maxColID);
    this.updateByLastSelectCi(0);
  }

  _getExpandedMergeRangeByLastSelectRiCi(ri, ci) {
    let [sri, eri] = getSortedArray([ri, this.riOfEditingCell]);
    let [sci, eci] = getSortedArray([ci, this.ciOfEditingCell]);
    return this.coreSheet.multiCoreMerge.expandToIncludeCrossMergeRange(new CellRangeProxy(sri, sci, eri, eci,));
  }

  _getExpandedMergeRangeByLastSelectCi(ci, otherCi, shiftValue = -1): CellRangeProxy {
    let { sri, eri } = this.selectedCoreRange;
    if (isHave(otherCi) === false) {
      if (shiftValue === -1) {
        otherCi = ci >= this.ciOfEditingCell ? this.selectedCoreRange.sci : this.selectedCoreRange.eci;
      } else {
        otherCi = ci > this.ciOfEditingCell ? this.selectedCoreRange.sci : this.selectedCoreRange.eci;
      }
    }
    let [sci, eci] = getSortedArray([ci, otherCi]);
    return this.coreSheet.multiCoreMerge.expandToIncludeCrossMergeRange(new CellRangeProxy(sri, sci, eri, eci,));
  }

  _getExpandedMergeRangeByLastSelectRi(ri, otherRi, shiftValue = -1): CellRangeProxy {
    if (isHave(otherRi) === false) {
      if (shiftValue === -1) {
        otherRi = ri >= this.riOfEditingCell ? this.selectedCoreRange.sri : this.selectedCoreRange.eri;
      } else {
        otherRi = ri > this.riOfEditingCell ? this.selectedCoreRange.sri : this.selectedCoreRange.eri;
      }
    }
    let [sri, eri] = getSortedArray([ri, otherRi]);
    let { sci, eci } = this.selectedCoreRange;
    return this.coreSheet.multiCoreMerge.expandToIncludeCrossMergeRange(new CellRangeProxy(sri, sci, eri, eci,));
  }

  updateByLastSelectCi(ci) {
    this.selectedCoreRange = this._getExpandedMergeRangeByLastSelectCi(ci);
  }

  updateByLastSelectRi(ri) {
    this.selectedCoreRange = this._getExpandedMergeRangeByLastSelectRi(ri);
  }


  updateByLastSelectCell(lastRi, lastCi) { // 转移到coreSelector中去
    let lastRiNew = lastRi < 0 ? 0 : lastRi;
    let lastCiNew = lastCi < 0 ? 0 : lastCi;
    // row index
    if (this.isSelectAllRow === false && this.isSelecteAllCol === false) {
      this.selectedCoreRange = this._getExpandedMergeRangeByLastSelectRiCi(lastRiNew, lastCiNew);
    } else if (this.isSelecteAllCol === false) {
      let [sci, eci] = getSortedArray([lastCiNew, this.ciOfEditingCell]);
      this.selectedCoreRange.sci = sci;
      this.selectedCoreRange.eci = eci;
    } else if (this.isSelectAllRow === false) {
      let [sri, eri] = getSortedArray([lastRiNew, this.riOfEditingCell]);
      this.selectedCoreRange.sri = sri;
      this.selectedCoreRange.eri = eri;
    }
    return this.selectedCoreRange;
  }

}
