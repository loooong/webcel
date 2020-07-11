import { bind, bindMouseMoveThenUpFunc, bindTouch } from '../utils/event_helper';
import { expr2xy } from '../../global_utils/alphabet';
import { cuttingByPos, getUniqueRefStrArray } from '../comp_cell_editor/ref_selector_control_old';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { getFontSizePxByPt } from '../../core/core_utils/font';
import {
  KEY_CODE_A,
  KEY_CODE_B,
  KEY_CODE_BACKSPACE,
  KEY_CODE_C,
  KEY_CODE_DELETE,
  KEY_CODE_DOWN_ARROW,
  KEY_CODE_ENTER,
  KEY_CODE_ESC,
  KEY_CODE_F2,
  KEY_CODE_I,
  KEY_CODE_LEFT_ARROW,
  KEY_CODE_RIGHT_ARROW,
  KEY_CODE_SPACE,
  KEY_CODE_TAB,
  KEY_CODE_U,
  KEY_CODE_UP_ARROW,
  KEY_CODE_V,
  KEY_CODE_X,
  KEY_CODE_Y,
  KEY_CODE_Z,
  POINT_EVENTS_AUTO,
  POINT_EVENTS_NONE
} from '../utils/config';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { isCalcResError } from '../../global_utils/func_for_calc_core';
import { myLog, PRINT_LEVEL3 } from '../../log/new_log';
import {ArrowMoveSelectorDealer,EnterMoveSelectorDealer, ShiftArrowMoveSelectorDealer, TabMoveSelectorDealer
} from '../../core/core_data_proxy/dealer_move_selector';

export class SheetEventDealer {
  sheetComp: SheetComp;
  coreSheet: CoreSheet;

  constructor(sheetComp) {
    this.sheetComp = sheetComp;
    this.coreSheet = this.sheetComp.coreSheet;
  }

  loadFormula() {
    console.log('loadFormula 需要重写！ src/component/sheet.js');

  }

  /**
   * 这个应该是通过鼠标点击与选中来变更编辑框中的输入, todo: 需要重构
   * @param coreSheet
   * @param cellEditorComp
   * @param evt
   */
  changeReferByMouse(coreSheet: CoreSheet, cellEditorComp, evt) {
    let _selector = null;
    let change = 0;
    bindMouseMoveThenUpFunc(window,
      (e) => { // 鼠标按住之后，然后移动执行的函数
        let relativeXYDetailC = this.sheetComp.overlayComp.getRelativeXYDetail(e, 1);
        this.sheetComp.picContainer.css('pointer-events', POINT_EVENTS_NONE);
        if (_selector && _selector.selectorCompInDetail) {
          _selector.selectorCompInDetail.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_NONE);
        }

        let enter = true;
        let { multiCoreMerge } = coreSheet; // 处理合并单元格
        // let {inputText} = cellEditorComp;
        let inputText = this.coreSheet.coreInputEditor.editorTextProxyOLD.getText();
        let it = inputText;

        Object.keys(coreSheet.multiCoreMerge.mergeRangeArray)
          .forEach(i => {
            let m = coreSheet.multiCoreMerge.mergeRangeArray[i];
            const cut = getUniqueRefStrArray(it, true);
            for (let i = 0; i < cut.length; i++) {
              if (cut[i].indexOf(':') !== -1) {
                let a1 = cut[i].split(':')[0];
                let a2 = cut[i].split(':')[1];
                let e1 = expr2xy(a1);
                let e2 = expr2xy(a2);

                if (m.sci >= e1[0] && m.sri >= e1[1] && m.eci <= e2[0] && m.eri <= e2[1]) {
                  enter = false;
                }
              }
            }
          });

        if (enter) {
          if (e.buttons === 1 && !e.shiftKey) {
            let { ri, ci } = coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
            if (_selector && _selector.selectorCompInDetail) {
              _selector = this.sheetComp.cellEditorComp.editorInputComp.formulaEditBhv.makeSelector(ri, ci, this.sheetComp.refSelectors, true, _selector.selectorCompInDetail, true);
              this.sheetComp.cellEditorComp.editorInputComp.lockCells(evt, _selector);
              this.sheetComp.mergeSelector = true;
            } else {
              let inputText = this.coreSheet.coreInputEditor.editorTextProxyOLD.getText();
              for (let i = 0; i < this.sheetComp.refSelectors.length; i++) {
                let selector = this.sheetComp.refSelectors[i];
                let { selectingExpr } = selector;

                if (selectingExpr === cuttingByPos(inputText, this.coreSheet.coreInputEditor.startCursorPst)) {
                  _selector = selector;
                  change = 1;
                  _selector.selectorCompInDetail.set(ri, ci, true);
                  break;
                }
              }

              _selector = _selector ? _selector : this.sheetComp.cellEditorComp.editorInputComp.formulaEditBhv.makeSelector(ri, ci, this.sheetComp.refSelectors, true, null, false);
            }
          }
        }
      },
      () => {
        this.sheetComp.picContainer.css('pointer-events', POINT_EVENTS_AUTO);
        if (_selector && _selector.selectorCompInDetail) {
          _selector.selectorCompInDetail.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_AUTO);
        }

        if (this.sheetComp.mergeSelector === false) {
          if (_selector && !change) {
            this.sheetComp.refSelectors.push(_selector);
          }
          this.sheetComp.cellEditorComp.editorInputComp.lockCells(evt, _selector);
        } else if (_selector && !change && _selector.selectorCompInDetail) {
          this.sheetComp.refSelectors.push(_selector);
        }
        if (_selector) {
          for (let i = 0; i < this.sheetComp.refSelectors.length; i++) {
            let selector = this.sheetComp.refSelectors[i];

            if (selector.className === _selector.className) {
              selector.selectingExpr = _selector.selectingExpr;
              break;
            }
          }
        }
        _selector = null;
        change = 0;
        this.sheetComp.mergeSelector = false;
      });
  }

  addEventKeyDown(window) {
    bind(window, 'keydown', evt => {
      this.dealWindowKeyDown(evt);
    });
  }

  dealWindowKeyDown(evt: KeyboardEvent) {
    // 在textInput组件中的keydown事件不会传递到这里来
    myLog.myPrint(PRINT_LEVEL3, evt);
    const { key, ctrlKey, shiftKey, metaKey, keyCode } = evt;
    // ===============  应该是选中的一个pic ===================
    if (ctrlKey || metaKey) {
      this.dealCtrlKeyPlusOtherKeyCode(keyCode, shiftKey);
      evt.preventDefault();
    } else if (this.dealKeyCodeWithOutCtrlForMoveSelector(keyCode, shiftKey)) {
      evt.preventDefault();
    } else if (keyCode === KEY_CODE_DELETE) { // 把selector范围内的内容都删除
      this.sheetComp.insertDeleteRowColumn('delete-cell-text');
      evt.preventDefault();
    } else if (keyCode === KEY_CODE_F2) { // F2
      this.sheetComp.sheetOperationDealer.sheetComp.cellEditorComp.dealBeginEditFromOldCell();
    } else if (keyCode === KEY_CODE_BACKSPACE) { // 弹出editor，然后把editor中的内容都删除
      this.coreSheet.coreInputEditor.refreshEditingFormatCellByNewFormula();
      this.sheetComp.cellEditorComp.resetByCoreData();
      this.sheetComp.clearInnerClipboard();
    }
  }

  dealCtrlKeyPlusOtherKeyCode(keyCode, shiftKey) {
    // ===============  按住了ctrl 键 ===================
    // const { sIndexes, eIndexes } = selector;
    // let what = 'all';
    // if (shiftKey) what = 'text';
    // if (altKey) what = 'format';
    switch (keyCode) {
      case KEY_CODE_Z:
        // undo: ctrl + z
        this.sheetComp.undo();
        break;
      case KEY_CODE_Y:
        // redo: ctrl + y
        this.sheetComp.redo();
        break;
      case KEY_CODE_C:
        // ctrl + c
        //  加上这里是因为 需要展示虚线
        if (this.sheetComp.copyBhv.getChooseImg()) {
          return;
        }
        this.sheetComp.copy();
        // table.render();
        // sheetReset.call(this.sheetComp);
        break;
      case KEY_CODE_X:
        // ctrl + x
        this.sheetComp.cut();
        break;
      case KEY_CODE_U:
        // ctrl + u
        this.sheetComp.toolbarComp.trigger('underline');
        break;
      case KEY_CODE_V:
        // ctrl + v
        // paste.call(this.sheetComp, what, () => {
        // });
        break;
      case KEY_CODE_B:
        // ctrl + B
        this.sheetComp.toolbarComp.trigger('font-bold');
        break;
      case KEY_CODE_I:
        // ctrl + I
        this.sheetComp.toolbarComp.trigger('font-italic');
        break;
      default:
        break;
    }
    if (shiftKey === false && keyCode === KEY_CODE_A) { // 全选
      // 全选
      if (this.sheetComp.cellEditorComp.editorInputComp.isTextElVisible()) {
        return;
      }
      this.coreSheet.coreSelector.updateByNegativeRiCi(-1, -1);
      this.sheetComp.selectorContainerComp.updateSelfByCoreSelector();
    } else if (shiftKey === false && this.isArrowKeyCode(keyCode)) {
      if (keyCode === KEY_CODE_UP_ARROW) {
        this.coreSheet.coreSelector.updateByFirstSelectCell(this.coreSheet.tableViewForEvent.getMinMaxRowID(0), this.coreSheet.coreSelector.ciOfEditingCell);
        this.coreSheet.coreScrollBarProxy.updateByScrollY(0);
        this.sheetComp.verticalScrollbar.updateByCoreScrollPst();
      } else if (keyCode === KEY_CODE_DOWN_ARROW) {
        this.coreSheet.coreSelector.updateByFirstSelectCell(this.coreSheet.tableViewForEvent.getMinMaxRowID(1), this.coreSheet.coreSelector.ciOfEditingCell);
        this.coreSheet.coreScrollBarProxy.updateByScrollY(this.coreSheet.coreScrollBarProxy.getMaxScrollY());
        this.sheetComp.verticalScrollbar.updateByCoreScrollPst();
      } else if (keyCode === KEY_CODE_LEFT_ARROW) {
        this.coreSheet.coreSelector.updateByFirstSelectCell(this.coreSheet.coreSelector.riOfEditingCell, this.coreSheet.tableViewForEvent.getMinMaxColID(0));
        this.coreSheet.coreScrollBarProxy.updateByScrollX(0);
        this.sheetComp.horizontalScrollbar.updateByCoreScrollPst();
      } else if (keyCode === KEY_CODE_RIGHT_ARROW) {
        this.coreSheet.coreSelector.updateByFirstSelectCell(this.coreSheet.coreSelector.riOfEditingCell, this.coreSheet.tableViewForEvent.getMinMaxColID(1));
        this.coreSheet.coreScrollBarProxy.updateByScrollX(this.coreSheet.coreScrollBarProxy.getMaxScrollX());
        this.sheetComp.horizontalScrollbar.updateByCoreScrollPst();
      }
    } else if (shiftKey && this.isArrowKeyCode(keyCode)) { // ctrl+shift+Arrow
      if (keyCode === KEY_CODE_UP_ARROW) {
        this.coreSheet.coreSelector.updateByLastSelectRi(this.coreSheet.tableViewForEvent.getMinMaxRowID(0));
        this.coreSheet.coreScrollBarProxy.updateByScrollY(0);
        this.sheetComp.verticalScrollbar.updateByCoreScrollPst();
      } else if (keyCode === KEY_CODE_DOWN_ARROW) {
        this.coreSheet.coreSelector.updateByLastSelectRi(this.coreSheet.tableViewForEvent.getMinMaxRowID(1));
        this.coreSheet.coreScrollBarProxy.updateByScrollY(this.coreSheet.coreScrollBarProxy.getMaxScrollY());
        this.sheetComp.verticalScrollbar.updateByCoreScrollPst();
      } else if (keyCode === KEY_CODE_LEFT_ARROW) {
        this.coreSheet.coreSelector.updateByLastSelectCi(this.coreSheet.tableViewForEvent.getMinMaxColID(0));
        this.coreSheet.coreScrollBarProxy.updateByScrollX(0);
        this.sheetComp.horizontalScrollbar.updateByCoreScrollPst();
      } else if (keyCode === KEY_CODE_RIGHT_ARROW) {
        this.coreSheet.coreSelector.updateByLastSelectCi(this.coreSheet.tableViewForEvent.getMinMaxColID(1));
        this.coreSheet.coreScrollBarProxy.updateByScrollX(this.coreSheet.coreScrollBarProxy.getMaxScrollX());
        this.sheetComp.horizontalScrollbar.updateByCoreScrollPst();
      }
    }

  }

  dealKeyCodeWithOutCtrlForMoveSelector(keyCode, shiftKey) {
    if (shiftKey && this.isArrowKeyCode(keyCode)) {
      new ShiftArrowMoveSelectorDealer(this.sheetComp).easyDealMoveSelector(shiftKey, keyCode)
      return true;
    } else if(this.isArrowKeyCode(keyCode)){ // 不带shift的方向键
      new ArrowMoveSelectorDealer(this.sheetComp).easyDealMoveSelector(shiftKey, keyCode)
      return true;
    }else if (keyCode === KEY_CODE_TAB) {
      new TabMoveSelectorDealer(this.sheetComp).easyDealMoveSelector(shiftKey, keyCode);
      return true;
    } else if (keyCode === KEY_CODE_ENTER) {
      new EnterMoveSelectorDealer(this.sheetComp).easyDealMoveSelector(shiftKey, keyCode)
      return true;
    } else if (shiftKey && keyCode === KEY_CODE_SPACE) { // 如果textEl显示的话则不能执行;crtl+space是选择一整列
      // shift + space, all cells in col
      this.coreSheet.coreSelector.updateBySelectAllCol();
      this.sheetComp.selectorContainerComp.updateSelfAndToolBarByCoreSelector();
      return true;
    }
    return false;
  }

  isArrowKeyCode(keyCode) {
    return [KEY_CODE_UP_ARROW, KEY_CODE_DOWN_ARROW, KEY_CODE_LEFT_ARROW, KEY_CODE_RIGHT_ARROW].includes(keyCode);
  }

  getShiftArrayByArrowKeyCode(keyCode) {
    let shiftArray = [0, 0];
    if (keyCode === KEY_CODE_UP_ARROW) {
      shiftArray = [-1, 0];
    } else if (keyCode === KEY_CODE_DOWN_ARROW) {
      shiftArray = [1, 0];
    } else if (keyCode === KEY_CODE_LEFT_ARROW) {
      shiftArray = [0, -1];
    } else if (keyCode === KEY_CODE_RIGHT_ARROW) {
      shiftArray = [0, 1];
    }
    return shiftArray;
  }

  addEventForTouch() {
    let compSheet = this.sheetComp;
    // slide on mobile
    bindTouch(compSheet.overlayerEl.el, {
      move: (direction, d) => {
        this.overlayerTouch(direction, d);
      }
    });

  }

  /**
   * 调整advice 元素的位置
   */
  resetAdviceComp() { // 已经转移
    const rect = this.sheetComp.coreSheet.tableViewForEvent.getRangePstLTHW(this.sheetComp.coreSheet.coreSelector.selectedCoreRange);
    let left = rect.left + rect.width + 60;
    let top = rect.top + rect.height + 31;

    this.sheetComp.advice.el.el.style['top'] = `${top}px`;
    this.sheetComp.advice.el.el.style['left'] = `${left}px`;
  }

  /**
   * 对滚动条的操作
   */
  scrollbarMove() {
    const {
      coreSheet, verticalScrollbar, horizontalScrollbar,
    } = this.sheetComp;
    const {
      l, t, left, top, width, height,
    } = coreSheet.tableViewForEvent.getRangePstLTHW(coreSheet.coreSelector.selectedCoreRange);
    const tableOffset = this.coreSheet.tableViewForEvent.getTableContentPstDetail();

    if (Math.abs(left) + width > tableOffset.width) {
      horizontalScrollbar.updateByScrollValue({ left: l + width - tableOffset.width });
    } else {
      const fsw = coreSheet.tableViewForEvent.getFreezeLeft();
      if (left < fsw) {
        horizontalScrollbar.updateByScrollValue({ left: l - 1 - fsw });
      }
    }
    if (Math.abs(top * 1) + height > tableOffset.height) {
      verticalScrollbar.updateByScrollValue({ top: t + height - tableOffset.height - 1 });
    } else {
      const fsh = coreSheet.tableViewForEvent.getFreezeTop();
      if (top < fsh) {
        verticalScrollbar.updateByScrollValue({ top: t - 1 - fsh });
      }
    }
  }

  /**
   * 处理鼠标点击滚动条
   * @param direction
   * @param distance
   */
  overlayerTouch(direction, distance) {
    const { verticalScrollbar, horizontalScrollbar } = this.sheetComp;
    const { top } = verticalScrollbar.getScrollLeftTop();
    const { left } = horizontalScrollbar.getScrollLeftTop();
    if (direction === 'left' || direction === 'right') {
      horizontalScrollbar.updateByScrollValue({ left: left - distance });
    } else if (direction === 'up' || direction === 'down') {
      verticalScrollbar.updateByScrollValue({ top: top - distance });
    }
  }

  /**
   * 移动垂直或水平的滚动条
   * @param upOrDownOrLeftOrRight
   */
  moveScrollbarByOrient(upOrDownOrLeftOrRight) {
    let verticalScrollbar = this.sheetComp.verticalScrollbar;
    let horizontalScrollbar = this.sheetComp.horizontalScrollbar;
    let coreRows = this.sheetComp.coreSheet.coreRows;
    let coreCols = this.sheetComp.coreSheet.coreCols;

    if (Math.round(Math.random()) !== 1) { // 滚动带有随机性？挺新奇的。
      return;
    }
    let ri = 0,
      ci = 0;
    if (upOrDownOrLeftOrRight === 1) { // 下
      const { top } = verticalScrollbar.getScrollLeftTop();  // 可见视图上边缘距离toolbar的像素
      ri = this.sheetComp.coreSheet.coreScrollBarProxy.scrollRi + 1;
      verticalScrollbar.updateByScrollValue({ top: top + coreRows.ensureGetRowHeightByRi(ri) - 1 });
    } else if (upOrDownOrLeftOrRight === 0) { // 上
      const { top } = verticalScrollbar.getScrollLeftTop();
      ri = this.sheetComp.coreSheet.coreScrollBarProxy.scrollRi - 1;

      verticalScrollbar.updateByScrollValue({ top: ri === 0 ? 0 : top - coreRows.ensureGetRowHeightByRi(ri) });
    } else if (upOrDownOrLeftOrRight === 3) { // 左
      const { left } = horizontalScrollbar.getScrollLeftTop();
      ci = this.sheetComp.coreSheet.coreScrollBarProxy.scrollCi + 1;
      horizontalScrollbar.updateByScrollValue({ left: left + coreCols.ensureGetWidthByColID(ci) });
    } else if (upOrDownOrLeftOrRight === 2) { // 右
      const { left } = horizontalScrollbar.getScrollLeftTop();
      ci = this.sheetComp.coreSheet.coreScrollBarProxy.scrollCi - 1;
      horizontalScrollbar.updateByScrollValue({ left: left - coreCols.ensureGetWidthByColID(ci) });
    }
  }

  pictureSetOffset() {
    const { coreSheet } = this.sheetComp;
    let { pictureOffsetLeft, pictureOffsetTop } = this.sheetComp;


    this.sheetComp.coreSheet.pasteDirectionsArr.forEach(i => {
      const sOffset = coreSheet.tableViewForEvent.getRangePstLTHW(i.range);

      i.img.el.style['top'] = `${sOffset.top + pictureOffsetTop + i.number * 15 + i.offsetTop}px`;
      i.img.el.style['left'] = `${sOffset.left + pictureOffsetLeft + i.number * 15 + i.offsetLeft}px`;
    });
  }


  /**
   * 选择框移动
   * @param orien
   */
  selectorBeyondMove(orien) {
    if (orien === 2) {   //往下
      this.moveScrollbarByOrient(1);
    } else if (orien === 6) {    // 往上
      this.moveScrollbarByOrient(2);
    } else if (orien === 3) {        //往右
      this.moveScrollbarByOrient(4);
    } else if (orien === 5) {    // 往左
      this.moveScrollbarByOrient(3);
    } else if (orien === 1) { // 往下往右
      this.moveScrollbarByOrient(1);
      this.moveScrollbarByOrient(4);
    } else if (orien === 7) {         // 往下往左
      this.moveScrollbarByOrient(1);
      this.moveScrollbarByOrient(3);
    } else if (orien === 8) {     // 往上往右
      this.moveScrollbarByOrient(2);
      this.moveScrollbarByOrient(4);
    } else if (orien === 4) {       // 往上往左
      this.moveScrollbarByOrient(2);
      this.moveScrollbarByOrient(3);
    }
  }

  /**
   * 触发筛选
   */
  autofilter() {
    const { coreSheet } = this;
    coreSheet.changeRunAutoFilter();
    this.sheetComp.sheetReset();
  }

// 与冻结单元格有关的逻辑
  /**
   * 设定冻结视图
   */
  sheetFreeze() {
    const [ri, ci] = this.sheetComp.coreSheet.tableViewForEvent.freezeRiCi;
    if (ri > 0 || ci > 0) {
      const fwidth = this.sheetComp.coreSheet.tableViewForEvent.getFreezeLeft();
      const fheight = this.sheetComp.coreSheet.tableViewForEvent.getFreezeTop();
      this.sheetComp.cellEditorComp.setFreezeLengths(fwidth, fheight);
    }
    this.sheetComp.selectorContainerComp.updateSelfByCoreSelector();
  }

  /**
   * 自动调整高度与宽度, todo: 似乎有问题
   */
  renderAutoAdapt() { // todo:
    let table = this.sheetComp.tableComp;
    let coreSheet = this.sheetComp.coreSheet;
    const viewRange = coreSheet.tableViewForEvent.getPotentialViewRangeOld();
    let { autoAdapt } = coreSheet.coreSheetSetting.toolBarStyle;
    let viewWidth = 0;

    if (autoAdapt) {
      viewRange.applyEveryRiCi((ri, ci) => {
        let txt = table.getCellTextContent(ri, ci);
        const dbox = table.getDrawBox(ri, ci);

        if (txt !== undefined) {
          const style = table.getCellTextStyle(ri, ci);
          const font = Object.assign({}, style.font);
          font.size = getFontSizePxByPt(font.size);
          // 得到当前文字最宽的width
          let txtWidth = null;
          if (style.format !== undefined) {
            // txtWidth = table.tableCanvasComp.getTextTotalWidth(formatm[style.format].render(txt), font, dbox);

          } else {
            txtWidth = table.tableCanvasComp.getTextTotalWidth(txt, font);
          }
          if ((table.autoAdaptList[ci] === undefined || table.autoAdaptList[ci] < txtWidth)) {
            table.autoAdaptList[ci] = txtWidth;
          }
        }
      });
      if (table.autoAdaptList.length < 0) {
        return;
      }
      let { ignore } = coreSheet.coreSheetSetting;
      for (let i = 0; i < table.autoAdaptList.length; i++) {
        let _ignore = false;
        for (let j = 0; j < ignore.length; j++) {
          if (i === ignore[j]) _ignore = true;
        }
        if (_ignore === false) {
          if (table.autoAdaptList[i] === undefined) {
            viewWidth += 50;
            coreSheet.coreCols.setWidth(i, 50);
          } else {
            if (table.autoAdaptList[i] < 30) {
              table.autoAdaptList[i] = 30;
            }
            coreSheet.coreCols.setWidth(i, table.autoAdaptList[i]);
          }
        }
        viewWidth += table.autoAdaptList[i];

      }
      if (viewWidth > 0) {
        coreSheet.coreSheetSetting.cellWidth = () => viewWidth;
      }
    }
  }

  /**
   * 自动调整高度
   */
  autoRowResizer() {
    let table = this.sheetComp.tableComp;
    let coreSheet = this.sheetComp.coreSheet;

    let viewRange = coreSheet.tableViewForEvent.getPotentialViewRangeOld();
    let record_rc = 0,
      max = 0;
    let r_h = coreSheet.coreSheetSetting.rowConfig.headerHeight;
    let { autoAdapt } = coreSheet.coreSheetSetting.toolBarStyle;
    let viewHeight = 0;

    if (autoAdapt) {
      viewRange.applyEveryRiCi((ri, ci) => {
        const txt = table.getCellTextContent(record_rc, ci);
        const style = table.getCellTextStyle(ri, ci);
        const font = Object.assign({}, style.font);
        font.size = getFontSizePxByPt(font.size);
        const dbox = table.getDrawBox(record_rc, ci);
        // 1. 自适应调整一行的高度
        // 2. 进入下一行 得到 本行的max
        if (record_rc !== ri && txt !== undefined) {
          let record_h = coreSheet.coreRows.ensureGetRowHeightByRi(record_rc);
          if (r_h * max !== record_h) {
            let c_h = font.size * max + dbox.padding * 2 + 2 * max;
            const row = coreSheet.coreRows.multiCoreRow.ensureGetSingleRowByRowID(record_rc);
            row.height = c_h;
            viewHeight += c_h;
          } else {
            viewHeight += record_h;
          }
          max = 0;
        } else if (txt !== undefined && record_rc === ri) {
          if (txt !== undefined) {
            const n = table.tableCanvasComp.getLineNumberIfTextWarp(dbox, txt);
            if (n > max || max === 0) {
              max = n;
            }
          }
        }
        record_rc = ri;
      });
      let record_h = coreSheet.coreRows.ensureGetRowHeightByRi(record_rc);
      const style = table.getCellTextStyle(record_h, 0);
      const font = Object.assign({}, style.font);
      font.size = getFontSizePxByPt(font.size);
      const dbox = table.getDrawBox(record_rc, 0);
      if (r_h * max !== record_h && viewHeight > 0) {
        let c_h = font.size * max + dbox.padding * 2;
        viewHeight += c_h;
        const row = coreSheet.coreRows.multiCoreRow.ensureGetSingleRowByRowID(record_rc);
        row.height = c_h;
      } else if (viewHeight > 0) {
        viewHeight += record_h;
      }
    }
  }


  /**
   * 显示公式
   */
  showAllFormula() {
    this.sheetComp.coreSheet.changeShowFormula();
    this.sheetComp.sheetReset();
  }


}
