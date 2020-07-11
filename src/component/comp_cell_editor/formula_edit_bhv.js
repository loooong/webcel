import {expr2xy, xy2expr} from '../../global_utils/alphabet';
import {getSelectorColorObj} from '../comp_single_file/color_palette';
import {h} from '../basic_unit/element';
import {
    cutFirst,
    cutting,
    cutting2, cuttingByPos,
    getUniqueRefStrArray,
    isAbsoluteValue, isOperator, value2absolute
} from './ref_selector_control_old';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { EditorInputComp } from './editor_input_comp';
import { RefSelectorComp } from '../comp_selector/ref_selector_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';

// todo: 应该把数据处理与对comp的操作分离
export class FormulaEditBhv{
    sheetComp: SheetComp
    editorInputComp: EditorInputComp
    coreSheet: CoreSheet
    constructor(editorInputComp){
        this.sheetComp = editorInputComp.cellEditorComp.sheetComp
        this.editorInputComp = editorInputComp
        this.coreSheet = this.sheetComp.coreSheet
    }
    makeSelector(ri, ci, selectors = this.selectors, multiple = false, _selector, mergeSelector) {
        let selectorCopy;
        // const {inputText} = this.cellEditorComp;
        let inputText = this.coreSheet.coreInputEditor.editorTextProxyOLD.getText();
        const {color, index} = getSelectorColorObj(selectors.length);
        if (_selector) {
            selectorCopy = _selector;
        } else {
            const className = `selector${Math.random() * 999999}`;
            selectorCopy = new RefSelectorComp(this.coreSheet, this.sheetComp, className);
            selectorCopy.el.updateAttrByKeyValue('class', `${className} clear_selector`);
            selectorCopy.updateAreaBorder(color);
        }

        if (multiple) {
            if (mergeSelector) {
                selectorCopy.setEnd(ri, ci);
            } else {
                selectorCopy.set(ri, ci, true);
            }
        } else {
            selectorCopy.set(ri, ci, false);
        }

        selectorCopy.el.css('z-index', '100');
        const len = inputText.split(xy2expr(ci, ri)).length - 2;

        let it = xy2expr(ci, ri);
        let {multiCoreMerge} = this.coreSheet;
        Object.keys(multiCoreMerge.mergeRangeArray).forEach(i => {
            let m = multiCoreMerge.mergeRangeArray[i];
            const cut = getUniqueRefStrArray(it, true);
            for (let i = 0; i < cut.length; i++) {
                if (cut[i].indexOf(":") !== -1) {
                    let a1 = cut[i].split(":")[0];
                    let a2 = cut[i].split(":")[1];
                    let e1 = expr2xy(a1);
                    let e2 = expr2xy(a2);

                    if (m.sci >= e1[0] && m.sri >= e1[1] && m.eci <= e2[0] && m.eri <= e2[1]) {
                        it = it.replace(new RegExp(cut[i], 'g'), a1);
                    }
                }
            }
        });
        const res = new SelectorDetail(ri, ci, len, color, index, selectorCopy.el.el.className, it, selectorCopy)

        if (!mergeSelector) {
            selectorCopy.el.updateDisplayToBlock();
            this.sheetComp.selectorsEl.appendChildByStrOrEl(selectorCopy.el);
        }

        if (multiple) {
            return res;
        }

        this.sheetComp.selectorsEl.appendChildByStrOrEl(selectorCopy.el);
        return res;
    }

// 输入 input
    editingSelectors(text = '') {
        if (typeof text === 'number') {
            return;
        }
        const selectors_new = [];
        const uniqueRefStrArray = getUniqueRefStrArray(text, true);
        // case 1  过滤 refSelectors
        const {selectors_delete} = this.editorInputComp.filterSelectors(uniqueRefStrArray);

        Object.keys(selectors_delete).forEach((i) => {
            const selector = selectors_delete[i];
            selector.removeEl();
        });


        const selectors_valid = selectors_new;
        // case 2  验证 refSelectors
        Object.keys(uniqueRefStrArray).forEach((i) => {
            let enterCode = 1;
            Object.keys(this.sheetComp.refSelectors).forEach((i) => {
                const {selectorCompInDetail} = this.sheetComp.refSelectors[i];
                selectorCompInDetail.el.removeEl();
            });

            // 绝对值
            let arr = '';
            let sc = uniqueRefStrArray[i].replace(/\$/g, "");
            if (isAbsoluteValue(uniqueRefStrArray[i])) {
                const notTrueValue = uniqueRefStrArray[i].replace(/\$/g, '');
                arr = expr2xy(notTrueValue);
            } else if (sc.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1) {
                enterCode = 2;
            } else {
                arr = expr2xy(uniqueRefStrArray[i]);
            }

            if (enterCode === 1) {
                const ri = arr[1];
                const
                  ci = arr[0];
                const args = this.makeSelector(ri, ci, selectors_valid);
                args.erpx = uniqueRefStrArray[i];
                selectors_valid.push(args);
            } else if (enterCode === 2) {
                const prx = uniqueRefStrArray[i].replace(/\$/g, '').split(':')[0];
                const lax = uniqueRefStrArray[i].replace(/\$/g, '').split(':')[1];

                const prx_index = expr2xy(prx);
                const lax_index = expr2xy(lax);
                let args = this.makeSelector(prx_index[1], prx_index[0], selectors_valid, true, null, false);
                args = this.makeSelector(lax_index[1], lax_index[0], selectors_valid, true, args.selectorCompInDetail, true);
                args.erpx = uniqueRefStrArray[i];
                selectors_valid.push(args);
            }
        });
        this.selectors = selectors_valid;

        if (this.selectors.length > 0 || text[0] === '=') {
            this.editorInputComp.refreshSpanArray(cutting(text), cutting2(text));
        }
    }

// 找 ( 的index
    findBracketLeft(cut, i) { // 已经转移，在EditorInputComp
        let begin = -1;
        let has = 0;
        let stop = false;

        for (let j = i - 1; j > 0 && stop === false; j--) {
            if (cut[j] === '(') {
                stop = true;
            }
            if (cut[j] === ')') {
                has++;
            }
        }

        for (let j = i; j > 0 && begin === -1; j--) {
            if (cut[j] === '(') {
                if (has === 0) {
                    begin = j;
                }
                has--;
            }
        }

        return begin;
    }

// => { leftSpanElIndex: 0, right: 0,  exist: false }
    findBracket(pos,  text) {
        let express = [];
        for (let i = 0; i < text.length; i++) {
            if (text[i]) { // 非空就会加入数组
                express.push(text[i]);
            }
        }

        let resObj = {left: 0, right: 0, exist: false};
        if (text[pos] !== ')') {
            return resObj;
        }
        const right = pos;
        const left = this.findBracketLeft( express, right);
        if (left !== -1 && right !== -1) { // left, right都可以找到
            resObj = {left, right, exist: true};
        }
        return resObj;
    }


// 找 ) 的 index
    findBracketRight(cut, i) {
        let begin = -1;
        let has = 0;
        let stop = false;

        for (let j = i + 1; j < cut.length && stop === false; j++) {
            if (cut[j] === ')') {
                stop = true;
            }
            if (cut[j] === '(') {
                has++;
            }
        }

        for (let j = i; j < cut.length && begin === -1; j++) {
            if (cut[j] === ')') {
                if (has === 0) {
                    begin = j;
                }
                has--;
            }
        }

        return begin;
    }


    suggestContent(pos, cut, inputText) {
        // 如果在括号内
        // step 1. 找到距离pos最近的左、右括号的index
        // step 2. 若1成立，找到该函数名
        // step 3. 找光标前有几个逗号
        const content = {suggestContent: false, cut: '', pos: 1};
        const begin = pos - 1;
        const left = this.findBracketLeft(cut, begin);
        const right = this.findBracketRight(cut, left);

        if (left <= begin && left !== -1 && (right >= begin || right === -1)) {
            content.suggestContent = true;
            content.cut = cuttingByPos(inputText, left);
        }

        for (let i = left; i < begin + 1; i++) {
            if (inputText[i] === ',') {
                content.pos += 2;
            }
        }

        return content;
    }

}

export class SelectorDetail{
    selectingExpr: string
    constructor(ri,ci,index,color,index2,className,expr,selector) {
        this.ri = ri
        this.ci = ci
        this.index = index
        this.color = color
        this.index2 = index2
        this.className = className
        this.selectorCompInDetail = selector
        this.selectingExpr = expr
    }


}

