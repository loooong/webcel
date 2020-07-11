import { FormatCell } from './cell_format_cell';
import { CoreSheet } from './core_sheet_change';
import { ValueForSort } from './core_sort';
import { getCellLocByRiCi } from './core_sort_filter';
import { isHave } from '../../global_utils/check_value';
import { CellStyleSettings } from './core_sheet_proxy';
import { EditingFormatCell } from './cell_editing_cell';

export class SingleCoreRow {
  rowID: string; // 可以转化为数字的字符
  colIndex2FormatCell: {[key:number]: FormatCell};
  height: number;
  coreSheet:CoreSheet
  isAutoHeight: Boolean // 是否能够自动调整行高

  constructor(rowID, colIndex2FormatCell = {}, height, coreSheet) {
    this.rowID = parseInt(rowID);
    this.refreshByColIndex2CellSetting(colIndex2FormatCell, coreSheet)
    this.height = height;
    this.coreSheet = coreSheet
  }

  // 获取cellLoc2Formula这样的形式
  getCellLoc2Formula() {
    let cellLoc2Formula = {};
    for (let [colIndex, coreCell] of Object.entries(this.colIndex2FormatCell)) {
      let cellLoc = this.rowID + '_' + colIndex;
      cellLoc2Formula[cellLoc] = coreCell.formulas;
    }
    return cellLoc2Formula;
  }

  getFormatCellByColID(colID): FormatCell{
    return this.colIndex2FormatCell[colID]
  }
  ensureGetFormatCell(colID){
    if(this.colIndex2FormatCell.hasOwnProperty(colID) ===  false){
      this.colIndex2FormatCell[colID] = new FormatCell(this.coreSheet, getCellLocByRiCi(this.rowID, colID))
    }
    return this.colIndex2FormatCell[colID]
  }
  getCoreRowObj() {
    return {
      cells: this.colIndex2FormatCell,
      height: this.height
    };
  }

  createAEditingFormatCell(colID):EditingFormatCell{
    let theFormula = "", theStyleSetting = new CellStyleSettings()// formatCell为空的时候使用的数据
    let theFormatCell = this.getFormatCellByColID(colID)
    if(isHave(theFormatCell)){
      theFormula = theFormatCell.formulaInCalcCell
      theStyleSetting = theFormatCell.getStyleSetting()
    }
    let editingCalcCell = this.coreSheet.calc.calcWorkbookProxy.createAEditingCell(this.coreSheet.coreSheetName,this.rowID,colID,theFormula)
    return new EditingFormatCell(editingCalcCell, theStyleSetting)
  }

// ============= 数据变更 =================
  refreshByColIndex2CellSetting(colIndex2coreCell, coreSheet) {
    let colIndex2FormatCell = {};
    for (let [colIndex, coreCell] of Object.entries(colIndex2coreCell)) {
      colIndex2FormatCell[colIndex] = FormatCell.fromCellSetting(coreCell, coreSheet, getCellLocByRiCi(this.rowID, colIndex));
    }
    this.colIndex2FormatCell = colIndex2FormatCell;
    return this.colIndex2FormatCell;
  }

  updateByColIndex2coreCell(colIndex2CellObj) {
    for (let [colIndex, cellObj] of Object.entries(colIndex2CellObj)) {
      let curFormatCell = this.getFormatCellByColID(colIndex)
      if(curFormatCell){
        curFormatCell.updateFormatCellByObject(cellObj) // 更新
      }
      else {
        this.colIndex2FormatCell[colIndex] = FormatCell.fromCellSetting(cellObj,this.coreSheet, getCellLocByRiCi(this.rowID, colIndex)); // 新建
      }
    }
    return this.colIndex2FormatCell;
  }


 // rowID变更
  updateByNewRowID(newRowID){
    this.rowID = newRowID
    // 变更formatCell.cellLoc
    for (let [colIndex, formatCell] of Object.entries(this.colIndex2FormatCell)) {
      formatCell.cellLocProxy.updateByColIDRowID(colIndex, newRowID) // 位置变更
      }
    return this
  }
}

export class MultiCoreRow {
  coreSheet: CoreSheet
  constructor(rowID2singleRow, coreSheet) {
    this.rowID2singleRow = rowID2singleRow;
    this.coreSheet = coreSheet
  }

  static fromRowID2CoreRowObj(rowID2RowObj, defaultRowHeight, coreSheet) {
    let rowID2singleRow = {};
    for (let [rowID, rowObj] of Object.entries(rowID2RowObj)) {
      rowID2singleRow[rowID] = new SingleCoreRow(rowID, rowObj.cells, rowObj.height || defaultRowHeight, coreSheet);
    }
    return new MultiCoreRow(rowID2singleRow, coreSheet);
  }

  //  ============== 查询 ==============
  // 转换为CellLoc2Formula的形式
  getAllCellLoc2Formula() {
    let cellLoc2Formula = {};
    for (let singleRow of Object.values(this.rowID2singleRow)) {
      Object.assign(cellLoc2Formula, singleRow.getCellLoc2Formula());
    }
    return cellLoc2Formula;
  }

  getRowID2RowObj() {
    let rowID2RowObj = {};
    for (let [rowID, singleRow] of Object.entries(this.rowID2singleRow)) {
      rowID2RowObj[rowID] = singleRow.getCoreRowObj();
    }
    return rowID2RowObj;
  }
  getFormatCellByRowIDColID(rowID, colID): FormatCell{
    let singleRow = this.getSingleRowByRowID(rowID)
    if(typeof singleRow === "undefined"){
      return
    }
    return singleRow.colIndex2FormatCell[colID]
  }
  ensureGetFormatCellByRowIDColID(rowID, colID): FormatCell{
    let singleRow = this.ensureGetSingleRowByRowID(rowID)
    return singleRow.ensureGetFormatCell(colID)
  }


  getSingleRowByRowID(rowID): SingleCoreRow{
    return this.rowID2singleRow[rowID]
  }

  ensureGetSingleRowByRowID(rowID): SingleCoreRow{
    if(this.rowID2singleRow.hasOwnProperty(rowID) === false){
      this.rowID2singleRow[rowID] = this.createEmptySingleRow(rowID)
    }
    return this.getSingleRowByRowID(rowID)
  }

  getArrayForSort(colID, rowIDArray:Array):Array<ValueForSort>{
    return rowIDArray.map(rowID => {
      let curCell = this.getFormatCellByRowIDColID(rowID, colID)
      return ValueForSort.fromCellAndRowID(curCell, rowID)
    })
  }

  //  ============== 更新数据 ==============
  createEditingFormatCellByRiCi(rowID, colID){
    let singleRow = this.ensureGetSingleRowByRowID(rowID)
    return singleRow.createAEditingFormatCell(colID)
  }
  createEmptySingleRow(rowID){
    return  new SingleCoreRow(rowID, {},undefined, this.coreSheet);
  }
  // 只会更新，不会去删除不在rowID2ColIndex2CoreCell中的formatCell
  updateByRowID2ColIndex2CoreCell(rowID2ColIndex2CoreCell) {
    for (let [rowID, colID2CoreCell] of Object.entries(rowID2ColIndex2CoreCell)) {
      this.updateSingleRow(rowID, colID2CoreCell);
    }
  }

  updateSingleRow(rowID, colIndex2CellObj) {
    let singleRow = this.getSingleRowByRowID(rowID);
    if (typeof singleRow == 'undefined') {
      singleRow = new SingleCoreRow(rowID, colIndex2CellObj,undefined, this.coreSheet);
      this.rowID2singleRow[rowID] = singleRow;
    } else {
      singleRow.updateByColIndex2coreCell(colIndex2CellObj); // 更新一些属性
    }
  }

  updateByOldRowID2NewRowIDMap(oldRow2NewRowIDMap: Map){
    let singleRowArray:Array<SingleCoreRow> = []
    for (let [oldRowID, singleRow] of Object.entries(this.rowID2singleRow)) {
      let newRowID = oldRow2NewRowIDMap.get(parseInt(oldRowID))
      if(newRowID){ // 有变更的才会更新
        singleRow.updateByNewRowID(newRowID)
      }
      singleRowArray.push(singleRow)
    }
    singleRowArray.sort((a,b)=>a.rowID -b.rowID)
    this.rowID2singleRow = {}
    singleRowArray.forEach(singleRow => this.rowID2singleRow[singleRow.rowID] = singleRow)
  }
}
