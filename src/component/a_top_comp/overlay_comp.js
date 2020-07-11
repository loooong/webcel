import { SheetComp } from './sheet_comp';
import {
  CSS_PREFIX,
  EVENT_MOUSEWHEEL_STOP,
  EVENT_NAME_MOUSE_DOWN,
  EVENT_NAME_MOUSE_MOVE
} from '../../global_utils/config_for_core_and_component';
import { bind } from '../utils/event_helper';
import { CoreMouseEvent } from '../../core/core_data_proxy/event_data_proxy';
import { FinElement, h } from '../basic_unit/element';
import { myLog, PRINT_LEVEL0, PRINT_LEVEL2, PRINT_LEVEL3 } from '../../log/new_log';
import { OverlayLeftClickAfterEditDealer } from '../event_dealer/overlay_leftclick_event';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { RelativePstDetail } from '../../core/core_data_proxy/position_detail';

// 这个overlay主要是接受各种事件，然后让他的子组件来产生相应的行为
export class OverlayComp {
  sheetComp: SheetComp;
  overlayFel: FinElement;
  coreSheet: CoreSheet
  constructor(sheetComp) {
    this.sheetComp = sheetComp;
    this.coreSheet = this.sheetComp.coreSheet
    this.overlayerCEl = sheetComp.overlayerCEl;
    this.overlayFel = this.createOverlayFel();
    this.addEventFuncToOverLayer();
  }

  createOverlayFel() {
    return h('div', `${CSS_PREFIX}-overlayer`)
      .children(this.overlayerCEl);
  }


  // 主流程
  addEventFuncToOverLayer() {
// overlayer
    this.overlayFel
      .on(EVENT_NAME_MOUSE_MOVE, (evt) => this.handleOverlayMousemoveBeforeDown(evt))
      .on(EVENT_NAME_MOUSE_DOWN, (evt) => this.handleOverlayMouseDown(evt))
      .on(EVENT_MOUSEWHEEL_STOP, (evt) => this.handleOverlayMouseScroll(evt));
    bind(window, 'click', (evt) => {
      this.overlayFel.isContainElement(evt.target); // 点击的dom元素是否在overlyerEl以内,这块可能要优化
      // this.focusing = overlayerEl.contains(evt.target);
    });
  }
  // ============= 基础查询 ============
  getXYRelativeToOverlay(evt: MouseEvent) { // 事件可能是子元素触发的，需要获取相对于overLayer的坐标； 可以转移到eventProxy中去
    let domRect = this.overlayFel.el.getBoundingClientRect(); // 相对viewPort的位置
    let x = evt.clientX - domRect.left;
    let y = evt.clientY - domRect.top;
    return [x, y];
  }

  getRelativeXYDetail(evt:MouseEvent, overlayOrOverlayContent = 0): RelativePstDetail{
    let pstDetail
    if(overlayOrOverlayContent === 0){
      pstDetail = this.overlayFel.getRelativePstDetailByEvent(evt)
      pstDetail.isRelativeToTable = true
    }
    else {
      pstDetail = this.overlayerCEl.getRelativePstDetailByEvent(evt)
      pstDetail.isRelativeToTable = false
    }
    return pstDetail
  }


  // ============= handle 函数都在这里 ============
  handleOverlayMouseDown(evt) {
    let curMouseEventWarp = new CoreMouseEvent(evt);
    // renderAutoAdapt.call(this);
    // autoRowResizer.call(this);
    // the leftSpanElIndex mouse button: mousedown → mouseup → click
    // the right mouse button: mousedown → contenxtmenu → mouseup
    if (curMouseEventWarp.isRightClick()) { // 右击事件
      this.handleRightClick(curMouseEventWarp);
    } else if (curMouseEventWarp.isDoubleClick()) { // 双击事件
      this.handelDoubleClick(evt);
    } else if(curMouseEventWarp.isLeftClick()){ // 单击事件
      this.handelLeftClick(evt);
    }
    myLog.myPrint(PRINT_LEVEL0, this);
  }

  /**
   * 直接移动鼠标
   * 调整行列宽度
   * @param evt
   */
// private methods
  handleOverlayMousemoveBeforeDown(evt) { // 转移到子类
    if (evt.buttons !== 0) return; // todo: 感觉这个判断没必要
    if (evt.target.className === `${CSS_PREFIX}-resizer-hover`) return; // 不会再次展示同一个resizer-hover
    let relativeXYDetailC = this.getRelativeXYDetail(evt, 1);
    const cellPstDetail = this.sheetComp.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft,relativeXYDetailC.yRelativeToTop);
    // url 展开， 跳出超链接
    this.sheetComp.website.show(cellPstDetail.ri, cellPstDetail.ci);
    // 处理Resizer
    this.sheetComp.rowResizer.hide();
    this.sheetComp.colResizer.hide();
    if( cellPstDetail.isOnRowResizer()){
      this.sheetComp.rowResizer.showResizerByCellPstDetail(cellPstDetail)
      return;
    }
    if( cellPstDetail.isOnColResizer()){
      this.sheetComp.colResizer.showResizerByCellPstDetail(cellPstDetail);
      return;
    }
  }

  /**
   * 处理鼠标的滚轮上下滚动
   * @param evt
   */
  handleOverlayMouseScroll(evt) {
    this.sheetComp.coreSheet.coreEventProxy.updateCoreScrollByEvent(evt)
    this.sheetComp.verticalScrollbar.updateByCoreScrollPst()
    myLog.myPrint(PRINT_LEVEL3, this.coreSheet.coreScrollBarProxy);
  }

  handelLeftClick(evt) {
    let isMouseSelectRefer =  this.sheetComp.cellEditorComp.editorInputComp.isMouseSelectReferState();
    if (isMouseSelectRefer) { // 此时是编辑锁定状态
      this.sheetComp.sheetEventDealer.changeReferByMouse(this.sheetComp.coreSheet, this.sheetComp.cellEditorComp, evt);
    }
    else if(this.sheetComp.cellEditorComp.editorInputComp.isTextElVisible()) {
      this.sheetComp.sheetOperationDealer.dealEndEdit();
      new OverlayLeftClickAfterEditDealer(this).easyDeal(evt);
    }
    else {
      new OverlayLeftClickAfterEditDealer(this).easyDeal(evt);
    }
    myLog.myPrint(PRINT_LEVEL2, this);
  }


  handelDoubleClick(evt) {
    evt.preventDefault(); // 这里如果不加这个的话，textFel获取不到光标，底层原理还搞不清楚
    this.coreSheet.coreInputEditor.textBeforeAndAfterCursor = [] // mouseDownIndex设为空， 这个mouseDownIndex的含义可能是点击的其他单元格
    if (this.coreSheet.coreInputEditor.lock) { // 如果是被锁的状态直接离开
      return;
    }
    // 双击单元格，会弹出Editor组件； 选中range的时候输入也会执行
    this.sheetComp.cellEditorComp.dealBeginEditFromOldCell()
  }

  handleRightClick(curMouseEventProxy: CoreMouseEvent) {
    let domEvent = curMouseEventProxy.mouseEvent;
    if (this.sheetComp.coreSheet.tableViewForEvent.isXYInSelectedRect(domEvent.offsetX, domEvent.offsetY)) { // 先选中的范围内
    } else { // 之前的选择区域会消失，跳转到新的选择区域
      this.sheetComp.contextMenuComp.hide();
      let relativeXYDetailC = this.getRelativeXYDetail(curMouseEventProxy.mouseEvent, 1);
      const firstSelectCellPst = this.sheetComp.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft,relativeXYDetailC.yRelativeToTop);
      if(this.coreSheet.coreSelector.updateByNegativeRiCi(firstSelectCellPst.ri, firstSelectCellPst.ci)){
        // 全选，或者选择一整行，或一整列
        this.sheetComp.selectorContainerComp.updateSelfAndToolBarByCoreSelector()
      }
      else {
        this.coreSheet.coreSelector.updateByFirstSelectCell(firstSelectCellPst.ri, firstSelectCellPst.ci)
        this.sheetComp.selectorContainerComp.updateByFirstSelectMerge();
      }
      this.sheetComp.pasteBhv.hideDirectionArr();
      this.sheetComp.advice.el.hide();
      this.sheetComp.setTimeOutForTableRender()
    }
    setTimeout(() => { // Excel也有一定的延时效果
      this.sheetComp.contextMenuComp.updatePositionByMouseXY(domEvent.offsetX, domEvent.offsetY);
      domEvent.stopPropagation();
    }, 100);
    myLog.myPrint(PRINT_LEVEL2, this);
  }

  /**
   * 鼠标点击之后，调整选择框
   * @param evt
   */
  updateFirstSelectedCellByEvent(evt) {
    const overlayer = evt.target.className === `${CSS_PREFIX}-overlayer`;
    if (!overlayer) {
      return;
    }
    let relativeXYDetailC = this.getRelativeXYDetail(evt, 1);
    const cellRect = this.sheetComp.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop); // 根据鼠标坐标获取选中的单元格
    this.sheetComp.coreSheet.coreSelector.updateByFirstSelectCell(cellRect.ri, cellRect.ci);
  }
}

