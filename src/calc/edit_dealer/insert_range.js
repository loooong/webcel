import { RangeLocProxy } from '../calc_data_proxy/loc_range_loc';
import { FAIL_OBJ_EDIT } from '../calc_utils/error_config';
import { isCalcResError } from '../../global_utils/func_for_calc_core';

/**
 * @property {WorkbookEditor} workbookEditor
 */
export class InsertRangeShiftRightDealer {
  constructor(workbookEditor) {
    this.workbookEditor = workbookEditor;
    this.rightOrDown = 0 // rightAndDown, 就是两个方向都会移动。
  }
  // 移动距离; 允许负值
  getShiftNumber(reqRangeProxy) {
    return (reqRangeProxy.indexArray[3] - reqRangeProxy.indexArray[1]) + 1;
  }

  getRangeLoc(reqRangeProxy, theCalcSheet) {
    return reqRangeProxy.getRangeLocToRight(theCalcSheet.maxEditableCol);
  }

  adjustMaxRowORCol(theCalcSheet, shiftRightNumber) {
    theCalcSheet.maxEditableCol += shiftRightNumber;
  }


  deleteCellByRangeProxy(theSheetID, reqRangeProxy){
    return []
  }

  preSolveBeginCellIDArray(theSheetID, reqRangeProxy){
    let theCalcSheet = this.workbookEditor.multiSheet.getSheetByID(theSheetID);
    // 获取toShiftRange
    let shiftNumber = this.getShiftNumber(reqRangeProxy);
    let toShiftRangeLoc = this.getRangeLoc(reqRangeProxy, theCalcSheet);
    let toShiftRangeProxy = new RangeLocProxy(toShiftRangeLoc);


    // 1. toShiftRange与合并单元格是cross关系的时候，会直接报错"You can't perform a paste that partially intersects a merge."
    let res = this.workbookEditor.multiMergeLoc.updateMergeFullLocAfterMove(theSheetID, shiftNumber, toShiftRangeProxy)
    if (isCalcResError(res)) { // 此时报错了
      return res;
    }
    //  批量删除的步骤，如果是插入的话不需要删除
    let beginCellIDArray = this.deleteCellByRangeProxy(theSheetID, reqRangeProxy)

    // 2.[增加maxEditableCol]此时maxEditableCol会增加 【可以采取只增加不减少的原则】
    this.adjustMaxRowORCol(theCalcSheet, shiftNumber);

    // 3.[移动单元格] 获取需要需要移动的所有的cellID，把这些cell向右移动
    let filteredObj = this.workbookEditor.multiCalcCell.getFilteredArrayObjFromRangeProxy(theSheetID, toShiftRangeProxy);
    let toMoveCellIDArray = filteredObj.cellID;
    this.workbookEditor.multiCalcCell.moveCellIDArrayInASheet(theSheetID, toMoveCellIDArray, shiftNumber, this.rightOrDown);

    // 4.[引用变化] 更新引用字符串
    let shiftRightNumber, shiftDownNumber
    if(this.rightOrDown === 0){
      [shiftRightNumber, shiftDownNumber] = [shiftNumber, 0]
    }
    else {
      [shiftRightNumber, shiftDownNumber] = [0, shiftNumber]
    }

    let beginCellIDArray2 = this.workbookEditor.multiRelation.updateFormulaByShiftRangeToMargin(toShiftRangeProxy, shiftRightNumber, shiftDownNumber)
    // 7. 根据beginCellIDArray重新计算相关的单元格。
    beginCellIDArray = beginCellIDArray.concat(beginCellIDArray2)
    return beginCellIDArray
  }


  /**
   * 在某个sheet内插入空白区域， 向右移动
   * @param sheetName
   * @param rangeLoc
   */
  easyDeal(sheetName, rangeLoc) {
    let theSheetID = this.workbookEditor.multiSheet.getIDByName(sheetName);
    if (typeof theSheetID === 'undefined') { // 没有这个名字
      return FAIL_OBJ_EDIT;
    }
    let reqRangeProxy = new RangeLocProxy(rangeLoc);
    let beginCellIDArray = this.preSolveBeginCellIDArray(theSheetID, reqRangeProxy)
    if (typeof beginCellIDArray !== 'undefined' && typeof beginCellIDArray.msg === 'string') { // 此时报错了
      return beginCellIDArray;
    }
    return this.workbookEditor.workbookSolver.recalculateByBeginCellIDArray(beginCellIDArray);
  }

}

export class InsertRangeShiftDownDealer extends InsertRangeShiftRightDealer {
  constructor(workbookEditor) {
    super(workbookEditor);
    this.rightOrDown = 1
  }

  getShiftNumber(reqRangeProxy) {
    return (reqRangeProxy.indexArray[2] - reqRangeProxy.indexArray[0]) + 1; // 移动距离
  }

  getRangeLoc(reqRangeProxy, theCalcSheet) {
    return reqRangeProxy.getRangeLocToBottom(theCalcSheet.maxEditableRow);
  }

  adjustMaxRowORCol(theCalcSheet, shiftNumber) {
    theCalcSheet.maxEditableRow += shiftNumber;
  }

}

export class DeleteRangeShiftLeftDealer extends InsertRangeShiftRightDealer{
  // 向左移动为负值
  getShiftNumber(reqRangeProxy) {
    return -(reqRangeProxy.indexArray[3] - reqRangeProxy.indexArray[1]) - 1;
  }

  getRangeLoc(reqRangeProxy, theCalcSheet) {
    return reqRangeProxy.getRangeLocToRight(theCalcSheet.maxEditableCol, false);
  }

  adjustMaxRowORCol(theCalcSheet, shiftNumber) { // 删除时不会调整sheet的最大行列
  }

  // 注意:移动Range时会覆盖oldRange,删除oldRange的情景下可以继续使用
  deleteCellByRangeProxy(theSheetID, reqRangeProxy){
    // [删除] 获取range范围内所有的cellID得到filteredCellIDArray，
    // workbookEditor.removeRelationByToCellIDArray(toDelCellIDArray, theSheetID)
    let cellRelationProxy = this.workbookEditor.multiRelation
    let filteredObj = this.workbookEditor.multiCalcCell.getFilteredArrayObjFromRangeProxy(theSheetID, reqRangeProxy);
    let toDelCellIDArray = filteredObj.cellID;
    this.workbookEditor.multiCalcCell.removeCellIDArrayFromWorkbook(toDelCellIDArray)

    // [更新引用单元格] 遍历fullLoc2CellID2RefID：如果是contain的关系，reqUnit变为#REF!,加入beginSet;
    return this.workbookEditor.multiRelation.updateFormulaByDeleteRange(reqRangeProxy)
  }

}

export class DeleteRangeShiftUpDealer extends DeleteRangeShiftLeftDealer{
  constructor(workbookEditor) {
    super(workbookEditor);
    this.rightOrDown = 1
  }
  // 向上移动为负值
  getShiftNumber(reqRangeProxy) {
    return -(reqRangeProxy.indexArray[2] - reqRangeProxy.indexArray[0]) - 1;
  }

  getRangeLoc(reqRangeProxy, theCalcSheet) {
    return reqRangeProxy.getRangeLocToBottom(theCalcSheet.maxEditableRow, false);
  }

  adjustMaxRowORCol(theCalcSheet, shiftNumber) { // 删除时不会调整sheet的最大行列
  }

}
