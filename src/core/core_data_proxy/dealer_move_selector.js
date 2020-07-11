import { SheetComp } from '../../component/a_top_comp/sheet_comp';
import { CoreSheet } from './core_sheet_change';
import { isCalcResError } from '../../global_utils/func_for_calc_core';
import { CellRangeProxy } from '../../internal_module/cell_range';
class DealState{
  shiftKey:Boolean
  keyCode: number
  preRangAndNewRange: [CellRangeProxy, CellRangeProxy]
  constructor(aObj = {}){
    Object.assign(aObj, this)
  }
}

class BaseMoveSelectorDealer{
  sheetComp:SheetComp
  coreSheet:CoreSheet
  constructor(sheetComp) {
    this.sheetComp = sheetComp
    this.coreSheet = this.sheetComp.coreSheet
    this.dealState = new DealState({})
  }
  moveScrollBarToShowSelector(shiftArray) {
    let tryShowTopOrBottom = shiftArray[0] === 1 ? 1 : 0;
    let tryShowLeftOrRight = shiftArray[1] === 1 ? 1 : 0;
    let changeArray = this.coreSheet.coreScrollBarProxy.updateByAdaptiveToCoreSelector(tryShowTopOrBottom, tryShowLeftOrRight);
    if (changeArray[0]) {
      this.sheetComp.horizontalScrollbar.updateByCoreScrollPst(false);
    }
    if (changeArray[1]) {
      this.sheetComp.verticalScrollbar.updateByCoreScrollPst(false);
    }
    return changeArray;
  }


  updateCoreSelectorStep() {
    this.coreSheet.coreSelector.updateEditingCellLeftOrRight(this.dealState.shiftKey);
  }

  updateScrollBarStep() {
    this.dealState.changeArray = this.moveScrollBarToShowSelector(this.dealState.shiftKey ? [0, -1] : [0, 1]);
  }
  dealVisibleEditor(){
    return isCalcResError(this.sheetComp.sheetOperationDealer.dealEndEdit())
  }


  easyDealMoveSelector(shiftKey, keyCode){
    this.dealState.shiftKey = shiftKey
    this.dealState.keyCode = keyCode
    if (this.sheetComp.cellEditorComp.editorInputComp.isTextElVisible()) {
      if (this.dealVisibleEditor()) {
        return true;
      }
    }
    this.updateCoreSelectorStep();
    this.updateScrollBarStep();
    this.sheetComp.selectorContainerComp.updateSelfAndToolBarByCoreSelector();
    this.sheetComp.tableComp.refreshTableDataThenRender();
  }


}


export class TabMoveSelectorDealer extends BaseMoveSelectorDealer{

  updateCoreSelectorStep() {
    this.coreSheet.coreSelector.updateEditingCellLeftOrRight(this.dealState.shiftKey);
  }
  updateScrollBarStep() {
    this.dealState.changeArray = this.moveScrollBarToShowSelector(this.dealState.shiftKey ? [0, -1] : [0, 1]);
  }
}

export class EnterMoveSelectorDealer extends BaseMoveSelectorDealer{
  updateCoreSelectorStep() {
    this.coreSheet.coreSelector.updateEditingCellUpOrDown(this.dealState.shiftKey);
  }
  updateScrollBarStep() {
    this.dealState.changeArray = this.moveScrollBarToShowSelector(this.dealState.shiftKey ? [-1,0] : [1,0]);
  }
}


export class ShiftArrowMoveSelectorDealer extends BaseMoveSelectorDealer{
  dealVisibleEditor(){
    return true // editor显示的时候直接退出
  }

  updateCoreSelectorStep() {
    let shiftArray = this.sheetComp.sheetEventDealer.getShiftArrayByArrowKeyCode(this.dealState.keyCode);
    this.dealState.preRangAndNewRange = this.coreSheet.coreSelector.updateExpandKernelRangeByShiftArray(shiftArray);
  }
  updateScrollBarStep() {
    let preRangAndNewRange = this.dealState.preRangAndNewRange
    let tryShowLeftOrRight = preRangAndNewRange[1].eci !== preRangAndNewRange[0].eci ? 1 : 0;
    let tryShowTopOrBottom = preRangAndNewRange[1].eri !== preRangAndNewRange[0].eri ? 1 : 0;
    let changeArray = this.coreSheet.coreScrollBarProxy.updateByAdaptiveToCoreSelector(tryShowTopOrBottom, tryShowLeftOrRight);
    if (changeArray[0]) {
      this.sheetComp.horizontalScrollbar.updateByCoreScrollPst(false);
    }
    if (changeArray[1]) {
      this.sheetComp.verticalScrollbar.updateByCoreScrollPst(false);
    }
  }
}

export class ArrowMoveSelectorDealer extends BaseMoveSelectorDealer{
  dealVisibleEditor(){
    return true // editor显示的时候直接退出
  }

  updateCoreSelectorStep() {
    this.dealState.shiftArray = this.sheetComp.sheetEventDealer.getShiftArrayByArrowKeyCode(this.dealState.keyCode);
    this.coreSheet.coreSelector.updateByFirstSelectCellShiftInView(this.dealState.shiftArray);
  }
  updateScrollBarStep() {
    let tryShowTopOrBottom = this.dealState.shiftArray[0] === 1 ? 1 : 0;
    let tryShowLeftOrRight = this.dealState.shiftArray[1] === 1 ? 1 : 0;
    let changeArray = this.coreSheet.coreScrollBarProxy.updateByAdaptiveToCoreSelector(tryShowTopOrBottom, tryShowLeftOrRight);
    if (changeArray[0]) {
      this.sheetComp.horizontalScrollbar.updateByCoreScrollPst(false);
    }
    if (changeArray[1]) {
      this.sheetComp.verticalScrollbar.updateByCoreScrollPst(false);
    }
    return changeArray;
  }
}
