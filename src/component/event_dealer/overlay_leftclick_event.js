import { SheetComp } from '../a_top_comp/sheet_comp';
import { MultiTimer } from '../../core/core_data_proxy/Timer';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { myLog, PRINT_LEVEL2, PRINT_LEVEL3 } from '../../log/new_log';
import { bindMouseMoveThenUpFunc } from '../utils/event_helper';
import { OverlayComp } from '../a_top_comp/overlay_comp';
import {
  EVENT_CLICK_FILTER_BUTTON,
  EVENT_MOVE_RANGE_BY_MOUSE,
  EVENT_SELECT_AUTOFILL_RANGE,
  EVENT_SELECT_RANGE_BY_CLICK_LAST_CELL,
  EVENT_SELECT_RANGE_BY_MOUSE_MOVE
} from '../../core/core_data_proxy/event_data_proxy';
import { POINT_EVENTS_AUTO, POINT_EVENTS_NONE } from '../utils/config';
import { RelativePstDetail } from '../../core/core_data_proxy/position_detail';
import { FAIL_OBJ_INTERSECT_MERGE } from '../../calc/calc_utils/error_config';

// 处理在overlay上面的left Click关闭editor的之后的处理逻辑
export class OverlayLeftClickAfterEditDealer {
  overlayComp: OverlayComp;
  sheetComp: SheetComp;
  stopTimer: MultiTimer;
  stopTimer2: MultiTimer;

  constructor(overlayComp) {
    this.overlayComp = overlayComp;
    this.sheetComp = this.overlayComp.sheetComp;
    this.coreSheet = this.sheetComp.coreSheet;
    this.stopTimer = new MultiTimer();
    this.stopTimer2 = new MultiTimer();

  }

  getIsTargetSelectorCorner(evt) {
    return evt.target.className === `${CSS_PREFIX}-selector-corner`;
  }

  getIsTargetSelectorMargin(evt) {
    return evt.target.className === `${CSS_PREFIX}-selector-box`;
  }


  // =========== 主流程 =============
  easyDeal(evt) {
    let relativeXYDetail = this.overlayComp.getRelativeXYDetail(evt, 0);
    let relativeXYDetailC = this.overlayComp.getRelativeXYDetail(evt, 1);
    const cellPstDetail = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
    this.sheetComp.pasteBhv.hideDirectionArr();
    this.sheetComp.advice.el.hide();
    let overLayEventType = this.coreSheet.coreEventProxy.getOverlayEventTypeByLeftClick(cellPstDetail, evt);
    if (overLayEventType === EVENT_CLICK_FILTER_BUTTON) {
      this.sheetComp.sortFilterComp.showFilterMenuByCellPst(cellPstDetail);
    } else if (overLayEventType === EVENT_MOVE_RANGE_BY_MOUSE) {
      this.dealMoveRangeByMouse(relativeXYDetail);
    } else if (overLayEventType === EVENT_SELECT_AUTOFILL_RANGE) {
      this.dealAutoFill(); // 会绑定move事件
    } else if (overLayEventType === EVENT_SELECT_RANGE_BY_MOUSE_MOVE) { // 左单击
      this.dealSelectARangeClickFunc(cellPstDetail.ri, cellPstDetail.ci); // 会绑定move事件
    } else if (overLayEventType === EVENT_SELECT_RANGE_BY_CLICK_LAST_CELL) { // 左单击+shift
      this.dealSelectRangeByClickSecondCell(cellPstDetail.ri, cellPstDetail.ci); // 不会绑定move事件
    }

    // this.sheetComp.selectorContainerComp.primeSelectorComp.updateAreaElBorder(SELECTOR_BORDER_STYLE);
    // 已经转移
    this.sheetComp.sheetEventDealer.sheetComp.cellEditorComp.editorInputComp.clearRefSelectors()
    this.sheetComp.cellEditorComp.updateCellEditorCompBySelector();
    myLog.myPrint(PRINT_LEVEL2, {
      overLayEventType,
      cellPstDetail,
      evt
    });
  }

  // =========== 子流程 =============
  dealMoveRangeByMouse(xyToOverlay: RelativePstDetail) { // 移动range
    const SELECTOR_BORDER_WIDTH = 2;
    this.coreSheet.coreMoveSelector.updateByClickRelativePst(xyToOverlay)
    this.sheetComp.moveSelectorComp.updateByCoreLTWH();
    bindMouseMoveThenUpFunc(window,
      (evt) => this.movingSelectorByMouse(evt),
      (evt)=>{
      console.log(FAIL_OBJ_INTERSECT_MERGE)
      // 1. 需要判定是否有合并单元格，如果有的话直接报错
        // 2. 如果没有合并单元格，coreSelector数据变为moveSelector的位置。coreMoveSelector消失
        // 3. MoveSelector消失
        this.sheetComp.moveSelectorComp.selectorFel.hide()

      });
  }

  dealSelectRangeByClickSecondCell(ri, ci) {
    this.coreSheet.coreSelector.updateByLastSelectCell(ri, ci);
    this.sheetComp.selectorContainerComp.updateSelfAndToolBarByCoreSelector();
    this.sheetComp.setTimeOutForTableRender();
  }
  // ========== 移动range ====================
  movingSelectorByMouse(evt){
    let relativeXYDetail = this.overlayComp.getRelativeXYDetail(evt, 1);
    this.coreSheet.coreMoveSelector.updateByMovingRelativePst(relativeXYDetail);
    this.sheetComp.moveSelectorComp.updateByCoreLTWH();
    this._moveScrollBarIfNeed(relativeXYDetail, ()=>this.movingSelectorByMouse(evt))
    myLog.myPrint(PRINT_LEVEL2,this.coreSheet.coreMoveSelector)
  }

  // ============= dealSelectARangeClickFunc =============
  dealSelectARangeClickFunc(ri, ci) { // 选择range
    if(this.coreSheet.coreSelector.updateByNegativeRiCi(ri,ci)){
      // 全选，或者选择一整行，或一整列
      this.sheetComp.selectorContainerComp.updateSelfAndToolBarByCoreSelector()
    }
    else {
      // 选择某个单元格
      this.coreSheet.coreSelector.updateByFirstSelectCell(ri, ci);
      this.sheetComp.selectorContainerComp.updateByFirstSelectMerge();
    }
    this.sheetComp.setTimeOutForTableRender();
    bindMouseMoveThenUpFunc(window, (evt) => this.selectingARangeMoveFunc(evt),
      (evt) => this.selectARangeUpFunc(evt));

    myLog.myPrint(PRINT_LEVEL2, {
      ci,
    });
  }


  selectingARangeMoveFunc(evt) {
    this.sheetComp.selectorContainerComp.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_NONE);
    this.sheetComp.picContainer.css('pointer-events', POINT_EVENTS_NONE); // 让图片无法被鼠标选中
    this.stopTimer.clear();
    this._adjustRangeWhenSelectingRange(evt);
    myLog.myPrint(PRINT_LEVEL2, this);
  }

  /**
   * 鼠标按住之后滚动
   */
  _adjustRangeWhenSelectingRange(event: MouseEvent) {
    let relativePstDetail = this.overlayComp.getRelativeXYDetail(event, 1);

    // 更新selectorComp
    this.coreSheet.coreSelector.updateRelativePst(relativePstDetail);
    this.sheetComp.selectorContainerComp.updateByFirstSelectMerge();
    this.sheetComp.selectorContainerComp.updateSelfAndToolBarByCoreSelector();
    this.sheetComp.tableComp.refreshTableDataThenRender();


    // 判定是否要持续移动scrollBar
    this._moveScrollBarIfNeed(relativePstDetail, ()=>this._adjustRangeWhenSelectingRange(event))
    myLog.myPrint(PRINT_LEVEL2, {
      relativePstDetail,
    }, this.sheetComp.selectorContainerComp.selectedWholeRange, this.sheetComp.coreSheet.coreSelector);
  }

  // 重复执行func
  _moveScrollBarIfNeed(relativePstDetail, repeatFunc){
    let [rightStep, downStep] = relativePstDetail.getRelativeOrientArray();
    let isChange = this.coreSheet.coreScrollBarProxy.updateByDownRightStep(downStep, rightStep);
    this.sheetComp.updateByIsScrollPstChange(isChange);
    if (isChange.isVerticalBarChange || isChange.isHorizontalBarChange) { // 可以持续移动
      let stopTimer = setTimeout(() => { // stopTime, 与stopTime2 在overlayMouseDownThenUp的时候会被终止掉
        // 移动滚动条，然后会自动触发afterScroll方法；
        repeatFunc();
      }, 100);
      this.stopTimer.push(stopTimer);
    }
  }


  selectARangeUpFunc(evt) {
    let self = this;
    self.stopTimer.clear();
    self.stopTimer2.clear();
    self.sheetComp.selectorContainerComp.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_AUTO);
    self.sheetComp.toolbarComp.handleToolbarChangePaintformatPaste();
    self.sheetComp.picContainer.css('pointer-events', POINT_EVENTS_AUTO);
    myLog.myPrint(PRINT_LEVEL2, this);
  }

  // ============= dealAutoFill=============
  dealAutoFill() {
    this.coreSheet.coreAutoFillSelector.updateFirstClick()
    this.sheetComp.autoFillSelectorComp.updateByCoreLTWH()
    bindMouseMoveThenUpFunc(window, (evt) => this.autoFillThenMouseMove(evt),
      (evt) => this.autoFillThenMouseUp(evt));
  }

  autoFillThenMouseMove(event) {
    let relativePosition = this.overlayComp.getRelativeXYDetail(event, 1)
    this._autoFillAdjustingRange(relativePosition)
    this.stopTimer.clear();
    this._moveScrollBarIfNeed(relativePosition, ()=>this._autoFillAdjustingRange(relativePosition))
    myLog.myPrint(PRINT_LEVEL3, this.coreSheet.coreAutoFillSelector); // 其中会区分事件类型

  }

  _autoFillAdjustingRange(relativePosition: RelativePstDetail) {
    this.coreSheet.coreAutoFillSelector.updateAutoFillSelectorByMovingRelativePst(relativePosition)
    this.sheetComp.autoFillSelectorComp.updateByCoreLTWH()
    myLog.myPrint(PRINT_LEVEL3, relativePosition); // 其中会区分事件类型

  }

  autoFillThenMouseUp(evt) {
    let self = this;
    self.stopTimer.clear();
    this.sheetComp.autoFillSelectorComp.selectorFel.hide()
    if(this.coreSheet.coreAutoFillSelector.isDstEqualWithSelectedRange()){
      return
    }
    this.coreSheet.changeClickAutofillNew();
    this.sheetComp.tableComp.refreshTableDataThenRender();
    self.sheetComp.toolbarComp.reset();
    myLog.myPrint(PRINT_LEVEL2, this);
  }
}
