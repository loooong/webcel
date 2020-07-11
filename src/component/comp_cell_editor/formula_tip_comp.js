import {CSS_PREFIX} from "../../global_utils/config_for_core_and_component";
import {h} from "../basic_unit/element";
import {formulaHelpObj} from "../../calc/calc_cmd/fn_suggestion";
import {bind} from "../utils/event_helper";
export class FormulaTipComp {
    constructor(width = "300px") {
        this.el = h('div', `${CSS_PREFIX}-suggest-content`).css('width', width).css('z-index', "10000").css('position', "absolute").hide();
        this.el.updateAttrByKeyValue('tabindex', 0);
        bind(this.el.el, 'paste', evt => {
            evt.stopPropagation();
        });
        bind(this.el.el, 'copy', evt => {
            evt.stopPropagation();
        });
        bind(this.el.el, 'keydown', evt => {
            evt.stopPropagation();
        });
        bind(this.el.el, 'keyup', evt => {
            evt.stopPropagation();
        });
        this.className = `${CSS_PREFIX}-help-title`
        this.spanClassName = `${CSS_PREFIX}-help-span-title`
        this.span2ClassName = `${CSS_PREFIX}-help-span2-title`
    }

    hide() {
        const {el} = this;
        el.hide();
    }

    updateByExpFnName(expFnName = "", paraIndex = -1) {
        expFnName = expFnName.toUpperCase(); // formulaName变为大写
        // expFnName 找到内容
        let formulaHelpContent: {title: Array, example: Array, content:Object } = formulaHelpObj[expFnName]

        if (typeof formulaHelpContent === "undefined") { // 没有找到
            return;
        }
        // 这里应该是在处理搜索到的内容
        let items = [];
        let titleEl = this.createElByNameEditorArray( formulaHelpContent.title, paraIndex, `${CSS_PREFIX}-help-title`, `${CSS_PREFIX}-help-span-title`, `${CSS_PREFIX}-help-span2-title`);
        let exampleNameEl = h('div', `${CSS_PREFIX}-help-section-title`).appendChildByStrOrEl("示例");
        let exampleEl = this.createElByNameEditorArray(formulaHelpContent.example, paraIndex, `${CSS_PREFIX}-help-section-content`, `${CSS_PREFIX}-help-span3-title`);
        items.push(...[titleEl, exampleNameEl, exampleEl]);
        Object.keys(formulaHelpContent.content).forEach(i => {
            let c = formulaHelpContent.content[i];
            let item = h('div', `${CSS_PREFIX}-help-section-title`).appendChildByStrOrEl(i);
            let item2 = h('div', `${CSS_PREFIX}-help-section-content`).appendChildByStrOrEl(c);
            items.push(...[item, item2]);
        });

        for(let [key, value] of Object.entries(formulaHelpContent.content)){
            let item = h('div', `${CSS_PREFIX}-help-section-title`).appendChildByStrOrEl(key);
            let item2 = h('div', `${CSS_PREFIX}-help-section-content`).appendChildByStrOrEl(value);
            items.push(...[item, item2]);
        }
        this.el.updateInnerHtml('').children(...items).updateDisplayToBlock();
    }

    createElByNameEditorArray(nameEditorArray, nameEditorIndex, className, s = "", s2 = "") {
        let item = h('div', className);
        for (let i = 0; i < nameEditorArray.length; i++) {
            let nameEditor = nameEditorArray[i];
            let {name, editor, index} = nameEditor;
            if (nameEditorIndex === i) {
                item.appendChildByStrOrEl(h('span', s).appendChildByStrOrEl(name));
            } else if (editor === true && nameEditorIndex >= index) {
                item.appendChildByStrOrEl(h('span', s).appendChildByStrOrEl(name));
            } else {
                item.appendChildByStrOrEl(h('span', s2).appendChildByStrOrEl(name));
            }
        }
        return item;
    }
}
