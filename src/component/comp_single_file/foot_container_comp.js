import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { DEFAULT_FOOTER_CONTAINER_HEIGHT } from '../../global_utils/config_for_core_and_component';

// 显示顶部增加列的选型
export class FooterContainerComp {
  sheetComp: SheetComp;
  coreSheet: CoreSheet
  constructor(sheetComp) {
    this.sheetComp = sheetComp;
    this.coreSheet = this.sheetComp.coreSheet
    this.footerContainerHeight = DEFAULT_FOOTER_CONTAINER_HEIGHT;
  }
  /**
   * 刷新footer
   */
  footerContainerReset() {
    let { footEl } = this.sheetComp;
    if (!footEl) {
      return
    }

    let footElTop = this._getFootElTopValue();
    let isShow = this.coreSheet.tableViewForEvent.tableHeight >= footElTop
    if (isShow) {
      footEl.style['display'] = 'block';
      footEl.style['top'] = footElTop + 'px';
    } else {
      footEl.style['display'] = 'none';
    }
  }

  _getFootElTopValue():number {
    const { coreSheet } = this;
    const ri = coreSheet.coreScrollBarProxy.scrollRi + 1;
    let footElTop = coreSheet.coreRows.totalHeight()  - (this.coreSheet.coreScrollBarProxy.y + coreSheet.coreRows.ensureGetRowHeightByRi(ri)) - 65
    return footElTop
  }
}
