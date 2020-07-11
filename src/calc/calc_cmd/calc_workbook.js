import { CalcCell } from '../calc_data_proxy/calc_cell';
import { MultiCollExpFn } from '../calc_data_proxy/exp_fn_collection';
import { SimpleExpressionBuilder } from '../calc_deal/simple_expression/deal_simple_expression';
import { StructuralExpressionBuilder } from '../calc_deal/structural_expression/deal_structural_expression';
import { FORMULA_STATUS } from '../calc_utils/config';
import { CalcSheet } from '../calc_data_proxy/calc_sheet';
import { createDefaultFnCollection } from '../calc_utils/factory_func';
import { WorkbookEditor } from './workbook_editor';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';
import { INSERT } from '../../global_utils/config_for_calc_and_core';
// import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { xy2expr } from '../../global_utils/alphabet';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';


/**
 * @property{SimpleExpressionBuilder} simpleExpressionBuilder
 * @property{StructuralExpressionBuilder} structuralExpressionBuilder
 * @property{MultiCollExpFn}
 */
export class CalcWorkbookProxy { // 对workbook的数据代理
  /**
   *
   * @param {Object} workbookObj
   */
  constructor(workbookObj) {
    this.multiCollExpFn = createDefaultFnCollection(); //
    this.workbookEditor = new WorkbookEditor(this);
  }

  // ==== 查询；参数为fullLoc与Name; 都是为了适配老的测试用例=======
  getValueByFullLoc(fullLoc){
    let calcCell = this.workbookEditor.multiCalcCell.getCellByFullLoc(fullLoc)
    return calcCell.cellObj.v
  }

  getFormulaStringByFullLoc(fullLoc){
    let calcCell = this.workbookEditor.multiCalcCell.getCellByFullLoc(fullLoc)
    return calcCell.formulaString
  }


  // ======== 更新，编辑 =========
  // 与sheet有关的操作
  /**
   * 根据workbookObj给sheetID2SheetProxy与name2SheetID赋值
   * @param workbookObj
   */
  updateByWorkbookObj(workbookObj) {
    // 格式转换
    let sheetName2CellLoc2Formula = {}
    let sheetsObj = workbookObj.Sheets
    for(let sheetName of Object.keys(sheetsObj)){
      sheetName2CellLoc2Formula[sheetName] = {}
      for(let cellName of Object.keys(sheetsObj[sheetName])){
        let cellLocStr = CellLocStrProxy.cellName2CellLoc(cellName)
        sheetName2CellLoc2Formula[sheetName][cellLocStr] =  sheetsObj[sheetName][cellName].f
      }
    }
    let res = this.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula)
    workbookObj.Sheets = this.workbookEditor.getSheetsObj()
    return res
  }
  /**
   *
   * @param coreSheet
   * @param {ChangeDetailWrap} changeDetailWarp
   */
  dealEditRequest(coreSheet,changeDetailWarp){

  }
  /**
   *
   * @param {CoreSheet}coreSheet
   * @param {PreAction} changeDetail
   */
  updateWorkbookServerByChangeDetail(coreSheet: CoreSheet, changeDetail) {
    //{type: 'row', n:1, begin: 0, insert_or_delete: 0}, 代表对行列的操作
    let changeDetailWarp = new ChangeDetailWrap(changeDetail)
    if(changeDetailWarp.isEditRequest()){
      return this.dealEditRequest(coreSheet,changeDetailWarp )
    }
    else{ // 单sheet全量更新
      this.workbookEditor.clearContentForAllSheet()
      let sheetName2CellLoc2Formula = coreSheet.coreRows.getSheetName2CellLoc2Formula()
      this.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula) // 需要把新的值给coreWorkbook; 暂时不支持合并单元格的变更
      let rowID2ColIndex2CoreCell = this.workbookEditor.getRowID2ColIndex2CoreCellBySheetName(Object.keys(sheetName2CellLoc2Formula)[0]) // todo：未来要支持多sheet
      coreSheet.coreRows.multiCoreRow.updateByRowID2ColIndex2CoreCell(rowID2ColIndex2CoreCell)
      return rowID2ColIndex2CoreCell
    }
  }


  createAEditingCell(sheetName, ri, ci, formulaString){
    let theCalcSheet = this.workbookEditor.multiSheet.getSheetByName(sheetName)
    let cellName = xy2expr(ci, ri)
    return theCalcSheet.createEditingCalcCell(cellName, {f:formulaString})
  }

}

export const ACTION_INSERT_RANGE = 13
class ChangeDetailWrap{
  constructor(changeDetail){
    this.changeDetail = changeDetail
  }
  isEditRequest(){
    return false
  }
  isInsertRange(){
    return [INSERT.ROW, INSERT.COL].includes(this.changeDetail.property)
  }


  /**
   *
   */
  convertPreAction2name2CellObj() {
    let preAction = this.changeDetail
    let oldName2CellObj = {};
    let oldCell = preAction.oldCell; // newCell是单元格的f发生更改的cellProp实例的集合
    if (oldCell.hasOwnProperty('map')) { // 为空
      oldCell.map((aCell) => {
        oldName2CellObj[aCell.expr] = { f: aCell.cell.formulas };
      });
    }

    let newName2CellObj = {};
    let newCell = preAction.newCell; // newCell是单元格的f发生更改的cellProp实例的集合
    if (preAction.isDelete()) {
      newCell.map((aCell) => {
        newName2CellObj[aCell.expr] = { f: '' };
      }); // 删除了，formula 变为空
    } else {
      newCell.map((aCell) => {
        newName2CellObj[aCell.expr] = { f: aCell.cell.formulas };
      });
    }

    Object.assign(oldName2CellObj, newName2CellObj);

    let name2CellObj = {};
    let to_calc_cell_names = preAction.findAllNeedCalcCell(); // 获取所有需要计算的单元格； 可能有很多null; 不存在多sheet的情况
    to_calc_cell_names.map((cellName) => {
      name2CellObj[cellName] = {};
    }); // {} 代表需要重新计算，不需要更新值了
    Object.assign(name2CellObj, oldName2CellObj);
    return name2CellObj;
  }

}
