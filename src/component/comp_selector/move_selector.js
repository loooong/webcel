// 移动选择框的时候出现的组件: 纯粹的一个方框，没有corner
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import {h} from '../basic_unit/element';
import { SELECTOR_BORDER_WIDTH } from './selector_comp';
export const MOVE_BORDER_WIDTH = 3 // 比正常的selector边框更宽
export const MOVE_SELECTOR = "move-selector"
export const AUTO_FILL_SELECTOR = "auto-fill-selector"
export class MoveSelectorComp {
  sheetComp: SheetComp
  coreSheet: CoreSheet
  constructor(sheetComp: SheetComp){
    this.sheetComp = sheetComp
    this.coreSheet = this.sheetComp.coreSheet
    this.createSelectorFel()
  }
  getClassName(){
    return MOVE_SELECTOR
  }
  getCoreLTWH(){
    return this.coreSheet.coreMoveSelector.dstRangePstDetail.getLTWH()
  }
  createSelectorFel(){
    this.selectorFel = h("div",`${CSS_PREFIX}-${this.getClassName()}`)
    this.sheetComp.overlayerCEl.appendChildByStrOrEl(this.selectorFel) // 放到sheetComp下一级
    this.selectorFel.updateCssPropertyByObject({
      position: "absolute",
      border: MOVE_BORDER_WIDTH + "px solid green", //
    }).hide()
    this.selectorFel.updateElLTWH({
      left: 0,
      top:  0,
      width: 100,
      height: 100,
    })
  }
  updateByCoreLTWH(){
    let ltwh = this.getCoreLTWH()
    // 确保moveSelector的边框的最外侧不超过selector边框的最外侧
    ltwh.left = ltwh.left - (MOVE_BORDER_WIDTH - SELECTOR_BORDER_WIDTH)
    ltwh.top = ltwh.top  - (MOVE_BORDER_WIDTH - SELECTOR_BORDER_WIDTH)
    ltwh.width = ltwh.width - SELECTOR_BORDER_WIDTH
    ltwh.height = ltwh.height - SELECTOR_BORDER_WIDTH
    this.selectorFel.updateElLTWH(ltwh)
    this.selectorFel.updateDisplayToBlock()
  }
}

export class AutoFillSelectorComp extends MoveSelectorComp{
  sheetComp: SheetComp
  coreSheet: CoreSheet
  getClassName(){
    return AUTO_FILL_SELECTOR
  }
  getCoreLTWH(){
    return this.coreSheet.coreAutoFillSelector.dstRangePstDetail.getLTWH()
  }

}

