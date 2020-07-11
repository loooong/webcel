//* global window */
import { FinElement, h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { RangePstDetail } from '../../core/core_data_proxy/position_detail';
import { EditorInputComp } from './editor_input_comp';
import { EditorTextProxyOLD } from '../../core/core_data_proxy/editor_text';
import { STATE_FINISHED } from '../../core/core_utils/config';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { myLog, PRINT_LEVEL2 } from '../../log/new_log';
import { SELECTOR_BORDER_WIDTH } from '../comp_selector/selector_comp';
import {
  EDITOR_AREA_HIDE_STYLE,
  EDITOR_AREA_SHOW_STYLE,
  EDITOR_TEXT_HIDE_STYLE,
  EDITOR_TEXT_SHOW_STYLE
} from '../utils/config';

export class CellEditorComp {
  sheetComp: SheetComp;
  editorInputComp: EditorInputComp;
  changed: boolean;
  data: CoreSheet;
  coreSheet: CoreSheet; // 之后用这个属性逐渐提到.data
  freezeWidthHeight: { w: number, h: number };
  editorTextProxy: EditorTextProxyOLD;
  isCors: boolean;
  areaFel: FinElement;

  constructor(fnNameArrayWithKey, coreSheet, compSheet) {
    this.fnNameArrayWithKey = fnNameArrayWithKey; // 这个是自动提示用的
    this.sheetComp = compSheet;

    // === 数据 ======
    this.coreSheet = coreSheet;
    this.data = coreSheet;

    // ===== 状态 =========
    this.changed = false; // 应该是标记状态
    this.isCors = false; // 推测跟锁定状态有关
    // ===== 子组件 ===========
    this.editorInputComp = new EditorInputComp(this);


    // ===== 构建组件 ========
    this.areaFel = h('div', `${CSS_PREFIX}-editor-area`) // 创建areaEl 与textEl这两个html元素
      .children( // 加入子元素
        this.editorInputComp.textFel,
        this.editorInputComp.textLineFel = h('div', 'textline'),
        this.editorInputComp.formulaTipComp.el,
        this.editorInputComp.datepickerComp.el,
      )
      .on('mousemove.stop', () => {
      })
      .on('mousedown.stop', () => {
      });

    compSheet.el.appendChildByStrOrEl(this.editorInputComp.suggestComp.el); // suggest是放在compSheet下面
    this.el = h('div', `${CSS_PREFIX}-editor`)
      .children(this.areaFel);
    this.freezeWidthHeight = {
      w: 0,
      h: 0
    };

    setTimeout(() => {
      this.show(false);
    });

  }

  get editorTextProxy() {
    return this.coreSheet.coreInputEditor.editorTextProxyOLD;
  }

  // ======== 生命周期事件处理 ===========
  change(state, itext) { // state = finish, format, input
    let coreSheet = this.coreSheet;
    if (state === 'finish') { //  用户输入
      coreSheet.editorChangeToHistory(this.editorTextProxy.getOldCell(), this.editorTextProxy.getRICI(), 1);
      this.editorTextProxy.recordPreFormatCell({}, {
        ri: -1,
        ci: -1
      });
      return;
    }

    if (state === 'format') {
      coreSheet.changeSetSelectedCellAttr(state, 'rmb');
      // return;
    }
    // let {selector} = this;
    // selector.el.hide();
    //实时更新this.refSelectors
    // this.editorInputComp.coreSheet.coreInputEditor.textBeforeAndAfterCursor = coreSheet.coreRows
    this.editorInputComp.formulaEditBhv.editingSelectors(itext);
    if (this.coreSheet.coreInputEditor.lock && itext !== '=') {
      return;
    }

    // if (this.refSelectors.length > 0) {
    //     return;
    // }

    if (state === 'format') {
      return;
    }

    this.dataSetCellText(itext, state);
  };

  /**
   * 结束编辑，把input中的text放到单元格中去
   * @param newFormula
   * @param state
   */
  dataSetCellText(newFormula, state = STATE_FINISHED) {
    this.coreSheet.changeFormulaOfSelectedCell(newFormula, state); //
    if (state === STATE_FINISHED) {
      this.sheetComp.tableComp.refreshTableDataThenRender();
    }
  }


  // =============== 基本的变化  ================
  // 设置冻结单元格的位置
  setFreezeLengths(width, height) {
    this.freezeWidthHeight.w = width;
    this.freezeWidthHeight.h = height;
  }


  // 切换显示状态
  show(isShown = true) { // 通过调整css，把editor显示出来


    if (isShown && this.coreSheet.coreSheetSetting.showEditor) { // todo: 直接display = none？
      this.editorInputComp.textFel.css(EDITOR_TEXT_SHOW_STYLE);
      this.editorInputComp.textFel.el.focus();
      this.areaFel.css(EDITOR_AREA_SHOW_STYLE);
    } else {
      this.editorInputComp.textFel.css(EDITOR_TEXT_HIDE_STYLE);
      this.editorInputComp.textFel.el.blur();
      this.areaFel.css(EDITOR_AREA_HIDE_STYLE);
    }
  }

  // 清空Editor组件
  clear(c = false) {
    let inputText = this.coreSheet.coreInputEditor.editorTextProxyOLD.getText(); // 获取输入字符

    if (inputText !== '' && isNaN(inputText) && inputText.replace(/\s/g, '')
      .lastIndexOf('¥') === 0) {
      this.change('format', inputText);
    } else if (this.changed) {
      this.change('finish', inputText);

    }

    this.changed = false;
    this.coreSheet.coreInputEditor.editingRangeLEWH = null;
    // this.inputText = '';
    this.show(false);
    this.editorInputComp.clearWholeInput();

    if (c) {
      return false;
    }
    return this.editorInputComp.isTextElVisible(); // 确实在显示,
  }

  // 设置editor的位置
  _setEditorPst(rangePstDetail: RangePstDetail) {
    if (!rangePstDetail) {
      return;
    }
    const { freezeWidthHeight } = this;
    this.coreSheet.coreInputEditor.editingRangeLEWH = rangePstDetail.getLTWH();
    const {
      rangeViewLeft, rangeViewTop, rangeWidth, rangeLeft, rangeTop,
    } = rangePstDetail;
    const editorLeftTop = {
      left: 0,
      top: 0
    };
    // top leftSpanElIndex; todo: 这里对freeze的处理不是很能理解
    if (freezeWidthHeight.w > rangeLeft && freezeWidthHeight.h > rangeTop) { // 处理冻结单元格
      // 在冻结点的左上方，不处理
    } else if (freezeWidthHeight.w < rangeLeft && freezeWidthHeight.h < rangeTop) {
      // 冻结点的右下方
      editorLeftTop.left = freezeWidthHeight.w;
      editorLeftTop.top = freezeWidthHeight.h;
    } else if (freezeWidthHeight.w > rangeLeft) {
      // 冻结点的右上方
      editorLeftTop.top = freezeWidthHeight.h;
    } else if (freezeWidthHeight.h > rangeTop) {
      // 冻结点的左下方
      editorLeftTop.left = freezeWidthHeight.w;
    }
    // === 更新各个元素的位置 =========
    this.el.updateElLTWH(editorLeftTop);
    this.areaFel.updateElLTWH({
      left: rangeViewLeft - editorLeftTop.left - 0.8,
      top: rangeViewTop - editorLeftTop.top - 0.8
    });
    this.editorInputComp.textFel.updateElLTWH({
      width: rangeWidth - 2 + 0.8,
    });
    // 这里是重新调整宽度与高度
    this.editorInputComp.updateTextElementSize(); // 重新设置textArea 区域
  }

  /**
   * 根据当前selector的位置重新调整cellEditor组件
   * @param show
   * @param cri
   * @param cci
   */
  updateCellEditorCompBySelector(show = true, cri = -1, cci = -1) {
    const { selectorContainerComp } = this.sheetComp; // this 应该是SheetComp
    let ri = this.coreSheet.coreSelector.riOfEditingCell;
    let ci = this.coreSheet.coreSelector.ciOfEditingCell;

    ri = cri === -1 ? ri : cri; // 如果cri与cci有值的话，会把editor直接挪过去？
    ci = cci === -1 ? ci : cci;
    // 获取选择框的位置信息
    const rangePstDetail = this.coreSheet.tableViewForEvent.getRangePstDetailNew(new CellRangeProxy(ri, ci, selectorContainerComp.selectedWholeRange.eri, selectorContainerComp.selectedWholeRange.eci)); // 获取位置信息

    this._setEditorPst(rangePstDetail);

    // 这里是处理suggest组件的位置；
    this.editorInputComp.suggestComp.hide(); // 此时把suggest之间关掉了最简单
    if (show) {
      this.show(false);
    }
    // setTimeout(() => { // 放置光标应该不需要了
    //   this.editorInputComp.updateCursorPstByLen(this.editorInputComp.editorTextProxyOLD.getText().length);
    // });
  }

  resetByCoreData() {
    this.show(true); // 在选择框上面show出CellEditor
    this.areaFel.updateElLTWH({
      left: this.coreSheet.coreInputEditor.editingRangeLEWH.left - SELECTOR_BORDER_WIDTH,
      top: this.coreSheet.coreInputEditor.editingRangeLEWH.top - SELECTOR_BORDER_WIDTH,
    });
    this.editorInputComp.textFel.updateElLTWH({ // 至少要盖住原先的编辑中的单元格
      'min-width': this.coreSheet.coreInputEditor.editingRangeLEWH.width - 4,
      'min-height': this.coreSheet.coreInputEditor.editingRangeLEWH.height - 4,
      width: this.coreSheet.coreInputEditor.editingRangeLEWH.width - 4, // 应该对于换行的才有width属性
      // height: this.coreSheet.coreInputEditor.editingRangeLEWH.height - 4,
    });
    // // 需要设置样式
    this.editorInputComp.textFel.updateCssPropertyByObject(this.coreSheet.coreInputEditor.editingFormatCell.cellStyleSetting.getCssProperty2Value());
    // this.editorInputComp.textFel.css("height","100%")
    this.editorInputComp.refreshTextFelByCoreData();
    // this.editorInputComp.suggestComp.refreshSuggestCompByCoreData()
  }


  // 这个方法在runBeginEditFromOldCell以及 handleInput中会被调用
  showCellEditorCompOnSelector() {
    let theCoreCellRange = new CellRangeProxy(this.editorInputComp.ri, this.editorInputComp.ci,
      this.sheetComp.selectorContainerComp.selectedWholeRange.eri, this.sheetComp.selectorContainerComp.selectedWholeRange.eci);
    const rangePstDetail = this.coreSheet.tableViewForEvent.getRangePstDetailNew(theCoreCellRange); // 获取位置信息
    this._setEditorPst(rangePstDetail);
    // 这里是处理suggest组件的位置；
    this.editorInputComp.suggestComp.hide(); // 此时把suggest之间关掉了最简单
    this.show(true);
  }


  getSuggestDirectionByRangePstDetail(rangePstDetail: RangePstDetail) {
    let suggestDirection = 'top'; // 调整suggestDirection的展开位置
    if (rangePstDetail.rangeViewTop > this.coreSheet.tableViewForEvent.getTableContentPstDetail().height / 2) {
      suggestDirection = 'bottom';
    }
    return suggestDirection;
  }


  /**
   * 跳出error框，与editor有关
   * @param enter
   * @param msg
   * @return {{msg: *, state: boolean}}
   */
  showErrorMsgDialog(enter, msg) {
    const { errorMsgDialogComp } = this.sheetComp;

    if (enter && !errorMsgDialogComp.open) {
      errorMsgDialogComp.showMsg(msg);
      return {
        'state': true,
        'msg': msg
      };
    } else if (errorMsgDialogComp.open) {
      errorMsgDialogComp.hide();
      return {
        'state': true,
        'msg': msg
      };
    }
    return {
      'state': false,
      'msg': msg
    };
  }

  checkNewFormula(newFormula) {

  }

  /**
   * 把编辑器里面的文字塞入到workbookServer中去； 单击其他位置，退出时触发本函数。以及按下tab键，回车健以后触发
   * @param ri
   * @param ci
   * @param text
   * @param style
   * @param state: input 或 style
   * @return {boolean}
   */
  selectorCellText(ri, ci, { text, style }, state) {
    let args = this.coreSheet.selectorCellText(ri, ci, text + '', state); // 这里面会检查错误信息
    if (args.state) { // 有错误直接跳出弹框
      args = this.showErrorMsgDialog(true, args.msg);
      if (args.state) {
        return true;
      }
    }

    this.coreSheet.setCellText(ri, ci, { // 设置单元格的text
      text,
      style
    });
    this.el.hide();

    return false;
  }

  // =============== deal 函数


  /**
   * 执行beginEdit 操作
   */
  dealBeginEditFromOldCell() { // 双击单元格，会弹出Editor组件； 选中range的时候输入也会执行
    // ======== 更新数据 =========
    this.coreSheet.coreInputEditor.updateEditingRangeLTWH();
    this.coreSheet.coreInputEditor.refreshEditingFormatCell();
    // === 更新各个元素的位置 =========

    this.resetByCoreData();
    this.sheetComp.clearInnerClipboard();
    myLog.myPrint(PRINT_LEVEL2, this.sheetComp.cellEditorComp);
  }


}


