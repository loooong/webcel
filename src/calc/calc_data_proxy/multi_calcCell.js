import { RefLocStrProxy } from './loc_full_loc';
import { FORMULA_STATUS } from '../calc_utils/config';
import { CalcCell } from './calc_cell';
import { RangeLocProxy } from './loc_range_loc';
import { isHave } from '../../global_utils/check_value';
import { FAIL_OBJ_EDIT } from '../calc_utils/error_config';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';

export class MultiCalcCell {
  constructor(workbookEditor, cellID2CalcCell = {}, sheetID2CellLoc2CellID = {}) {
    this.workbookEditor = workbookEditor
    this.cellID2CalcCell = cellID2CalcCell;
    this.sheetID2CellLoc2CellID = sheetID2CellLoc2CellID
    this.curCellID = 0;
  }
  clearContent(isDeleteSheetID = true){
    this.cellID2CalcCell = {};
    this.curCellID = 0;
    if(isDeleteSheetID){
      this.sheetID2CellLoc2CellID = {}
    }
    else {
      Object.keys(this.sheetID2CellLoc2CellID).forEach((sheetID) =>this.sheetID2CellLoc2CellID[sheetID] = {})
    }
  }

  // ==== 查询 ==========
  getCellLoc2CellIDBySheetID(sheetID){
    return this.sheetID2CellLoc2CellID[sheetID]
  }
  getCellByID(cellID) {
    return this.cellID2CalcCell[cellID];
  }
  getCellBySheetIDAndCellLoc(sheetID, cellLoc):CalcCell{
    if(this.sheetID2CellLoc2CellID.hasOwnProperty(sheetID) === false){
      throw new Error("指定sheetID不存在", sheetID)
    }
    let cellID = this.sheetID2CellLoc2CellID[sheetID][cellLoc]
    return this.cellID2CalcCell[cellID]
  }



  getFilteredArrayObjFromRangeProxy(theSheetID, toMergeRangeProxy) {
    let cellID;
    let filteredCellIDArray = [];
    let filteredCellLocArray = [];
    toMergeRangeProxy.forEachCellLoc(
      cellLoc => {
        cellID = this.getIDBySheetIDAndCellLoc(theSheetID, cellLoc);
        if (typeof cellID !== 'undefined') {
          filteredCellIDArray.push(cellID); // 如果cellLoc对应的cellID不存在，则不会放入cellIDArray
          filteredCellLocArray.push(cellLoc);
        }
      }
    );
    return {
      cellID: filteredCellIDArray,
      cellLoc: filteredCellLocArray
    };
  }


  getIDBySheetIDAndCellLoc(sheetID, cellLoc){
    return this.sheetID2CellLoc2CellID[sheetID][cellLoc]
  }


  getCellArrayByIDArray(cellIDArray) {
    let self = this;
    return cellIDArray.map(cellID => self.cellID2CalcCell[cellID]);
  }

  getFullLocArrayByIDArray(cellIDArray) {
    let self = this;
    return cellIDArray.map(cellID => {
        let calcCell = this.cellID2CalcCell[cellID];
        return calcCell.getFullLocStr();
      }
    );
  }
  /**
   * 通过fullLoc字符串来获取calcCell
   * @param {String} fullLoc
   */
  getCellByFullLoc(fullLoc) {
    let refStrProxy = new RefLocStrProxy(fullLoc);
    let sheetID = refStrProxy.refSheetID;
    let cellLoc = refStrProxy.getLocStrInSheet();
    if (this.sheetID2CellLoc2CellID.hasOwnProperty(sheetID) === false || // 有可能不存在这个fullLoc
      this.sheetID2CellLoc2CellID[sheetID].hasOwnProperty(cellLoc) === false
    ) {
      throw new Error('cannot find calcCell');
    }
    let cellID = this.sheetID2CellLoc2CellID[sheetID][cellLoc];
    return this.getCellByID(cellID); // 通过cellID获取类实例
  }



  // 遍历
  applyToAllCellsFilterEmpty(funcForCalcCell) { // 过滤Null
    let formulaArray = [];
    for(let curCalcCell of Object.values(this.cellID2CalcCell)){
      let callBackRes = funcForCalcCell(curCalcCell); // 遍历cell
      if (typeof callBackRes !== 'undefined') {
        formulaArray.push(callBackRes); // 之后可以直接把null过滤掉
      }
    }
    return formulaArray;
  }



  // ===== 编辑 ====
  /**
   *
   * @param sheetID
   * @param sortedRowMap 原先的rowID对应到新的RowID
   * @return {{msg}}
   */
  moveCellByOld2NewRowID(sheetID, sortedRowMap:Map) {
    if (this.sheetID2CellLoc2CellID.hasOwnProperty(sheetID) === false) {
      return FAIL_OBJ_EDIT // 没有这个sheetID，报错
    }
    let cellLoc2CellID = this.sheetID2CellLoc2CellID[sheetID]
    let newCellLoc2CellID = {}
    for(let [cellLoc, cellID] of Object.entries(cellLoc2CellID)){
      let cellLocStrProxy = new CellLocStrProxy(cellLoc)
      if(sortedRowMap.has(cellLocStrProxy.rowID)){
        // cellLoc 需要变动，calcCell.name 也需要变化
        let newRowID = sortedRowMap.get(cellLocStrProxy.rowID)
        let shiftArray = [newRowID - cellLocStrProxy.rowID, 0]
        cellLocStrProxy.updateByColIDRowID(undefined, newRowID)
        newCellLoc2CellID[cellLocStrProxy.cellLocStr] = cellID
        this.cellID2CalcCell[cellID].updateFormulaAndCellNameByShiftArray(shiftArray)// 更新formula与cellName
      }
    else{
        newCellLoc2CellID[cellLoc] = cellID // 不发生变化
      }
    }
    this.sheetID2CellLoc2CellID[sheetID] = newCellLoc2CellID // 更新
  }


  replaceAndDeleteFormulaAfterMerge(theSheetID, toMergeRangeProxy){
    // 3. 获取mergedCellValue: 在范围里面从左上角开始找到一个不为空的单元格，定为mergedCellValue,否则为"".
    // 1. 根据sheetName, rangeLoc，寻找范围内的cellID，按照从左上方到右下方的fullLoc，进而获得cellIDArray
    if (toMergeRangeProxy.isSingleCell()) { // 单个单元格不需要合并
      return;
    }
    let filteredObj = this.getFilteredArrayObjFromRangeProxy(theSheetID, toMergeRangeProxy);
    let filteredCellIDArray = filteredObj.cellID;
    let filteredCellLocArray = filteredObj.cellLoc;

    if (filteredCellIDArray.length === 0) { // 不存在任何cellID的记录
      return [];
    }
    let mergedCellFormula = '';
    for (let i = 0; i < filteredCellIDArray.length; i++) {
      let curCellID = filteredCellIDArray[i];
      let curCalcCell = this.getCellByID(curCellID);
      let curV = curCalcCell.cellObj.f;
      if (curV !== '') {
        mergedCellFormula = curV;
        break;
      }
    }
    // 4. 把mergedCellValue值赋值给左上角的cell。其他的单元格的formulaString变为""
    let sheetID2CellLoc2Formula = {};
    sheetID2CellLoc2Formula[theSheetID] = {};
    for (let i = 0; i < filteredCellLocArray.length; i++) {
      sheetID2CellLoc2Formula[theSheetID][filteredCellLocArray[i]] = '';
    }
    sheetID2CellLoc2Formula[theSheetID][toMergeRangeProxy.getLeftTopCellLoc()] = mergedCellFormula;
    return sheetID2CellLoc2Formula
  }

  updateCellFormulaByNewStr(cellID2RefID, newStr) {
    Object.keys(cellID2RefID)
      .forEach(
        cellID => {
          let curCalcCell = this.getCellByID(cellID);
          curCalcCell.updateByRefIDAndNewStr(cellID2RefID[cellID], newStr);
        }
      );
  }
  updateCellFormulaByRenameSheet(toChangeCellIdArray,oldSheetName, newSheetName ){
    let calcCellArray = this.getCellArrayByIDArray(toChangeCellIdArray)
    // (2)toChangeCellIdArray中的refUnit(SUnitRangeRef,SUnitRefValue)的sheetName属性如果等于oldSheetName，则会发生变更。
    let changedCellArray = [];
    calcCellArray.forEach(
      /* @type {CalcCell} calcCell*/
      calcCell => calcCell.updateSynUnitByRenameSheet(oldSheetName, newSheetName, changedCellArray)
    );
    return changedCellArray
  }

  /**
   * 对于cellID中的cellID2RefID[cellID]指向的那些语法单元，用rangeIndexArray进行更新。
   * @param cellID2RefID
   * @param rangeIndexArray
   */
  updateCellFormulaByRangeIndexArray(cellID2RefID, rangeIndexArray) {
    Object.keys(cellID2RefID)
      .forEach(
        cellID => {
          let curCalcCell = this.getCellByID(cellID);
          curCalcCell.updateByRefIDAndRangeIndexArray(cellID2RefID[cellID], rangeIndexArray);
        }
      );
  }
  /**
   * 移动指定的cellID
   * （1）更新sheetID2CellLoc2CellID; （2）cellID对应的cellName也发生变化。（3）calcSheet.name2CellProxy也会变化
   */
  moveCellIDArrayInASheet(theSheetID, cellIDArray, shiftNumber, rightOrDown = 0) {
    let calcCellArray = this.getCellArrayByIDArray(cellIDArray); // 获取单元格类实例
    // 删除原有的loc
    calcCellArray.forEach(
      calcCell => {
        delete this.sheetID2CellLoc2CellID[theSheetID][calcCell.getCellLoc()];
        if (rightOrDown === 0) {
          calcCell.updateCelNameByShiftRight(shiftNumber); // 左右移动
        } else {
          calcCell.updateCelNameByShiftDown(shiftNumber); // 上下移动
        }
      }
    );

    // 新增新的loc
    calcCellArray.forEach(
      calcCell => {
        console.assert(this.sheetID2CellLoc2CellID[theSheetID].hasOwnProperty(calcCell.getCellLoc()) === false); // 不允许替换已经有的cell，应该先删除掉
        this.sheetID2CellLoc2CellID[theSheetID][calcCell.getCellLoc()] = calcCell.cellID;
      }
    );
  }

  // 删除目标区域中的所有单元格
  removeCellInRange(dstSheetID, dstRangeProxy){
    let cellArrayObj = this.getFilteredArrayObjFromRangeProxy(dstSheetID, dstRangeProxy)
    this.removeCellIDArrayFromWorkbook(cellArrayObj.cellID)
    return cellArrayObj
  }
  /**
   * 移动指定的cellID
   * （1）更新sheetID2CellLoc2CellID; （2）cellID对应的cellName也发生变化。（3）calcSheet.name2CellProxy也会变化
   */
  cutPasteCellInRange(oriSheetID, oriRangeProxy, dstSheetID, dstRangeProxy) {
    let toMoveCellID = this.getFilteredArrayObjFromRangeProxy(oriSheetID, oriRangeProxy).cellID
    let shiftArray = oriRangeProxy.getShiftArrayToOther(dstRangeProxy)
    // 获取oriRange中的所有单元格类实例
    let oriCalcCellArray = this.getCellArrayByIDArray(toMoveCellID);

    // 删除oriCalcCellArray的loc，更新cellName; 这些calcCell属于无位置状态
    oriCalcCellArray.forEach(
      calcCell => {
        delete this.sheetID2CellLoc2CellID[calcCell.calcSheet.sheetID][calcCell.getCellLoc()];
        calcCell.updateCelNameByShiftArray(shiftArray); // 移动
        calcCell.calcSheet = this.workbookEditor.multiSheet.getSheetByID(dstSheetID)
      }
    );

    // 删除dstRange中的Cell
    // 因为oriCalcCellArray已经不在sheetID2CellLoc2CellID中了，所以不会删除oriCalcCellArray
    let removedCelArrayObj = this.removeCellInRange(dstSheetID, dstRangeProxy)

    // 新增新的loc
    oriCalcCellArray.forEach(
      calcCell => {
        console.assert(this.sheetID2CellLoc2CellID[dstSheetID].hasOwnProperty(calcCell.getCellLoc()) === false); // 不允许替换已经有的cell，应该先删除掉
        this.sheetID2CellLoc2CellID[dstSheetID][calcCell.getCellLoc()] = calcCell.cellID;
      }
    );
    return removedCelArrayObj
  }

  createNewSheetID(sheetID){
    this.sheetID2CellLoc2CellID[sheetID] = {}
  }

  addSheetID2CellLoc2CellID(sheetID, cellLoc, cellID) {
    if (this.sheetID2CellLoc2CellID.hasOwnProperty(sheetID) === false) { // 没有这个sheet的时候新建
      this.sheetID2CellLoc2CellID[sheetID] = {};
    }
    this.sheetID2CellLoc2CellID[sheetID][cellLoc] = cellID;
  }

  addCellToMultiCell(calcCell) {
    let cellID = this.getAndAddCellID();
    this.addCellID2CalcCell(cellID, calcCell);
    let cellLoc = calcCell.getCellLoc();
    this.addSheetID2CellLoc2CellID(calcCell.calcSheet.sheetID, cellLoc, cellID);
    return cellID;
  }

  addCellID2CalcCell(cellID, calcCell) {
    this.cellID2CalcCell[cellID] = calcCell;
  }

  getAndAddCellID() {
    let cellID = this.curCellID;
    this.curCellID += 1;
    return cellID;
  }
  removeCellIDArrayFromWorkbook(toDelCellIDArray){
    let calcCellArray = this.getCellArrayByIDArray(toDelCellIDArray);
    calcCellArray.forEach(
      (calcCell) => calcCell.wkRemoveSelf()
    )
    return calcCellArray
  }

  simpleRemoveCellIDArray(toDelCellIDArray) {
    let calcCellArray = this.getCellArrayByIDArray(toDelCellIDArray);
    calcCellArray.forEach(
      (calcCell) => delete this.sheetID2CellLoc2CellID[calcCell.calcSheet.sheetID][calcCell.getCellLoc()]
    );
    toDelCellIDArray.forEach(cellID => delete this.cellID2CalcCell[cellID])
  }

  removeCellBySheetID(sheetID){ // 删除某个sheetID对应的所有cell
    // 从 sheetID2cellLoc2CellID中找到toDelCellArray，删除sheetID2cellLoc2CellID[delSheetID]
    let toDelCellIDArray = Object.values(this.sheetID2CellLoc2CellID[sheetID]);
    toDelCellIDArray.forEach(cellID => delete this.cellID2CalcCell[cellID])
    delete this.sheetID2CellLoc2CellID[sheetID]; // 删除
    return toDelCellIDArray
  }
}
