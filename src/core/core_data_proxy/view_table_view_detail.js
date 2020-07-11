import { CoreSheet } from './core_sheet_change';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { RangeLocProxy } from '../../calc/calc_data_proxy/loc_range_loc';
import {
  FILTER_BUTTON_HEIGHT,
  DROPDOWN_PADDING,
  FILTER_BUTTON_WIDTH,
  getIntOfDevicePixelNew,
  TableCanvasDealer
} from '../../component/comp_table/table_canvas_comp';
import { ColsInView, RowsInView, ViewColDetail, ViewRowDetail } from './view_col_row_in_view';
import {
  CELL_PADDING_WIDTH,
  TABLE_FIXED_HEADER_BG_COLOR_STYLE,
  TABLE_GRID_STYLE_OBJ,
  TABLE_HEADER_GRID_COLOR0,
  TABLE_HEADER_GRID_COLOR1,
  TABLE_HEADER_HIGHLIGHT_TEXT_STYLE,
  TABLE_HEADER_IN_FILTER_TEXT_STYLE,
  TABLE_HEADER_STYLE_OBJ,
  TABLE_LEFT_TOP_TRIANGLE_BG_COLOR_STYLE
} from '../../component/utils/component_table_config';
import { DrawBoxDetail } from './view_box_detail';
import { stringAt } from '../../global_utils/alphabet';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';
import { FilterHeaderButton } from './view_filter_button';
import { TableViewForEvent } from './view_table_view';
import { assertTrue } from '../../global_utils/check_value';

export const HEIGHT_LINE_THICKNESS = 2;

// 为canvas渲染而获取的数据
export class TableViewDetail {
  coreSheet: CoreSheet;
  coreTableView: TableViewForEvent;
  canvasElWidth: number;
  colsInView: ColsInView;
  rowsInView: RowsInView;
  devicePixelRatio: number;
  leftTopCellPst: Array;
  row0col0Pst: Array;
  cellLoc2FilterHeader: { [key: number]: FilterHeaderButton }; // 应该有不同的状态
  cellLoc2DrawBox: { [key: string]: DrawBoxDetail }; // 单个单元格
  mergeLoc2DrawBox: { [key: string]: DrawBoxDetail }; // 合并单元格
  drawBoxDetailArray: Object; // cellLoc2DrawBox与mergeLoc2DrawBox的drawBox的合并
  headerColWidth: number;

  constructor(coreSheet, coreTableView) {
    this.coreSheet = coreSheet;
    this.coreTableView = coreTableView;
  }

  get drawBoxDetailArray() {
    return Object.values(this.cellLoc2DrawBox)
      .concat(Object.values(this.mergeLoc2DrawBox));
  }

  getHeaderWidthHeight(){
    return [this.headerColWidth, this.headerRowHeight]
  }

  refreshAllInfo() {
    // 整个窗口大小
    this.colsInView = this.getColsInViewByMaxWidth();
    this.rowsInView = this.getRowsInViewByMaxHeight();
    //   更新三个属性
    this.rowsInView.updateDetailForDraw()
    this.colsInView.updateColDetailForDraw()
    this.tableWidth = this.coreTableView.tableWidth;
    this.tableHeight = this.coreTableView.tableHeight;
    this.canvasElWidth = getIntOfDevicePixelNew(this.tableWidth, this.devicePixelRatio);
    this.canvasElHeight = getIntOfDevicePixelNew(this.tableHeight, this.devicePixelRatio);
    // 左上方的单元格相对于table的位置
    this.updateColHeaderWidth(); // 自动调整列宽度
    this.leftTopCellPst = [this.headerColWidth, this.headerRowHeight];
    this.row0col0Pst = [this.headerColWidth - this.coreSheet.coreScrollBarProxy.x, this.headerRowHeight - this.coreSheet.coreScrollBarProxy.y];
    this.gridObj = this.getRowAndColGrid();
    this.updateCellLocAndMergeLoc2DrawBox();// 获取所有的drawBox
    this.cellLoc2FilterHeader = this.getCellLocToFilterHeader(); // 获取filter
    return this;
  }

  // 根据最大的行序号来调整列header的宽度
  updateColHeaderWidth() {
    this.headerColWidth = Math.max(String(this.rowsInView.maxRowID).length * 10, this.coreSheet.coreCols.headerWidth);
    this.headerRowHeight = this.coreSheet.coreRows.headerHeight;
  }

  forEachRiCiInView(func) {
    for (let [rowID, rowTopHeight] of Object.entries(this.rowsInView.rowID2rowInViewDetail)) {
      for (let [colID, colLeftWidth] of Object.entries(this.colsInView.colID2ColDetail)) {
        func(rowID, rowTopHeight, colID, colLeftWidth);
      }
    }
  }

  getRowsInViewByMaxHeight(maxHeight = this.coreTableView.tableContentHeight, initRi = this.coreSheet.coreScrollBarProxy.scrollRi): RowsInView { // 应该转移到tableDetail
    let totalHeight = 0;
    let rowID2RowInViewDetail = {};
    assertTrue(maxHeight >= 0, 'maxHeight必须大于等于0！');
    initRi = parseInt(initRi); // 转变为数字
    for (let curRowID = initRi; curRowID <= this.coreSheet.coreRows.maxRowID; curRowID = this.coreTableView.getNextRowID(curRowID)) {
      if (totalHeight >= maxHeight) {
        break;
      }
      let curHeight = this.coreSheet.coreRows.ensureGetRowHeightByRi(curRowID);
      rowID2RowInViewDetail[curRowID] = new ViewRowDetail({
        rowTop: totalHeight,
        rowHeight: curHeight
      });
      totalHeight += curHeight;
    }
    return  new RowsInView(rowID2RowInViewDetail, this);
  }


  getColsInViewByMaxWidth(maxWidth = this.coreTableView.tableContentWidth, initCi = this.coreTableView.coreScrollPst.scrollCi): ColsInView {// 应该转移到tableDetail
    let totalWidth = 0;
    let colID2LeftWidth = {};
    assertTrue(maxWidth >= 0, 'maxWidth必须大于等于0！');
    initCi = parseInt(initCi);
    for (let curColID = initCi; curColID <= this.coreSheet.coreCols.maxColID; curColID = this.coreTableView.getNextColID(curColID)) {
      if (totalWidth >= maxWidth) {
        break;
      }
      let curWidth = this.coreSheet.coreCols.ensureGetWidthByColID(curColID);
      colID2LeftWidth[curColID] = new ViewColDetail({
        colLeft: totalWidth,
        colWidth: curWidth
      });
      totalWidth += curWidth;
    }
    return new ColsInView(colID2LeftWidth,this);
  }


  // 获取autoFilter的header对应的drawBoxArray，以及整个筛选范围的drawBox
  getCellLocToFilterHeader() {
    if (!this.coreSheet.coreSortFilter.isSortFilterActive()) {
      return;
    }
    let cellLocToFilterHeader = {};
    let cellLoc2FilterType = this.coreSheet.coreSortFilter.getCellLoc2FilterType((colID) => this.coreTableView.getNextColID(colID));
    for (let [cellLoc, filterType] of Object.entries(cellLoc2FilterType)) {
      let cellLocProxy = new CellLocStrProxy(cellLoc);
      let [ri, ci] = [cellLocProxy.rowID, cellLocProxy.colID];
      let leftWidthHeight = this.coreTableView.getLeftWidthHeightByRiCi(ri, ci); // 获取区域
      let formatCell = this.coreSheet.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
      leftWidthHeight.left = leftWidthHeight.left + leftWidthHeight.width - FILTER_BUTTON_WIDTH;
      leftWidthHeight.top = leftWidthHeight.top + leftWidthHeight.height - FILTER_BUTTON_HEIGHT;
      leftWidthHeight.width = FILTER_BUTTON_WIDTH;
      leftWidthHeight.height = FILTER_BUTTON_HEIGHT;
      let curDrawBox = DrawBoxDetail.fromLeftRightWidthHeight(leftWidthHeight, DROPDOWN_PADDING, formatCell, false);
      cellLocToFilterHeader[cellLoc] = new FilterHeaderButton(curDrawBox, filterType);
    }
    let cellLoc2SortAscOrDesc = this.coreSheet.coreSortFilter.getCellLoc2SortAscOrDesc()
    if(cellLoc2SortAscOrDesc){
      for(let [cellLoc, sortAscOrDesc] of Object.entries(cellLoc2SortAscOrDesc)){
        cellLocToFilterHeader[cellLoc].sortAscOrDesc = sortAscOrDesc
      }
    }
    return cellLocToFilterHeader;
  }

  getMergeLocArrayByMinMaxRiCi(minRi, minCi, maxRi, maxCi) {
    let curIndexArray = [minRi, minCi, maxRi, maxCi];
    return this.coreSheet.coreWorkbook.calcWorkbookEditor.multiMergeLoc.getMergeArrayInRange(this.coreSheet.coreSheetID, RangeLocProxy.fromIndexArray(curIndexArray));
  }

  updateCellLocAndMergeLoc2DrawBox(): Array<DrawBoxDetail> {
    let cellLoc2DrawBox = {};
    let allMergeLoc = [];
    this.forEachRiCiInView(
      (rowID, rowTopHeight, colID, colLeftWidth) => {
        // 如果在merge的范围内
        let findMergeLocArray = this.getMergeLocArrayByMinMaxRiCi(rowID, colID, rowID, colID);
        if (findMergeLocArray.length > 0) {
          allMergeLoc = allMergeLoc.concat(findMergeLocArray);
        }
        // 寻找formatCell
        else {
          let curFormatCell = this.coreSheet.coreRows.multiCoreRow.getFormatCellByRowIDColID(rowID, colID);
          if (curFormatCell) {
            let { left, top, width, height } = this.coreTableView.getLeftWidthHeightByRiCi(rowID, colID);
            let isMergeRange = false;
            let cellLoc = [rowID, colID].join('_');
            cellLoc2DrawBox[cellLoc] = new DrawBoxDetail(left, top, width, height, CELL_PADDING_WIDTH, curFormatCell, isMergeRange);
          }
        }
      }
    );
    this.cellLoc2DrawBox = cellLoc2DrawBox;
    let mergeLoc2DrawBox = {};
    let uniqueMergeLocArray = Array.from(new Set(allMergeLoc)); // 去掉重复
    uniqueMergeLocArray.forEach(
      (mergeloc) => {
        let rangeProxy = new RangeLocProxy(mergeloc);
        let curFormatCell = this.coreSheet.coreRows.multiCoreRow.getFormatCellByRowIDColID(rangeProxy.indexArray[0], rangeProxy.indexArray[1]);
        let { left, top, width, height } = this.coreTableView.getLeftWidthHeightByMinMaxRiCi(...rangeProxy.indexArray);
        mergeLoc2DrawBox[mergeloc] = new DrawBoxDetail(left, top, width, height, CELL_PADDING_WIDTH, curFormatCell, true);
      }
    );
    this.mergeLoc2DrawBox = mergeLoc2DrawBox;
  }


  getRowAndColGrid(): { rowGrid: Array, colGrid: Array } {
    let res = {
      rowGrid: [],
      colGrid: []
    };
    for (let [rowID, topHeight] of Object.entries(this.rowsInView.rowID2rowInViewDetail)
      .slice(1)) { // 第一条线不画
      res.rowGrid.push([[0, topHeight.rowTop], [this.colsInView.totalWidth, topHeight.rowTop]]);
    }
    res.rowGrid.push([[0, this.rowsInView.totalHeight], [this.colsInView.totalWidth, this.rowsInView.totalHeight]]); // 画最后一个横线
    for (let [colID, leftWidth] of Object.entries(this.colsInView.colID2ColDetail)
      .slice(1)) {
      res.colGrid.push([[leftWidth.colLeft, 0], [leftWidth.colLeft, this.rowsInView.totalHeight]]);
    }
    res.colGrid.push([[this.colsInView.totalWidth, 0], [this.colsInView.totalWidth, this.rowsInView.totalHeight]]); // 最后一列
    return res;
  }


  updateAllTextLine(tableCanvasComp: TableCanvasDealer) {
    for (let [cellLoc, curMergeDrawBox] of Object.entries(this.cellLoc2DrawBox)) {
      let curPadding = this.cellLoc2FilterHeader.hasOwnProperty(cellLoc) ? FILTER_BUTTON_WIDTH + DROPDOWN_PADDING : 0;
      curMergeDrawBox.updateTextLineArray(tableCanvasComp, this.coreSheet.isShowFormula, curPadding);
    }
    for (let [mergeLoc, curMergeDrawBox] of Object.entries(this.mergeLoc2DrawBox)) {
      let leftTopCellLoc = new RangeLocProxy(mergeLoc).getLeftTopCellLoc();
      let curPadding = this.cellLoc2FilterHeader.hasOwnProperty(leftTopCellLoc) ? FILTER_BUTTON_WIDTH + DROPDOWN_PADDING : 0;
      curMergeDrawBox.updateTextLineArray(tableCanvasComp, this.coreSheet.isShowFormula, curPadding);
    }
  }

  // ================ 所有的draw函数都在这里 ========================

  // 遍历所有的行,画线
  drawGridOnColAndRow(tableCanvasComp: TableCanvasDealer) {
    tableCanvasComp.saveAndBeginPath();
    tableCanvasComp.clearRect(0, 0, this.colsInView.totalWidth, this.rowsInView.totalHeight); // 清空canvas
    if (this.coreSheet.coreSheetSetting.showGrid) { // 如果不显示网格线，直接退出
      tableCanvasComp.updateAttrByName2Value(TABLE_GRID_STYLE_OBJ) // 设置tableGrid的样式
        .translate(...this.leftTopCellPst); // 左上方的单元格相对于table的位置
      this.gridObj.rowGrid.forEach(line => tableCanvasComp.drawLineByPoints(line[0], line[1]));
      this.gridObj.colGrid.forEach(line => tableCanvasComp.drawLineByPoints(line[0], line[1]));
    }
    tableCanvasComp.restore(); // 从tableGridStyle返回到defaultStyle
    // debugger
  }

  // 遍历所有的单元格与合并单元格
  drawAllCellAndMerge(tableCanvasComp: TableCanvasDealer) {
    tableCanvasComp.saveAndBeginPath();
    tableCanvasComp.translate(...this.row0col0Pst); // 这个调整起始点到0，0单元格
    this.drawBoxDetailArray.forEach(
      (curMergeDrawBox) => {
        // 处理cellText
        tableCanvasComp.drawFillBgColor(curMergeDrawBox); // 画出填充
        // 画边框,边框能够画到填充上面
        tableCanvasComp.drawBorderDetailArray(curMergeDrawBox.borderDetailArray);
        tableCanvasComp.drawTextLinesNew(curMergeDrawBox.textLineArray, curMergeDrawBox);
      }
    );
    tableCanvasComp.restore();
  }

  // viewRange
// type: all | leftSpanElIndex | top
// w: the fixed width of header
// h: the fixed height of header
// tx: moving distance on x-axis
// ty: moving distance on y-axis
  drawFixedHeaders(tableCanvasDealer: TableCanvasDealer) {
    tableCanvasDealer.saveAndBeginPath();
    // header的背景颜色填充
    // tableCanvasDealer.updateAttrByName2Value(TABLE_FIXED_HEADER_BG_COLOR_STYLE);
    // tableCanvasDealer.fillRect(0, this.headerRowHeight, this.headerColWidth, this.tableHeight);
    // tableCanvasDealer.fillRect(this.headerColWidth, 0, this.tableWidth, this.headerRowHeight);
    const {
      sri, sci, eri, eci,
    } = this.coreSheet.coreSelector.selectedCoreRange;
    // tableCanvasDealer text
    // text font, align...
    tableCanvasDealer.updateAttrByName2Value(TABLE_HEADER_STYLE_OBJ());
    let splitLineRatio = 0; // 等于0的时候是完整覆盖
    // col_header
    this.rowsInView.drawColHeaderSplitAndHighLight(tableCanvasDealer);
    // row_header
    this.colsInView.drawRowHeaderSplitAndHighLight(tableCanvasDealer, sci, eci);
  }

  drawAutoFilterHeader(tableCanvasDealer: TableCanvasDealer) { // 画出下三角
    tableCanvasDealer.saveAndBeginPath();
    tableCanvasDealer.translate(...this.row0col0Pst);
    let filterButtonArray = Object.values(this.cellLoc2FilterHeader);
    filterButtonArray.forEach(
      (filterButton: FilterHeaderButton) => {
        filterButton.drawAutoFilterButton(tableCanvasDealer);
      }
    );
    tableCanvasDealer.restore();
  }


  drawFixedLeftTopCell(tableCanvasDealer: TableCanvasDealer) {
    const TRIANGLE_WIDTH = 11;
    const TRIANGLE_PADDING = 4;
    tableCanvasDealer.saveAndBeginPath();
    // leftSpanElIndex-top-cell
    tableCanvasDealer.updateAttrByName2Value(TABLE_FIXED_HEADER_BG_COLOR_STYLE) // 应该再在右下角画一个三角形
      .fillRect(0, 0, this.headerColWidth, this.headerRowHeight);
    tableCanvasDealer.updateAttrByName2Value(TABLE_LEFT_TOP_TRIANGLE_BG_COLOR_STYLE);
    tableCanvasDealer.ctx.moveTo(this.headerColWidth - TRIANGLE_PADDING - TRIANGLE_WIDTH, this.headerRowHeight - TRIANGLE_PADDING); //从A（100,0）开始
    tableCanvasDealer.ctx.lineTo(this.headerColWidth - TRIANGLE_PADDING, this.headerRowHeight - TRIANGLE_PADDING);//从A(100,0)开始，画到B (0,173)结束
    tableCanvasDealer.ctx.lineTo(this.headerColWidth - TRIANGLE_PADDING, this.headerRowHeight - TRIANGLE_PADDING - TRIANGLE_WIDTH); //B(0,173)-C(200,173)
    tableCanvasDealer.ctx.fill();
    tableCanvasDealer.restore();
  }

}

// 专门处理table的视图的行为类； 需要考虑冻结单元格，autofill，滚动条位置
