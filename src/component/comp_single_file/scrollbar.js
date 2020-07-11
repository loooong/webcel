import { FinElement, h } from '../basic_unit/element';
import {
  CSS_HEIGHT,
  CSS_PREFIX,
  CSS_WIDTH,
  EVENT_SCROLL_STOP,
  VERTICAL_SCROLL_BAR_TOTAL_WIDTH,
  VERTICAL_SCROLLBAR_BORDER_WIDTH
} from '../../global_utils/config_for_core_and_component';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { CSS_BOTTOM } from '../../global_utils/config_for_calc_and_core';

export class ScrollbarComp {
  el: FinElement;
  sheetComp: SheetComp;
  coreSheet: CoreSheet;

  constructor(sheetComp) {
    this.sheetComp = sheetComp;
    this.el = this.createEl();
    this.coreSheet = this.sheetComp.coreSheet;
    this._updateScrollCss();
  }

  get vertical() {
    return false;
  }

  createEl() {
    return h('div', `${CSS_PREFIX}-scrollbar ${this.vertical ? 'vertical' : 'horizontal'}`)
      .appendChildByStrOrEl(this.contentEl = h('div', ''))
      .on(EVENT_SCROLL_STOP, (evt) => {
        this.dealScrollStop(evt);
      });
  }

  _updateScrollCss() {
  }

  // ================= 数据查询 =====================
  getScrollLeftTop(): { left: number, top: number } {
    return {
      left: this.el.el.scrollLeft,
      top: this.el.el.scrollTop
    };
  }

  // ================= 数据更新 ==============
  // 对外提供的核心方法，本方法调用之后，会触发afterScrollValueChange方法
  updateByScrollValue(v: { left: number, top: number }) {
    // debugger
    this.el.updateScrollByLeftTopValue(v);
    return this;
  }

  /**
   *
   * @param cssLength 是垂直滚动条的width（水平滚动条的height）
   * @param maxScrollLength scrollPstProxy的取值范围，滚动范围
   * @return {ScrollbarComp}
   */
  _updateHeightAndWidth(cssLength, maxScrollLength) {
    if (maxScrollLength > cssLength) {
      const cssKey = this.vertical ? CSS_HEIGHT : CSS_WIDTH;
      this.el.css(cssKey, `${cssLength}px`)
        .updateDisplayToBlock();
      this.contentEl
        .css(this.vertical ? CSS_WIDTH : CSS_HEIGHT, `${VERTICAL_SCROLLBAR_BORDER_WIDTH}px`)
        .css(cssKey, `${maxScrollLength}px`);
    } else {
      // debugger; // 看下触发场景
      this.el.hide(); // 能够完整的看到了，不需要滚动条
    }
    return this;
  }

  // =========== 事件处理 =================
  // 触发时机：1. 直接控制滚动条可以触发滚动条移动。 2. 区域选择的时候，系统会自动滚动滚动条。
  dealScrollStop(evt) {
    let { scrollTop, scrollLeft } = evt.target;
    this.$afterScrollValueChange(this.vertical ? scrollTop : scrollLeft, evt);
  }

  $afterScrollValueChange(scrollValue, evt) { // 需要子类实现这个事件
    return;
  };

  commonResetOtherComp() {
    this.sheetComp.sheetEventDealer.pictureSetOffset();
    this.sheetComp.sheetEventDealer.resetAdviceComp();
    this.sheetComp.resetRefSelectorComps();
    this.sheetComp.cellEditorComp.updateCellEditorCompBySelector(false);
    this.sheetComp.tableComp.refreshTableDataThenRender();
  }
}

export class HorizontalScrollbar extends ScrollbarComp {
  $afterScrollValueChange(scrollValue, evt) {
    this.coreSheet.coreScrollBarProxy.updateByScrollX(scrollValue);
    this.resetOtherComp();
  };

  /**
   * 设定水平方向滚动条位置,reset前缀代表重新定位
   */
  resetHorizontalScrollbar() {
    // 加上VERTICAL_SCROLL_BAR_TOTAL_WIDTH是为了塞满右下角
    const width = this.coreSheet.tableViewForEvent.tableWidth + VERTICAL_SCROLL_BAR_TOTAL_WIDTH;
    this._updateHeightAndWidth(width, this.coreSheet.coreScrollBarProxy.getMaxScrollWidth());
  }

  updateByCoreScrollPst(isRestAll = true) {
    this.el.updateScrollByLeftTopValue({ left: this.coreSheet.coreScrollBarProxy.scrollX });
    this.resetOtherComp(isRestAll );
  }

  resetOtherComp(isRestAll = true) {
    this.sheetComp.selectorContainerComp.updateSelfByCoreSelector()
    // ======== 下面的部分与horizon是一样的  ==============
    if (isRestAll) {
      this.commonResetOtherComp()
    }
  }

}

export class VerticalScrollbar extends ScrollbarComp {
  get vertical() {
    return true;
  }

  // 底部VERTICAL_SCROLL_BAR_TOTAL_WIDTH的空间预留给horizontalScrollBar
  _updateScrollCss() {
    this.el.css(CSS_BOTTOM, VERTICAL_SCROLL_BAR_TOTAL_WIDTH + 'px');
  }


  /** 前缀$代表需要操作sheetComp的组件
   * 这个是时间绑定，滚动了某个距离之后需要出发的逻辑
   * @param scrollValue
   * @param evt
   * @private
   */
  $afterScrollValueChange(scrollValue, evt) {
    this.coreSheet.coreScrollBarProxy.updateByScrollY(scrollValue);
    this.resetOtherCompAfterScroll();
  };

  /**reset 方法就是根据coreSheet中的数据来做更新
   * 设定垂直方向滚动条位置,reset前缀代表重新定位
   */
  resetVerticalScrollbar() {
    const height = this.coreSheet.tableViewForEvent.tableHeight;
    this._updateHeightAndWidth(height, this.coreSheet.coreScrollBarProxy.getMaxScrollHeight());
  }

  getTotalWidth() {
    return VERTICAL_SCROLL_BAR_TOTAL_WIDTH;
  }

  updateByCoreScrollPst(isRestAll = true) {
    this.el.updateScrollByLeftTopValue({ top: this.coreSheet.coreScrollBarProxy.scrollY });
    this.resetOtherCompAfterScroll(isRestAll);
  }

  resetOtherCompAfterScroll(isRestAll = true) {
    this.sheetComp.selectorContainerComp.updateSelfByCoreSelector() // selector的变化
    this.sheetComp.footerContainerComp.footerContainerReset();
    // ======== 下面的部分与horizon是一样的  ==============
    if(isRestAll){
      this.commonResetOtherComp()
    }
  }

}

