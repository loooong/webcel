import { FinElement, h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { SelectorContainerComp, SELECTOR_BORDER_WIDTH, START_Z_INDEX } from './selector_comp';
import { CoreMouseEvent } from '../../core/core_data_proxy/event_data_proxy';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CSS_POINTER_EVENTS, POINT_EVENTS_AUTO, POINT_EVENTS_NONE } from '../utils/config';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';

export const SELECTOR_HIGH_LIGHT_PADDING = 1;

// 对应autofill, copy,cut 范围的虚线框
export class SingleSelectorComp {
  el: FinElement;
  sheetComp: SheetComp;
  coreSheet: CoreSheet;
  multiSelectorComp: SelectorContainerComp;
  l: FinElement;
  r: FinElement;
  t: FinElement;
  b: FinElement;
  cornerEl: FinElement;
  boxinner: FinElement;
  areaEl: FinElement;
  clipboardEl: FinElement;
  svgEl: SVGElement;

  constructor(coreSheet, multiSelectorComp, sheetComp) {
    this.cornerEl = h('div', `${CSS_PREFIX}-selector-corner`);
    // this.box = h('div', `${CSS_PREFIX}-selector-box`);
    this.data = coreSheet;
    this.coreSheet = coreSheet;
    this.sheetComp = sheetComp;
    this.multiSelectorComp = multiSelectorComp;
    this.zIndex = START_Z_INDEX;
    this.createAllEl();
  }

  createAllEl() {
    this.l = h('div', `${CSS_PREFIX}-selector-box-l`); // 这四个是margin
    this.r = h('div', `${CSS_PREFIX}-selector-box-r`);
    this.t = h('div', `${CSS_PREFIX}-selector-box-t`);
    this.b = h('div', `${CSS_PREFIX}-selector-box-b`);
    this.cornerEl.on('mousedown', evt => { // 绑定双击corner事件
      if (new CoreMouseEvent(evt).isDoubleClick()) this.dealDoubleClickCorner(evt);
    });
    this.boxinner = h('div', `${CSS_PREFIX}-selector-boxinner`)
      .children(this.b, this.t, this.r, this.l);
    this.areaEl = h('div', `${CSS_PREFIX}-selector-area`)
      .children(this.cornerEl, this.boxinner)
      .hide();            // this.boxinner
    this.clipboardEl = h('div', `${CSS_PREFIX}-selector-clipboard`)
      .hide();
    this.el = h('div', `${CSS_PREFIX}-selector`)
      .css('z-index', `${this.zIndex}`)
      .children(this.areaEl, this.clipboardEl)
      .hide();
    this.zIndex += 1;
    this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgEl.setAttribute('style', `top:${SELECTOR_HIGH_LIGHT_PADDING}px;left:${SELECTOR_HIGH_LIGHT_PADDING}px; position:absolute`);
    this.svgEl.setAttribute('class', `${CSS_PREFIX}-selector-svg-highlight`);
    const SELECTOR_HIGHLIGHT_FILL = 'rgba(0, 0, 0,0.2)';

    this.svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.svgPath.setAttribute('style', ` fill-rule: evenodd;   fill: ${SELECTOR_HIGHLIGHT_FILL}`);
    this.svgEl.appendChild(this.svgPath);
    this.areaEl.el.appendChild(this.svgEl);

  }

  updateAreaLTWHAndShow(leftTopWidthHeight) { //设置areaEl的位置与大小
    const {
      left, top, width, height,
    } = leftTopWidthHeight;
    let rangePstDetail = this.coreSheet.coreSelector.getFirstSelectMergeRangePstDetail();
    let cellLeft = rangePstDetail.rangeViewLeft - left;
    let cellTop = rangePstDetail.rangeViewTop - top;
    let cellRight = rangePstDetail.rangeWidth + cellLeft - SELECTOR_HIGH_LIGHT_PADDING;
    let cellBottom = rangePstDetail.rangeHeight + cellTop - SELECTOR_HIGH_LIGHT_PADDING;

    this.updateSvgPath(height, width, cellLeft, cellTop, cellBottom, cellRight);
    this.svgEl.setAttribute('width', width - SELECTOR_BORDER_WIDTH + 0.8);
    this.svgEl.setAttribute('height', height - SELECTOR_BORDER_WIDTH + 0.8);

    this.areaEl.updateElLTWH({
      width: width,
      height: height,
      // leftSpanElIndex: leftSpanElIndex - 0.8,  // 选中区域的边框没有了
      left: left - SELECTOR_BORDER_WIDTH,
      top: top - SELECTOR_BORDER_WIDTH,
      // top: top - 0.8,
    })
      .updateDisplayToBlock();
    // debugger
  }

  updateSvgPath(height, width, cellLeft, cellTop, cellBottom, cellRight) {
    this.svgPath.setAttribute('d', `M 0 0 L0 ${height} L${width} ${height}
     L${width} 0 L0 0 M ${cellLeft} ${cellTop}L${cellLeft} ${cellBottom} 
     L${cellRight}  ${cellBottom}L${cellRight} ${cellTop} L${cellLeft} ${cellTop}Z`);
  }

  updateAreaElBorder(value) { // 选择框的边界
    this.areaEl.css('border', value);
  }

  hideAndThenShowBoxinner(time = 500) {
    this.boxinner.hide();
    setTimeout(() => {
      this.boxinner.updateDisplayToBlock();
    }, time);
  }

  updateAreaBorder(b) {
    this.areaEl.css('border', `2px dashed ${b}`);
    this.el.css('z-index', '-1');
  }


  updateBoxinnerPointEvents(pointer: POINT_EVENTS_NONE | POINT_EVENTS_AUTO) {
    this.l.css(CSS_POINTER_EVENTS, pointer);
    this.r.css(CSS_POINTER_EVENTS, pointer);
    this.t.css(CSS_POINTER_EVENTS, pointer);
    this.b.css(CSS_POINTER_EVENTS, pointer);
    this.cornerEl.css(CSS_POINTER_EVENTS, pointer);
  }

  hide() {
    this.el.hide();
    return this;
  }


  updateClipboardLTWH(leftTopWidthHeight) {
    const {
      left, top, width, height,
    } = leftTopWidthHeight;
    this.clipboardEl.updateElLTWH({
      left: left,
      top,
      width: width - 2*SELECTOR_BORDER_WIDTH,
      height: height - 2*SELECTOR_BORDER_WIDTH,
    });
  }


  showClipboard() {
    this.clipboardEl.updateDisplayToBlock();
  }

  hideClipboard() {
    this.clipboardEl.hide();
  }

  // ========= 处理双击core的事件 ==============
  dealDoubleClickCorner(evt) {
    this.sheetComp.runCopyPasteAfterDoubleClickCorner();
    evt.stopPropagation();
  }

}
