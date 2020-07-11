import { FinElement, h } from '../basic_unit/element';
import {fireAEventToDocument} from '../utils/event_helper';
import {CSS_PREFIX} from '../../global_utils/config_for_core_and_component';
import {CellRangeProxy} from "../../internal_module/cell_range";
import { CellEditorComp } from './editor';
import {
    KEY_CODE_DOWN_ARROW, KEY_CODE_ENTER,
    KEY_CODE_LEFT_ARROW,
    KEY_CODE_RIGHT_ARROW, KEY_CODE_TAB,
    KEY_CODE_UP_ARROW
} from '../utils/config';
const SINGLE_ITEM_HEIGHT = 26

import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
export class ItemDetail{
    title: string
    label: string
    key: string
}
export class SuggestComp {
    editor: CellEditorComp
    itemIndex: number // 这个变量只赋值了，似乎没有什么用
    el: FinElement
    coreSheet: CoreSheet
    items: Array<ItemDetail>
    show: Boolean
    constructor(items, itemClick, coreSheet, cellEditorComp, width = '200px') {
        this.filterItems = [];
        this.items = items;
        this.coreSheet = coreSheet;
        this.cellEditorComp = cellEditorComp;
        this.el = h('div', `${CSS_PREFIX}-suggest`)
            .css('width', width)
            .css('overflow-y', 'auto')
            .css('max-height', '306px').hide();
        this.el.updateAttrByKeyValue('tabindex', 0);
        this.itemClick = itemClick;
        this.itemIndex = -1;
        this.show = false;
    }

    setOffset(v) {
        this.el.cssRemoveKeys('top', 'bottom')
            .updateElLTWH(v);
    }

    hide() {
        const {el} = this;
        this.filterItems = [];
        this.itemIndex = -1;
        el.hide();
        this.show = false;
        this.el.parent().unbindClickoutside();
    }

    setItems(items) {
        this.items = items;
        // this.search('');
    }

    /**
     * 搜索自动提示
     * @param keyWord
     */
    searchAndShowByKeyWord(keyWord) {
        const SHOW_ITEM_NUM = 10 // 搜索结果如果超过10个的话，会出现滚动条
        let {items} = this;
        if (!/^\s*$/.test(keyWord)) {
            items = items.filter(it => (it.key.toUpperCase() || it.toUpperCase()).startsWith(keyWord.toUpperCase()));
        }
        items = items.map((it) => {
            let {title} = it;
            if (title) {
                if (typeof title === 'function') {
                    title = title();
                }
            } else {
                title = it;
            }
            const item = h('div', `${CSS_PREFIX}-item`)
                .appendChildByStrOrEl(title)
                .on('click.stop', () => {
                    this.itemClick(it); // 处理点击的事件函数
                });
            if (it.label) {
                item.appendChildByStrOrEl(h('div', 'label').updateInnerHtml(it.label));
            }
            return item;
        });
        this.filterItems = items;
        if (items.length <= 0) {
            this.hide();
            this.show = false;
            return;
        }
        const {el} = this;
        // items[0].toggle();
        let editingRangeLTWHInTable = this.coreSheet.coreInputEditor.getEditingRangeLTWHInTable()
        let suggestLT = {left: editingRangeLTWHInTable.left, top:editingRangeLTWHInTable.top +  editingRangeLTWHInTable.height}
        if(editingRangeLTWHInTable.top + SHOW_ITEM_NUM * SINGLE_ITEM_HEIGHT >= this.coreSheet.tableViewForEvent.tableHeight) { // 此时suggest向上
            suggestLT.top = editingRangeLTWHInTable.top - SHOW_ITEM_NUM * SINGLE_ITEM_HEIGHT;
        }
        this.el.updateElLTWH(suggestLT)
        el.updateInnerHtml('').children(...items).updateDisplayToBlock();
        this.show = true;
        this.el.parent().bindClickOutside(() => {
            this.hide();
            this.show = false;
        });
    }
    // ============= 事件处理 ================
    bindInputEvents(textEl) {
        textEl.on('keydown', evt => this.dealKeyDown(evt)); // 额外再新增点击事件
    }
    dealKeyDown(evt){
        const {keyCode} = evt;
        if (evt.ctrlKey) {
            evt.stopPropagation();
        }
        switch (keyCode) {
            case KEY_CODE_LEFT_ARROW: // leftSpanElIndex
                evt.stopPropagation();
                break;
            case KEY_CODE_UP_ARROW: // up
                this.inputMovePrev(evt);
                evt.stopPropagation();
                break;
            case KEY_CODE_RIGHT_ARROW: // right
                evt.stopPropagation();
                break;
            case KEY_CODE_DOWN_ARROW: // down
                this.inputMoveNext(evt)
                evt.stopPropagation();
                break;
            case KEY_CODE_ENTER: // enter
                this.inputEnter(evt);
                break;
            case KEY_CODE_TAB: // tab
                this.inputEnter(evt);
                break;
            default:
                evt.stopPropagation();
                break;
        }
    }

    inputMovePrev(evt){
        // evt.preventDefault(); // 如果去掉默认行为的
        evt.stopPropagation();
        const {filterItems} = this;
        if (filterItems.length <= 0) return;
        if (this.itemIndex >= 0) filterItems[this.itemIndex].toggle();
        this.itemIndex -= 1;
        if (this.itemIndex < 0) {
            this.itemIndex = filterItems.length - 1;
            this.el.el.scrollTop = this.el.el.scrollHeight;
        }
        this.el.el.scrollTop = (this.itemIndex - 9) * 33;
        filterItems[this.itemIndex].toggle();
    }
    inputMoveNext(evt) {
        evt.stopPropagation();
        const {filterItems} = this;
        if (filterItems.length <= 0 || filterItems.length < this.itemIndex) return;
        if (this.itemIndex >= 0) filterItems[this.itemIndex].toggle();
        this.itemIndex += 1;
        if (this.itemIndex > filterItems.length - 1) {
            this.itemIndex = 0;
            this.el.el.scrollTop = 0;
        }
        this.el.el.scrollTop = (this.itemIndex - 9) * 33;
        filterItems[this.itemIndex].toggle();
    }
    inputEnter(evt) {
        evt.preventDefault();
        if (this.filterItems.length <= 0) return;
        evt.stopPropagation();
        if (this.itemIndex < 0) {
            this.itemIndex = 0;
            this.hide();
            fireAEventToDocument.call(this, KEY_CODE_ENTER, false);
            return
        }
        this.filterItems[this.itemIndex].el.click(); // 触发iterm的点击事件
        this.hide();
    }
    // ============= 更新 ======================
    refreshSuggestCompByCoreData(){
        this.hide(); // 此时把suggest之间关掉了最简单
        if (this.coreSheet.coreInputEditor.charPstDetail.isAllowExpFn()) {
            this.searchAndShowByKeyWord(this.coreSheet.coreInputEditor.charPstDetail.getLeftPartOfSynUnit()); // 搜索
        } else {
            this.hide();
        }
        this.itemIndex = -1;
    }

}
