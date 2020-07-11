import { h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { SingleRefSelector } from './single_ref_selector';
import { bindMouseMoveThenUpFunc } from '../utils/event_helper';
import {
  cuttingByPos,
  getCurSyntaxUnitUpperCase,
  isAbsoluteValue
} from '../comp_cell_editor/ref_selector_control_old';
import { expr2xy } from '../../global_utils/alphabet';
import { POINT_EVENTS_AUTO, POINT_EVENTS_NONE } from '../utils/config';

export const selectorHeightBorderWidth = 2 * 2 - 1;
export let startZIndex = 10;
// 表示引用语法单元的选择器
class RefSelectorElement {
  selectorCopy: RefSelectorComp;
  coreSheet: CoreSheet;

  constructor(data, selector, sheet) {
    // this.cornerEl = h('div', `${CSS_PREFIX}-selector-corner`);
    // this.box = h('div', `${CSS_PREFIX}-selector-box`);
    this.data = data;
    this.coreSheet = data;
    this.selectorCopy = selector;
    this.sheetComp = sheet;
    this.l = h('div', `${CSS_PREFIX}-selector-box-l`)
      .on('mousedown.stop', evt => {
        this.moveEvent(evt);
      });
    this.r = h('div', `${CSS_PREFIX}-selector-box-r`)
      .on('mousedown.stop', evt => {
        this.moveEvent(evt);
      });
    this.t = h('div', `${CSS_PREFIX}-selector-box-t`)
      .on('mousedown.stop', evt => {
        this.moveEvent(evt);
      });
    this.b = h('div', `${CSS_PREFIX}-selector-box-b`)
      .on('mousedown.stop', evt => {
        this.moveEvent(evt);
      });


    this.boxinner = h('div', `${CSS_PREFIX}-selector-boxinner`)
      .children(this.b, this.t, this.r, this.l);
    this.selectorMove = new SingleRefSelector(this.boxinner, data, sheet, selector);
    this.areaEl = h('div', `${CSS_PREFIX}-selector-area`)
      .appendChildByStrOrEl(this.boxinner)
      .hide();            // this.boxinner
    this.clipboardEl = h('div', `${CSS_PREFIX}-selector-clipboard`)
      .hide();
    this.autofillEl = h('div', `${CSS_PREFIX}-selector-autofill`)
      .hide();
    this.el = h('div', `${CSS_PREFIX}-selector`)
      .css('z-index', `${startZIndex}`)
      .children(this.areaEl, this.clipboardEl, this.autofillEl)
      .hide();
    startZIndex += 1;
  }

  find(str, cha) {
    return str.lastIndexOf(cha);
  }


  moveEvent(evt) {
    let { data, selectorCopy, sheetComp } = this;
    let _move_selectors = null;
    let { sri, sci, eri, eci, w, h } = this.coreSheet.coreSelector.selectedCoreRange;
    let cellRange = new CellRangeProxy(sri, sci, eri, eci, w, h);
    let p = -1;
    bindMouseMoveThenUpFunc(window, (e) => {
      let { selectors } = this.sheetComp;
      sheetComp.picContainer.css('pointer-events', POINT_EVENTS_NONE);
      for (let i = 0; i < selectors.length; i++) {
        let selector = selectors[i];
        selector.selectorCompInDetail.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_NONE)
      }
      let relativeXYDetailC = this.sheetComp.overlayComp.getRelativeXYDetail(evt, 1);


      let { ri, ci } = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
      if (ri !== -1 && ci !== -1) {
        let { pos } = this.sheetComp.cellEditorComp;
        let inputText = this.sheetComp.cellEditorComp.editorTextProxy.getText();
        let _erpx = cuttingByPos(inputText, pos - 1, true);
        if (inputText.length > pos - 1) {
          _erpx += getCurSyntaxUnitUpperCase(inputText, pos - 1);
        }
        for (let i = 0; i < selectors.length; i++) {
          let selector = selectors[i];
          let { className, selectingExpr } = selector;

          if (erpx === _erpx && className === selectorCopy.className + ' clear_selector') {
            _move_selectors = _move_selectors ? _move_selectors : selector;
            if (erpx.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1) {
              let arr = erpx.split(':');
              let e1 = expr2xy(arr[0]);
              let e2 = expr2xy(arr[1]);
              cellRange = new CellRangeProxy(e1[1], e1[0], e2[1], e2[0], w, h);
              cellRange.updateByStartRiCi(ri, ci);
              const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
              _move_selectors.selectorCompInDetail.range = cellRange;
              _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
            } else {
              _move_selectors.selectorCompInDetail.set(ri, ci, true);
            }
            break;
          } else if (erpx !== _erpx && className === selectorCopy.className + ' clear_selector') {
            p = p !== -1 ? p : this.find(inputText, selector.selectingExpr);
            this.sheetComp.cellEditorComp.editorInputComp.coreSheet.coreInputEditor.startCursorPst = p + selector.selectingExpr.length;
            this.sheetComp.cellEditorComp.editorInputComp.updateCursorPstAtTextEl();
            _move_selectors = _move_selectors ? _move_selectors : selector;

            if (selector.selectingExpr.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1) {
              let arr = erpx.split(':');
              let e1 = expr2xy(arr[0]);
              let e2 = expr2xy(arr[1]);
              cellRange = new CellRangeProxy(e1[1], e1[0], e2[1], e2[0], w, h);
              cellRange.updateByStartRiCi(ri, ci);
              const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
              _move_selectors.selectorCompInDetail.range = cellRange;
              _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
            } else {
              _move_selectors.selectorCompInDetail.set(ri, ci, true);
            }
            break;
          }
        }
        if (_move_selectors) {
          _move_selectors.selectorCompInDetail.updateAreaBorder(_move_selectors.color, false);
          this.sheetComp.cellEditorComp.editorInputComp.lockCells(evt, _move_selectors, isAbsoluteValue(_move_selectors.selectingExpr), p);
        }
      }
    }, () => {
      // 加这个的原因是  e.layerX, e.layerY， 如果不加的话 会点到单元格内的 xy坐标进行结算
      let { selectors } = this.sheetComp;
      sheetComp.picContainer.css('pointer-events', POINT_EVENTS_AUTO);
      for (let i = 0; i < selectors.length; i++) {
        let selector = selectors[i];
        selector.selectorCompInDetail.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_AUTO)
      }
      p = -1;
      if (_move_selectors && _move_selectors.selectorCompInDetail) {
        _move_selectors.selectorCompInDetail.updateAreaBorder(_move_selectors.color, true);
      }
      _move_selectors = null;
    });
  }

  setBoxinner(pointer) {
    this.l.css('pointer-events', pointer);
    this.r.css('pointer-events', pointer);
    this.t.css('pointer-events', pointer);
    this.b.css('pointer-events', pointer);
    this.selectorMove.l.css('pointer-events', pointer);
    this.selectorMove.r.css('pointer-events', pointer);
    this.selectorMove.t.css('pointer-events', pointer);
    this.selectorMove.b.css('pointer-events', pointer);
  }

  setCss(b, key = true) {
    if (!key) {
      this.areaEl.css('border', `2px solid ${b}`);
    } else {
      this.areaEl.css('border', `2px dashed ${b}`);
    }
    this.el.css('z-index', '-1');
  }

  setOffset(v) {
    this.el.updateElLTWH(v)
      .updateDisplayToBlock();
    return this;
  }

  hide() {
    this.el.hide();
    return this;
  }

  setAreaOffset(v) {
    const {
      left, top, width, height,
    } = v;
    this.areaEl.updateElLTWH({
      width: width - selectorHeightBorderWidth + 0.8,
      height: height - selectorHeightBorderWidth + 0.8,
      left: left - 0.8,
      top: top - 0.8,
    })
      .updateDisplayToBlock();
  }

  setClipboardOffset(v) {
    const {
      left, top, width, height,
    } = v;
    this.clipboardEl.updateElLTWH({
      left: left,
      top,
      width: width - 5,
      height: height - 5,
    });
  }

  showAutofill(v) {
    const {
      left, top, width, height,
    } = v;
    this.autofillEl.updateElLTWH({
      width: width - selectorHeightBorderWidth,
      height: height - selectorHeightBorderWidth,
      left: left,
      top,
    })
      .updateDisplayToBlock();
  }

  hideAutofill() {
    this.autofillEl.hide();
  }

  showClipboard() {
    this.clipboardEl.updateDisplayToBlock();
  }

  hideClipboard() {
    this.clipboardEl.hide();
  }
}

export class RefSelectorComp { // selectorCopy与selectorComp有何区别？
  el: Element;
  coreSheet: CoreSheet

  constructor(data, sheet, className) {
    this.data = data;
    this.coreSheet = data
    this.className = className;
    this.br = new RefSelectorElement(data, this, sheet);
    this.t = new RefSelectorElement(data, this, sheet);
    this.l = new RefSelectorElement(data, this, sheet);
    this.tl = new RefSelectorElement(data, this, sheet);
    this.br.el.updateDisplayToBlock();
    this.offset = null;
    this.areaOffset = null;
    this.indexes = null;
    this.range = null;
    this.arange = null;
    this.el = h('div', `${CSS_PREFIX}-selectors`)
      .children(
        this.tl.el,
        this.t.el,
        this.l.el,
        this.br.el,
      )
      .hide();

    // for performance
    this.lastri = -1;
    this.lastci = -1;

    startZIndex += 1;
  }

  setCss(b, key = true) {
    this.br.setCss(b, key);
    this.t.setCss(b, key);
    this.l.setCss(b, key);
    this.tl.setCss(b, key);
  }

  hide() {
    this.el.hide();
  }

  resetOffset() {
    const {
      data, tl, t, l, br,
    } = this;
    const freezeHeight = data.tableViewForEvent.getFreezeTop();
    const freezeWidth = data.tableViewForEvent.getFreezeLeft();
    if (freezeHeight > 0 || freezeWidth > 0) {
      tl.resetByLTWH({
        width: freezeWidth,
        height: freezeHeight
      });
      t.resetByLTWH({
        left: freezeWidth,
        height: freezeHeight
      });
      l.resetByLTWH({
        top: freezeHeight,
        width: freezeWidth
      });
      br.resetByLTWH({
        left: freezeWidth,
        top: freezeHeight
      });
    } else {
      tl.hide();
      t.hide();
      l.hide();
      br.resetByLTWH({
        left: 0,
        top: 0
      });
    }
  }

  resetAreaOffset() {
    const offset = this.data.tableViewForEvent.getRangePstLTHW(this.data.coreSelector.selectedCoreRange);
    const coffset = this.data.getClipboardRect();
    this.setAllAreaOffset(offset);
    this.setAllClipboardOffset(coffset);
    this.resetOffset();
  }

  resetBRTAreaOffset() {
    const offset = this.data.tableViewForEvent.getRangePstLTHW(this.data.coreSelector.selectedCoreRange);
    const coffset = this.data.getClipboardRect();
    this.setBRAreaOffset(offset);
    this.setTAreaOffset(offset);
    this.setBRClipboardOffset(coffset);
    this.setTClipboardOffset(coffset);
    this.resetOffset();
  }

  resetSelectorBRLAreaOffset(range) {
    const offset = this.data.tableViewForEvent.getRangePstLTHW(range);
    const coffset = this.data.getClipboardRect();
    this.setBRAreaOffset(offset);
    this.setLAreaOffset(offset);
    this.setBRClipboardOffset(offset);
    this.setLClipboardOffset(offset);
    this.resetOffset();
  }

  resetBRLAreaOffset() {
    const offset = this.data.tableViewForEvent.getRangePstLTHW(this.data.coreSelector.selectedCoreRange);
    const coffset = this.data.getClipboardRect();
    this.setBRAreaOffset(offset);
    this.setLAreaOffset(offset);
    this.setBRClipboardOffset(offset);
    this.setLClipboardOffset(offset);
    this.resetOffset();
  }

  set(ri, ci, indexesUpdated = true) {
    const { data } = this;
    const cellRange = this.coreSheet.coreSelector.updateByFirstSelectCell(ri, ci);
    const { sri, sci } = cellRange;
    if (indexesUpdated) {
      let [cri, cci] = [ri, ci];
      if (ri < 0) cri = 0;
      if (ci < 0) cci = 0;
      data.coreSelector._updateRiCiOfFirstSelectCell(cri, cci);
      this.indexes = [cri, cci];
    }

    this.moveIndexes = [sri, sci];
    // this.sIndexes = sIndexes;
    // this.eIndexes = eIndexes;
    this.range = cellRange;
    this.resetAreaOffset();
    this.el.show();
  }

  setMove(rect) {
    this.setAllAreaOffset(rect);
  }

  setEnd(ri, ci, moving = true) {
    const { data, lastri, lastci } = this;
    if (moving) {
      if (ri === lastri && ci === lastci) return;
      this.lastri = ri;
      this.lastci = ci;
    }
    this.range = this.coreSheet.coreSelector.updateByLastSelectCell(ri, ci);

    this.setAllAreaOffset(this.data.tableViewForEvent.getRangePstLTHW(this.data.coreSelector.selectedCoreRange));

  }

  setBoxinner(pointer) {
    this.br.setBoxinner(pointer);
    this.t.setBoxinner(pointer);
    this.l.setBoxinner(pointer);
    this.tl.setBoxinner(pointer);
  }

  // updateByCoreSheet() {
  //     const {eri, eci} = this.data.coreSelector.selectedCoreRange;
  //     this.setEnd(eri, eci);
  // }

  showAutofill(ri, ci) {
    if (ri === -1 && ci === -1) return;
    // const [sri, sci] = this.sIndexes;
    // const [eri, eci] = this.eIndexes;
    const {
      sri, sci, eri, eci,
    } = this.range;
    const [nri, nci] = [ri, ci];
    // const rn = eri - sri;
    // const cn = eci - sci;
    const srn = sri - ri;
    const scn = sci - ci;
    const ern = eri - ri;
    const ecn = eci - ci;
    if (scn > 0) {
      // leftSpanElIndex
      this.arange = new CellRangeProxy(sri, nci, eri, sci - 1);
      // this.saIndexes = [sri, nci];
      // this.eaIndexes = [eri, sci - 1];
      // data.calRangeIndexes2(
    } else if (srn > 0) {
      // top
      // nri = sri;
      this.arange = new CellRangeProxy(nri, sci, sri - 1, eci);
      // this.saIndexes = [nri, sci];
      // this.eaIndexes = [sri - 1, eci];
    } else if (ecn < 0) {
      // right
      // nci = eci;
      this.arange = new CellRangeProxy(sri, eci + 1, eri, nci);
      // this.saIndexes = [sri, eci + 1];
      // this.eaIndexes = [eri, nci];
    } else if (ern < 0) {
      // bottom
      // nri = eri;
      this.arange = new CellRangeProxy(eri + 1, sci, nri, eci);
      // this.saIndexes = [eri + 1, sci];
      // this.eaIndexes = [nri, eci];
    } else {
      this.arange = null;
      // this.saIndexes = null;
      // this.eaIndexes = null;
      return;
    }
    if (this.arange !== null) {
      const offset = this.data.tableViewForEvent.getRangePstLTHW(this.arange);
      offset.width += 2;
      offset.height += 2;
      const {
        br, l, t, tl,
      } = this;
      br.updateAutofillLTWHAndShow(this.calBRAreaOffset(offset));
      l.updateAutofillLTWHAndShow(this.calLAreaOffset(offset));
      t.updateAutofillLTWHAndShow(this.calTAreaOffset(offset));
      tl.updateAutofillLTWHAndShow(offset);
    }
  }

  hideAutofill() {
    ['primeSelectorComp', 'l', 't', 'selectorComp4'].forEach((property) => {
      this[property].primeSelectorComp.hideAutofill()
    });
  }

  showClipboard() {
    const coffset = this.data.getClipboardRect();
    this.setAllClipboardOffset(coffset);
    ['primeSelectorComp', 'l', 't', 'selectorComp4'].forEach((property) => {
      this[property].showClipboard();
    });
  }

  hideClipboard() {
    ['primeSelectorComp', 'l', 't', 'selectorComp4'].forEach((property) => {
      this[property].hideClipboard();
    });
  }

  calBRAreaOffset(offset) {
    const { data } = this;
    const {
      left, top, width, height, scroll, l, t,
    } = offset;
    const ftwidth = data.tableViewForEvent.getFreezeLeft();
    const ftheight = data.tableViewForEvent.getFreezeTop();
    let left0 = left - ftwidth;
    if (ftwidth > l) left0 -= scroll.x;
    let top0 = top - ftheight;
    if (ftheight > t) top0 -= scroll.y;
    return {
      left: left0,
      top: top0,
      width,
      height,
    };
  }

  calTAreaOffset(offset) {
    const { data } = this;
    const {
      left, width, height, l, t, scroll,
    } = offset;
    const ftwidth = data.tableViewForEvent.getFreezeLeft();
    let left0 = left - ftwidth;
    if (ftwidth > l) left0 -= scroll.x;
    return {
      left: left0,
      top: t,
      width,
      height,
    };
  }

  calLAreaOffset(offset) {
    const { data } = this;
    const {
      top, width, height, l, t, scroll,
    } = offset;
    const ftheight = data.tableViewForEvent.getFreezeTop();
    let top0 = top - ftheight;
    if (ftheight > t) top0 -= scroll.y;
    return {
      left: l,
      top: top0,
      width,
      height,
    };
  }

  setBRAreaOffset(offset) {
    const { br } = this;
    br.updateAreaLTWHAndShow(this.calBRAreaOffset(offset));
  }

  setTLAreaOffset(offset) {
    const { tl } = this;
    tl.updateAreaLTWHAndShow(offset);
  }

  setTAreaOffset(offset) {
    const { t } = this;
    t.updateAreaLTWHAndShow(this.calTAreaOffset(offset));
  }

  setLAreaOffset(offset) {
    const { l } = this;
    l.updateAreaLTWHAndShow(this.calLAreaOffset(offset));
  }

  setLClipboardOffset(offset) {
    const { l } = this;
    l.updateClipboardLTWH(this.calLAreaOffset(offset));
  }

  setBRClipboardOffset(offset) {
    const { br } = this;
    br.updateClipboardLTWH(this.calBRAreaOffset(offset));
  }

  setTLClipboardOffset(offset) {
    const { tl } = this;
    tl.updateClipboardLTWH(offset);
  }

  setTClipboardOffset(offset) {
    const { t } = this;
    t.updateClipboardLTWH(this.calTAreaOffset(offset));
  }

  setAllAreaOffset(offset) {
    this.setBRAreaOffset(offset);
    this.setTLAreaOffset(offset);
    this.setTAreaOffset(offset);
    this.setLAreaOffset(offset);
  }

  setAllClipboardOffset(offset) {
    this.setBRClipboardOffset(offset);
    this.setTLClipboardOffset(offset);
    this.setTClipboardOffset(offset);
    this.setLClipboardOffset(offset);
  }

}
