import { HEIGHT_LINE_THICKNESS, TableViewDetail } from './view_table_view_detail';
import {
  TABLE_FIXED_HEADER_BG_COLOR_STYLE,
  TABLE_HEADER_GRID_COLOR0, TABLE_HEADER_GRID_COLOR1, TABLE_HEADER_GRID_COLOR_SELECTED,
  TABLE_HEADER_HIGHLIGHT_TEXT_STYLE,
  TABLE_HEADER_IN_FILTER_TEXT_STYLE
} from '../../component/utils/component_table_config';
import { stringAt } from '../../global_utils/alphabet';
import { TableCanvasDealer } from '../../component/comp_table/table_canvas_comp';
import { CoreSheet } from './core_sheet_change';
import { isHave } from '../../global_utils/check_value';

export const SPLIT_GAP_IF_PRE_ROW_EXCEPT = 2.5
export const SPLIT_LINE_THICKNESS = 0.5
export class ViewRowDetail{
  rowTop:number
  rowHeight:number
  rowBackgroundTop:number // 背景色的top
  rowBackgroundHeight:number  // 背景色的高度
  isPreRowExcept: boolean
  isSelected:boolean
  isSelectedOrPreSelected: boolean
  isInFilterRange:boolean
  constructor(aObj){
    Object.assign(this, aObj)
  }
  updateBackgroundTopHeight(){
    this.rowBackgroundTop = this.isPreRowExcept? this.rowTop + SPLIT_GAP_IF_PRE_ROW_EXCEPT :this.rowTop
    this.rowBackgroundHeight = this.isPreRowExcept? this.rowHeight - SPLIT_GAP_IF_PRE_ROW_EXCEPT+  SPLIT_LINE_THICKNESS:this.rowHeight
  }
  getBottomY(){
    return this.rowTop + this.rowHeight
  }
}

export class RowsInView {
  preTotalHeight: number; // 最后一行的top值
  totalHeight: number; // 总高度
  tableViewDetail: TableViewDetail
  rowID2rowInViewDetail:{[key: number]:ViewRowDetail}
  coreSheet: CoreSheet
  constructor(rowID2RowDetail, tableViewDetail) {
    this.rowID2rowInViewDetail = rowID2RowDetail;
    this.tableViewDetail = tableViewDetail
    this.coreSheet = this.tableViewDetail.coreSheet
  }

  get rowIDArray() {
    return Object.keys(this.rowID2rowInViewDetail);
  }

  get preTotalHeight() {
    let valueArray = Object.values(this.rowID2rowInViewDetail);
    return valueArray[valueArray.length - 1].rowTop;
  }
  get minRowID():number{
    let rowIDArray = this.rowIDArray;
    return parseInt(rowIDArray[0]);
  }

  get maxRowID():number{
    let rowIDArray = this.rowIDArray;
    return parseInt(rowIDArray[rowIDArray.length - 1]);
  }

  get totalHeight() {
    let valueArray = Object.values(this.rowID2rowInViewDetail);
    let { rowTop, rowHeight } = valueArray[valueArray.length - 1];
    return rowTop + rowHeight;
  }

  getInfoArray() {
    return [this.preTotalHeight, this.totalHeight, this.maxRowID];
  }
  applyRowIDRowDetail(func){
    for(let [curRowID, rowDetail] of Object.entries(this.rowID2rowInViewDetail)){
      func(parseInt(curRowID), rowDetail)
    }
  }
  getLastRowDetail():ViewRowDetail{
    return this.rowID2rowInViewDetail[this.maxRowID]
  }
  getSelectedRowsTopHeight(){
    if(this.coreSheet.coreSelector.selectedCoreRange.eri < this.minRowID ||this.coreSheet.coreSelector.selectedCoreRange.sri > this.maxRowID ){
      return {top: 0, height: 0} // 不在可视范围以内
    }
    let firstRowDetail = this.rowID2rowInViewDetail[Math.max(this.coreSheet.coreSelector.selectedCoreRange.sri,this.minRowID)] // 因为选择范围可能会超过可视范围
    let lastRowDetail = this.rowID2rowInViewDetail[Math.min(this.coreSheet.coreSelector.selectedCoreRange.eri, this.maxRowID)]
    return {top: firstRowDetail.rowBackgroundTop, height: lastRowDetail.rowBackgroundTop + lastRowDetail.rowBackgroundHeight - firstRowDetail.rowBackgroundTop}
  }

  applyRowIDTopHeight(func){
    for(let [curRowID, topHeight] of Object.entries(this.rowID2rowInViewDetail)){
      func(parseInt(curRowID), topHeight.rowTop, topHeight.rowHeight)
      }
    }

    // ============== 数据变化   ==================
  updateDetailForDraw(){
    let preRowDetail = new ViewRowDetail()
    this.applyRowIDRowDetail(
      (rowID: number, rowDetail: ViewRowDetail) => {
        rowDetail.isPreRowExcept = this.coreSheet.exceptRowSet.has(rowID - 1);
        rowDetail.updateBackgroundTopHeight()
        if(rowDetail.isPreRowExcept && isHave(preRowDetail)){
          preRowDetail.rowBackgroundHeight -= SPLIT_GAP_IF_PRE_ROW_EXCEPT
        }
        rowDetail.isSelected = this.coreSheet.coreSelector.selectedCoreRange.isOverlapWithRowID(rowID);
        rowDetail.isSelectedOrPreSelected = rowDetail.isSelected || preRowDetail.isSelected
        rowDetail.isInFilterRange = this.coreSheet.coreSortFilter.isRowIDInFilteringRange(rowID);
        preRowDetail = rowDetail
      }
    );
  }

  drawColHeaderSplitAndHighLight(tableCanvasDealer: TableCanvasDealer) {
    tableCanvasDealer.saveAndBeginPath();
    tableCanvasDealer.drawVerticalLine(this.tableViewDetail.headerColWidth, this.tableViewDetail.headerRowHeight, this.tableViewDetail.tableHeight + this.tableViewDetail.headerRowHeight);
    this.applyRowIDRowDetail(
      (curRowID, rowDetail: ViewRowDetail) => {
        const curRowY = this.tableViewDetail.headerRowHeight + rowDetail.rowTop; // row的顶部的y坐标
        const curBackgroundY = this.tableViewDetail.headerRowHeight + rowDetail.rowBackgroundTop
        // 处理选中高亮
        // debugger
        if (rowDetail.isSelected) {
          tableCanvasDealer.drawFillRect(0, curBackgroundY, this.tableViewDetail.headerColWidth, rowDetail.rowBackgroundHeight);
        }
        // 未选中的时候的填充
        else{
          tableCanvasDealer.drawFillRect(0, curBackgroundY, this.tableViewDetail.headerColWidth, rowDetail.rowBackgroundHeight,TABLE_FIXED_HEADER_BG_COLOR_STYLE);
        }
        // 画split
        if (rowDetail.isPreRowExcept) { // 会画两个split
          this.drawHeaderRowSplit(tableCanvasDealer, curRowY - 2.5, rowDetail.isSelectedOrPreSelected);
          this.drawHeaderRowSplit(tableCanvasDealer, curRowY + 2.5, rowDetail.isSelectedOrPreSelected);
        } else {
          this.drawHeaderRowSplit(tableCanvasDealer, curRowY, rowDetail.isSelectedOrPreSelected);
        }

        // 处理text
        tableCanvasDealer.saveAndBeginPath();
        if (rowDetail.isInFilterRange) {
          tableCanvasDealer.updateAttrByName2Value(TABLE_HEADER_IN_FILTER_TEXT_STYLE);
        } else if (rowDetail.isSelected) {
          tableCanvasDealer.updateAttrByName2Value(TABLE_HEADER_HIGHLIGHT_TEXT_STYLE);
        }
        tableCanvasDealer.fillText(curRowID + 1, this.tableViewDetail.headerColWidth / 2, curRowY + (rowDetail.rowHeight / 2));
        tableCanvasDealer.restore();
      });
    tableCanvasDealer.restore();
    let selectedTopHeight = this.getSelectedRowsTopHeight()
    tableCanvasDealer.saveAndBeginPath();
    tableCanvasDealer.updateAttrByName2Value(TABLE_HEADER_HIGHLIGHT_TEXT_STYLE);
    // 画绿色的高亮标志线
    tableCanvasDealer.fillRect(this.tableViewDetail.headerColWidth - HEIGHT_LINE_THICKNESS, this.tableViewDetail.headerRowHeight + selectedTopHeight.top, HEIGHT_LINE_THICKNESS, selectedTopHeight.height);
    tableCanvasDealer.restore();
    // 画最底部row的底部的split线
    let lastRowDetail = this.getLastRowDetail()
    this.drawHeaderRowSplit(tableCanvasDealer, lastRowDetail.getBottomY() + this.tableViewDetail.headerRowHeight, lastRowDetail.isSelectedOrPreSelected);
  }
  drawHeaderRowSplit(tableCanvasDealer, curRowY, isSelected = false) {
// 画水平线
    tableCanvasDealer.saveAndBeginPath();
    if(isSelected){
      tableCanvasDealer.ctx.strokeStyle = TABLE_HEADER_GRID_COLOR_SELECTED
    }
    else {
      let grd = tableCanvasDealer.ctx.createLinearGradient(0, 0, this.tableViewDetail.headerColWidth, 0);
      grd.addColorStop(0, TABLE_HEADER_GRID_COLOR0);
      grd.addColorStop(1, TABLE_HEADER_GRID_COLOR1);
      // 填充渐变
      tableCanvasDealer.ctx.strokeStyle = grd;
    }
    tableCanvasDealer.drawHorizonLine(curRowY, 0, this.tableViewDetail.headerColWidth);
    tableCanvasDealer.ctx.restore();
  }
}

export class ViewColDetail{
  colLeft:number
  colWidth:number
  colBackgroundLeft:number // 背景色的top
  colBackgroundWidth:number  // 背景色的高度
  isPreColExcept: boolean
  isSelected:boolean
  isSelectedOrPreSelected: boolean
  constructor(aObj){
    Object.assign(this, aObj)
  }
  updateBackgroundLeftWidth(){
    this.colBackgroundLeft = this.isPreColExcept? this.colBackgroundLeft + SPLIT_GAP_IF_PRE_ROW_EXCEPT :this.colBackgroundLeft
    this.colBackgroundWidth = this.isPreColExcept? this.colWidth - SPLIT_GAP_IF_PRE_ROW_EXCEPT+  SPLIT_LINE_THICKNESS:this.colWidth
  }
  getRightX(){
    return this.colLeft + this.colWidth
  }
}


export class ColsInView {
  preTotalWidth: number;
  totalWidth: number;
  maxColID: number;
  colID2ColDetail: { [key: number]: ViewColDetail};
  tableViewDetail: TableViewDetail
  coreSheet: CoreSheet
  constructor(colID2LeftWidth, tableViewDetail) {
    this.colID2ColDetail = colID2LeftWidth;
    this.tableViewDetail = tableViewDetail
    this.coreSheet = this.tableViewDetail.coreSheet
  }

  get colIDArray() {
    return Object.keys(this.colID2ColDetail);
  }

  get preTotalWidth() {
    let valueArray = Object.values(this.colID2ColDetail);
    return valueArray[valueArray.length - 1].colLeft;
  }
  get minColID(){
    let colIDArray = this.colIDArray;
    return parseInt(colIDArray[0]);

  }

  get maxColID() {
    let colIDArray = this.colIDArray;
    return parseInt(colIDArray[colIDArray.length - 1]);
  }

  get totalWidth() {
    let valueArray = Object.values(this.colID2ColDetail);
    let { colLeft, colWidth } = valueArray[valueArray.length - 1];
    return colLeft + colWidth;
  }
  getLastColDetail(){
    return this.colID2ColDetail[this.maxColID]
  }
  getInfoArray() {
    return [this.preTotalWidth, this.totalWidth, this.maxColID];
  }

  applyColIDLeftWidth(func){
    for(let [curColID, leftWidth] of Object.entries(this.colID2ColDetail)){
      func(curColID, leftWidth.colLeft, leftWidth.colWidth)
    }
  }

  applyColDetail(func){
    for(let [curColID, curColDetail] of Object.entries(this.colID2ColDetail)){
      func(curColID, curColDetail)
    }
  }

  // ========== 变更数据 ============
  updateColDetailForDraw(){
    let preColDetail = new ViewColDetail()
    this.applyColDetail(
      (colID: number, colDetail: ViewColDetail) => {
        colDetail.isPreColExcept = this.coreSheet.exceptColSet.has(colID - 1);
        colDetail.updateBackgroundLeftWidth()
        if(colDetail.isPreColExcept && isHave(preColDetail)){
          preColDetail.colBackgroundWidth -= SPLIT_GAP_IF_PRE_ROW_EXCEPT
        }
        colDetail.isSelected = this.coreSheet.coreSelector.selectedCoreRange.isOverlapWithColID(colID);
        colDetail.isSelectedOrPreSelected = colDetail.isSelected || preColDetail.isSelected
        preColDetail = colDetail
      }
    );
  }


  drawRowHeaderSplitAndHighLight(tableCanvasDealer, sci, eci) {
    tableCanvasDealer.saveAndBeginPath();
    // 画水平线
    tableCanvasDealer.drawHorizonLine(this.tableViewDetail.headerRowHeight, this.tableViewDetail.headerColWidth, this.tableViewDetail.tableWidth + this.tableViewDetail.headerColWidth);
    this.applyColDetail(
      (curColID, colDetail: ViewColDetail) => {
        const curColX = this.tableViewDetail.headerColWidth + colDetail.colLeft;
        if (colDetail.isSelected) { // 高亮
          tableCanvasDealer.drawFillRect(curColX, 0, colDetail.colBackgroundWidth, this.tableViewDetail.headerRowHeight);
          tableCanvasDealer.saveAndBeginPath();
          tableCanvasDealer.updateAttrByName2Value(TABLE_HEADER_HIGHLIGHT_TEXT_STYLE);
          tableCanvasDealer.fillRect(curColX, this.tableViewDetail.headerRowHeight - HEIGHT_LINE_THICKNESS, colDetail.colBackgroundWidth, HEIGHT_LINE_THICKNESS);
          tableCanvasDealer.fillText(stringAt(curColID), curColX + (colDetail.colBackgroundWidth / 2), this.tableViewDetail.headerRowHeight / 2);
          tableCanvasDealer.restore();
        } else {
          tableCanvasDealer.drawFillRect(curColX, 0, colDetail.colBackgroundWidth, this.tableViewDetail.headerRowHeight, TABLE_FIXED_HEADER_BG_COLOR_STYLE);
          tableCanvasDealer.fillText(stringAt(curColID), curColX + (colDetail.colBackgroundWidth / 2), this.tableViewDetail.headerRowHeight / 2);
        }
        this.drawHeaderColSplitLine(tableCanvasDealer, curColX, colDetail.isSelectedOrPreSelected);
      }
    );
    tableCanvasDealer.restore();
    // 画最后一列的右边缘的split
    let lastColDetail = this.getLastColDetail()
    this.drawHeaderColSplitLine(tableCanvasDealer, lastColDetail.getRightX() + this.tableViewDetail.headerColWidth, lastColDetail.isSelectedOrPreSelected);
  }

  drawHeaderColSplitLine(tableCanvasDealer, curColX, isSelected = false) {
    tableCanvasDealer.saveAndBeginPath();
    if(isSelected){
      tableCanvasDealer.ctx.strokeStyle = TABLE_HEADER_GRID_COLOR_SELECTED;
    }
    else {
      let grd2 = tableCanvasDealer.ctx.createLinearGradient(0, 0, 0, this.tableViewDetail.headerRowHeight);
      grd2.addColorStop(0, TABLE_HEADER_GRID_COLOR0);
      grd2.addColorStop(1, TABLE_HEADER_GRID_COLOR1);
      // 填充渐变
      tableCanvasDealer.ctx.strokeStyle = grd2;
    }
    tableCanvasDealer.drawVerticalLine(curColX, 0, this.tableViewDetail.headerRowHeight);
    tableCanvasDealer.ctx.restore();
  }


}
