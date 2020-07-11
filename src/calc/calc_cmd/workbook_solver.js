import { FORMULA_STATUS } from '../calc_utils/config';
import { MySet } from '../calc_data_proxy/basic_myset';
import { isCalcResError } from '../../global_utils/func_for_calc_core';

export class WorkbookSolver {
  constructor(workbookEditor) {
    this.workbookEditor = workbookEditor;
    this.calcWorkbook = this.workbookEditor.calcWorkbook;
  }


  getEndFullLocSet(beginLocArray) {
// 获取更新过的fullLocStr集合。记为beginSet，使用递归的方法，获得会被beginSet影响到的单元格,得到endSet
    let incrementalSet = new MySet(beginLocArray);
    let dependentFullLocSet;
    let endFullLocSet = incrementalSet;
    while (true) {
      let cellID2RefSyntaxUnit = this.workbookEditor.multiRelation.getDependentCellID2RefUnitArray(incrementalSet);
      let toAddFullLocArray = this.workbookEditor.multiCalcCell.getFullLocArrayByIDArray(Object.getOwnPropertyNames(cellID2RefSyntaxUnit));
      dependentFullLocSet = new MySet(toAddFullLocArray);
      incrementalSet = dependentFullLocSet.getDiff(endFullLocSet);
      if (incrementalSet.size === 0) {
        break;
      }
      endFullLocSet = endFullLocSet.getUnion(incrementalSet);
    }
    return endFullLocSet;
  }
  // 获取引用了preRefLocArray的所有单元格的fullLoc信息
  getDependentFullLocArrayByPreLocArray(preRefLocArray:Array<string>):Array<string>{
    let cellID2RefSyntaxUnit = this.workbookEditor.multiRelation.getDependentCellID2RefUnitArray(preRefLocArray);
    return  this.workbookEditor.multiCalcCell.getFullLocArrayByIDArray(Object.getOwnPropertyNames(cellID2RefSyntaxUnit));
  }
  // =============== 重新计算 ============

  recalculateByCalcCellArray(calcCellArray) { // 核心的计算引擎; formulas是数组，应该转化为cellFormula类。
    for (let i = calcCellArray.length - 1; i >= 0; i--) { // 遍历所有需要计算的formulas; 从后向前遍历
      try {
        let calcCell = calcCellArray[i];
        /**
         * @type {CalcCell} calcCell
         */
        if (calcCell.check_valid() !== true) {//如果公式不合法
          throw Error('not a valid formula');
        } else {
          calcCell.execFormula(); // 核心方法，执行公式
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  /**
   *
   * @param beginCellIDArray
   */
  recalculateByBeginCellIDArray(beginCellIDArray) {
    // 先去重
    let uniqueBeginCellIDArray = Array.from(new Set(beginCellIDArray)); // 去重
    let beginCellLocArray = this.workbookEditor.multiCalcCell.getFullLocArrayByIDArray(uniqueBeginCellIDArray);
    let endCellLocArray = this.getEndFullLocSet(beginCellLocArray);
    return this.recalculateEndFullLocSet(beginCellLocArray, endCellLocArray);
  }

  recreateByBeginCellIDArray(beginCellIDArray) {
    // 先去重
    let uniqueBeginCellIDArray = Array.from(new Set(beginCellIDArray)); // 去重
    let beginCellLocArray = this.workbookEditor.multiCalcCell.getFullLocArrayByIDArray(uniqueBeginCellIDArray);
    let endCellLocArray = this.getEndFullLocSet(beginCellLocArray);
    return this.recreateEndFullLocSet(endCellLocArray);
  }

  recreateByBeginFullLocArray(beginFullLocArray) {
    // 先去重
    let uniqueBeginFullLocArray = Array.from(new Set(beginFullLocArray)); // 去重
    let endCellLocArray = this.getEndFullLocSet(uniqueBeginFullLocArray);
    return this.recreateEndFullLocSet(endCellLocArray);
  }



  /**
   * beginLocArray指向的单元格状态变为created，endFullLocSet与beginLocArray的差集指向的单元格，
   * 状态变为recalculate
   * @param beginLocArray
   * @param endFullLocSet
   * @return {Array}
   */
  recalculateEndFullLocSet(beginLocArray, endFullLocSet) {
    let calcCellArray = [];
    endFullLocSet.forEach((fullLoc) => {
        let curCalcCell = this.workbookEditor.multiCalcCell.getCellByFullLoc(fullLoc);
        calcCellArray.push(curCalcCell);
        curCalcCell.cellStatus = beginLocArray.includes(fullLoc) ?
          FORMULA_STATUS.created : FORMULA_STATUS.recalculate;
      }
    );
    this.recalculateByCalcCellArray(calcCellArray);
    return calcCellArray;
  }

  /**
   * endFullLocSet指向的所有的单元格状态变为created
   * @param endFullLocSet
   * @return {Array}
   */
  recreateEndFullLocSet(endFullLocSet) {
    let calcCellArray = [];
    endFullLocSet.forEach((fullLoc) => {
        let curCalcCell = this.workbookEditor.multiCalcCell.getCellByFullLoc(fullLoc);
        calcCellArray.push(curCalcCell);
        curCalcCell.cellStatus = FORMULA_STATUS.created;
      }
    );
    this.recalculateByCalcCellArray(calcCellArray);
    return calcCellArray;
  }
  // rowIDArray 中的行被重新排序了
  updateByMovedRowIDArray(sheetID, reSortedRowIDArray){
    // 得到引用了这个rowID的单元格作为beginLocArray
    let fullLocArray = this.workbookEditor.multiSheet.getRefLocArrayByRowIDArray(sheetID, reSortedRowIDArray)
    if (isCalcResError(fullLocArray)) {
      return fullLocArray;
    }
    let beginLocArray = this.getDependentFullLocArrayByPreLocArray(fullLocArray)
    // 重新计算
    return this.recreateByBeginFullLocArray(beginLocArray)
  }


}
