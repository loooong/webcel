// 封装的，访问多个sheet的类
import { CalcSheet } from './calc_sheet';
import { xy2expr } from '../../global_utils/alphabet';
import { FAIL_OBJ_EDIT } from '../calc_utils/error_config';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';
import { RefLocStrProxy } from './loc_full_loc';
import { A1A2 } from '../calc_utils/config';
import { isHave } from '../../global_utils/check_value';

export class MultiSheetProxy {
  constructor(calcWorkbook, sheetName2SheetID = {}, sheetID2SheetProxy = {}) {
    this.sheetName2SheetID = sheetName2SheetID;
    this.sheetID2SheetProxy = sheetID2SheetProxy;
    this.calcWorkbook = calcWorkbook
    this.curSheetID = 0;
  }
  clearContent(){
    this.sheetName2SheetID = {};
    this.sheetID2SheetProxy = {};
    this.curSheetID = 0;

  }

  getIDByName(sheetName){
    return this.sheetName2SheetID[sheetName]
  }

  getNameByID(sheetID){
    return this.sheetID2SheetProxy[sheetID].theSheetName
  }

  // === 对sheet的查询===
  getFirstSheet() {
    return Object.values(this.sheetID2SheetProxy)[0];
  }


  /**
   *
   * @param sheetName
   * @return {CalcSheet}
   */
  getSheetByName(sheetName): CalcSheet {
    let curSheetID = this.sheetName2SheetID[sheetName];
    return this.sheetID2SheetProxy[curSheetID];
  }
  getSheetByID(sheetID) {
    return this.sheetID2SheetProxy[sheetID];
  }


  getSheetNameArray() {
    return Object.getOwnPropertyNames(this.sheetName2SheetID);
  }

  ensureGetSheet(sheetName) {
    if (typeof sheetName === 'undefined') {
      return this.getFirstSheet();
    } else {
      return this.getSheetByName(sheetName);
    }
  }
  // 根据RowID来获取FullLoc，[2,3] => ["0!A1A2_2_0_2_25","0!A1A2_3_0_3_25"]
  getRefLocArrayByRowIDArray(sheetID, rowIDArray):Array<string>{
    let calcSheet = this.getSheetByID(sheetID)
    if(isHave(calcSheet)===false){
      return FAIL_OBJ_EDIT
    }
    let refLocStrArray = rowIDArray.map(
      (rowID) => {
        let newRefLocProxy = RefLocStrProxy.fromRefTypeAndRangeIndexArray(sheetID, A1A2, [rowID,0 ,rowID, calcSheet.maxEditableCol])
        return newRefLocProxy.refLocStr
      }
    )
    return refLocStrArray
  }

  // === 会变更数据 ==========

  deleteSheetByName(sheetName){
    let delSheetID = this.getIDByName(sheetName);
    if (typeof delSheetID === 'undefined') { // 没有这个名字
      return FAIL_OBJ_EDIT;
    }
    // 更新 sheetName2sheetID, sheetID2sheetProxy, sheetID2mergeLoc
    delete this.sheetID2SheetProxy[delSheetID];
    delete this.sheetName2SheetID[sheetName];
    return delSheetID
  }
  replaceOldNameByNewName(oldSheetName, newSheetName){
    console.assert(typeof oldSheetName === 'string' && typeof newSheetName === 'string');
    let self = this;
    let sheetID = this.sheetName2SheetID[oldSheetName];
    if (typeof sheetID === 'undefined') { // 没有这个名字
      return FAIL_OBJ_EDIT;
    }
    // (1)workbook.name2calcSheet需要发生变更， calcSheet.Name需要发生变更
    delete this.sheetName2SheetID[oldSheetName];
    this.sheetName2SheetID[newSheetName] = sheetID;
    let theCalcSheet = this.sheetID2SheetProxy[sheetID];
    theCalcSheet.theSheetName = newSheetName;
    return sheetID
  }

  ensureGetSheetID2Loc2Formula(sheetName2CellLoc2Formula, sheetName2sheetOptions = {}){
    let sheetID2CellLoc2Formula = {};
    for (let sheetName of Object.getOwnPropertyNames(sheetName2CellLoc2Formula)) {
      if (this.sheetName2SheetID.hasOwnProperty(sheetName) === false) { // 新建sheet
        this.sheetName2SheetID[sheetName] = this.curSheetID;
        this.sheetID2SheetProxy[this.curSheetID] = new CalcSheet(sheetName, this.calcWorkbook,  this.curSheetID);
        this.calcWorkbook.workbookEditor.multiCalcCell.createNewSheetID(this.curSheetID)
        this.curSheetID += 1;
      }
      let sheetID = this.sheetName2SheetID[sheetName];
      if(sheetName2sheetOptions.hasOwnProperty(sheetName)){ // 更新maxEditableRow与col属性
        this.sheetID2SheetProxy[sheetID].updateBySheetOption(sheetName2sheetOptions[sheetName])
      }
      sheetID2CellLoc2Formula[sheetID] = sheetName2CellLoc2Formula[sheetName];
    }
    return sheetID2CellLoc2Formula
  }

  updateBySheetID2Loc2Formula(sheetID2CellLoc2Formula){ // 要移动
    let beginArray = [];
    for (let [sheetID, cellLoc2Formula] of Object.entries(sheetID2CellLoc2Formula)) {
      for (let [cellLoc, formula] of Object.entries(cellLoc2Formula)) {
        this.calcWorkbook.workbookEditor.updateACellByCellObj(sheetID, cellLoc, { 'f': formula})
        beginArray.push(sheetID + '!A1_' + cellLoc);
      }
    }
    return beginArray
  }

  updateBySheetID2Loc2FormulaReturnCellIDArray(sheetID2CellLoc2Formula){
    let curCalcSheet
    let beginCellIDArray = [];
    for (let [sheetID, cellLoc2Formula] of Object.entries(sheetID2CellLoc2Formula)) {
      for (let [cellLoc, formula] of Object.entries(cellLoc2Formula)) {
        curCalcSheet = this.sheetID2SheetProxy[sheetID];
        let theCell = this.calcWorkbook.workbookEditor.updateACellByCellObj(sheetID, cellLoc, { 'f': formula})
        beginCellIDArray.push(theCell.cellID);
      }
    }
    return beginCellIDArray
  }


}
