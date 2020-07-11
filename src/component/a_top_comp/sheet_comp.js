import { AutoFillSelectorComp, MoveSelectorComp } from '../comp_selector/move_selector';
import { FinElement, h } from '../basic_unit/element';
import {
  CSS_PREFIX,
  EVENT_COPY,
  EVENT_CUT,
  EVENT_PASTE,
  EVENT_WIN_RESIZE
} from '../../global_utils/config_for_core_and_component';
import { ToolbarComp } from '../comp_single_file/toolbar';
import { ColResizer, RowResizer } from '../comp_single_file/resizer_comp';
import { HorizontalScrollbar, VerticalScrollbar } from '../comp_single_file/scrollbar';
import { CellEditorComp } from '../comp_cell_editor/editor';
import { calc } from '../../calc';
import { Website } from '../comp_single_file/website';
import { ModalValidation } from '../comp_single_file/modal_validation';
import { ErrorMsgDialog, showMsgBox } from '../comp_single_file/message_dialog';
import { ContextMenu } from '../comp_single_file/contextmenu';
import { SelectorContainerComp } from '../comp_selector/selector_comp';
import { Advice } from '../comp_single_file/advice';
import { ChartView } from '../../chart/chart_cmd/chart_view';
import { SortFilterComp } from '../comp_single_file/sort_filter';
import { TableComp } from '../comp_table/table_comp';
import { deepCopyObj } from '../../global_utils/operator';
import { bind, remove } from '../utils/event_helper';
import { isCalcResError } from '../../global_utils/func_for_calc_core';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { SelectorDetail } from '../comp_cell_editor/formula_edit_bhv';
import { PasteBhv } from '../event_dealer/paste_event_bhv';
import { CopyBhv } from '../event_dealer/copy_event_bhv';
import { SheetEventDealer } from '../event_dealer/all_sheet_event';
import { FooterContainerComp } from '../comp_single_file/foot_container_comp';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { OverlayComp } from './overlay_comp';
import { myLog, PRINT_LEVEL2, PRINT_LEVEL3 } from '../../log/new_log';
import { SheetOperationDealer } from '../event_dealer/sheet_operation_dealer';

export class SheetComp {

  refSelectors: Array<SelectorDetail>;
  selectorContainerComp: SelectorContainerComp;
  sortFilterComp: SortFilterComp;
  autoFillSelectorComp:AutoFillSelectorComp

  cellEditorComp: CellEditorComp;
  errorMsgDialogComp: ErrorMsgDialog;

  coreSheet: CoreSheet;
  tableRenderTimer: number; // 异步发起的table.render事件的倒计时, 因为table.render执行此时很多，会把一定动态合并起来，一起更新。
  contextMenuComp: ContextMenu;
  overlayerEl: FinElement;
  overlayerCEl:FinElement
  overlayComp: OverlayComp;
  verticalScrollbar: VerticalScrollbar;
  el: FinElement;
  rootFel: FinElement
  moveSelectorComp: MoveSelectorComp

  constructor(rootFel, coreSheet) {
    this.el = h('div', `${CSS_PREFIX}-sheet`);
    // ============ 数据  ============
    this.pictureOffsetLeft = 10;
    this.pictureOffsetTop = 10;

    this.data = coreSheet;
    this.coreSheet = this.data;
    this.refSelectors = []; // 会被引用
    this.sheetEventDealer = new SheetEventDealer(this);
    this.sheetOperationDealer = new SheetOperationDealer(this); // 需要用到eventDealer
    this.rootFel = rootFel

    // ============ 组件  ============
    this.toolbarComp = new ToolbarComp(coreSheet, this.coreSheet.coreSheetSetting.showToolbar, this);
    rootFel.children(this.toolbarComp.el, this.el);

    this.footerContainerComp = new FooterContainerComp(this);
    this.pasteBhv = new PasteBhv(this);
    this.copyBhv = new CopyBhv(this);

    // resizer
    this.rowResizer = new RowResizer(this, coreSheet.coreRows.minHeight);
    this.colResizer = new ColResizer(this, coreSheet.coreCols.minWidth);
    // scrollbar
    this.verticalScrollbar = new VerticalScrollbar(this);
    this.horizontalScrollbar = new HorizontalScrollbar(this);
    // editor
    this.cellEditorComp = new CellEditorComp(
      calc.fnNameArrayWithKey,
      coreSheet,
      this,
    );
    this.website = new Website(coreSheet, this.cellEditorComp);

    // coreSheet validation
    this.modalValidation = new ModalValidation();
    this.errorMsgDialogComp = new ErrorMsgDialog();
    // contextMenuComp
    this.contextMenuComp = new ContextMenu(this, !this.coreSheet.coreSheetSetting.showContextmenu);
    // selector
    this.selectorContainerComp = new SelectorContainerComp(coreSheet, this, true);
    // this.editorProxy = created EditorProxy();

    this.advice = new Advice(coreSheet, this);
    // this.pasteDirectionsArr = [];
    // this.pasteOverlay = h('div', `${CSS_PREFIX}-paste-overlay-picContainer`).hide();
    this.chartView = new ChartView();
    this.picContainer = h('div', '');

    this.selectorsEl = h('div', `selector_clear`)
      .updateAttrByKeyValue('id', 'selector_clear');
    this.mergeSelector = false;

    // 把图片容器移到了 overlayerCEl 下面，原因是 如果在 overlayerEl下面 会遮挡表头
    this.overlayerCEl = this.createOverlayCEl(this.coreSheet.coreSheetSetting.showEditor); // 未来要转移
    this.overlayComp = new OverlayComp(this); // 会把overlayerCEl作为子元素
    this.overlayerEl = this.overlayComp.overlayFel;
    // 依赖overlay来获取tableRect, coreTableView使用相关数据的时候都会调用这个方法来更新tableRect属性
    this.coreSheet.tableViewForEvent.updateTableWHAndDevicePixelFunc(
      () => this.getTableWidth(),
      () => this.getTableHeight());

    // sortFilterComp
    this.sortFilterComp = new SortFilterComp(this);

    this.direction = false;   // 图片移动
    // table
    this.tableComp = new TableComp(coreSheet, this);
    // root element
    this.el.children(
      this.tableComp.tableFel,
      this.rowResizer.el,
      this.overlayerEl.el,
      this.colResizer.el,
      this.verticalScrollbar.el,
      this.horizontalScrollbar.el,
      this.contextMenuComp.el,
      this.modalValidation.el,
      this.errorMsgDialogComp.el,
      this.sortFilterComp.el,
      this.advice.el,
      this.website.el,
      this.website.tableEl,
      // this.pasteOverlay.el,
    );
    this.moveSelectorComp = new MoveSelectorComp(this)
    this.autoFillSelectorComp = new AutoFillSelectorComp(this)

    this.sheetInitEvents(); // 初始化各个事件
    this.sheetReset();
    // init selector [0, 0]
    this.selectorContainerComp.updateByFirstSelectMerge()
  }
  // ================== 计算宽度与高度 ==================
  getSheetWidth(){
    return document.documentElement.clientWidth
  }
  getSheetHeight(){
    let rect = this.toolbarComp.el.el.getBoundingClientRect() // 去掉在toolbarCom的下方
    return document.documentElement.clientHeight - rect.top - rect.height
  }

  getTableWidth(){
    return this.getSheetWidth() - this.verticalScrollbar.getTotalWidth()
  }
  getTableHeight(){
    let rect = this.toolbarComp.el.el.getBoundingClientRect() // 去掉在toolbarCom的下方
    return this.getSheetHeight() - this.verticalScrollbar.getTotalWidth()
  }

  // table.render使用异步的好处是相邻时刻可能有很多次table.render需要执行，可以合并执行
  setTimeOutForTableRender(timeOut = 100) {
    clearTimeout(this.tableRenderTimer);
    this.tableRenderTimer = setTimeout(() => {
      /**
       * @type {TableComp} table
       */
      this.tableComp.refreshTableDataThenRender();
    }, timeOut);
  }

  /**
   * 应该是用来创建overlay 组件
   * @param showEditor
   * @return {*}
   */
  createOverlayCEl(showEditor = true) {
    // let {selector} = this;
    if (showEditor === true) {
      return this.overlayerCEl = h('div', `${CSS_PREFIX}-overlayer-content`)
        .children(
          this.cellEditorComp.el,
          this.selectorContainerComp.el,
          this.chartView.el,
          this.selectorsEl,
          this.picContainer
        );
    } else {
      return this.overlayerCEl = h('div', `${CSS_PREFIX}-overlayer-content`)
        .children(
          this.chartView.el,
          this.selectorsEl,
          this.picContainer
        );
    }

  }

  setCellRange(reference, tableProxy, styleBool, cellRange) {
    for (let i = 0; i < reference.length; i++) { // 遍历reference
      let { ri, ci } = reference[i]; // 获取i元素的ri与ci属性
      let cell = deepCopyObj(tableProxy.rows.multiCoreRow.ensureGetFormatCellByRowIDColID(ri, ci)); // 获取cell
      if (styleBool === false) { // 取消格式？
        delete cell['cellStyleID'];
      }
      this.cellEditorComp.selectorCellText(ri, ci, cell, 'style');
      this.selectorSet(true, ri, ci, true, true);
    }
    this.coreSheet.changePaste(cellRange);
  }

  selectorEditorReset(ri, ci) {
    let { selectorContainerComp } = this;
    this.cellEditorComp.updateCellEditorCompBySelector(true, ri, ci);

    selectorContainerComp.hide();
    this.sheetReset();
  }

  // 初始化的时候导入数据
  initLoadData(data) {
    this.data.setData(data, this);
    this.sheetReset();
    return this;
  }

  // freeze coreRows or coreCols
  freeze(ri, ci) {
    const { data } = this;
    data.changeSetFreeze(ri, ci);
    this.sheetReset();
    return this;
  }

  undo() {
    this.data.undo(this);
    this.sheetReset();
  }

  redo() {
    this.data.redo();
    this.sheetReset();
  }

  reload() {
    this.sheetReset();
    return this;
  }

  removeEvent() {
    remove.call(this);
  }

  footerContainerReset() {
    this.footerContainerComp.footerContainerReset();
  }

  // 这块应该直接弹窗提示
  insertRows(len) {
    let { data, verticalScrollbar } = this;
    let { coreRows } = data;
    let calcRes = data.changeInsertRowOrCol('row', len * 1, data.coreCols.len);
    if (isCalcResError(calcRes)) { // 出现错误
      console.log('应该显示弹窗 src/component/component_unit/component_sheet.js');
      return calcRes;
    }
    this.sheetReset();
    verticalScrollbar.updateByScrollValue({ top: coreRows.totalHeight() });
    // afterMoveVerticalScrollbar.call(this, data.coreRows.totalHeight() - data.tableViewForEvent.getHeightForTableComp()  );
  }


  /**
   * 重新渲染
   * 这里的this是ComponentSheet类实例
   * 在sheetComp新建的时候就会执行sheetReset
   */
  sheetReset() {
    this.coreSheet.coreSortFilter.applyFilterAndSortToRows() // 执行筛选
    this.tableComp.refreshTableDataThenRender();
    this.resetEditorAndSelectorByNewFreeze();
    this.toolbarComp.reset();
    // this.selectorContainerComp.updateByCoreSheet(); // 感觉不需要了
  }
  updateSheetElWidthHeight(tableWidthHeight){
    this.el.updateElLTWH({width: this.getSheetWidth(),
      height: this.getSheetHeight()})
  }

  // 与冻结单元格有关的逻辑
  /**
   * 设定冻结视图
   */
  resetEditorAndSelectorByNewFreeze() {
    const {
      selectorContainerComp,  cellEditorComp,
    } = this;
    const [ri, ci] = this.coreSheet.tableViewForEvent.freezeRiCi;
    if (ri > 0 || ci > 0) {
      const fwidth = this.coreSheet.tableViewForEvent.getFreezeLeft();
      const fheight = this.coreSheet.tableViewForEvent.getFreezeTop();
      cellEditorComp.setFreezeLengths(fwidth, fheight);
    }
    selectorContainerComp.updateSelfByCoreSelector()
  }

  /**
   * 插入或删除行列
   * @param type
   */
  insertDeleteRowColumn(type) {
    const { data } = this;
    if (type === 'changeInsertRowOrCol-row') {
      data.changeInsertRowOrCol('row');
    } else if (type === 'delete-row') {
      data.changeDelete('row');
    } else if (type === 'changeInsertRowOrCol-column') {
      data.changeInsertRowOrCol('column');
    } else if (type === 'delete-column') {
      data.changeDelete('column');
    } else if (type === 'delete-cell') {
      data.changeDeleteCell();
    } else if (type === 'delete-cell-format') {
      data.changeDeleteCell('format');
    } else if (type === 'delete-cell-text') {
      data.changeDeleteCell('text');
    }
    this.clearInnerClipboard();
    this.footerContainerComp.footerContainerReset();
    this.sheetReset();
  }


  /**
   * 清楚剪贴状态
   */
  clearInnerClipboard() {
    this.coreSheet.coreClipSelector.clear();
    this.selectorContainerComp.primeSelectorComp.hideClipboard();
  }

  /**
   * 点击复制，进入copy状态
   */
  copy() {
    this.coreSheet.coreClipSelector.updateByCoreSelector(0);
    this.selectorContainerComp.showClipboard();
  }

  /**
   * 点击剪切，进入cut状态
   */
  cut() {
    this.coreSheet.coreClipSelector.updateByCoreSelector(1)
    this.selectorContainerComp.showClipboard();
  }

  /**
   * 点击黏贴
   * @param what
   * @param cb
   * @return {void|*|never}
   */
  paste(what, cb = (p) => {
    if (p) {
      this.clearInnerClipboard();
      this.sheetReset();
    }
  }) {
    const { data } = this;
    let p = data.changePaste(what, msg => showMsgBox('Tip', msg));
    cb(p);

    return p;
  }

  /**
   * 黏贴事件
   * @param evt
   */
  pasteEvent(evt) {
    this.clearInnerClipboard();
    this.pasteBhv.mountPaste(evt, () => {
      this.sheetReset();
      this.coreSheet.postChangeData(this.coreSheet.getWorkbookServerObj());
    });
  }

  /**
   * 设定选定区域
   * @param multiple
   * @param ri
   * @param ci
   * @param isUpdateSelectedCell
   */
  selectorSet(multiple, ri, ci, isUpdateSelectedCell = true, moving = false) {  // todo: isUpdateSelectedCell = false 的时候不再支持
    // if(ri === 0 && ci === 0) { // 左上角全选
    //     ri = -1;
    //     ci = -1;
    // }
    // if (ri === -1 && ci === -1) return;
    if (multiple) {
      this.coreSheet.coreSelector.updateByLastSelectCell(ri, ci);
      this.selectorContainerComp.updateSelfAndToolBarByCoreSelector()
    } else {
      this.coreSheet.coreSelector.updateByFirstSelectCell(ri, ci)
      this.selectorContainerComp.updateByFirstSelectMerge();
    }

    this.setTimeOutForTableRender();

    if (ri < 0) {
      // debugger; // 有问题
    }
    myLog.myPrint(PRINT_LEVEL2, {
      multiple,
      ri,
      ci,
      indexesUpdated: isUpdateSelectedCell,
    });
  }

  /**
   * selectorRange 的移动； todo: 有bug
   * @param multiple
   * @param direction
   */
  selectorMove(multiple, direction) {
    const { selectorContainerComp } = this;
    const { coreRows, coreCols } = this.coreSheet;
    if (this.cellEditorComp.isCors) {
      this.coreSheet.coreSelector.updateByFirstSelectCell(this.cellEditorComp.editorInputComp.ri, this.cellEditorComp.editorInputComp.ci)
    }
    let ri = this.coreSheet.coreSelector.riOfEditingCell;
    let ci = this.coreSheet.coreSelector.ciOfEditingCell;
    const { eci } = this.coreSheet.coreSelector.selectedCoreRange;

    // if((editor.ri != ri && editor.ri != -1) || (editor.ci != ci && editor.ci != -1)) {
    //     return;
    // }

    if (direction === 'left') { // 移动方向
      if (ci > 0) ci -= 1;
    } else if (direction === 'right') {
      if (eci !== ci) ci = eci;
      if (ci < coreCols.len - 1) ci += 1;
    } else if (direction === 'up') {
      if (ri > 0) ri -= 1;
    } else if (direction === 'down') {
      // if (eri !== ri) ri = eri;
      if (ri < coreRows.len - 1) ri += 1;
    } else if (direction === 'row-first') {
      ci = 0;
    } else if (direction === 'row-last') {
      ci = coreCols.len - 1;
    } else if (direction === 'col-first') {
      ri = 0;
    } else if (direction === 'col-last') {
      ri = coreRows.len - 1;
    }

    if (multiple) {
      selectorContainerComp.moveIndexes = [ri, ci];
    }
    this.coreSheet.coreSelector.updateByFirstSelectCell(ri, ci)
    this.selectorContainerComp.updateByFirstSelectMerge();
    this.selectorSet(multiple, ri, ci);
    // editor.clear();
    this.cellEditorComp.updateCellEditorCompBySelector();
    this.sheetEventDealer.scrollbarMove();
    myLog.myPrint(PRINT_LEVEL3, {multiple, direction})

  }


  /**
   * 跟selector有关的逻辑
   */
  resetRefSelectorComps() {
    for (let i = 0; i < this.refSelectors.length; i++) {
      let selector = this.refSelectors[i];
      selector.resetSelectorBRLAreaOffset(new CellRangeProxy(selector.ri, selector.ci, selector.ri, selector.ci));
    }
  }
  /**
   * 初始化sheet的时候初始化各个事件
   */
  sheetInitEvents() {
    // pasteOverlay.on('mousedown', evt => {
    //   pasteOverlay.hide();
    // });
    let sheetEventDealer = this.sheetEventDealer;
    sheetEventDealer.addEventKeyDown(window);
    sheetEventDealer.addEventForTouch();
    let self = this;

    this.modalValidation.updateChangeFunc((action, ...args) => {
      if (action === 'save') {
        this.coreSheet.changeAddValidation(...args);
      } else {
        this.coreSheet.changeRemoveValidation();
      }
    });

    // let windows = this.el.el;
    bind(window, EVENT_WIN_RESIZE, () => {
      this.reload();
    });


    bind(this.el.el, EVENT_COPY, (evt) => {
      this.copyBhv.mountCopy(evt);
      // data.history.add(data.getData());
    });

    bind(this.el.el, EVENT_CUT, (evt) => {
      this.cut();
      this.copyBhv.mountCopy(evt);
      let { data } = this;
      data.history.add(data.getWorkbookServerObj());
    });

    bind(this.el.el, EVENT_PASTE, (evt) => {
      this.pasteEvent(evt);
    });
  }

  // ============= run 函数， 未来转移到sheetOperationBhv中去 ================
  runCopyPasteAfterDoubleClickCorner() {
    let args = this.coreSheet.clickCopyPaste();
    if (args.enter) {
      this.coreSheet.changeClickAutofill(args.srcCellRange, args.dstCellRange, 'all', msg => showMsgBox('Tip', msg));
      this.tableComp.refreshTableDataThenRender();
    }
  }
  updateByIsScrollPstChange({isVerticalBarChange, isHorizontalBarChange}){
    if(isVerticalBarChange && isHorizontalBarChange === false){
      this.verticalScrollbar.updateByCoreScrollPst()
    }
    else if(isHorizontalBarChange && isVerticalBarChange === false){
      this.horizontalScrollbar.updateByCoreScrollPst()
    }
    else if(isHorizontalBarChange && isVerticalBarChange){
      this.verticalScrollbar.updateByCoreScrollPst(false)
      this.horizontalScrollbar.updateByCoreScrollPst()
    }

  }

}

// windows重新resize
