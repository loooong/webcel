import { SheetComp } from '../a_top_comp/sheet_comp';
import { myLog, PRINT_LEVEL2, PRINT_LEVEL3 } from '../../log/new_log';
import { isCalcResError } from '../../global_utils/func_for_calc_core';

export class SheetOperationDealer{ // sheet的基本功能实现在这里, 能够调用sheetEventDealer，反之不行
  sheetComp: SheetComp
  constructor(sheetComp){
    this.sheetComp = sheetComp
    this.sheetEventDealer = this.sheetComp.sheetEventDealer
    this.coreSheet = this.sheetComp.coreSheet
  }

  // =================== 所有的可执行的功能点都在这里，用run 做前缀 ============================
  dealEndEdit(){
    let resObj = this.coreSheet.coreInputEditor.updateFormulaInCalc()
    if (isCalcResError(resObj)) {
      this.sheetComp.errorMsgDialogComp.showMsg(resObj.msg) // 跳出错误提示
      return resObj;
    }
    // debugger
    this.sheetComp.cellEditorComp.show(false) // 消失掉
    this.sheetComp.cellEditorComp.editorInputComp.clearWholeInput()
    // 已经转移
    this.sheetComp.cellEditorComp.editorInputComp.clearRefSelectors() // 去掉语法高亮
    // 与其他component之间的关系
    // this.sheetComp.selectorContainerComp.primeSelectorComp.hideAndThenShowBoxinner(); // 可能是跟时间有关系
    // this.sheetEventDealer.renderAutoAdapt();
    // this.sheetEventDealer.autoRowResizer();
    this.sheetComp.tableComp.refreshTableDataThenRender()
    myLog.myPrint(PRINT_LEVEL3, resObj)

  }
  // 放弃之间编辑的结果
}


