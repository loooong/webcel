import { CoreSheet } from './core_sheet_change';
import {
  DEFAULT_FOOTER_CONTAINER_HEIGHT,
  TABLE_RIGHT_MARGIN,
  VERTICAL_SCROLL_BAR_TOTAL_WIDTH
} from '../../global_utils/config_for_core_and_component';
import { myLog, PRINT_LEVEL3 } from '../../log/new_log';
import { isHave } from '../../global_utils/check_value';

export class CoreScrollBarProxy {
  coreSheet: CoreSheet;
  scrollY: number; // scrollX与scrollY对应滚动条的位置
  scrollX: number;
  scrollRi: number;
  scrollCi: number;

  constructor(coreSheet) {
    this.coreSheet = coreSheet;
    this.scrollRi = 0; // cell row-index
    this.scrollCi = 0; // cell col-index
    this.scrollY = 0;
    this.scrollX = 0;
  }

  get x() {
    return this.scrollX;
  }

  get y() {
    return this.scrollY;
  }

  getMaxScrollWidth() {
    return this.coreSheet.tableViewForEvent.getScrollTotalWidth() + VERTICAL_SCROLL_BAR_TOTAL_WIDTH + TABLE_RIGHT_MARGIN;
  }

  getMaxScrollHeight() {
    return this.coreSheet.tableViewForEvent.getScrollTotalHeight() + DEFAULT_FOOTER_CONTAINER_HEIGHT;
  }

  getMaxScrollX() {
    return this.getMaxScrollWidth() - this.coreSheet.tableViewForEvent.tableContentWidth;
  }

  getMaxScrollY() {
    return this.getMaxScrollHeight() - this.coreSheet.tableViewForEvent.tableContentHeight;
  }


  isAbleToMoveDownStep(downStep) {
    if (downStep > 0) {
      return this.getMaxScrollY() > this.scrollY;
    } else if (downStep < 0) {
      return this.scrollY > 0;
    }
  }

  isAbleToMoveRightStep(rightStep) {
    if (rightStep > 0) {
      return this.getMaxScrollX() > this.scrollX;
    } else if (rightStep < 0) {
      return this.scrollX > 0;
    }
  }

  // === 处理鼠标中键的滚动
  updateByDownRightStep(downStep = 0, rightStep = 0) { // 移动 todo: 到底部了，不应该再移动
    let isVerticalBarChange = false,
      isHorizontalBarChange = false;
    if (downStep !== 0 && this.isAbleToMoveDownStep(downStep)) {
      isVerticalBarChange = this.updateByScrollRi(this.coreSheet.tableViewForEvent.getNextRowID(this.scrollRi, downStep));
    }
    if (rightStep !== 0 && this.isAbleToMoveRightStep(rightStep)) {
      isHorizontalBarChange = this.updateByScrollCi(this.coreSheet.tableViewForEvent.getNextRowID(this.scrollCi, rightStep));
    }
    return {
      isVerticalBarChange,
      isHorizontalBarChange
    };
  }

  updateByScrollRi(scrollRi) {
    // sheet 向上移动
    if (scrollRi >= 0) {
      this.coreSheet.coreScrollBarProxy.scrollRi = scrollRi; // Ri 变大
      this.coreSheet.coreScrollBarProxy.scrollY = this.coreSheet.tableViewForEvent.getTotalHeightBetweenTwoIndex(0, scrollRi);
      return true;
    }
    return false;
  }

  updateByScrollCi(scrollCi) {
    if (scrollCi >= 0) {
      this.coreSheet.coreScrollBarProxy.scrollCi = scrollCi;
      this.coreSheet.coreScrollBarProxy.scrollX = this.coreSheet.tableViewForEvent.getTotalWidthBetweenTwoIndex(0, scrollCi);
      return true;
    }
    return false;
  }

  // === 处理鼠标拖动滚动条
  // scrollX是连续的，但是tableView的视图是不连续的，必须是以一个单元的左上角作为起始点。
  updateByScrollX(scrollX, adaptiveToLeft = true) { // 会转移到scrollProxy
    const res = this.coreSheet.tableViewDetail.getColsInViewByMaxWidth(scrollX + 0.1, 0);
    if (adaptiveToLeft) { // 发生变化
      if (this.scrollCi !== res.maxColID) {
        this.scrollX = res.preTotalWidth;
        this.scrollCi = res.maxColID;
        return true;
      }
    } else {
      this.scrollCi = this.coreSheet.tableViewForEvent.getNextColID(res.maxColID);
      this.scrollX = res.totalWidth;
      return true;
    }
  }

  updateByScrollY(scrollY, adaptiveToTop = true) {// 会转移到scrollProxy
    const res = this.coreSheet.tableViewDetail.getRowsInViewByMaxHeight(scrollY + 0.1, 0);
    if (adaptiveToTop) { // 发生变化
      if (this.scrollRi !== res.maxRowID) {
        this.scrollY = res.preTotalHeight;
        this.scrollRi = res.maxRowID;
        return true;
      }
    } else {
      this.scrollY = res.totalHeight;
      this.scrollRi = this.coreSheet.tableViewForEvent.getNextRowID(res.maxRowID);
      return true;
    }
  }


  /**
   *
   * @param tryShowTopOrBottom
   * @param tryShowLeftOrRight 左右都超过边界的时候，尽量展示左边还是右边
   */
  updateByAdaptiveToCoreSelector(tryShowTopOrBottom = 0, tryShowLeftOrRight = 0) {
    const SMALL_VALUE = 0.01; // 浮点数的问题
    let selectorRangePst = this.coreSheet.coreSelector.getWholeSelectedRangePstDetail();
    let newScrollX;
    let newScrollY;
    // 尽量展示顶部
    if (tryShowTopOrBottom === 0) {
      if (selectorRangePst.rangeViewTop < SMALL_VALUE) { // 顶部在视图上方
        newScrollY = this.scrollY + selectorRangePst.rangeViewTop;
        this.updateByScrollY(newScrollY);
      } else if (selectorRangePst.rangeViewTop - this.coreSheet.tableViewForEvent.tableContentHeight > -SMALL_VALUE) { // 顶部在视图下方
        newScrollY = Math.min(this.scrollY + selectorRangePst.rangeViewTop -1,// 视图第一行为顶部
          this.scrollY + selectorRangePst.getViewBottomY() - this.coreSheet.tableViewForEvent.tableContentHeight); // 视图最后一行为range底部
        this.updateByScrollY(newScrollY,false);
      }
    }
    else {
      // 尽量展示底部
      if (selectorRangePst.getViewBottomY() < SMALL_VALUE) { // 底部在视图上方
        newScrollY = this.scrollY + selectorRangePst.getViewBottomY() - 1 // 确保视图中第一行为bottom
        this.updateByScrollY(newScrollY, true);
      } else if (selectorRangePst.getViewBottomY() - this.coreSheet.tableViewForEvent.tableContentHeight > -SMALL_VALUE) { // 底部在视图下方
        newScrollY = this.scrollY + selectorRangePst.getViewBottomY() - this.coreSheet.tableViewForEvent.tableContentHeight;// 视图最后一行为底部
        this.updateByScrollY(newScrollY, false);
      }
    }
    // 尽量展示左边
    if (tryShowLeftOrRight === 0) {
      if (selectorRangePst.rangeViewLeft < SMALL_VALUE) { // 左部在视图左边
        newScrollX = this.scrollX + selectorRangePst.rangeViewLeft; // range左边为视图左边
        this.updateByScrollX(newScrollX);
      } else if (selectorRangePst.rangeViewLeft - this.coreSheet.tableViewForEvent.tableContentWidth > -SMALL_VALUE) {// 左部在视图右边
        let firstColWidth = this.coreSheet.coreCols.ensureGetWidthByColID(this.coreSheet.coreSelector.selectedCoreRange.sci)
        newScrollX = this.scrollX + selectorRangePst.rangeViewLeft + firstColWidth - this.coreSheet.tableViewForEvent.tableContentWidth + 1; // range左边为视图右边
        this.updateByScrollX(newScrollX, false);
      }
    }
    // 尽量展示出右边
    else if (tryShowLeftOrRight === 1) {
      if (selectorRangePst.getViewRightX() < SMALL_VALUE) { //range右边在视图左边
        newScrollX = this.scrollX + selectorRangePst.getViewRightX() - 1; // 确保视图第一列为range右边
        this.updateByScrollX(newScrollX, true);
      } else if (selectorRangePst.getViewRightX() - this.coreSheet.tableViewForEvent.tableContentWidth > -SMALL_VALUE) { // range右边在视图右边
        newScrollX = this.scrollX + selectorRangePst.getViewRightX() - this.coreSheet.tableViewForEvent.tableContentWidth; // 确保range右边在视图右边
        this.updateByScrollX(newScrollX, false);
      }
    }
    myLog.myPrint(PRINT_LEVEL3, selectorRangePst, {
      newScrollX,
      newScrollY,
      tryShowLeftOrRight
    });
    return [isHave(newScrollX), isHave(newScrollY)];
  }
}
