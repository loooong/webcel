// overlayContent的大小会通过参数传进来，自己没有办法直接获取
import { CoreSheet } from './core_sheet_change';
import { CoreRows } from './core_rows';
import { getDevicePixelRatio } from '../../component/comp_table/table_canvas_comp';
import { isArrayEqual, RangeLocProxy } from '../../calc/calc_data_proxy/loc_range_loc';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { DrawBoxDetail } from './view_box_detail';
import { CELL_PADDING_WIDTH } from '../../component/utils/component_table_config';
import { FormatCell } from './cell_format_cell';
import { CellPstDetail, RangePstDetail, RelativePstDetail } from './position_detail';
import { myLog, PRINT_LEVEL2 } from '../../log/new_log';
import { rangeReduceIf } from '../../global_utils/dataproxy_helper';
import { TableViewDetail } from './view_table_view_detail';
import { isHave } from '../../global_utils/check_value';

export class LeftTopWidthHeight{
  left:number
  top:number
  width:number
  height:number
  constructor(aObj) {
    Object.assign(this, aObj)
  }
}

/**
 * 这个类用来处理事件，典型如鼠标点击与移动时候判定鼠标选中的单元格或合并单元格
 * 注意：鼠标click与move获取单元格rici的逻辑是不同的。
 * (1) click的时候会存在ri,ci = -1的情况，而move的时候，会把此时的ri,ci记为0
 * (2) click的发生位置在table范围内，而move的发生未知在整个window以内都可以。
 */
export class TableViewForEvent {
  coreSheet: CoreSheet;
  freezeRiCi: Array<number>;
  coreRows: CoreRows;
  tableViewDetail: TableViewDetail

  constructor(coreSheet, freezeRiCi) {
    this.coreSheet = coreSheet;
    this.coreRows = this.coreSheet.coreRows; // 下划线代表是内部的变量
    this.coreCols = this.coreSheet.coreCols;
    this.coreScrollPst = this.coreSheet.coreScrollBarProxy;
    this.coreSelector = this.coreSheet.coreSelector;
    this.multiCoreMerge = this.coreSheet.multiCoreMerge;
    this.freezeRiCi = freezeRiCi || [0, 0]; // 初始化
    this.tableViewDetail = new TableViewDetail(this.coreSheet, this); // 只有要构造这个
  }

  get exceptRowSet() { // 建立映射关系
    return this.coreSheet.exceptRowSet;
  }

  get unsortedRowMap() {
    return this.coreSheet.coreSortFilter.old2NewRowIDMap;
  }

  get tableWidth() {
    return this.getTableWidthFunc();
  }

  get tableHeight() {
    return this.getTableHeightFunc();
  }

  get tableContentWidth() {
    return this.tableWidth - this.coreCols.headerWidth;
  }

  get tableContentHeight() {
    return this.tableHeight - this.coreRows.headerHeight;
  }

  // 必要的配置
  updateTableWHAndDevicePixelFunc(getTableWidthFunc, getTableHeightFunc, getDevicePixelFunc = getDevicePixelRatio) {
    this.getTableWidthFunc = getTableWidthFunc;
    this.getTableHeightFunc = getTableHeightFunc;
    this.tableViewDetail.devicePixelRatio = getDevicePixelFunc();
  }

  // =============  主流程 =============
  // 获取各个属性
  easyRefreshTableViewDetail() {
    // 获取colsInView与RowsInView
    this.tableViewDetail.refreshAllInfo();
    return this.tableViewDetail;
  }

  // ============ 数据查询 =============
  // 是否存在冻结单元格
  isFreezeRiCiAvailable() {
    return isArrayEqual(this.freezeRiCi, [0, 0]) === false;
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  getHeightForTableComp() {
    return this.tableHeight;
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  getViewWidthForTableComp() { // todo; 需要修改
    return this.tableWidth;
  }

  getNextRowID(preRowID, findStep =1) {
    let nextRow = preRowID + findStep;
    while (this.exceptRowSet.has(nextRow)) { // 会考虑到被过滤的row
      nextRow += findStep;
    }
    return nextRow;
  }

  getNextColID(preColID,  findStep =1) { // 之后会考虑到隐藏的情况
    return preColID + findStep;
  }


  getMinMaxRowID(minOrMax = 0) {
    if(minOrMax === 0){
      return this.getNextRowID(-1)
    }
    else {
      return this.getNextRowID(this.coreSheet.coreRows.maxRowID+1, -1)
    }
  }

  getMinMaxColID(minOrMax = 0) {
    if(minOrMax === 0){
      return this.getNextColID(-1)
    }
    else {
      return this.getNextColID(this.coreSheet.coreCols.maxColID+1, -1)
    }
  }



// 获取长度与高度 要转移到 TableViewForEvent
  applyBeginColToEndCol(minColID, maxColID, func) {
    let curLeft = 0;
    const { coreCols } = this;
    for (let curColID = minColID; curColID <= maxColID; curColID += 1) {
      const curColWidth = coreCols.ensureGetWidthByColID(curColID);
      func(curColID, curLeft, curColWidth);
      curLeft += curColWidth;
    }
  }

  // 获取长度与高度 要转移到 TableViewForEvent； todo: 本方法需要废弃
  applyBeginRowToEndRow(beginRowID, endRowID, func) {
    let curTop = 0;
    const { coreRows } = this;
    // 被过滤的集合
    for (let curRowID = beginRowID; curRowID <= endRowID; curRowID += 1) {
      const curRowHeight = coreRows.ensureGetRowHeightByRi(curRowID);
      func(curRowID, curTop, curRowHeight);
      curTop += curRowHeight;
    }
    console.log({
      beginRowID,
      endRowID
    }); // 判断起始与结束的Row
  }

  getTableWidthHeight() { // 获取长度与高度 要转移到 TableViewForEvent
    return {
      width: this.getViewWidthForTableComp(),
      height: this.getHeightForTableComp()
    };
  }

  /**
   *
   * @param mouseX 鼠标相对于tableContent的位置
   * @param mouseY
   * @param width
   * @param height
   * @return {{top: *, left: *}}
   */
  getContextMenuLeftTopByWidthHeight(mouseX, mouseY, width, height):{left:number, top:number}{
    const tableContentWidthHeight = this.getTableContentPstDetail();
    let top = mouseY;
    let left = mouseX;
    if (tableContentWidthHeight.height - mouseY <= height) {
      top -= height;
    }
    if (tableContentWidthHeight.width - mouseX <= width) {
      left -= width;
    }
    return {left: left, top}
  }

  getTableContentPstDetail():LeftTopWidthHeight { // 要转移到CoreTableView
    let width = this.getViewWidthForTableComp();
    let height = this.getHeightForTableComp();
    return new LeftTopWidthHeight({
      width: width - this.tableViewDetail.headerColWidth,
      height: height - this.tableViewDetail.headerRowHeight,
      left: this.tableViewDetail.headerColWidth, // 可能是第一列的宽度
      top: this.tableViewDetail.headerRowHeight, // 可能是第一行的高度
    });
  }

  // ================
  getTotalWidthBetweenTwoIndex(minColID, maxColID) {
    let totalWidth = 0;
    for (let curColID = minColID; curColID < maxColID; curColID = this.getNextColID(curColID)) {
      totalWidth += this.coreCols.ensureGetWidthByColID(curColID);
    }
    return totalWidth;
  }

  // 不包含maxRowID的高度
  getTotalHeightBetweenTwoIndex(beginRowID, endRowID) {
    let totalHeight = 0;
    for (let curRowID = beginRowID; curRowID < endRowID; curRowID = this.getNextRowID(curRowID)) {
      totalHeight += this.coreRows.ensureGetRowHeightByRi(curRowID);
    }
    if (this.exceptRowSet.has(beginRowID)) { // 首行被过滤的情况
      totalHeight -= this.coreRows.ensureGetRowHeightByRi(beginRowID);
    }
    return totalHeight;
  }

  getScrollTotalHeight() {
    return this.getTotalHeightBetweenTwoIndex(0, this.coreRows.maxRowID + 1)+ this.tableViewDetail.headerRowHeight;
  }

  getScrollTotalWidth() {
    return this.getTotalWidthBetweenTwoIndex(0, this.coreCols.maxColID + 1) + this.tableViewDetail.headerColWidth;
  }


  // 获取长度与高度 要转移到 TableViewForEvent
  getMergeRangeAbsolutePstByLeftTopRiCi(ri, ci):LeftTopWidthHeight {
    // 寻找merge
    let findMergeLoc = this.coreSheet.coreWorkbook.calcWorkbookEditor.multiMergeLoc.getMergeLocByLeftTopRiCi(this.coreSheet.coreSheetID, ri, ci);
    let res
    if (findMergeLoc) { // 存在merge
      res = this.getLeftWidthHeightByMinMaxRiCi(...new RangeLocProxy(findMergeLoc).indexArray);
    } else { // 不存在merge
      res = this.getLeftWidthHeightByRiCi(ri, ci);
    }
    res.cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
    return res
  }

  getMergeRangePstByClickRiCi(ri, ci):LeftTopWidthHeight{
    let findMergeLocArray = this.coreSheet.tableViewDetail.getMergeLocArrayByMinMaxRiCi(ri,ci,ri,ci);
    let res
    if (findMergeLocArray.length > 0) { // 存在merge
      res = this.getLeftWidthHeightByMinMaxRiCi(...new RangeLocProxy(findMergeLocArray[0]).indexArray);
    } else { // 不存在merge
      res = this.getLeftWidthHeightByRiCi(ri, ci);
    }
    return res
  }



  getLeftWidthHeightByRiCi(rowID, colID) {
    let left = this.getTotalWidthBetweenTwoIndex(0, colID);
    let top = this.getTotalHeightBetweenTwoIndex(0, rowID);
    let width = this.coreCols.ensureGetWidthByColID(colID);
    let height = this.coreRows.ensureGetRowHeightByRi(rowID);
    return {
      left: left,
      top,
      width,
      height
    };
  }

  getLeftWidthHeightByMinMaxRiCi(minRi, minCi, maxRi, maxCi):LeftTopWidthHeight {
    let left = this.getTotalWidthBetweenTwoIndex(0, minCi);
    let top = this.getTotalHeightBetweenTwoIndex(0, minRi);
    let width = this.getTotalWidthBetweenTwoIndex(minCi, maxCi + 1);
    let height = this.getTotalHeightBetweenTwoIndex(minRi, maxRi + 1);
    return new LeftTopWidthHeight({
      left: left,
      top,
      width,
      height
    });
  }


  // 获取长度与高度 要转移到 TableViewForEvent
  getDrawBoxByRiCi(ri, ci): DrawBoxDetail {
    const { coreRows, coreCols } = this;
    const left = this.getTotalWidthBetweenTwoIndex(0, ci);
    const top = this.getTotalHeightBetweenTwoIndex(0, ri);
    // 寻找merge
    let findMergeLoc = this.coreSheet.coreWorkbook.calcWorkbookEditor.multiMergeLoc.getMergeLocByLeftTopRiCi(this.coreSheet.coreSheetID, ri, ci);
    let width,
      height,
      isMergeRange;
    if (findMergeLoc) { // 存在merge
      let [minRi, minCi, maxRi, maxCi] = findMergeLoc.split('_')
        .map((x) => +x);
      width = this.getTotalWidthBetweenTwoIndex(minCi, maxCi + 1);
      height = this.getTotalHeightBetweenTwoIndex(minRi, maxRi + 1);
      isMergeRange = true;
    } else { // 不存在merge
      width = coreCols.ensureGetWidthByColID(ci);
      height = coreRows.ensureGetRowHeightByRi(ri);
      isMergeRange = false;
    }
    let formatCell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
    return new DrawBoxDetail(left, top, width, height, CELL_PADDING_WIDTH, formatCell, isMergeRange);
  }

  getRowIndexByViewRi(viewRi) {  // 获取长度与高度 要转移到 TableViewForEvent
    if (this.unsortedRowMap.has(viewRi)) {
      return this.unsortedRowMap.get(viewRi);
    }
    return viewRi;
  }


  getSelectedCell(): FormatCell { // 会考虑到autoFilter  // 获取长度与高度 要转移到 TableViewForEvent
    const { riOfEditingCell, ciOfEditingCell } = this.coreSelector;
    return this.coreRows.multiCoreRow.getFormatCellByRowIDColID(riOfEditingCell, ciOfEditingCell);
  }

  ensureGetSelectedCell(): FormatCell { // 会考虑到autoFilter  // 获取长度与高度 要转移到 TableViewForEvent
    const { riOfEditingCell, ciOfEditingCell } = this.coreSelector;
    return this.coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(riOfEditingCell, ciOfEditingCell);
  }


  getSelectedCellRiCi(ri, ci) {  // 获取长度与高度 要转移到 TableViewForEvent
    let nri = this.getRowIndexByViewRi(ri);
    return this.coreRows.multiCoreRow.getFormatCellByRowIDColID(nri, ci);
  }

  isXYInSelectedRect(x, y) {  // 获取长度与高度 要转移到 TableViewForEvent
    const {
      left, top, width, height,
    } = this.getRangePstLTHW(this.coreSelector.selectedCoreRange);
    const x1 = x - this.coreCols.headerWidth;
    const y1 = y - this.coreRows.headerHeight;
    return x1 > left && x1 < (left + width)
      && y1 > top && y1 < (top + height);
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  // 核心逻辑，寻找cellRange的位置; 当Scroll，exceptRowSet，Freeze有更新的时候都需要调整
  // 是相对于tableContent的坐标; 及时不在视图中也可以获取到坐标
  getRangePstDetailNew(cellRange: CellRangeProxy | RangeLocProxy): RangePstDetail {
    const { coreScrollPst, coreRows, coreCols, exceptRowSet, } = this;
    let { sri, sci, eri, eci} = cellRange;
    if(cellRange instanceof RangeLocProxy){ // todo:
      [sri, sci, eri, eci] = cellRange.indexArray
    }

    // no selector
    if (sri < 0 || sci < 0) { // 此时，range可视大小为0
      return new RangePstDetail(coreScrollPst);
    }
    const rangeLeft = coreCols.getColWidthBetweenTwoIndex(0, sci);
    const rangeTop = coreRows.getRowHeightBetweenTwoIndex(0, sri, exceptRowSet);
    const rangeHeight = coreRows.getRowHeightBetweenTwoIndex(sri, eri + 1, exceptRowSet);
    const rangeWidth = coreCols.getColWidthBetweenTwoIndex(sci, eci + 1);
    let rangeViewLeft = rangeLeft - coreScrollPst.x; // 相对于滚动条坐标点的坐标
    let rangeViewTop = rangeTop - coreScrollPst.y;

    // 下面是处理冻结单元格的逻辑， todo; 看起来有点不对
    const freezeTop = this.getFreezeTop();
    const freezeLeft = this.getFreezeLeft();
    if (freezeLeft > 0 && freezeLeft > rangeLeft) {
      rangeViewLeft = rangeLeft;
    }
    if (freezeTop > 0 && freezeTop > rangeTop) {
      rangeViewTop = rangeTop;
    }
    let res = new RangePstDetail(coreScrollPst, rangeLeft, rangeTop, rangeViewLeft, rangeViewTop, rangeHeight, rangeWidth);
    myLog.myPrint(PRINT_LEVEL2, cellRange);
    return res;
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  getRangePstLTHW(cellRange) {
    let res = this.getRangePstDetailNew(cellRange);
    return {
      l: res.rangeLeft,
      t: res.rangeTop,
      left: res.rangeViewLeft,
      top: res.rangeViewTop,
      height: res.rangeHeight,
      width: res.rangeWidth,
      scroll: res.scrollPstProxy,
    };
  }

  // 要转移到 TableViewForEvent
  isFreezeActive() {
    const [ri, ci] = this.freezeRiCi;
    return ri > 0 || ci > 0;
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  getFreezeLeft() {
    return this.coreCols.getColWidthBetweenTwoIndex(0, this.freezeRiCi[1]);
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  getFreezeTop() {
    return this.coreRows.getRowHeightBetweenTwoIndex(0, this.freezeRiCi[0]);
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  freezeViewRange() {
    const [ri, ci] = this.freezeRiCi;
    return new CellRangeProxy(0, 0, ri - 1, ci - 1, this.getFreezeLeft(), this.getFreezeTop());
  }

  // 获取长度与高度 要转移到 TableViewForEvent
  eachMergesInView(viewRange, cb) {
    this.multiCoreMerge.getOverlapMergeArray(viewRange)
      .forEach(it => cb(it));
  }


  // 如果在tableComp以外，会选取tableComp最近的哪个cell
  getCellPstByMovePst(relativePstDetail: RelativePstDetail): { cellRi:number, cellCi:number } { // 转移到CoreTableView
    let {yRelativeToTop, xRelativeToLeft} = relativePstDetail
    if(relativePstDetail.isRelativeToTable){
      yRelativeToTop = relativePstDetail.yRelativeToTop - this.tableViewDetail.headerRowHeight
      xRelativeToLeft = relativePstDetail.xRelativeToLeft - this.tableViewDetail.headerColWidth
    }
    let cellRi = this.getCellRiByMoveY(yRelativeToTop, relativePstDetail.yRelativeToBottom);
    let cellCi = this.getCellCiByMoveX(xRelativeToLeft, relativePstDetail.xRelativeToRight);
    return {
      cellRi,
      cellCi
    };
  }

  getCellCiByMoveX(xRelativeToLeft, xRelativeToRight) {
    let cellCi
    if (xRelativeToLeft <= 0) {
      cellCi = this.tableViewDetail.colsInView.minColID;
    } else {
      let maxWidth = xRelativeToRight >= 0 ? this.tableContentWidth : xRelativeToLeft;
      cellCi = this.tableViewDetail.getColsInViewByMaxWidth(maxWidth).maxColID;
    }
    return cellCi;
  }

  getCellRiByMoveY(yRelativeToTop, yRelativeToBottom) {
    let cellRi
    if (yRelativeToTop <= 0) {
      cellRi = this.tableViewDetail.rowsInView.minRowID;
    } else {
      let maxHeight = yRelativeToBottom >= 0 ? this.tableContentHeight : yRelativeToTop;
      cellRi = this.tableViewDetail.getRowsInViewByMaxHeight(maxHeight).maxRowID;
    }
    if(isHave(cellRi) === false)    {debugger}
    return cellRi
  }


  /**
   */
  getCellColByClickX(xRelativeToLeft) {
    let cellCi
    if (xRelativeToLeft <= 0) {
      cellCi = -1
    } else {
      cellCi = this.tableViewDetail.getColsInViewByMaxWidth(xRelativeToLeft).maxColID;
    }
    return cellCi;
  }

  /**
   * 获取鼠标位置对应的cellRow的位置；
   *  如果在tableContent以上的位置，返回-1，如果tableContent以下的位置，返回最底部的RowID
   */
  getCellRowByClickY(yRelativeToTop) {
    let cellRi
    if (yRelativeToTop <= 0) {
      cellRi = -1
    } else {
      cellRi = this.tableViewDetail.getRowsInViewByMaxHeight(yRelativeToTop).maxRowID;
    }
    return cellRi
  }


  // clickXY得到ri,ci可以是-1
  getCellPstDetailByClickXY(xRelativeToContent, yRelativeToContent): CellPstDetail { // 转移到CoreTableView
    let rowID = this.getCellRowByClickY(yRelativeToContent);
    let colID = this.getCellColByClickX(xRelativeToContent);
    let cellPstDetail = new CellPstDetail(rowID, colID);
    cellPstDetail.mousePstX = xRelativeToContent
    cellPstDetail.mousePstY = yRelativeToContent
    if (rowID >= 0 && colID >= 0) {
      let rangeLTWH = this.getMergeRangePstByClickRiCi(rowID, colID);
      Object.assign(cellPstDetail, rangeLTWH)
    }else{
      if (colID === -1) {
        cellPstDetail.width = this.coreCols.totalWidth();
      }
      else{
        cellPstDetail.left = this.getTotalWidthBetweenTwoIndex(0, colID);
        cellPstDetail.width = this.coreCols.ensureGetWidthByColID(colID);
      }
      if (rowID === -1) {
        cellPstDetail.height = this.coreRows.totalHeight();
      }
      else {
        cellPstDetail.top = this.getTotalHeightBetweenTwoIndex(0, rowID);
        cellPstDetail.height = this.coreRows.ensureGetRowHeightByRi(rowID);
      }
    }
    cellPstDetail.updateLeftTopByScrollXY(this.coreScrollPst.x, this.coreScrollPst.y) // 处理coreScroll
    return cellPstDetail
  }

// ============= 需要废弃的代码 =================
  // 获取潜在的可视的行列范围（resViewRange会在potentialViewRange中截图）
  getPotentialViewRangeOld(): CellRangeProxy { // 需要传递overlayContent元素的width与height作为参数来计算值
    let { scrollRi, scrollCi } = this.coreScrollPst;
    let rowsInView = this.tableViewDetail.getRowsInViewByMaxHeight();
    let colsInView = this.tableViewDetail.getColsInViewByMaxWidth();
    return new CellRangeProxy(scrollRi, scrollCi, rowsInView.maxRowID, colsInView.maxColID,
      colsInView.totalWidth, rowsInView.totalHeight);
  }

  getCellRectByXYOlD(x, y): CellPstDetail { // 需要删除
    const {
      coreScrollPst, multiCoreMerge,
    } = this;
    let { ri, top, height } = this.getCellRowByClickY(y, coreScrollPst.y);
    let { ci, left, width } = this.getCellColByClickX(x, coreScrollPst.x);
    if (ri >= 0 || ci >= 0) { // 处理合并单元格
      const merge = multiCoreMerge.getFirstIncludes(ri, ci);
      if (merge) {
        ri = merge.sri;
        ci = merge.sci;
        ({
          left: left,
          top,
          width,
          height,
        } = this.getMergeRangeAbsolutePstByLeftTopRiCi(ri, ci));
      }
    }
    return new CellPstDetail(ri, ci, left, top, width, height);
  }

}
