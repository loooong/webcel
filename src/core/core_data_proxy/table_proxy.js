import {CoreRows} from "./core_rows";
import {CellRangeProxy} from '../../internal_module/cell_range';
import {isHave} from "../../global_utils/check_value";
import { splitStr } from '../../component/comp_cell_editor/ref_selector_control_old';
import { isHaveStyle } from '../../component/utils/component_helper';
import { CoreSheet } from './core_sheet_change';
export class CoreTableProxy {
    coreSheet: CoreSheet
    rows: CoreRows
    constructor(coreSheet) {
        this.data = coreSheet;
        this.coreSheet = coreSheet
        // todo: tableProxy.rows 与workbookServer.rows不是同一个?
        this.rows = new CoreRows(coreSheet); //
        this.rows.len = 0
        this.rows.defaultRowHeight = 0
    }

    getComputedStyle(computedStyle) {
        let bold = false;
        if (computedStyle.fontWeight > 400) {
            bold = true;
        }

        return {
            color: computedStyle.color,
            bgcolor: computedStyle.background.substring(0,
                computedStyle.background.indexOf(")") + 1),
            font: {
                bold: bold,
            },
        };
    }

    extend(tableDom, {ri, ci}) {
        let {data} = this;
        if (tableDom.rows.length >= data.rows.len - ri) {
            let diff = tableDom.rows.length - (data.rows.len - ri);
            if(diff > 0) {
                data.changeInsertRowOrCol('row', diff);
            }
        }

        if (isHave(tableDom.rows[0]) === false || isHave(tableDom.rows[0].cells) === false) {
            return;
        }

        let colLen = tableDom.rows[0].cells.length;
        if (colLen >= data.coreCols.len) {
            let diff = colLen - (data.coreCols.len - ci);
            if(diff > 0) {
                data.changeInsertRowOrCol('column', diff, data.coreCols.len);
            }
        }
    }

    each(obj, cb) {
        for (let i = 0; i < obj.rows.length; i++) {
            for (let j = 0; j < obj.rows[i].cells.length; j++) {
                cb(i, j, obj.rows[i].cells[j]);
            }
        }
    }

    dealColSpan(tableDom) {
        this.each(tableDom, (i, j, cell) => {
            let len = cell.getAttribute("colspan");
            if (len && len > 1) {
                for (let c = 0; c < len - 1; c++) {
                    tableDom.rows[i].insertBefore(document.createElement("td"), tableDom.rows[i].cells[j + 1]);
                }
            }
        });
    }
    // 处理data.styles
    dealStyle(tableDom, {ri, ci}) {
        let {data, rows} = this;
        let styles = data.cellStyleArray;

        this.each(tableDom, (i, j, cell) => {
            let computedStyle = document.defaultView.getComputedStyle(cell, null);
            let args = this.getComputedStyle(computedStyle);
            let index = isHaveStyle(styles, args); // styles 如果没有args这个style元素的话，则添加
            if (index === -1) {
                styles.push(args); // 可能是初始化styles
            }
            // 黏贴样式
            rows.setCell(ri + i, ci + j, {"style": index === -1 ? styles.length - 1 : index}, 'all');
        });
    }

    parseTableCellRange(tableDom, {ri, ci}) {
      let maxRi = ri, maxCi = ci;
      this.each(tableDom, (i, j) => {
        let rii = ri + i;
        let cij = ci + j;
            if(maxRi < rii) {
              maxRi = rii;
            }
            if(maxCi < cij) {
              maxCi = cij;
            }
        });
        return new CellRangeProxy(ri, ci, maxRi, maxCi);
    }

    dealReference(tableDom, {ri, ci}) {
        let {rows} = this;
         let reference = [];

        this.each(tableDom, (i, j, cell) => { // 处理reference函数提取一下，填充也用引用这个函数。 updateCEllReferenceByShift， 跟填充的逻辑共享
            let node = cell.querySelector("reference");
            let innerText = cell.innerText || "";
            if (node) {
                let eri = node.getAttribute('ri');
                let eci = node.getAttribute('ci');

                let strList = splitStr(innerText);
                let dci = i + ri - eri;
                let dei = j + ci - eci;

                let {bad, result} = rows.getCellTextByShift(strList, dei, dci);
                rows.updateCellReferenceByShift(bad, result, ri + i, ci + j);
            } else {
                let _cell = this.rows.multiCoreRow.getFormatCellByRowIDColID(ri + i, ci + j) || {};
                _cell.text = innerText;
                _cell.formulas = innerText;

                rows.setCell(ri + i, ci + j, _cell, 'all');
            }
            // proxy.setCell(data.name, xy2expr(ci + j, ri + i));

            reference.push({
                ri: ri + i,
                ci: ci + j
            });
        });
        return {"reference": reference};
    }
}
