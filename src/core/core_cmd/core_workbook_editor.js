import { CoreSheet } from '../core_data_proxy/core_sheet_change';
import { calc } from '../../calc';
import { isCalcResError } from '../../global_utils/func_for_calc_core';
import { CoreSheetSetting } from '../core_data_proxy/core_sheet_proxy';
import { WorkbookEditor } from '../../calc/calc_cmd/workbook_editor';


export class CoreWorkbookProxy { // 属于一个中介者，把各种事件变化传递给workbookEditor
  calcWorkbookEditor : WorkbookEditor
  constructor() {
    this.calc = new calc.Calc();
    this.calcWorkbookEditor = this.calc.calcWorkbookProxy.workbookEditor;
    this.sheetID2CoreSheet = {};
  }

  // ============== 查询 =============
  getCoreSheetByID(sheetID = 0): CoreSheet {
    return this.sheetID2CoreSheet[sheetID];
  }

  getCoreSheetByName(sheetName):CoreSheet {
    let curSheetID = this.calcWorkbookEditor.multiSheet.getIDByName(sheetName);
    return this.getCoreSheetByID(curSheetID);
  }

  // ========== 数据更新 ===============

  refreshMultiRowByWorkbookEditor(sheetName, coreRows) { // 未来做增量更新
    let rowID2ColIndex2CoreCell = this.calcWorkbookEditor.getRowID2ColIndex2CoreCellBySheetName(sheetName);
    return coreRows.updateAllByRowID2ColIndex2CoreCell(rowID2ColIndex2CoreCell);
  }

  addToSheetID2CoreSheet(coreSheet: CoreSheet, sheetName) {
    let curSheetID = this.calcWorkbookEditor.multiSheet.getIDByName(sheetName);
    this.sheetID2CoreSheet[curSheetID] = coreSheet;
    return curSheetID;
  }

  // ========= 综合处理事件，以deal作为前缀 ==============
  // 创建，或者重建多sheet
  dealRefreshByCoreSheetSettingArray(sheetName2CoreSheetSetting:{ [key: string]: CoreSheetSetting }){ //
    // 创建coreSheetArray
    let coreSheetArray = []
    for(let [sheetName, coreSheetSetting] of Object.entries(sheetName2CoreSheetSetting)){
      let curCoreSheet = new CoreSheet(sheetName, coreSheetSetting, this); // 这样子就重新新建coreSheet了
      coreSheetArray.push(curCoreSheet)
    }
    this.calcWorkbookEditor.refreshSelfByCoreSheetArray(coreSheetArray)
    for (let curCoreSheet of coreSheetArray){
      this.sheetID2CoreSheet[curCoreSheet.coreSheetID] = curCoreSheet
    }
  }

  // 创建一个新的sheet
  dealCreateASheet(sheetName, coreSheetSetting: CoreSheetSetting): CoreSheet {
    // 把rowID2RowObj 转化为 SheetName2CellLoc2Formula 的形式。
    // 把SheetName2CellLoc2Formula传递给workbookEditor, 获取结果
    // 根据结果来更新自己
    let curCoreSheet = new CoreSheet(sheetName, coreSheetSetting, this);
    // 创建新的sheet
    this.calcWorkbookEditor.editAddASheetByCoreSheet(curCoreSheet)
    this.addToSheetID2CoreSheet(curCoreSheet, sheetName);
    return curCoreSheet;
  }

  // 通过editor改变某个单元格的公式
  dealInputFormulaOfSingleCell(sheetName, rowID, colID, newFormula) {
    if(typeof rowID !== 'number'){
      throw new Error("rowID 不是数字:")
    }
    let sheetName2CellLoc2Formula = {};
    let cellLoc = [rowID, colID].join('_');
    sheetName2CellLoc2Formula[sheetName] = {};
    sheetName2CellLoc2Formula[sheetName][cellLoc] = newFormula;
    // 更新calcWorkbookEditor
    let res = this.calcWorkbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula);
    if (isCalcResError(res)) {
      return res; // 没有成功更新
    }
    // 更新multiCoreRows
    let curCoreSheet = this.getCoreSheetByName(sheetName);
    this.refreshMultiRowByWorkbookEditor(sheetName, curCoreSheet.coreRows);
    // 需要把更新后的数据传递给component
  }

}
