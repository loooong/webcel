/* global window */
import { FinElement, h } from '../basic_unit/element';
import { bindMouseMoveThenUpFunc } from '../utils/event_helper';
import {
  CSS_PREFIX,
  RESIZER_DISTANCE, VERTICAL_SCROLLBAR_WIDTH
} from '../../global_utils/config_for_core_and_component';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CellPstDetail } from '../../core/core_data_proxy/position_detail';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';

// 坐标是在table下，而不是tableContent下的
export class ResizerComp {
  sheetComp: SheetComp;
  el: FinElement;
  cellPstDetail: CellPstDetail;
  minDistance: number;
  coreSheet: CoreSheet;
  isColResizer: Boolean;
  isMoving: Boolean;

  constructor(sheetComp, minDistance) {
    this.isMoving = false;
    this.sheetComp = sheetComp;
    this.coreSheet = this.sheetComp.coreSheet;
    this.isColResizer = false;
    // cell rect
    this.minDistance = minDistance;
  }

  getTargetCellLeft() {
    return this.cellPstDetail.left + this.coreSheet.tableViewDetail.headerColWidth;
  }

  getTargetCellTop() {
    return this.cellPstDetail.top + this.coreSheet.tableViewDetail.headerRowHeight;

  }


  createAllFel() {
    this.el = h('div', `${CSS_PREFIX}-resizer ${this.isColResizer ? 'col' : 'row'}`)
      .children(
        this.hoverEl = h('div', `${CSS_PREFIX}-resizer-hover`)
          .on('mousedown.stop', evt => this.mousedownHandler(evt)),
        this.lineEl = h('div', `${CSS_PREFIX}-resizer-line`)
          .hide(),
      )
      .hide();
  }


  hide() {
    this.el.updateElLTWH({
      left: 0,
      top: 0,
    })
      .hide();
  }

  resizeToNewDistance(cRect, distance) {
    return '';
  };


  mousedownHandler(evt) {
    let newDistance = this.isColResizer ? this.cellPstDetail.width : this.cellPstDetail.height;
    this.lineEl.updateDisplayToBlock();
    bindMouseMoveThenUpFunc(window, (event) => {
      this.isMoving = true;
      let relativePst = this.sheetComp.overlayComp.getRelativeXYDetail(event, 1);
      if ( event.buttons === 1) {
        newDistance = this.resizerMouseMoveFunc(relativePst);
      }
    }, () => {
     this.resizerMouseUpFunc(newDistance);
    });
  }

  resizerMouseUpFunc(newDistance) {
    document.documentElement.style.cursor = 'auto';
    this.lineEl.hide();
    this.isMoving = false;
    this.hide();
    this.resizeToNewDistance(newDistance);
    this.sheetComp.tableComp.refreshTableDataThenRender();
    this.sheetComp.selectorContainerComp.updateSelfByCoreSelector();
  }

  resizerMouseMoveFunc(relativePst) {
    let newDistance
    if (this.isColResizer) {
      document.documentElement.style.cursor = 'col-resize';
      newDistance = relativePst.xRelativeToRight < 0 ? relativePst.xRelativeToLeft - this.cellPstDetail.left : this.cellPstDetail.width;
      if (newDistance < this.minDistance) newDistance = this.minDistance;
      this.el.css('left', `${this.getTargetCellLeft() + newDistance - RESIZER_DISTANCE}px`);
    } else {
      document.documentElement.style.cursor = 'row-resize';
      newDistance = relativePst.yRelativeToBottom < 0 ? relativePst.yRelativeToTop - this.cellPstDetail.top : this.cellPstDetail.height;
      if (newDistance < this.minDistance) newDistance = this.minDistance;
      this.el.css('top', `${this.getTargetCellTop() + newDistance - RESIZER_DISTANCE}px`);
    }
    // 跟随鼠标动态变化
    this.resizeToNewDistance(newDistance);
    this.sheetComp.tableComp.refreshTableDataThenRender();
    return newDistance;
  }
}

export class RowResizer extends ResizerComp {
  constructor(sheetComp, minDistance) {
    super(sheetComp, minDistance);
    this.isColResizer = false;
    this.createAllFel();
  }

  resizeToNewDistance(newHeight) {
    return this.coreSheet.changeSetRowHeight(this.cellPstDetail.ri, newHeight);
  };

  showResizerByCellPstDetail(cellPstDetail: CellPstDetail) {
    if (this.isMoving) return;
    this.cellPstDetail = cellPstDetail;
    this.el.updateElLTWH({
      left: 0,
      top: this.getTargetCellTop() + cellPstDetail.height - RESIZER_DISTANCE
    })
      .updateDisplayToBlock();
    this.hoverEl.updateElLTWH({
      width: this.coreSheet.tableViewDetail.headerColWidth,
      height: RESIZER_DISTANCE,
    });
    this.lineEl.updateElLTWH({
      width: this.coreSheet.tableViewDetail.tableWidth,
      height: RESIZER_DISTANCE,
    });

  }
}

export class ColResizer extends ResizerComp {
  constructor(sheetComp, minDistance) {
    super(sheetComp, minDistance);
    this.isColResizer = true;
    this.createAllFel();
  }

  resizeToNewDistance(newWidth) {
    return this.coreSheet.changeSetColWidth(this.cellPstDetail.ci, newWidth);
  };

  showResizerByCellPstDetail(cellPstDetail: CellPstDetail) {
    if (this.isMoving) return;
    this.cellPstDetail = cellPstDetail;
    this.el.updateElLTWH({
      left: this.getTargetCellLeft() + cellPstDetail.width - RESIZER_DISTANCE,
      top: 0
    })
      .updateDisplayToBlock();
    this.hoverEl.updateElLTWH({
      width: RESIZER_DISTANCE,
      height: this.coreSheet.tableViewDetail.headerRowHeight,
    });
    this.lineEl.updateElLTWH({
      width: RESIZER_DISTANCE,
      height: this.coreSheet.tableViewDetail.tableHeight,
    });
  }

}
