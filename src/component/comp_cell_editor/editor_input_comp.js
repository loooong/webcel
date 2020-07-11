import { FinElement, h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { CellEditorComp } from './editor';
import { FormulaEditBhv, SelectorDetail } from './formula_edit_bhv';
import { EditorTextProxyOLD } from '../../core/core_data_proxy/editor_text';
import { ItemDetail, SuggestComp } from './suggest';
import { isHave } from '../../global_utils/check_value';
import { FormulaTipComp } from './formula_tip_comp';
import { DatepickerComp } from './datepicker';
import {
  cutFirst,
  cutting,
  cutting2,
  cuttingByPos,
  cuttingByPos2,
  getCurSyntaxUnitUpperCase,
  getUniqueRefStrArray,
  isAbsoluteValue,
  isOperator,
  value2absolute
} from './ref_selector_control_old';
import { expr2xy, xy2expr } from '../../global_utils/alphabet';
import { getSelectorColorObj } from '../comp_single_file/color_palette';
import { STATE_INPUT } from '../../core/core_utils/config';
import { KEY_CODE_ESC, KEY_CODE_F4, KEY_CODE_SPACE, TEXTAREA_BORDER_WITH } from '../utils/config';
import { myLog, PRINT_LEVEL0, PRINT_LEVEL3 } from '../../log/new_log';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { SheetComp } from '../a_top_comp/sheet_comp';

interface InputEvent extends UIEvent { // webstorm还不支持InputEvent的语法提示
  data: string,
  isComposing: Boolean, // 当前输入的字符是输入法的中途输入
}

export class EditorInputComp {
  sheetComp: SheetComp;
  cellEditorComp: CellEditorComp;
  textFel: FinElement;
  tmp: FinElement;
  cursorPst: number;
  editorTextProxy: EditorTextProxyOLD;
  formulaEditBhv: FormulaEditBhv;
  selectors: Array<SelectorDetail>;
  coreSheet: CoreSheet;
  ri: number;
  ci: number;
  spanElArr: Array;

  constructor(editorComp) {
    this.cellEditorComp = editorComp;
    this.sheetComp = this.cellEditorComp.sheetComp;
    this.coreSheet = this.cellEditorComp.sheetComp.coreSheet;
    // 子组件
    this.textLineFel = h('div', 'textline');
    this.selectors = editorComp.sheetComp.refSelectors;
    this.textFel = this.createTextEl();
    this.suggestComp = new SuggestComp(this.cellEditorComp.fnNameArrayWithKey, (it) => {
      this.dealSuggestItemClickNew(it); // 创建提示组件
    }, this.cellEditorComp.coreSheet, this);
    this.spanElArr = []; // 猜测是语法标记
    this.configTextEl(this.coreSheet.coreCols.defualtColWidth, this.coreSheet.coreRows.defaultRowHeight);
    this.formulaTipComp = new FormulaTipComp(); // 创建提示信息
    this.datepickerComp = new DatepickerComp();
    this.datepickerComp.change((d) => {
      this.updateByText(this.datepickerComp.dateFormat(d));
      this.cellEditorComp.clear();
    });
    this.formulaEditBhv = new FormulaEditBhv(this);
  }

  // =========== 基础操作  ==============
  get editorTextProxy() {
    return this.coreSheet.coreInputEditor.editorTextProxyOLD;
  }

  get lock() {
    return this.coreSheet.coreInputEditor.lock;
  }

  get cursorPst() {
    return this.coreSheet.coreInputEditor.startCursorPst;
  }

  get ri() {
    return this.coreSheet.coreSelector.getEditingRi();
  }

  get ci() {
    return this.coreSheet.coreSelector.getEditingRi();
  }

  // 核心的事件处理逻辑
  createTextEl() {
    document.addEventListener('keypress', (evt) => {
      this.dealDocumentTypeChar(evt);
    });
    document.addEventListener('compositionstart', (evt) => { // keyPress不会
      this.coreSheet.coreInputEditor.isTypingChinese = true;
      this.dealDocumentTypeChar(evt);
    }); // 输入中文
    return h('div', `${CSS_PREFIX}-editor-textEl`) // h是创建新的html元素
      .on('input', evt => this.dealTextFelInputNew(evt)) // 加入输入事件处理逻辑，inputEventHandler代码很长
      // .on('click', () => this.dealClickEvent()) // 点击的输入事件
      .on('keydown', (evt) => {
        this.dealTextFelKeyDownNew(evt);
      })
      // TextElVisible的时候的逻辑
      .on('paste', (evt) => {
        if (this.isTextElVisible()) { // 推测更改：cellEditorComp.textEl.el.style['caret-color'] === 'black'
          // fireAEventToDocument.call(cellEditorComp, 67, true, "paste");
          evt.stopPropagation(); // 阻止黏贴事件冒泡
        }
      })
      .on('copy', (evt) => {
        if (this.isTextElVisible()) {
          // fireAEventToDocument.call(cellEditorComp, 86, true, "sheetCopy");
          evt.stopPropagation();
        }
      })
      .on('compositionstart', () => { // 中文输入法的开始
        this.coreSheet.coreInputEditor.isTypingChinese = true;
      })
      .on('compositionend', () => { // 中文输入法结束
        this.coreSheet.coreInputEditor.isTypingChinese = false;
        this.dealTextFelInputNew(); // 输入中文
      })
      ;
  }

  refreshTextFelByCoreData() {
    this.textFel.appendChildByStrOrEl(this.coreSheet.coreInputEditor.curFormula);
    this.updateCursorPstAtTextEl(); // 设定光标焦点
    this.updateTextFelAndSpanElArray();
    this.updateTextElementSize();
  }

  // =========== beginEdit事件 相关的逻辑  ==============
  clearWholeInput() {
    this.updateByText('');
    this.coreSheet.coreInputEditor.isFromCopyPaste = false;
    this.clearTextEl();
    this.textLineFel.updateInnerHtml('');
    this.formulaTipComp.hide();
    this.suggestComp.setItems(this.cellEditorComp.fnNameArrayWithKey);
    this.datepickerComp.hide();
  }


  clearTextEl() {
    this.updateCursorPstAtTextEl();
    this.coreSheet.coreInputEditor.startCursorPst = 0;
    this.tmp.hide();
    this.textFel.updateInnerHtml('');
  }

  configTextEl(rowWidth, singleTextLineHeight) {
    this.suggestComp.bindInputEvents(this.textFel);
    this.textFel.on('paste', (evt) => {
      if (this.isTextElVisible() === false) {
        return;
      }
      this.pasteText(evt);
    });
    this.tmp = h('span', 'span_tmp')
      .hide();
    this.textFel.updateAttrByKeyValue('contenteditable', 'true');
    this.textFel.css('height', '100%');
    this.textFel.appendChildByStrOrEl(this.tmp);
    myLog.myPrint(PRINT_LEVEL0, this);
  }


  // 处理textEl的大小，似乎不需要了
  updateTextElementSize() {
    const { editingRangeLEWH } = this.coreSheet.coreInputEditor; // 根据editorLTWH来调整位置
    // textLineFel 是用来计算长度的?
    const tlineWidth = this.textLineFel.getElLTWH().width + 9 + TEXTAREA_BORDER_WITH; // todo; 这些 9 与 15 是什么？
    const tableWidth = this.coreSheet.tableViewForEvent.getTableContentPstDetail().width - editingRangeLEWH.left - 9; // 最多贴到table的边界？
    if (tlineWidth > editingRangeLEWH.width && editingRangeLEWH.width !== 0) { // 超过了原有的输入框的宽度
      let textAreaWidth = tlineWidth;
      if (tlineWidth > tableWidth) { // 调整文字框的高度，这样来换行, tlineWidth
        textAreaWidth = tableWidth - TEXTAREA_BORDER_WITH;
        this.textFel.css('height', `100%`); // 调整高度
      }
      this.textFel.css('width', `${textAreaWidth}px`); // 调整宽度
    }
  }

  isTextElVisible() {
    return this.textFel.el.style.opacity === '1';
  }

  updateByText(text) {
    this.editorTextProxy.setText(text);
    // this.inputText = text;
    // firefox bug
    this.textFel.el.blur();
    this.tmp.updateInnerHtml(text);
    this.textLineFel.updateInnerHtml(text);
    setTimeout(() => {
      // el.focus();
      this.updateCursorPstAtTextEl();
      // el.setSelectionRange(position, position);
    }, 0);
    this.updateTextElementSize();
    this.textFel.appendChildByStrOrEl(this.tmp);
  }


  // 设置mousedownIndex，应该是最初鼠标点击下去时候的光标位置， 与textEl有关
  // 设置锁定状态， 与textEl有关
// 设置锁定状态， 与textEl有关
  // lock 是针对editor的，此时可以通过鼠标点击或移动位置获取A1:A2这样的输入
  isMouseSelectReferState() {
    return this.lock || this.cellEditorComp.isCors;
  }

  // 应该归属EditorInputComp
  parse(pos = -1) {
    let { editorTextProxy } = this;
    let inputText = editorTextProxy.getText();
    if (pos !== -1) {
      this.coreSheet.coreInputEditor.startCursorPst = this.updateTextFelAndSpanElArray();
      this.coreSheet.coreInputEditor.startCursorPst = this.cursorPst;
      this.coreSheet.coreInputEditor.updateLockByCursorPst();
    } else {
      this.coreSheet.coreInputEditor.updateLockByCursorPst();
    }
  }

  // 归属EditorInputComp
  handler(text) {
    let { editorTextProxy } = this;
    let inputText = editorTextProxy.getText();

    const cursorPos = this.cursorPst;
    if (cursorPos >= inputText) {
      this.coreSheet.coreInputEditor.textBeforeAndAfterCursor = [];
      return;
    }
    const textBegin = text.substring(0, cursorPos);
    const textEnd = text.substring(cursorPos, text.length);
    this.coreSheet.coreInputEditor.updateLockByCursorPst();
    if (textEnd !== '') {
      this.coreSheet.coreInputEditor.textBeforeAndAfterCursor = [textBegin, textEnd];
    } else {
      this.coreSheet.coreInputEditor.textBeforeAndAfterCursor = [];
    }
  }

  // 归属EditorInputComp
  setCell(cell, validator, type = 1) {
    this.cell = cell;
    this.cellEditorComp.show();

    let text = (cell && cell.formulas) || '';
    text = text === '' ? (cell && cell.text) || '' : text;

    this.editorTextProxy.recordPreFormatCell({
      text: (cell && cell.text) || '',
      formulas: (cell && cell.formulas) || '',
    }, {
      ri: this.ri,
      ci: this.ci
    });
    const { el, datepickerComp, suggestComp } = this;
    el.updateDisplayToBlock();
    this.textFel.updateDisplayToBlock();
    this.updateCursorPstAtTextEl(); // 设定光标焦点
    setTimeout(() => {
      this.coreSheet.coreInputEditor.startCursorPst = text.length;
      this.updateCursorPstAtTextEl(); // 设定光标焦点
    }, 10);
    this.validator = validator;
    if (validator) {
      const { type } = validator;
      if (type === 'date') {
        datepickerComp.updateDisplayToBlock();
        if (!/^\s*$/.test(text)) {
          datepickerComp.setValue(text);
        }
      }
      if (type === 'list') {
        suggestComp.setItems(validator.values());
        suggestComp.searchAndShowByKeyWord('');
      }
    }

    if (type === 2 && text !== '' && text[0] === '=') {
      this.dealInputEvent(null, text);
      this.coreSheet.coreInputEditor.startCursorPst = text.length;
      this.updateCursorPstAtTextEl(); // 设定光标焦点
    } else if (type === 2 && text[0] !== '=') {
      this.textFel.appendChildByStrOrEl(text);
    }
    setTimeout(() => {
      this.textLineFel.updateInnerHtml(text);
      this.updateTextElementSize();
    });
  }

  // dealInputEvent(text = '', pos = 1, hide = false) {
  //     if (hide) {
  //         this.areaFel.hide();
  //         this.belongSheet.selector.hide();
  //         this.isCors = true;
  //     }
  //     this.setCursorPos(pos);
  //     dealInputEvent.call(this, null, text);
  // }

  // isDisplay() {
  //     let {editorText} = this;
  //
  //     return isDisplay.call(this) && editorText.isFormula();
  // }
  //   // 归属EditorInputComp
  pasteText(e) {
    e.preventDefault();
    let text = '';
    let theClipboardData = (e.originalEvent || e).clipboardData;
    if (theClipboardData === undefined || theClipboardData === null) {
      text = window.clipboardData.getData('text') || '';
      if (text !== '') {
        this.insertTextAtCursor(text);
      }
    } else {
      text = theClipboardData.getData('text/plain') || '';
      if (text !== '') {
        document.execCommand('insertText', false, text);
      }
    }
  }

  insertTextAtCursor(text) {
    if (window.getSelection) {
      let newNode = document.createElement('span');
      newNode.innerHTML = text;
      window.getSelection()
        .getRangeAt(0)
        .insertNode(newNode);// 光标位置插入节点
    } else {
      document.selection.createRange()
        .pasteHTML(text);
    }
  }

  /**
   * 设置焦点位置
   */
  updateCursorPstAtTextEl() {
    // this.textFel.set_focus(this.cursorPst)
    this.textFel.updateCursorPstAtTextElByStartEnd(this.cursorPst, this.cursorPst);
    // this.textFel.updateCursorPstAtTextElByStartEnd(1, 1);

  }

// const setCursorPosition = (elem, index) => {
//     const val = elem.value || elem.textContent;
//     const len = val.length;
//
//     // 超过文本长度直接返回
//     if (len < index) return;
//     set_focus.call(this, elem);
// };
  // 归属EditorInputComp

  dealClickEvent() {
    let inputText = this.editorTextProxy.getText();
    this.coreSheet.coreInputEditor.startCursorPst = this.updateTextFelAndSpanElArray();
    this.coreSheet.coreInputEditor.startCursorPst = this.cursorPst;
    this.coreSheet.coreInputEditor.updateLockByCursorPst();
    myLog.myPrint(PRINT_LEVEL3);
  }

  // 归属EditorInputComp
  // 归属EditorInputComp
  // 似乎是更新refSelectors
  filterSelectors(uniqueRefStrArray) {
    const selectors_new = [];
    const selectors_delete = [];
    Object.values(this.cellEditorComp.sheetComp.refSelectors)
      .forEach((selector) => {
        const { selectingExpr } = selector;
        let enter = 0;
        for (let refArrayIndex = 0; refArrayIndex < uniqueRefStrArray.length && enter === 0; refArrayIndex++) {
          if (uniqueRefStrArray[refArrayIndex].replace(/\$/g, '') === selectingExpr) {
            enter = 1;
            selectors_new.push(selector);
          }
        }

        if (enter === 0) {
          selectors_delete.push(selector.selectorCompInDetail.el);
        }
      });
    return {
      selectors_delete,
      selectors_new,
    };
  }

  // 似乎是给selectors赋值
  lockCells(evt, _selector, isAb = false, p = -1) {

    let cellEditorComp = this.cellEditorComp;
    let coreSheet = this.cellEditorComp.coreSheet;
    let mousedownIndex = this.coreSheet.coreInputEditor.textBeforeAndAfterCursor;

    let relativeXYDetailC = this.cellEditorComp.sheetComp.overlayComp.getRelativeXYDetail(evt, 1);
    const cellRect = coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
    const { ri, ci } = cellRect;

    let pos = this.cursorPst;
    let inputText = this.editorTextProxy.getText();
    let input = '';

    this.handler(inputText);
    if (isAbsoluteValue(cuttingByPos(inputText, pos), 2) || _selector) {
      if (_selector) {
        const {
          sri, sci, eri, eci,
        } = _selector.selectorCompInDetail.range;

        const s1 = xy2expr(sci, sri);
        const s2 = xy2expr(eci, eri);
        let text = s1 === s2 ? s1 : `${s1}:${s2}`;

        if (isAb === 2) {
          const es1 = value2absolute(s1);
          const es2 = value2absolute(s2);
          text = es1.s1 === es2.s1 ? es1.s1 : `${es1.s1}:${es2.s1}`;
        } else if (isAb === 1) {
          const es1 = value2absolute(s1);
          const es2 = value2absolute(s2);
          text = es1.s2 === es2.s2 ? es1.s2 : `${es1.s2}:${es2.s2}`;
        } else if (isAb === 3) {
          const es1 = value2absolute(s1);
          const es2 = value2absolute(s2);
          text = es1.s3 === es2.s3 ? es1.s3 : `${es1.s3}:${es2.s3}`;
        }
        _selector.erpx = text;
        let { isCors } = cellEditorComp;
        if (isCors) {
          pos = 1;
        }

        let sp = p !== -1 ? p : pos - cuttingByPos(inputText, pos).length;
        input = inputText.substring(0, sp) + text + inputText.substring(pos, inputText.length);
        this.updateByText(input);
        this.coreSheet.coreInputEditor.startCursorPst = inputText.substring(0, sp).length + text.length;
        this.updateCursorPstAtTextEl();
      } else {
        // 此情况是例如: =A1  -> 这时再点A2  则变成: =A2
        let enter = 0;
        for (let i = 0; i < this.selectors.length && enter === 0; i++) {
          const selector = this.selectors[i];
          const { selectingExpr } = selector;
          if (selectingExpr === cuttingByPos(inputText, pos)) {
            const { ri, ci } = cellRect;
            this.selectors[i].ri = ri;
            this.selectors[i].ci = ci;
            this.selectors[i].selectingExpr = xy2expr(ci, ri);
            this.selectors[i].selectorCompInDetail.set(ri, ci);
            input = `${inputText.substring(0, pos - selectingExpr.length)}${xy2expr(ci, ri)}${inputText.substring(pos, inputText.length)}`;
            this.updateByText(input);
            this.coreSheet.coreInputEditor.startCursorPst = inputText.substring(0, pos - selectingExpr.length).length + xy2expr(ci, ri).length;
            this.updateCursorPstAtTextEl();
            enter = 1;
          }
        }
      }
    } else if (mousedownIndex.length > 0) {
      if (isOperator(mousedownIndex[1][0]) && isAbsoluteValue(cuttingByPos(mousedownIndex[1], mousedownIndex[1].length), 2)) {
        this.coreSheet.coreInputEditor.lock = false;
        return;
      }

      const selectorDetail = this.formulaEditBhv.makeSelector(ri, ci);
      this.selectors.push(selectorDetail);
      input = `${mousedownIndex[0]}${xy2expr(ci, ri)}${mousedownIndex[1]}`;
      const judgeText = input.substring(mousedownIndex[0].length + xy2expr(ci, ri).length, input.length);
      // 不是的话，需要删除这个
      let number = cutFirst(judgeText.substring(1));
      if (isOperator(judgeText[0]) && !isAbsoluteValue(number, 2)) {
        this.updateByText(input);
        this.coreSheet.coreInputEditor.textBeforeAndAfterCursor = [];
        return;
      }
      // 不是的话，需要删除这个
      number = cutFirst(mousedownIndex[1]);

      const uniqueRefStrArray = getUniqueRefStrArray(`${mousedownIndex[0]}${xy2expr(ci, ri)}+4${mousedownIndex[1]}`);
      const { selectors_delete, selectors_new } = this.filterSelectors(uniqueRefStrArray);
      Object.keys(selectors_delete)
        .forEach((i) => {
          const selector = selectors_delete[i];
          selector.removeEl();
        });

      this.selectors = selectors_new;

      input = input.replace(number, '');
      this.updateByText(input);
      // const content = suggestContent.call(this, pos - 1, cutting(inputText), inputText);
      this.coreSheet.coreInputEditor.startCursorPst = mousedownIndex[0].length + xy2expr(ci, ri).length;
      this.updateCursorPstAtTextEl();
    } else {
      let pos = this.cursorPst;

      const args = _selector || this.formulaEditBhv.makeSelector(ri, ci);
      if (pos !== -1) {
        let str = '';
        let enter = false;
        let step = pos;
        let first = '';
        for (let i = pos; i < inputText.length; i++) first += inputText[i];
        let len = cutFirst(first).length;
        for (let i = 0; i < inputText.length; i++) {
          if (pos === i) {
            enter = true;
            str += xy2expr(ci, ri);
          }

          if (step === i && len > 0) {
            step += 1;
            len -= 1;
          } else {
            str += inputText[i];
          }
        }

        if (_selector) {
          const {
            sri, sci, eri, eci,
          } = coreSheet.coreSelector.selectedCoreRange;
          const s1 = xy2expr(sci, sri);
          const s2 = xy2expr(eci, eri);

          input = s1 === s2 ? s1 : `${s1}:${s2}`;
          str = !enter ? str + input : str;
        } else {
          this.selectors.push(args);
          str = !enter ? str + xy2expr(ci, ri) : str;
        }
        this.updateByText(str);
        this.coreSheet.coreInputEditor.startCursorPst = str.length;
        this.updateCursorPstAtTextEl();
        this.parse();
      } else {
        this.selectors.push(args);
        input = `${inputText}${xy2expr(ci, ri)}`;
        this.updateByText(input);
      }
    }
    this.parse(cellEditorComp.cursorPst);
    if (this.selectors.length > 0 || _selector) {
      // const {inputText} = cellEditorComp;
      let inputText = this.editorTextProxy.getText();
      // 处理 合并单元格
      let it = inputText,
        enter = false;
      let { multiCoreMerge } = this.cellEditorComp.coreSheet;
      Object.keys(multiCoreMerge.mergeRangeArray)
        .forEach(i => {
          let m = multiCoreMerge.mergeRangeArray[i];
          const cut = getUniqueRefStrArray(it, true);
          for (let i = 0; i < cut.length; i++) {
            if (cut[i].indexOf(':') !== -1) {
              let a1 = cut[i].split(':')[0];
              let a2 = cut[i].split(':')[1];
              let e1 = expr2xy(a1);
              let e2 = expr2xy(a2);

              if (m.sci >= e1[0] && m.sri >= e1[1] && m.eci <= e2[0] && m.eri <= e2[1]) {
                it = it.replace(new RegExp(cut[i], 'g'), a1);
                enter = true;
              }
            }
          }
        });


      // clearRefSelectors.call(this);
      this.refreshSpanArray(cutting(it), cutting2(it));
      if (enter) {
        setTimeout(() => {
          this.coreSheet.coreInputEditor.startCursorPst = it.length;
          this.updateCursorPstAtTextEl();
        }, 10);
      }
    }
    // step 3.  在enter或者点击的时候写入到cell中
    // dataSetCellText.call(this, input, 'input');
  }

  // =========== 与spanArray有关的逻辑===============
  // 似乎是根据括号位置来更新spanEl，以及suggestComp// todo: 这个方法需要检查
  updateTextFelAndSpanElArray() {
    const curCursorPst = this.coreSheet.coreInputEditor.startCursorPst;
    let curFormula = this.coreSheet.coreInputEditor.curFormula;
    const { exist, left, right } = this.formulaEditBhv.findBracket(curCursorPst - 1, cutting(curFormula), curFormula);
    Object.keys(this.spanElArr)
      .forEach((i) => {
        this.spanElArr[i].css('background-color', 'rgba(255,255,255,0.1)');
      });
    const spanLeft = this.spanElArr[left];
    const spanRight = this.spanElArr[right];
    this.formulaTipComp.hide();
    if (exist && spanLeft && spanRight) {
      spanLeft.css('background-color', 'rgb(229, 229, 229)');
      spanRight.css('background-color', 'rgb(229, 229, 229)');
    } else {
      const { show } = this.suggestComp;
      const content = this.formulaEditBhv.suggestContent(curCursorPst, cutting(curFormula), curFormula);
      if (content.suggestContent && !show) {
        this.formulaTipComp.updateByExpFnName(content.cut, content.pos);
      }
    }
    return curCursorPst;
  };

  // 归属EditorInputComp
  mount2span(spanArr, pos = -1, begin = -1, content = {
    suggestContent: false,
    cut: '',
    pos: -1
  }) {
    if (this.spanElArr === spanArr) { // spanArray 没有发生任何变化
      return;
    }

    const { show } = this.suggestComp;
    if (content.suggestContent && !show) {
      this.formulaTipComp.updateByExpFnName(content.cut, content.pos);
    } else {
      this.formulaTipComp.hide();
    }
    Object.keys(spanArr)
      .forEach((i) => {
        spanArr[i].css('background-color', 'rgba(255,255,255,0.1)');
      });
    if (pos !== '-1' && begin !== -1 && spanArr[pos]) {
      spanArr[pos].css('background-color', '#e5e5e5');
      spanArr[begin].css('background-color', '#e5e5e5');
    }

    if (spanArr.length > 0) {
      this.addSpanToTextFel(spanArr);
    }
    this.spanElArr = spanArr;
  }

  // 增加spanArray
  addSpanToTextFel(spanArr) {
    this.textFel.updateInnerHtml('');
    this.tmp = h('span', 'span_tmp')
      .children(...spanArr)
      .css('top', '0px')
      .css('color', 'black')
      .css('font-size', '14px')
      .css('font-family', 'm-inconsolata,monospace,arial,sans,sans-serif');
    this.textFel.el.insertBefore(this.tmp.el, this.textFel.el.childNodes[0]);
    // this.textFel.el.removeChild(this.textFel.el.childNodes[this.textFel.el.childNodes.length - 1]);
    this.updateCursorPstAtTextEl();
  }

  // 增加spanArray,
  refreshSpanArray(cutArray, cutColorArray) {
    const spanArr = [];
    let begin = -1;
    let end = -1;
    // 初始化spanArray
    Object.keys(cutArray)
      .forEach((curArrayIndex) => {
        const spanEl = h('span', `formula_span${curArrayIndex}`);
        Object.keys(cutColorArray)
          .forEach(() => {
            // 匹配cutColor中的data属性
            if (cutColorArray[curArrayIndex] && cutColorArray[curArrayIndex].code !== -1 && cutColorArray[curArrayIndex].data === cutArray[curArrayIndex]) {
              const { color } = getSelectorColorObj(cutColorArray[curArrayIndex].code);
              spanEl.css('color', color);
            }
          });
        // 更新spanEl
        spanEl.css('display', 'inline-block');
        spanEl.css('cursor', 'text');

        if (cutArray[curArrayIndex] === ' ') {
          spanEl.updateInnerHtml('&emsp;');
        } else {
          spanEl.updateInnerHtml(cutArray[curArrayIndex]);
        }
        spanArr.push(spanEl);
      });

    // 高亮
    let curFormula = this.coreSheet.coreInputEditor.curFormula;
    let content = {
      suggestContent: false,
      cut: ''
    };
    if (curFormula[this.cursorPst - 1] === ')') {
      begin = this.cursorPst - 1;
      end = this.formulaEditBhv.findBracketLeft(cutArray, begin);
    } else {
      content = this.formulaEditBhv.suggestContent(this.cursorPst + 1, cutArray, curFormula);
    }
    if (curFormula !== '' && spanArr.length <= 0) { // 之前的一步spanArray为空
      const spanEl = h('span', 'formula_span');
      spanArr.push(spanEl);
    }
    // 挂载
    this.mount2span(spanArr, begin, end, content);
  }

  // =============== 处理前端事件的函数，以deal为前缀 ==================
  // 按键盘之后唤醒textFel
  dealDocumentTypeChar(evt: KeyboardEvent) {
    if (this.isTextElVisible() || evt.ctrlKey || (evt.shiftKey && evt.keyCode === KEY_CODE_SPACE)) { // 直接使用input事件
      return;
    }
    this.coreSheet.coreInputEditor.updateEditingRangeLTWH();
    this.coreSheet.coreInputEditor.refreshEditingFormatCellByNewFormula(); // 此时初始化的text是空
    // // === 更新各个元素的位置 =========
    this.cellEditorComp.resetByCoreData();
    this.sheetComp.clearInnerClipboard();
    myLog.myPrint(PRINT_LEVEL3, 'document deal key press', evt); // 此后会触发textEl的input事件
  }

  // 按键盘的的事件处理函数； 不会产生字符输入的那些事件
  // 方向键的默认行为就是移动光标
  dealTextFelKeyDownNew(evt: KeyboardEvent) {
    myLog.myPrint(PRINT_LEVEL3, 'textFel deal key down', evt);
    if (evt.keyCode === KEY_CODE_F4) {       // F4键， 绝对引用。todo; 后面有时间需要修复这一块
      let { inputText, pos } = this.editorTextProxy.f4ShortcutKey(this.updateTextFelAndSpanElArray());
      // this.dealInputEvent(null, inputText, inputText); // 应该在input事件中就会触发？
      setTimeout(() => {
        this.coreSheet.coreInputEditor.startCursorPst = pos;
        this.updateCursorPstAtTextEl();
      });
    } else if (evt.keyCode === KEY_CODE_ESC) { // ESC键 放弃编辑
      this.sheetComp.contextMenuComp.hide();
      if (this.sheetComp.cellEditorComp.editorInputComp.isTextElVisible()) {
        this.sheetComp.cellEditorComp.editorInputComp.clearAll();
      }
    }
  }

  // 归属EditorInputComp
  dealTextFelInputNew(evt: InputEvent) { // input事件规范还在草稿中
    // 中文输入法的输入过程中，不会更新editingFormatCell
    if (this.coreSheet.coreInputEditor.isTypingChinese) return;
    // 获取光标位置
    this.coreSheet.coreInputEditor.startCursorPst = this.textFel.getCursorPst();
    let newFormula = this.textFel.el.innerText;
    this.coreSheet.coreInputEditor.updateByNewFormula(newFormula);

    // ============ 判断是否被锁定，以及做语法高亮 ==================
    this.coreSheet.coreInputEditor.updateLockByCursorPst();
    let toSearchStr = '';
    if (this.coreSheet.coreInputEditor.editingFormatCell.editingCalcCell.isStructuralFormula()) {
      let leftPartOfSynUnit = this.coreSheet.coreInputEditor.charPstDetail.getLeftPartOfSynUnit();
      toSearchStr = leftPartOfSynUnit.trim()
        .toUpperCase();
      if (toSearchStr.length > 0) {
        this.suggestComp.searchAndShowByKeyWord(toSearchStr); // 搜索
      }
    } else {
      this.suggestComp.hide();
    }
    myLog.myPrint(PRINT_LEVEL3, 'textFel deal input', evt, {
      newFormula,
      toSearchStr
    }, this.coreSheet.coreInputEditor.editingFormatCell.editingCalcCell.isStructuralFormula()); // 此后会触发textEl的input事件

    // ================ 更新selectors =============
    this.formulaEditBhv.editingSelectors(newFormula);
  }

  // 归属EditorInputComp
  dealInputEvent(evt: InputEvent, insideText = '', formulas = '', state = STATE_INPUT) { // evt比UIEvent还增加了属性
    myLog.myPrint(PRINT_LEVEL3, 'textFel deal input'); // 此后会触发textEl的input事件

    if (this.isTextElVisible() === false) {
      // 此时是Editor第一次展示出来
      this.cellEditorComp.showCellEditorCompOnSelector(); // 此时会跳出component
    }


    if (evt) { // 处理input事件类型
      const {
        inputType,
      } = evt;

      if (inputType === 'insertFromPaste' && !this.isTextElVisible()) {
        this.coreSheet.coreInputEditor.isFromCopyPaste = true;
        return; // Dom中自带事件 https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
      }

      if (inputType === 'historyUndo') {
        return;
      }
    }


    let { editorTextProxy } = this;
    // let inputText = editorTextProxyOLD.getText();

    // if (inputText === '') {
    //     const {data} = this;
    //     const {history} = data;
    //     history.add(data.getData());
    // }

    if (this.coreSheet.coreInputEditor.isTypingChinese) return; // 正在输入中文
    let newFormula = '';
    // 从其他网页中复制黏贴的时候，获取其中的纯文本字符串
    if (insideText === '' && evt && evt.target && evt.target.childNodes) {
      let t1 = '';
      for (let i = 0, len = evt.target.childNodes.length; i < len; i++) {
        if (evt.target.childNodes[i].nodeType === 1) { // div 的noteType是1
          newFormula += evt.target.childNodes[i].innerText;
        } else if (evt.target.childNodes[i].nodeType === 3) { // text的noteType是3
          t1 += evt.target.childNodes[i].nodeValue;
        }
      } // todo: 这里并没有成功地复制黏贴进来
      newFormula = t1 !== '' ? t1 : newFormula; // 是复制html网页，然后黏贴到输入框里面
    } else if (insideText === '' && evt && isHave(evt.data)) {
      newFormula = evt.data !== '' ? evt.data : newFormula;
    } else {
      newFormula = insideText;
    }

    if (this.coreSheet.coreInputEditor.isFromCopyPaste) {
      this.coreSheet.coreInputEditor.isFromCopyPaste = false;
      newFormula = (evt && evt.data) ? evt.data : ''; // 从event.data属性中获取值
      this.textFel.updateInnerHtml(newFormula); // 更新textEl的innerHtml属性
      this.coreSheet.coreInputEditor.startCursorPst = newFormula.length;
      this.updateCursorPstAtTextEl(); // 更新编辑框中的光标位置到this.pos
    }
    // =============== 初始化Editor的逻辑从这里才开始执行 ============
    const { suggestComp, textLineFel, validator } = this;
    let innerText = newFormula;

    // =============== 初始化Editor的逻辑从这里才开始执行 ============
    this.cellEditorComp.changed = true; // 调整changed的状态
    editorTextProxy.setText(`${innerText}`); // 设置数据
    this.coreSheet.coreInputEditor.startCursorPst = this.updateTextFelAndSpanElArray(); // 获取当前光标位置

    if (validator) { // 存在validator的时候
      if (validator.type === 'list') { // 提供自动提示
        suggestComp.searchAndShowByKeyWord(innerText);
      } else {
        suggestComp.hide();
      }
    } else {
      // ============ 判断是否被锁定，以及做语法高亮 ==================
      innerText = innerText + '';
      if (this.cursorPst !== -1) {
        this.coreSheet.coreInputEditor.startCursorPst = this.cursorPst;
        this.coreSheet.coreInputEditor.updateLockByCursorPst(); // 判定是否要锁定
      } else {
        this.coreSheet.coreInputEditor.updateLockByCursorPst();
      }
      let show = false;
      let cutValue = cuttingByPos2(innerText, this.cursorPst, true); // todo: 这个是做什么的？
      if (innerText.length >= this.cursorPst) { // innerText[this.pos]是光标位置对应的字符
        const charBesideCursor = `${innerText[this.cursorPst]}`;
        if (charBesideCursor.search(/^[0-9]+.?[0-9]*$/) !== -1) {
          show = true;
        } else if (charBesideCursor) { // 不为数字
          cutValue += getCurSyntaxUnitUpperCase(innerText, this.cursorPst + 1);
        }
      }
      const start = innerText.lastIndexOf('=');
      if (start === 0 && innerText.length > 1 && cutValue !== '' && !show && cutValue.trim().length > 0) {
        suggestComp.searchAndShowByKeyWord(cutValue); // 搜索cutValue
      } else {
        suggestComp.hide();
      }
    }
    textLineFel.updateInnerHtml(innerText || innerText); // 向这一行插入字符串
    editorTextProxy.setText(newFormula); // 设置字符串
    this.suggestComp.itemIndex = -1;
    const { editingRangeLEWH } = this.coreSheet.coreInputEditor; // 根据editorLTWH来调整位置
    // textLineFel 是用来计算长度的?
    const tlineWidth = this.textLineFel.getElLTWH().width + 9 + TEXTAREA_BORDER_WITH; // todo; 这些 9 与 15 是什么？
    const tableWidth = this.coreSheet.tableViewForEvent.getTableContentPstDetail().width - editingRangeLEWH.left - 9; // 最多贴到table的边界？
    if (tlineWidth > editingRangeLEWH.width && editingRangeLEWH.width !== 0) { // 超过了原有的输入框的宽度
      let textAreaWidth = tlineWidth;
      if (tlineWidth > tableWidth) { // 调整文字框的高度，这样来换行, tlineWidth
        textAreaWidth = tableWidth - TEXTAREA_BORDER_WITH;
        this.textFel.css('height', `100%`); // 调整高度
      }
      this.textFel.css('width', `${textAreaWidth}px`); // 调整宽度
    } // 重设边框的大小，可能因为输入更多的文字而变大
    if (innerText && innerText[0] !== '=') {
      this.updateCursorPstAtTextEl();
    }
    this.cellEditorComp.change(STATE_INPUT, innerText); // 调用change
    this.cellEditorComp.show();
  }

  // 这个是
  clearAll() {
    this.cellEditorComp.show(false); // 消失掉
    this.clearWholeInput();
    // 已经转移
    this.clearRefSelectors(); // 去掉语法高亮
  }

  clearRefSelectors() {
    let sheetComp = this.sheetComp;
    sheetComp.selectorsEl.updateInnerHtml('');
    sheetComp.refSelectors = [];
    sheetComp.selectorContainerComp.el.updateDisplayToBlock();
    this.coreSheet.coreInputEditor.lock = false;
  }

  // suggest选项被选中的事件处理
  dealSuggestItemClickNew(itemDetail: ItemDetail) {
    // 首先关闭推荐选项
    this.suggestComp.hide();

    // 1. 变更公式与光标位置
    this.coreSheet.coreInputEditor.updateFormulaAndCursorByReplaceStringAtCharPst(itemDetail.key + '(');
    // 2. 更新
    // let inputText = editorTextProxy.getText();
    const curCursorPst = this.coreSheet.coreInputEditor.startCursorPst;
    let curFormula = this.coreSheet.coreInputEditor.curFormula;
    // 3.高亮括号
    const { exist, left, right } = this.formulaEditBhv.findBracket(curCursorPst - 1, curFormula); // 寻找括号的左边与右边
    Object.keys(this.spanElArr)
      .forEach((i) => {
        this.spanElArr[i].css('background-color', 'rgba(255,255,255,0.1)');
      });
    const spanLeft = this.spanElArr[left];
    const spanRight = this.spanElArr[right];
    this.formulaTipComp.hide();
    if (exist && spanLeft && spanRight) {
      spanLeft.css('background-color', 'rgb(229, 229, 229)');
      spanRight.css('background-color', 'rgb(229, 229, 229)');
    } else {
      this.refreshFormulaTipComp(curCursorPst, curFormula);
    }
    // const begin = this.cursorPst - cuttingByPos(inputText, this.cursorPst).length;
    // const c = getCurSyntaxUnitUpperCase(inputText, this.cursorPst + 1);
    // const arr = ['', ''];
    // const end = this.cursorPst + c.length;
    // for (let i = 0; i < inputText.length; i++) {
    //   if (i < begin) {
    //     arr[0] += inputText[i];
    //   }
    //
    //   if (i > end - 1) {
    //     arr[1] += inputText[i];
    //   }
    // }
    // inputText = editorTextProxy.setText(`${arr[0] + itemDetail.key}(`);
    // // this.inputText = `${arr[0] + itemDetail.key}(`;
    // this.coreSheet.coreInputEditor.startCursorPst = editorTextProxy.getText().length;
    // inputText = editorTextProxy.setText(inputText + `)${arr[1]}`);
    // // this.inputText += `)${arr[1]}`;
    // this.textFel.updateInnerHtml(inputText);
    this.textFel.updateInnerHtml(curFormula);
    this.textLineFel.updateInnerHtml(curFormula);
    // this.coreSheet.coreInputEditor.startCursorPst = this.cursorPst;
    this.coreSheet.coreInputEditor.updateLockByCursorPst();
    // this.cellEditorComp.change('input', inputText);
    this.updateCursorPstAtTextEl();
    this.updateTextElementSize();
  }


  refreshFormulaTipComp(curCursorPst, curFormula) {
    // 1. 获取光标所在位置的函数名
    // 2. 获取光标所在位置在对应函数中所处的para位置
    // 3. 显示相应的formulaTip
    const content = this.formulaEditBhv.suggestContent(curCursorPst, cutting(curFormula), curFormula);
    if (content.suggestContent) {
      this.formulaTipComp.updateByExpFnName(content.cut, content.pos);
    }
    myLog.myPrint(PRINT_LEVEL3, content);
  }

// suggest选项被选中的事件处理
  dealSuggestItemClickOld(itemDetail: ItemDetail) {
    const { validator, editorTextProxy } = this;
    let inputText = editorTextProxy.getText();
    this.coreSheet.coreInputEditor.startCursorPst = this.updateTextFelAndSpanElArray();
    const begin = this.cursorPst - cuttingByPos(inputText, this.cursorPst).length;
    const c = getCurSyntaxUnitUpperCase(inputText, this.cursorPst + 1);
    const arr = ['', ''];
    const end = this.cursorPst + c.length;
    for (let i = 0; i < inputText.length; i++) {
      if (i < begin) {
        arr[0] += inputText[i];
      }

      if (i > end - 1) {
        arr[1] += inputText[i];
      }
    }
    inputText = editorTextProxy.setText(`${arr[0] + itemDetail.key}(`);
    // this.inputText = `${arr[0] + itemDetail.key}(`;
    this.coreSheet.coreInputEditor.startCursorPst = editorTextProxy.getText().length;
    inputText = editorTextProxy.setText(inputText + `)${arr[1]}`);
    // this.inputText += `)${arr[1]}`;
    this.textFel.updateInnerHtml(inputText);
    this.textLineFel.updateInnerHtml(inputText);
    this.suggestComp.hide();
    this.coreSheet.coreInputEditor.startCursorPst = this.cursorPst;
    this.coreSheet.coreInputEditor.updateLockByCursorPst();
    this.cellEditorComp.change('input', inputText);
    this.updateCursorPstAtTextEl();
    this.updateTextElementSize();
  }

  // 归属EditorInputComp


}
