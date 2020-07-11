import { FinElement, h } from '../basic_unit/element';
import {
  CSS_PREFIX,
  EVENT_COPY,
  EVENT_CUT,
  EVENT_DEL_COL,
  EVENT_DEL_ROW,
  EVENT_INSERT_COL,
  EVENT_INSERT_ROW,
  EVENT_PASTE,
  EVENT_PASTE_FORMAT,
  EVENT_PASTE_VALUE,
  EVENT_VALIDATION,
  ITEM_DIVIDE
} from '../../global_utils/config_for_core_and_component';
import { tf } from '../../locale/locale';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';

class ItemDetail{
  key: string
  title: function
  label:string
  clickFunc: function
  constructor(key, tfKey, clickFunc, label="",){
    this.key = key
    this.title = tf(tfKey)
    this.label = label
    this.clickFunc = clickFunc || (() =>console.log(key))
  }
}

// 这个是右击菜单
export class ContextMenu {
  sheetComp: SheetComp
  coreSheet: CoreSheet
  el: FinElement
  constructor(sheetComp, isHide = false) {
    this.menus = this.getMenuItems().map(it => this.buildMenuItem(it))
    this.el = h('div', `${CSS_PREFIX}-contextmenu`) // 构建div元素
      .children(...this.menus)
      .hide();
    this.sheetComp = sheetComp;
    this.coreSheet = this.sheetComp.coreSheet
    this.isHide = isHide;
  }
  getMenuItems():Array{
    return [
      new ItemDetail(EVENT_COPY, 'contextmenu.copy',
        ()=> this.sheetComp.copy(), 'Ctrl+C'),
      new ItemDetail(EVENT_CUT, 'contextmenu.cut',
        ()=> this.sheetComp.cut(), 'Ctrl+X'),
      new ItemDetail(EVENT_PASTE, 'contextmenu.paste',
        ()=> console.log("执行黏贴！"), 'Ctrl+V'),
      new ItemDetail(EVENT_PASTE_VALUE, 'contextmenu.pasteValue',
        ()=> console.log(EVENT_PASTE_VALUE), 'Ctrl+Shift+V'),
      new ItemDetail(EVENT_PASTE_VALUE, 'contextmenu.pasteFormat',
        ()=> console.log(EVENT_PASTE_FORMAT), 'Ctrl+Alt+V'),
      new ItemDetail(ITEM_DIVIDE),
      new ItemDetail(EVENT_INSERT_ROW, 'contextmenu.insertRow',
        ()=>this.sheetComp.insertDeleteRowColumn(EVENT_INSERT_ROW)),
      new ItemDetail(EVENT_INSERT_COL, 'contextmenu.insertColumn',
        ()=>this.sheetComp.insertDeleteRowColumn(EVENT_INSERT_COL)),
      new ItemDetail(ITEM_DIVIDE),
      new ItemDetail(EVENT_DEL_ROW, 'contextmenu.deleteRow',
        ()=>this.sheetComp.insertDeleteRowColumn(EVENT_DEL_ROW)),
      new ItemDetail(EVENT_DEL_COL, 'contextmenu.deleteColumn',
        ()=>this.sheetComp.insertDeleteRowColumn(EVENT_DEL_COL)),
      new ItemDetail(ITEM_DIVIDE),
      new ItemDetail(EVENT_VALIDATION, 'contextmenu.validation',
        ()=>this.sheetComp.modalValidation.setValue(this.coreSheet.getSelectedValidation())),
    ];
  }

  buildMenuItem(item:ItemDetail) {
    if (item.key === ITEM_DIVIDE) {
      return h('div', `${CSS_PREFIX}-item divider`);
    }
    return h('div', `${CSS_PREFIX}-item`)
      .on('click', (evt) => {
        item.clickFunc()
        this.hide();
      })
      .children(
        item.title(),
        h('div', 'label').appendChildByStrOrEl(item.label || ''),
      );
  }
  hide() {
    this.el.hide();
    this.el.unbindClickoutside();
  }

  updatePositionByMouseXY(mouseX, mouseY) {
    if (this.isHide) return;
    const { el } = this;
    const { height, width } = el.updateDisplayToBlock().updateElLTWH();
    let leftTop = this.coreSheet.tableViewForEvent.getContextMenuLeftTopByWidthHeight(mouseX, mouseY, width, height)
    el.updateElLTWH(leftTop);
    this.el.bindClickOutside()
  }
}
