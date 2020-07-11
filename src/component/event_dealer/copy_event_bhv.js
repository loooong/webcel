import { SheetComp } from '../a_top_comp/sheet_comp';
import { h } from '../basic_unit/element';
import { getUniqueRefStrArray } from '../comp_cell_editor/ref_selector_control_old';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';

export class CopyBhv {
  sheetComp: SheetComp;
  coreSheet:CoreSheet

  constructor(sheetComp) {
    this.sheetComp = sheetComp;
    this.coreSheet = this.sheetComp.coreSheet
  }

  mountCopy(event) {
    debugger
    event.preventDefault();
    let choose = this.getChooseImg(this);
    if (choose) {
      if (event.clipboardData) {
        event.clipboardData.setData('text/html', this.parseDom(choose.img2));
        event.clipboardData.setData('text/plain', '');
      }
      return;
    }

    let args = this.sheetCopy();
    if (event.clipboardData) {
      event.clipboardData.setData('text/html', this.parseDom(args.html.el));
      event.clipboardData.setData('text/plain', args.plain);
    }
  }

  getChooseImg() {
    let { pasteDirectionsArr } = this.sheetComp.coreSheet;

    this.direction = false;
    if (pasteDirectionsArr.length > 0) {
      for (let i = 0; i < pasteDirectionsArr.length; i++) {
        if (pasteDirectionsArr[i].state === true) {
          this.sheetComp.picContainer.css('pointer-events', 'auto');
          return pasteDirectionsArr[i];
        }
      }
    }
    return null;
  }

  sheetCopy() {
    let args = {
      plain: '',
      html: h('component_table.js', ''),
    };

    let rows = this.coreSheet.coreRows;
    let { sri, eri, sci, eci } = this.coreSheet.coreSelector.selectedCoreRange;
    let tbody = h('tbody', '');
    for (let i = sri; i <= eri; i += 1) {
      let tr = h('tr', '');
      for (let j = sci; j <= eci; j += 1) {
        let td = h('td', '');
        if (rows.rowID2RowObj[i] && rows.rowID2RowObj[i].cells && rows.rowID2RowObj[i].cells[j]) {
          if (rows.rowID2RowObj[i].cells[j] && this.coreSheet.cellStyleArray[rows.rowID2RowObj[i].cells[j].style]) {
            td.css('color', this.coreSheet.cellStyleArray[rows.rowID2RowObj[i].cells[j].style].color);
            if (this.coreSheet.cellStyleArray[rows.rowID2RowObj[i].cells[j].style]
              && this.coreSheet.cellStyleArray[rows.rowID2RowObj[i].cells[j].style].font
              && this.coreSheet.cellStyleArray[rows.rowID2RowObj[i].cells[j].style].font.bold) {
              let bold = this.coreSheet.cellStyleArray[rows.rowID2RowObj[i].cells[j].style].font.bold ? '900' : '';
              td.css('font-weight', bold);
            }
            td.css('background', this.coreSheet.cellStyleArray[rows.rowID2RowObj[i].cells[j].style].bgcolor);
          }

          if (!rows.rowID2RowObj[i].cells[j].text) {
            rows.rowID2RowObj[i].cells[j].text = '';
          }
          if (!rows.rowID2RowObj[i].cells[j].formulas) {
            rows.rowID2RowObj[i].cells[j].formulas = '';
          }

          let text = rows.rowID2RowObj[i].cells[j].formulas !== '' ? rows.rowID2RowObj[i].cells[j].formulas : rows.rowID2RowObj[i].cells[j].text;
          if (rows.rowID2RowObj[i].cells[j].formulas && getUniqueRefStrArray(rows.rowID2RowObj[i].cells[j].formulas, false, true).length > 0) {
            let hidden = h('reference', '');
            hidden.updateInnerHtml(text);
            hidden.updateAttrByKeyValue('ri', i);
            hidden.updateAttrByKeyValue('ci', j);
            td.appendChildByStrOrEl(hidden.el);
          } else {
            td.updateInnerHtml(text);
          }
          args.plain += text;
          args.plain += '\t';
        } else {
          args.plain += '\t';
        }
        tr.appendChildByStrOrEl(td);
      }

      tbody.appendChildByStrOrEl(tr);
      args.plain += '\n';
    }
    args.html.appendChildByStrOrEl(tbody);

    return args;
  }

  parseDom(node) {
    let tmpNode = document.createElement('div');
    tmpNode.appendChild(node.cloneNode(true));

    return tmpNode.innerHTML;
  }


}
