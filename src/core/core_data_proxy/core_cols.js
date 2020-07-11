import { rangeSum } from '../../global_utils/dataproxy_helper';
import { CoreSheet } from './core_sheet_change';
import { CoreSheetSetting } from './core_sheet_proxy';

class CoreCols {
  headerWidth: number
  colID2ColObj: Object // 表示列宽
  coreSheet: CoreSheet
  constructor(coreSheet, colID2ColObj) {
    this.coreSheet = coreSheet
    this.colID2ColObj = colID2ColObj || {};
    this.refreshByCoreSheetSetting(this.coreSheet.coreSheetSetting)
  }

  get maxColID(){
    return this.len - 1
  }

  refreshByCoreSheetSetting(coreSheetSetting:CoreSheetSetting) {
    this.len = coreSheetSetting.colConfig.len;
    this.defualtColWidth = coreSheetSetting.colConfig.defaultColWidth;
    this.headerWidth = coreSheetSetting.colConfig.headerWidth
    this.minWidth = coreSheetSetting.colConfig.minWidth
    this.colID2ColObj = coreSheetSetting.colID2ColObj || this.colID2ColObj
  }

  setData(d) {
    if (d.len) {
      this.len = d.len;
      delete d.len;
    }
    this.colID2ColObj = d;
  }

  getData() {
    const { len } = this;
    return Object.assign({ len }, this.colID2ColObj);
  }

  ensureGetWidthByColID(i) {
    const col = this.colID2ColObj[i];
    if (col && col.width) {
      return col.width;
    }
    return this.defualtColWidth;
  }

  getOrNew(ci) {
    this.colID2ColObj[ci] = this.colID2ColObj[ci] || {};
    return this.colID2ColObj[ci];
  }

  setWidth(ci, width) {
    const col = this.getOrNew(ci);
    col.width = width;
  }

  // setStyle(ci, style) {
  //   const col = this.getOrNew(ci);
  //   col.style = style;
  // }

  getColWidthBetweenTwoIndex(min, max) {
    return rangeSum(min, max, i => this.ensureGetWidthByColID(i));
  }

  totalWidth() {
    return this.getColWidthBetweenTwoIndex(0, this.len);
  }
}

export {
  CoreCols,
};
