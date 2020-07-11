import { stringAt } from '../../global_utils/alphabet';
import { TableCanvasDealer, } from './table_canvas_comp';
import { CSS_PREFIX, look } from '../../global_utils/config_for_core_and_component';
// import {deepCopy, distinct} from "../core/operator";
import { isHave } from '../../global_utils/check_value';
import {
  CELL_PADDING_WIDTH,
  TABLE_FIXED_HEADER_BG_COLOR_STYLE, TABLE_HEADER_GRID_COLOR0, TABLE_HEADER_GRID_COLOR1,
  TABLE_HEADER_HIGHLIGHT_STYLE, TABLE_HEADER_HIGHLIGHT_TEXT_STYLE,
  TABLE_HEADER_STYLE_OBJ, TABLE_LEFT_TOP_TRIANGLE_BG_COLOR_STYLE
} from '../utils/component_table_config';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { DrawBoxDetail } from '../../core/core_data_proxy/view_box_detail';
import { FinElement, h } from '../basic_unit/element';


/** end */
export class TableComp { // 包括行列的header，以及内部单元格的内容
  sheetComp: SheetComp;
  coreSheet: CoreSheet;
  tableCanvasComp: TableCanvasDealer;
  el: HTMLElement;
  tableFel: FinElement

  constructor(coreSheet, sheetComp) {
    this.tableFel = h('canvas', `${CSS_PREFIX}-table`);
    this.el = this.tableFel.el;
    this.sheetComp = sheetComp;
    this.tableCanvasComp = new TableCanvasDealer(this.el.getContext('2d'), coreSheet, this);
    // this.factory = created ApplicationFactory(data.methods, data.name, this);
    // this.editor = editor;
    this.data = coreSheet;
    this.coreSheet = this.data;
    // this.scrollTimer = null;
    // this.worker = created Worker();
    this.autoAdaptList = [];
  }

  getCellTextContent(rindex, cindex) {
    const { coreSheet } = this;
    const { sortedRowMap } = coreSheet;
    let nrindex = rindex;
    if (sortedRowMap.has(rindex)) {
      nrindex = sortedRowMap.get(rindex);
    }

    const cell = this.coreSheet.coreRows.multiCoreRow.getFormatCellByRowIDColID(nrindex, cindex);
    if (cell === null) return;

    return cell.text || '';
  }

  getDrawBox(rindex, cindex): DrawBoxDetail {
    const {
      left, top, width, height,
    } = this.coreSheet.tableViewForEvent.getMergeRangeAbsolutePstByLeftTopRiCi(rindex, cindex);
    return new DrawBoxDetail(left, top, width, height, CELL_PADDING_WIDTH);
  }


  getCellTextStyle(rindex, cindex) {
    const { coreSheet } = this;
    const { sortedRowMap } = coreSheet;
    let nrindex = rindex;
    if (sortedRowMap.has(rindex)) {
      nrindex = sortedRowMap.get(rindex);
    }

    return coreSheet.getCellStyleSetting(nrindex, cindex);
  }

  // 处理冻结单元格的视图
  //  renderFreezeArea(coreSheet, viewRange, freezeTop, headerColWith, headerRowHeight, freezeLeft, scrollLeft, scrollTop) {
  //    const [freezeRi, freezeCi] = coreSheet.tableViewForEvent.freezeRiCi;
  //    if (freezeRi > 0 || freezeCi > 0) {
  //      // 2
  //      if (freezeRi > 0) {
  //        const vr = viewRange.getCopy();
  //        vr.sri = 0;
  //        vr.eri = freezeRi - 1;
  //        vr.h = freezeTop;
  //        this.renderContentGrid(vr, headerColWith, headerRowHeight, freezeLeft, 0);
  //        this.renderMergeAndContent(vr, headerColWith, headerRowHeight, -scrollLeft, 0);
  //        this.drawFixedHeaders('top', vr, headerColWith, headerRowHeight, freezeLeft, 0);
  //      }
  //      // 3x
  //      if (freezeCi > 0) {
  //        const vr = viewRange.getCopy();
  //        vr.sci = 0;
  //        vr.eci = freezeCi - 1;
  //        vr.w = freezeLeft;
  //        this.renderContentGrid(vr, headerColWith, headerRowHeight, 0, freezeTop);
  //        this.drawFixedHeaders('leftSpanElIndex', vr, headerColWith, headerRowHeight, 0, freezeTop);
  //        this.renderMergeAndContent(vr, headerColWith, headerRowHeight, 0, -scrollTop);
  //      }
  //      // 4
  //      const freezeViewRange = coreSheet.tableViewForEvent.freezeViewRange();
  //      this.renderContentGrid(freezeViewRange, headerColWith, headerRowHeight, 0, 0);
  //      this.drawFixedHeaders('all', freezeViewRange, headerColWith, headerRowHeight, 0, 0);
  //      this.renderMergeAndContent(freezeViewRange, headerColWith, headerRowHeight, 0, 0);
  //      // 5
  //      this.renderFreezeHighlightLine(headerColWith, headerRowHeight, freezeLeft, freezeTop);
  //    }
  //  }
  // import Worker from 'worker-loader!../external/Worker2.js';


  /** 核心方法
   * table组件重新渲染
   */
  refreshTableDataThenRender() {
    this.tableCanvasComp.updateViewDetailByCoreTableView();
    // 先更新尺寸
    const tableWidthHeight = this.coreSheet.tableViewForEvent.getTableWidthHeight(); // 尺寸信息
    const tableContentPstDetail = this.coreSheet.tableViewForEvent.getTableContentPstDetail();
    this.tableFel.updateAttrByKeyValue(tableWidthHeight); //  overlayEl是依赖于table的
    this.sheetComp.overlayerEl.updateElLTWH(tableWidthHeight);// todoL
    this.sheetComp.overlayerCEl.updateElLTWH(tableContentPstDetail);
    this.sheetComp.updateSheetElWidthHeight(tableWidthHeight)
    // 更新canvas
    this.tableCanvasComp.resizeByTableWidthHeight(this.el);// canvas大小更新
    this.tableCanvasComp.clearCanvas0(this.el); // 清空cancvas
    this.tableCanvasComp.tableViewDetail.drawGridOnColAndRow(this.tableCanvasComp); // 这是是画tableContent中的grid； 这部分逻辑转移
    this.tableCanvasComp.tableViewDetail.drawAllCellAndMerge(this.tableCanvasComp);
    this.tableCanvasComp.tableViewDetail.drawAutoFilterHeader(this.tableCanvasComp);
    this.tableCanvasComp.tableViewDetail.drawFixedHeaders(this.tableCanvasComp)
    this.tableCanvasComp.tableViewDetail.drawFixedLeftTopCell(this.tableCanvasComp)
    // 处理scrollbar
    this.sheetComp.verticalScrollbar.resetVerticalScrollbar(); // todo: 行列的总宽度应该从
    this.sheetComp.horizontalScrollbar.resetHorizontalScrollbar();
    // 处理冻结单元格； 暂时先不用
    // this.renderFreezeArea(coreSheet, contentViewRange, freezeTop, headerColWith, headerRowHeight, freezeLeft, scrollLeft, scrollTop);
  }
}

