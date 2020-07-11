import { CoreSheet } from './core_sheet_change';
import { TableViewForEvent } from './view_table_view';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { CellPstDetail } from './position_detail';

export const EVENT_MOVE_RANGE_BY_MOUSE = "move_range"
export const EVENT_SELECT_AUTOFILL_RANGE = "select_auto_fill"
export const EVENT_SELECT_RANGE_BY_MOUSE_MOVE = "select_range_by_mouse_move"
export const EVENT_SELECT_RANGE_BY_CLICK_LAST_CELL = "select_range_by_last_cell"
export const EVENT_CLICK_FILTER_BUTTON = "click_filter_button"
export class CoreMouseEvent {
  mouseEvent: MouseEvent;

  constructor(mouseEvent) {
    this.mouseEvent = mouseEvent;
  }

  isLeftClick() {
    return this.mouseEvent.buttons === 1;
  }

  isRightClick() {
    return this.mouseEvent.buttons === 2; //  代表右击
  }

  isDoubleClick() {
    return this.mouseEvent.detail === 2;
  }

}

export class CoreEventProxy{
  coreSheet: CoreSheet
  tableViewForEvent: TableViewForEvent

  constructor(coreSheet, aObj = {}){
    this.coreSheet = coreSheet
    this.tableViewForEvent = this.coreSheet.tableViewForEvent
    Object.assign(this, aObj)
  }
  updateCoreScrollByEvent(evt: WheelEvent){
    let downStep = evt.deltaY > 0? 1:-1
    this.coreSheet.coreScrollBarProxy.updateByDownRightStep(downStep)
  }
  getIsTargetSelectorMargin(evt: MouseEvent) {
    let targetClassName: string = evt.target.className
    return targetClassName.startsWith(`${CSS_PREFIX}-selector-box`);
  }
  getIsTargetSelectorCorner(evt: MouseEvent) {
    return evt.target.className === `${CSS_PREFIX}-selector-corner`;
  }

  // 这个方法是对overlay的左点击事件进行归类
  getOverlayEventTypeByLeftClick(cellPstDetail:CellPstDetail, mouseEvent: MouseEvent){
    if(this.coreSheet.coreSortFilter.isClickOnSortFilterButton(cellPstDetail)){
      return EVENT_CLICK_FILTER_BUTTON
    }
    let isTargetSelectorCorner = this.getIsTargetSelectorCorner(mouseEvent)
    if (!mouseEvent.shiftKey && this.getIsTargetSelectorMargin(mouseEvent)) {
      return EVENT_MOVE_RANGE_BY_MOUSE
    } else if (!mouseEvent.shiftKey && isTargetSelectorCorner) {
      return EVENT_SELECT_AUTOFILL_RANGE
    } else if (!mouseEvent.shiftKey && !isTargetSelectorCorner) { // 左单击
      return EVENT_SELECT_RANGE_BY_MOUSE_MOVE
    } else if (mouseEvent.shiftKey && !isTargetSelectorCorner) { // 左单击才会有
      return EVENT_SELECT_RANGE_BY_CLICK_LAST_CELL
    }
  }
}

