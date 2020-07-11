import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import zhCN from '../../locale/zh-cn';
import { SheetComp } from './sheet_comp';
import { h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { locale } from '../../locale/locale';

// import Vue from 'vue';

/**
 * 最终对外暴露的类
 */
export class SpreadsheetComp {
  coreSheet: CoreSheet;
  data: CoreSheet;
  sheetComp: SheetComp  // 核心功能在其中
  constructor(targetElOrName, coreSheet) {
    this.locale('zh-cn', zhCN); // 语言配置需要首先配置
    // 先创建数据层
    this.coreSheet = coreSheet
    // 再创建组件
    this.targetEl = this.initTargetEl(targetElOrName);
    this.rootFel = this.initSheetRootFel();
    this.sheetComp = new SheetComp(this.rootFel, this.coreSheet);
    // this.initFinancialCellFooter() // todo: 要脱离Vue重写
    // 兼容，未来会慢慢替换为coreSheet
    this.data = this.coreSheet;
    // 语言配置
  }

  initTargetEl(targetElOrName) {
    if (typeof targetElOrName === 'string') {
      targetElOrName = document.querySelector(targetElOrName);
    }
    return targetElOrName;
  }

  initSheetRootFel() {
    let rootFel = h('div', `${CSS_PREFIX}`)
      .on('contextmenu', evt => evt.preventDefault());
    this.targetEl.appendChild(rootFel.el);
    return rootFel;
  }

  setDataSettings(value) {
    this.coreSheet.coreSheetSetting.showEditor = value;
  }

  loadData(data) {
    this.sheetComp.initLoadData(data);
    return this;
  }

  getData() {
    return this.coreSheet.getWorkbookServerObj();
  }

  validate() {
    const {validations} = this.data;
    return validations.errors.size <= 0;
  }

  addPostChangeDataFunc(cb) {
    this.coreSheet.postChangeData = cb;
    return this;
  }

  static locale(lang, message) {
    locale(lang, message);
  }

  locale(lang, message) {
    locale(lang, message);
  }

  // getEditorStatus() {
  //     let {editor} = this.belongSheet;
  //     let { ri, ci, pos} = editor;
  //     let inputText = editor.editorText.getText();
  //
  //     return  {
  //         "cellStatus": editor.isDisplay(),
  //         "inputText": inputText,
  //         "ri": ri,
  //         "ci": ci,
  //         "pos": pos,
  //     };
  // }

  // setEditorText(text = '', pos = 1) {
  //     let {editor} = this.belongSheet;
  //     text = text !== '' ? text : '=';
  //     editor.dealInputEvent(text, pos, true);
  // }
  //
  // setTextEnd(cell, ri, ci) {
  //     let {editor, data} = this.belongSheet;
  //     editor.setInnerTextByCellOld({
  //         text: cell.text,
  //         formulas: cell.formulas
  //     });
  //     data.setCellAll(ri, ci, cell.formulas + "", cell.formulas + "", '');
  //
  //     this.belongSheet.selectorEditorReset(ri, ci);
  //
  //     setTimeout(() => {
  //         editor.setCursorPos(cell.formulas.length);
  //     }, 100)
  // }

  insertRows(len) {
    this.sheetComp.insertRows(len);
  }

  /**
   * 利用Vue来 添加组件 todo: 这个组件之后脱离vue的依赖来做
   * @return {{msg: string, maxRows: number, total: number, inputValue: number}}
   */
  initFinancialCellFooter() {
    let theSpreadSheet = this;
    let CompFooter = Vue.extend({
      template: `<div id="foot-container" @click.stop @mousedown.stop @mouseup.stop @keydown.stop @keyup.stop @copy.stop @paste.stop
             style="height: 1000px; display: none; width: 100%; position: absolute; ">
                  <div style="color: #222; float: left; padding: 6px 0 0 45px; direction: ltr;">
                      <div @click.stop="textInputClick"
                           class="foot-container-btn"
                           style="display: inline-block; -webkit-box-shadow: none;-moz-box-shadow: none;box-shadow: none; font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-weight: 500; background-color: #f5f5f5;-webkit-border-radius: 2px;-moz-border-radius: 2px;border-radius: 2px;cursor: default;font-size: 11px;font-weight: bold;text-align: center;white-space: nowrap;margin-right: 16px;height: 27px;line-height: 27px;min-width: 54px;outline: 0px;padding: 0 8px;background-image: -webkit-linear-gradient(top,#f5f5f5,#f1f1f1);background-image: -moz-linear-gradient(top,#f5f5f5,#f1f1f1);background-image: -ms-linear-gradient(top,#f5f5f5,#f1f1f1);background-image: -o-linear-gradient(top,#f5f5f5,#f1f1f1);background-image: linear-gradient(top,#f5f5f5,#f1f1f1);color: #333;border: 1px solid #dcdcdc;border: 1px solid rgba(0,0,0,0.1);">
                          添加
                      </div>
                      <input class="textinput addRowsInput" type="text" v-model="inputValue"
                             style="-webkit-border-radius: 1px; width: 60px; width: 60px; -moz-border-radius: 1px; border-radius: 1px; border: 1px solid #d9d9d9; border-top: 1px solid #c0c0c0; font-size: 13px; height: 25px; padding: 1px 8px;"
                             aria-label="要添加的行数">
                      <div class="addRowsText goog-inline-block"
                           style="display: inline-block; color: #000000; padding-top: 5px; vertical-align: middle; font-weight: normal; font-size: 13px;">
                          行（在底部添加）。
                      </div>
                      <div v-if="msg !== ''" class="addRowsText goog-inline-block"
                           style="display: inline-block; color: red; font-weight: 500; padding-top: 5px; vertical-align: middle; font-weight: normal; font-size: 13px;">
                          {{msg}}
                      </div>
                  </div>
              </div>`,
      data() {
        return {
          inputValue: 10,
          msg: '',
          maxRows: 0,
          total: 5000,
        };
      },
      methods: {
        textInputClick() {
          if (isNaN(this.inputValue)) {
            this.msg = '请输入数字';
            return;
          }
          this.maxRows = this.total - theSpreadSheet.data.coreRows.len;
          if (this.maxRows <= 0) {
            this.msg = '超出最大单元格数量';
            return;
          }

          if (this.inputValue * 1 > this.maxRows) {
            this.msg = '请输入' + this.maxRows + '行内的数值';
            return;
          }

          theSpreadSheet.insertRows(this.inputValue);
          this.msg = '';
        },
      }
    });
    // let sheet = this.sheet['el'];
    let fc = this.sheetComp.overlayerEl.el;
    let footCompDom = new CompFooter().$mount();
    // this.sheetComp.footFel = footCompDom.$el;
    fc.appendChild(footCompDom.$el);
  }


  getText(alias, inputText, pos) {
    let { refSelectors, data, tableComp } = this.sheetComp;
    let text = '';
    for (let i = 0; i < refSelectors.length; i++) {
      let { selectingExpr } = refSelectors[i];
      text += erpx;
    }

    return data.getCellByExpr(text, tableComp, alias, inputText, pos);
  }

  removeEvent() {
    this.sheetComp.removeEvent();
  }
}
