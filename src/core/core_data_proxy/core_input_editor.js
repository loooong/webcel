import { CoreSheet } from './core_sheet_change';
import { EditorTextProxyOLD } from './editor_text';
import { EditingFormatCell } from './cell_editing_cell';
import { SYN_OPERATOR } from '../../calc/calc_utils/config';
import { SyntaxCharPstDetail } from '../../internal_module/syntax_builder_core';
import { myLog, PRINT_LEVEL3 } from '../../log/new_log';
import { LeftTopWidthHeight } from './view_table_view';

export class CoreInputEditor {
  coreSheet: CoreSheet;
  textBeforeAndAfterCursor: [string, string];
  startCursorPst: number;
  lock: boolean;
  isTypingChinese: boolean;
  isFromCopyPaste: boolean;
  editorTextProxyOLD: EditorTextProxyOLD;
  editingRangeLEWH: { left: number, width: number, top: number, height: number };
  editingFormatCell: EditingFormatCell;
  charPstDetail: SyntaxCharPstDetail

  constructor(coreSheet) {
    this.coreSheet = coreSheet;
    this.textBeforeAndAfterCursor = [];
    this.startCursorPst = 0;
    this.endCursorPst = 0;
    this.isTypingChinese = false; // 输入中文的时候
    this.lock = false;
    this.editorTextProxyOLD = new EditorTextProxyOLD('');
    this.editingRangeLEWH = null;
  }

  get curFormula() {
    return this.editingFormatCell.editingCalcCell.formulaString;
  }

  get charPstDetail(){ // 光标位置所对应的字符的详细信息
    if (this.editingFormatCell.editingCalcCell.isStructuralFormula() === false) {
     return new SyntaxCharPstDetail() // 是空的
    }
    // 存在等于号需要减去1;同时光标左边的charPst= cursorPst -1
    return this.editingFormatCell.editingCalcCell.rootSyntaxUnit.getCharPstDetail(this.startCursorPst - 2);
  }

  updateEditingRangeLTWH() {
    let rangePstDetail = this.coreSheet.coreSelector.getFirstSelectMergeRangePstDetail(); // 获取编辑位置
    this.editingRangeLEWH = rangePstDetail.getLTWH();
  }

  getEditingRangeLTWHInTable(){
    return  new LeftTopWidthHeight({
      left: this.editingRangeLEWH.left + this.coreSheet.tableViewDetail.headerColWidth,
      top: this.editingRangeLEWH.top+ this.coreSheet.tableViewDetail.headerRowHeight,
      width: this.editingRangeLEWH.width,
      height: this.editingRangeLEWH.height,
    })
  }

  refreshEditingFormatCell() {
    this.editingFormatCell = this.coreSheet.coreSelector.createEditingFormatCell();
    this.editingFormatCell.editingCalcCell.execFormula(); // 解析公式，执行运算
    this.startCursorPst = this.editingFormatCell.editingCalcCell.formulaString.length;
    this.endCursorPst = this.startCursorPst;
    this.updateLockByCursorPst() // lock可能为true

  }

  refreshEditingFormatCellByNewFormula(newFormula = ""){
    this.editingFormatCell = this.coreSheet.coreSelector.createEditingFormatCell();
    this.updateByNewFormula(newFormula)
    this.startCursorPst = this.editingFormatCell.editingCalcCell.formulaString.length;
    this.endCursorPst = this.startCursorPst;
    this.updateLockByCursorPst() // lock可能为true
  }
  updateFormulaAndCursorByReplaceStringAtCharPst(newString){
    let oriLeftPartLength = this.charPstDetail.getLeftPartLength()
    this.charPstDetail.synUnit.wholeStr = newString + this.charPstDetail.getRightPartOfSynUnit() // 替换掉左边的部分
    this.editingFormatCell.editingCalcCell.refreshFormulaString()
    this.editingFormatCell.editingCalcCell.execFormula() // 重新解析一遍
    this.startCursorPst = this.startCursorPst  - oriLeftPartLength + newString.length // 更新光标位置
    this.endCursorPst = this.startCursorPst;
  }

  updateByNewFormula(newFormula) {
    this.editingFormatCell.editingCalcCell.updateByCellObj({ f: newFormula });
    this.editingFormatCell.editingCalcCell.execFormula(); // 解析公式，执行运算
  }

  updateLockByCursorPst() {
    this.lock = this.charPstDetail.allowAddReferUnit()
    myLog.myPrint(PRINT_LEVEL3, this.lock)
  }

  updateFormulaInCalc(){
    if(this.editingFormatCell.editingCalcCell.isStructuralFormula()){
      let resObj = this.coreSheet.checkErrorOfFormula(this.curFormula) // 检查formula的错误
      if (resObj.isError) {
        return resObj
      }
    }
    this.coreSheet.coreWorkbook.dealInputFormulaOfSingleCell(this.coreSheet.coreSheetName,
      this.coreSheet.coreSelector.getEditingRi(),
      this.coreSheet.coreSelector.getEditingCi(), this.curFormula)// 更新数据
  }

}
