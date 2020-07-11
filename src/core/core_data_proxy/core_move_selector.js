import { CoreSheet } from './core_sheet_change';
import { isArrayEqual, RangeLocProxy } from '../../calc/calc_data_proxy/loc_range_loc';
import { RangePstDetail, RelativePstDetail } from './position_detail';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { SELECTOR_BORDER_WIDTH } from '../../component/comp_selector/selector_comp';
import {
  DIRECTION_DOWN,
  DIRECTION_LEFT, DIRECTION_RIGHT,
  DIRECTION_UP
} from '../../global_utils/config_for_core_and_component';

export class CoreMoveSelector {
  coreSheet: CoreSheet;
  oriRangeLoc: RangeLocProxy; // 原始位置
  dstRangeLoc: RangeLocProxy
  dstRangePstDetail: RangePstDetail; // 当前位置
  clickCellRiCi: {cellRi: number, cellCi:number} // 鼠标点击位置的对应的单元格
  constructor(coreSheet, aObj = {}) {
    this.coreSheet = coreSheet
    Object.assign(this, aObj);
  }

  updateByClickRelativePst(relativePst: RelativePstDetail){
    this.oriRangeLoc = RangeLocProxy.fromIndexArray(this.coreSheet.coreSelector.selectedCoreRange.cellRangeIndexArray)
    // 初始的ri，ci
    this.clickCellRiCi = this.coreSheet.tableViewForEvent.getCellPstByMovePst(relativePst)
    // clickCellRiCi 必须在coreSelector.selectedCoreRange范围以内
    this.clickCellRiCi.cellRi = this.coreSheet.coreSelector.selectedCoreRange.getRiInside(this.clickCellRiCi.cellRi)
    this.clickCellRiCi.cellCi = this.coreSheet.coreSelector.selectedCoreRange.getCiInside(this.clickCellRiCi.cellCi)
    this.updateDstRangeByShift([0,0])
  }

  updateDstRangeByShift(shiftArray: Array<Number>) {
    // 预处理shiftArray
    if(shiftArray[0] + this.oriRangeLoc.indexArray[0] <0){
      shiftArray[0] = -this.oriRangeLoc.indexArray[0]
    }
    if(shiftArray[1]+this.oriRangeLoc.indexArray[1]<0){
      shiftArray[1] = - this.oriRangeLoc.indexArray[1]
    }
    if(shiftArray[0] + this.oriRangeLoc.indexArray[2] > this.coreSheet.coreRows.maxRowID){
      shiftArray[0] = this.coreSheet.coreRows.maxRowID -this.oriRangeLoc.indexArray[2]
    }
    if(shiftArray[1]+this.oriRangeLoc.indexArray[3] > this.coreSheet.coreCols.maxColID){
      shiftArray[1] =  this.coreSheet.coreCols.maxColID - this.oriRangeLoc.indexArray[3]
    }

    this.dstRangeLoc = new RangeLocProxy(this.oriRangeLoc.updateByShiftArray(shiftArray, false));
    this.dstRangePstDetail = this.coreSheet.tableViewForEvent.getRangePstDetailNew(this.dstRangeLoc)
    this.dstRangePstDetail.updateByShiftArray([-SELECTOR_BORDER_WIDTH + 1, -SELECTOR_BORDER_WIDTH + 1]) // 向左上角移动一些
  }

  updateByMovingRelativePst(relativePst: RelativePstDetail):RangePstDetail{
    let curRiCi = this.coreSheet.tableViewForEvent.getCellPstByMovePst(relativePst)
    let curShiftArray = [curRiCi.cellRi - this.clickCellRiCi.cellRi, curRiCi.cellCi - this.clickCellRiCi.cellCi]
    return this.updateDstRangeByShift(curShiftArray)
  }

}

export class CoreAutoFillSelector{
  coreSheet: CoreSheet;
  oriRangePst: RangePstDetail
  dstRangeLoc: RangeLocProxy // 当前selector的范围
  dstRangePstDetail: RangePstDetail; // 当前位置
  constructor(coreSheet, aObj = {}) {
    this.coreSheet = coreSheet
    Object.assign(this, aObj);
  }
  isDstEqualWithSelectedRange(){
    return isArrayEqual(this.dstRangeLoc.indexArray, this.coreSheet.coreSelector.selectedCoreRange.cellRangeIndexArray)
  }

  _updateByDstIndexArray(indexArray){
    this.dstRangeLoc =  RangeLocProxy.fromIndexArray(indexArray)
    this.dstRangePstDetail = this.coreSheet.tableViewForEvent.getRangePstDetailNew(this.dstRangeLoc)
  }
  updateFirstClick(){
    this.oriRangePst = this.coreSheet.coreSelector.getWholeSelectedRangePstDetail() // 原先的选择框的range
    this.dstRangeLoc =  RangeLocProxy.fromIndexArray(this.coreSheet.coreSelector.selectedCoreRange.cellRangeIndexArray)
    this.dstRangePstDetail = this.oriRangePst
  }
  updateAutoFillSelectorByMovingRelativePst(relativePst: RelativePstDetail):RangePstDetail{
    this.oriRangePst = this.coreSheet.coreSelector.getWholeSelectedRangePstDetail() // 原先的选择框的range
    let contentRelativePst: RelativePstDetail = relativePst.getNewPstDetailByAdjustLeftTop(...this.coreSheet.tableViewForEvent.tableViewDetail.getHeaderWidthHeight())
    // 分为4种情况，分别是调整minRowID，minColID，maxRowID，maxColID
    let adjustInfo = this.oriRangePst.getAdjustTypeByRelativePst(contentRelativePst) // 获取调整方向
    if(adjustInfo.value <=0){ // 在原先的range内部，范围就是之前的选择框
      this.dstRangeLoc =  RangeLocProxy.fromIndexArray(this.coreSheet.coreSelector.selectedCoreRange.cellRangeIndexArray)
      this.dstRangePstDetail =this.oriRangePst
      return
    }
    let newIndexArray = this.coreSheet.coreSelector.selectedCoreRange.cellRangeIndexArray.concat()
    if(adjustInfo.adjustDirection === DIRECTION_UP){
      newIndexArray[0] = this.coreSheet.tableViewForEvent.getCellRiByMoveY(contentRelativePst.yRelativeToTop, contentRelativePst.yRelativeToBottom)
    }else if(adjustInfo.adjustDirection === DIRECTION_DOWN){
      newIndexArray[2] = this.coreSheet.tableViewForEvent.getCellRiByMoveY(contentRelativePst.yRelativeToTop, contentRelativePst.yRelativeToBottom)
    }else if(adjustInfo.adjustDirection === DIRECTION_LEFT){
      newIndexArray[1] = this.coreSheet.tableViewForEvent.getCellCiByMoveX(contentRelativePst.xRelativeToLeft, contentRelativePst.xRelativeToRight)
    }else if(adjustInfo.adjustDirection === DIRECTION_RIGHT){
      newIndexArray[3] = this.coreSheet.tableViewForEvent.getCellCiByMoveX(contentRelativePst.xRelativeToLeft, contentRelativePst.xRelativeToRight)
    }
    this._updateByDstIndexArray(newIndexArray)
  }
}
