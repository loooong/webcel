import { DEFAULT_MAX_COL, DEFAULT_MAX_ROW, FORMULA_STATUS } from '../calc_utils/config';
import { CalcCell, EditingCalcCell } from './calc_cell';
import { expr2xy, getRowNumFromCellName } from '../../global_utils/alphabet';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';
import { convertToCellV } from '../cell_value_type/complex_celll_value';

/**
 * 用来代表一个计算引擎中的cell
 * @property {string} name
 * @property {CalcWorkbookProxy} workbookProxy
 */
export class CalcSheet {
  maxEditableCol: number
  maxEditableRow: number
  constructor(name, workbookProxy, sheetID = 0) {
    this.theSheetName = name;
    this.workbookProxy = workbookProxy;
    this.multiCell = this.workbookProxy.workbookEditor.multiCalcCell
    this.sheetID = sheetID;
    this.maxEditableCol = DEFAULT_MAX_COL // 一个sheet的最大可编辑范围为26*1000
    this.maxEditableRow = DEFAULT_MAX_ROW
  }

  getCellLocArray() {
    return Object.keys(this.multiCell.getCellLoc2CellIDBySheetID(this.sheetID))
  }

  /**
   *
   * @param cellName
   * @return {CalcCell}
   */
  getCellByName(cellName) {
    let cellLocStr = CellLocStrProxy.cellName2CellLoc(cellName)
    return this.multiCell.getCellBySheetIDAndCellLoc(this.sheetID, cellLocStr)
  }

  getMaxRowNum() { // 最大的行号码
    let allCellLocArray = this.getCellLocArray();
    let maxRow = 0;
    allCellLocArray.map(cellLoc => {
      let curNum = new CellLocStrProxy(cellLoc).rowID;
      maxRow = curNum > maxRow ? curNum : maxRow;
    });
    return maxRow;
  }

  getMaxRowColNum() { // 最大的行与列的号码
    let allCellLocArray = this.getCellLocArray();
    let maxCol = 0;
    let maxRow = 0;
    allCellLocArray.map(cellLoc => {
      let cellLocProxy = new CellLocStrProxy(cellLoc)
      maxCol = cellLocProxy.colID > maxCol ? cellLocProxy.colID : maxCol;
      maxRow = cellLocProxy.rowID > maxRow ? cellLocProxy.rowID : maxRow;
    });
    return [maxCol, maxRow];
  }
  // =========== 属性变更  ================
  updateBySheetOption(sheetOption:{maxEditableCol:number, maxEditableRow: number}){
    this.maxEditableCol = sheetOption.maxEditableCol || this.maxEditableCol
    this.maxEditableRow = sheetOption.maxEditableRow || this.maxEditableRow
    return this

  }
  // 创建calcCell
  createCalcCell(cellName, cellObj, status = FORMULA_STATUS.created) {
    let newCell = new CalcCell(
      this.workbookProxy,
      this,
      cellObj,
      cellName,
      status
    )
    return newCell
  }

  createEditingCalcCell(cellName:string, cellObj:{f:string}, status = FORMULA_STATUS.created):EditingCalcCell {
    let newCell = new EditingCalcCell(
      this.workbookProxy,
      this,
      cellObj,
      cellName,
      status
    )
    return newCell
  }



  updateACell(cellName, cellObj) {
    let theCell = this.getCellByName(cellName);
    if (typeof theCell === 'undefined') {
      this.createCalcCell(cellName, cellObj);
    } else {
      theCell.updateByCellObj(cellObj);
    }
  }

}
