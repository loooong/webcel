import { h } from '../basic_unit/element';
import Button from '../basic_unit/button';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { t } from '../../locale/locale';
import {
  CoreTextFilter,
  SORT_ASC,
  SORT_DESC, TEXT_FILTER_IN, TEXT_FILTER_ALL, SingleSortFilterDetail
} from '../../core/core_data_proxy/core_sort_filter';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { isHave } from '../../global_utils/check_value';
import { CoreSort } from '../../core/core_data_proxy/core_sort';
import { CellPstDetail } from '../../core/core_data_proxy/position_detail';

export const BUTTON_NAME_OK = 'ok';
export const BUTTON_NAME_CANCEL = 'cancel';
export function isHaveMsg(res) {
  return isHave(res) && isHave(res.msg)
}
export class SortFilterComp {
  sheetComp: SheetComp;
  coreSheet: CoreSheet;
  tindex: number;
  curColID: number;
  textChoiceArray: string[];
  curChoosingAllowValues: string[]; // 当前选中的允许的value数组
  singleSortFilterDetail: SingleSortFilterDetail
  coreFilter: CoreTextFilter
  constructor(sheetComp) {
    this.sheetComp = sheetComp;
    this.coreSheet = this.sheetComp.coreSheet;
    this.filterBodyEl = h('div', `${CSS_PREFIX}-body`); // 两个子元素
    this.filterHeaderEl = h('div', `${CSS_PREFIX}-header state`)
      .on('click.stop', () => this.dealClickOnAllowValue(0, TEXT_FILTER_ALL));
    this.tindex = 1;
    this.el = h('div', `${CSS_PREFIX}-sort-filter`)
      .children(
        this.sortAscEl = this.buildSortItem(SORT_ASC), // 正序排列的item
        this.sortDescEl = this.buildSortItem(SORT_DESC),// 逆序排列的item
        this.buildMenu('divider'), // 建立menu
        h('div', `${CSS_PREFIX}-filter`)
          .children(
            this.filterHeaderEl,
            this.filterBodyEl,
          ),
        h('div', `${CSS_PREFIX}-buttons`)
          .children( // 建立buttons
            new Button(BUTTON_NAME_CANCEL).on('click', () => this.btnClick(BUTTON_NAME_CANCEL)),
            new Button(BUTTON_NAME_OK, 'primary').on('click', () => this.btnClick(BUTTON_NAME_OK)),
          ),
      )
      .hide();
    // this.setFilters(['test1', 'test2', 'text3']);
    this.el.on('mousedown.stop', evt => {
      this.tindex = 1; // todo： 这个属性还不知道是什么意思
    });

  }
  get curColID(){
    return this.singleSortFilterDetail.curColID
  }
  get textChoiceArray(){
    return Object.keys(this.singleSortFilterDetail.text2Count)
  }
  get coreFilter(){
    return this.singleSortFilterDetail.coreFilter
  }

  get coreSortOrder() {
    return this.coreSheet.coreSortFilter.coreSort.sortOrder;
  }
  get coreSort(){
    return this.singleSortFilterDetail.coreSort
  }

  // ======== 创建组件与绑定事件 =============

  buildMenu(clsName) {
    return h('div', `${CSS_PREFIX}-item ${clsName}`);
  }

  buildSortItem(it) {
    let textOnMenu = t(`sort.${it}`)
    return this.buildMenu('state')
      .appendChildByStrOrEl(textOnMenu)
      .on('click.stop', () => this.choseSortType(it));
  }

  // 点击之后展示控件
  showFilterMenuByCellPst(cellPstDetail:CellPstDetail) {
    this.singleSortFilterDetail = this.coreSheet.coreSortFilter.getDetailForFilterCompByCi(cellPstDetail.ci);
    this.sortAscEl.updateActiveClassByFlag(this.coreSort.isAsc());
    this.sortDescEl.updateActiveClassByFlag(this.coreSort.isDesc());
    // this.setFilters(text2Count, filter);
    this.buildFilterBody();
    this.restSelectAllItem();
    this.setOffset({
      left: cellPstDetail.left,
      top: cellPstDetail.top + cellPstDetail.height + 2
    });
  }

  buildFilterBody() {
    const { filterBodyEl } = this;
    filterBodyEl.updateInnerHtml('');
    this.singleSortFilterDetail.applyToEveryTextAndCount(
      (uniqueText, cnt, textID) => {
        const isActive = this.coreFilter.isAllowCurText(uniqueText) ? 'checked' : '';
        filterBodyEl.appendChildByStrOrEl(h('div', `${CSS_PREFIX}-item state ${isActive}`)
          .on('click.stop', () => this.dealClickOnAllowValue(textID, uniqueText))
          .children(uniqueText === '' ? t('filter.empty') : uniqueText, h('div', 'label')
            .updateInnerHtml(`(${cnt})`))); // 空白
      }
    )
  }

  btnClick(it) { // 点击事件
    if (it === BUTTON_NAME_OK) {
      this.exeUpdateFilter();
    }
    this.hide();
  }

  exeUpdateFilter() { // 执行ok时间
    this.singleSortFilterDetail.updateCoreFilterByChoosingArray()
    let res = this.sheetComp.coreSheet.coreSortFilter.updateBySingleCoreSortFilter(this.singleSortFilterDetail);
    if(isHaveMsg(res)){
      console.log(res.msg) // todo: 之后需要给出弹窗提示
    }
    else {
      this.sheetComp.sheetReset();
    }
  }

  choseSortType(it) { // 执行选择sortType的事件： todo: 点击后应该触发排序事件？
    this.singleSortFilterDetail.updateByNewSortOrder(it);
    const { sortAscEl, sortDescEl } = this;
    sortAscEl.updateActiveClassByFlag(it === SORT_ASC);
    sortDescEl.updateActiveClassByFlag(it === SORT_DESC);
  }

  dealClickOnAllowValue(textID, uniqueText) {
    const { filterBodyEl,  textChoiceArray } = this;
    const children = filterBodyEl.children();
    if (uniqueText === TEXT_FILTER_ALL) { // 全选或取消全选
      if (this.singleSortFilterDetail.isChoosingAll()) {
        this.singleSortFilterDetail.updateChoosingArray([]);
        children.forEach(i => h(i)
          .updateActiveClassByFlag(false));
      } else {
        this.singleSortFilterDetail.updateChoosingArray(textChoiceArray)
        children.forEach(i => h(i)
          .updateActiveClassByFlag(true));
      }
    } else {
      const checked = h(children[textID])
        .toggle('checked');
      if (checked) {
        this.singleSortFilterDetail.curChoosingAllowValues.push(uniqueText);
      } else {
        this.singleSortFilterDetail.removeTextFromChoosingArray(uniqueText); // textID
      }
    }

    this.restSelectAllItem();
  }


  setOffset(v) {
    if (this.el.isDisplayBlock()) {
      this.hide();
      return;
    }
    this.el.updateElLTWH(v)
      .updateDisplayToBlock();
    this.tindex = 1;
    this.el.bindClickOutside(() => {
      if (this.tindex === 0) {
        this.hide();
      }
      this.tindex = 0;
    });
  }

  show() {
    this.el.updateDisplayToBlock();
  }

  hide() {
    this.el.hide();
    this.el.unbindClickoutside();
  }



  restSelectAllItem() { // 更新全选按钮
    const { filterHeaderEl, curChoosingAllowValues, textChoiceArray } = this;
    // filterHeaderEl.updateInnerHtml(`${curChoosingAllowValues.length} / ${textChoiceArray.length}`);
    filterHeaderEl.updateInnerHtml(t('filter.chooseAll'));
    filterHeaderEl.updateActiveClassByFlag(this.singleSortFilterDetail.isChoosingAll());
  }
}
