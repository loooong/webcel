// 复制黏贴框
import { CellRangeProxy } from '../../internal_module/cell_range';
import { CoreSheet } from './core_sheet_change';
import { EVENT_COPY, EVENT_CUT } from '../../global_utils/config_for_core_and_component';

export class CoreClipSelector {
  coreSheet: CoreSheet
  clipCellRange: CellRangeProxy
  constructor(coreSheet) {
    this.coreSheet = coreSheet
    this.clipCellRange = null; //
    this.state = 'clear';
  }

  updateByCoreSelector(copyOrCut = 0){
    this.clipCellRange = this.coreSheet.coreSelector.selectedCoreRange
    this.state = copyOrCut === 0? EVENT_COPY: EVENT_CUT
  }

  updateByCopyCellRange(cellRange) {
    this.clipCellRange = cellRange;
    this.state = 'copy';
    return this;
  }

  updateByCutCellRange(cellRange) {
    this.clipCellRange = cellRange;
    this.state = 'cut';
    return this;
  }

  // isCopy() {
  //   return this.state === 'copy';
  // }
  //
  // isCut() {
  //   return this.state === 'cut';
  // }

  isClear() {
    return this.state === 'clear';
  }

  clear() {
    this.clipCellRange = null;
    this.state = 'clear';
  }
}
