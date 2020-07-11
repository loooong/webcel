import * as helper from '../../global_utils/dataproxy_helper';
import { Validations } from './validation';
import { MultiPreAction } from './multi_pre_action';
import { CoreSelectorProxy } from './core_selector';
import { CoreScrollBarProxy } from './scroll';
import { CoreSortFilter, SortFilterSetting } from './core_sort_filter';
import { CELL_PROP_STYLE, DEFAULT_SHEET_NAME } from '../core_utils/config';
import { MultiCoreMerge } from './merge';
import { CoreRows } from './core_rows';
import { CoreCols } from './core_cols';
import { CoreClipSelector } from './clipboard';
import Chart from '../../chart/chart_cmd/chart';
import { MoveBhv } from '../../component/event_dealer/move_event_bhv';
import { isHave } from '../../global_utils/check_value';
import { CellProp } from './cell_prop';
import { xy2expr } from '../../global_utils/alphabet';
import { CellProxyForDraw } from './cell_proxy';
import { CoreWorkbookProxy } from '../core_cmd/core_workbook_editor';
import { Calc } from '../../calc/calc_cmd/calc';
import { getFontSizePxByPt } from '../core_utils/font';
import { getIntOfDevicePixel } from '../../component/comp_table/table_canvas_comp';
import { WorkbookEditor } from '../../calc/calc_cmd/workbook_editor';
import { TableViewForEvent } from './view_table_view';
import { TableViewDetail } from './view_table_view_detail';
import { CoreEventProxy } from './event_data_proxy';
import { CoreAutoFillSelector, CoreMoveSelector } from './core_move_selector';
import { CoreInputEditor } from './core_input_editor';

export const LINE_HEIGHT_FONT_RATIO = 1.2
export const DEFAULT_BG_COLOR = 'rgb(255,255,255)'
export const ALIGN_LEFT = "left"
export const ALIGN_BOTTOM = "bottom"

export class CellStyleSettings{ // 样式
  color: string
  autoAdapt: Boolean
  constructor(aObj = {}){
    this.bgcolor =  aObj.bgcolor || DEFAULT_BG_COLOR
    this.align =aObj.align || ALIGN_LEFT
    this.valign = aObj.valign||'middle'
    this.textwrap = aObj.textwrap || false
    this.strike =aObj.strike||false
    this.flexible = aObj.flexible || false
    this.underline = aObj.underline || false
    this.autoAdapt = aObj.autoAdapt || false
    this.color = aObj.color|| '#0a0a0a'
    this.border = new BorderSetting(aObj.border )
    this.fontConfig = aObj.fontConfig || {
      name: 'Arial',
      size: 10,
      bold: false,
      italic: false,
    }
  }
  getFontPropertyForCanvas(){
    return `${this.fontConfig.italic ? 'italic' : ''} ${this.fontConfig.bold ? 'bold' : ''} ${getIntOfDevicePixel(getFontSizePxByPt(this.fontConfig.size))}px ${this.fontConfig.name}`
  }
  getFontSizePx(){
    return getFontSizePxByPt(this.fontConfig.size)
  }
  getLineHeightPx(){
    return getFontSizePxByPt(this.fontConfig.size) * LINE_HEIGHT_FONT_RATIO
  }
  getTextLineStyleForCanvas():Object{
    return {
      textAlign: ALIGN_LEFT, // 统一用这个坐标系定位
      textBaseline: ALIGN_BOTTOM,
      font: this.getFontPropertyForCanvas(),
      fillStyle: this.color, // todo:  不做区分么？
      strokeStyle: this.color,
    }
  }
  getCssProperty2Value(){ // 转化为Css样式
    let cssObj = {
      "background-color": this.bgcolor,
      "text-align": this.align,
      "vertical-align":this.valign,
      "font-size": getFontSizePxByPt(this.fontConfig.size) + 'px',
      "color": this.color,
      "font-family": this.fontConfig.name,
      "font-style": this.fontConfig.italic?"italic" : "initial",
      "font-weight": this.fontConfig.bold?"bold" : "initial",
      "line-height": getFontSizePxByPt(this.fontConfig.size)* 1.25 + 'px',
    }
    if(this.strike || this.underline){
      cssObj["text-decoration"] =  this.underline? "underline":"" + this.strike? "line-through":""
    }
    else {
      cssObj["text-decoration"] ="initial"
    }
    return cssObj
  }
}
export class BorderSetting{
  topBorder: {style: string, color:string}
  bottomBorder: {style: string, color:string}
  leftBorder: {style: string, color:string}
  rightBorder: {style: string, color:string}
  constructor(aObj = {}){
    this.topBorder = aObj.topBorder
    this.bottomBorder = aObj.bottomBorder
    this.leftBorder = aObj.leftBorder
    this.rightBorder = aObj.rightBorder
  }
}

export class CoreSheetSetting{
  constructor(aObj = {}) {
    this.formula = aObj.formula || {}
    this.showGrid = aObj.showGrid || true
    this.showToolbar = aObj.showToolbar || true
    this.showEditor = aObj.showEditor || true
    this.showContextmenu = aObj.showContextmenu || true
    this.sortFilterSetting = aObj.sortFilterSetting || new SortFilterSetting()
    this.cellLoc2TextToValueConfig = aObj.cellLoc2TextToValueConfig || {} // 数据格式

    this.rowConfig = aObj.rowConfig || {
      len: 100,
      headerHeight: 22,
      defaultRowHeight: 25,
      minHeight: 20,
    }
    this.colConfig = aObj.colConfig || {
      len: 26,
      headerWidth: 30,
      defaultColWidth: 100,
      minWidth: 20,
    }
    this.rowsInit = aObj.rowsInit || false
    this.cellStyleConfig = aObj.cellStyleConfig || new CellStyleSettings()
    this.toolBarStyle = aObj.toolBarStyle || new CellStyleSettings()
    this.rowID2RowObj = aObj.rowID2RowObj || {}
    this.colID2ColObj = aObj.colID2ColObj || {}
    this.cellStyleArray = aObj.cellStyleArray || []
    this.mergeLocArray = aObj.mergeLocArray || [] // [0_1_2_3,2_2_3_4] 这样的代表merge范围的数据
    this.freezeRiCi = aObj.freezeRiCi || [0, 0]
    this.autoSortFilter = aObj.autoSortFilter || {}
  }
}

export class BaseCoreSheet {
  calc: Calc
  postChangeData: function
  // ======= 仅存在前端的状态 ====
  tableViewForEvent: TableViewForEvent
  coreClipSelector: CoreClipSelector // todo： 应该需要处理内部数据源与外部数据源，现在只能处理内部数据
  coreScrollBarProxy: CoreScrollBarProxy
  coreSelector: CoreSelectorProxy
  coreMoveSelector: CoreMoveSelector
  coreSheetID: number
// ==== coreSheetSetting影响到的数据，后端会保存 ====
  coreSheetSetting: CoreSheetSetting
  coreWorkbook: CoreWorkbookProxy
  coreRows: CoreRows
  coreCols: CoreCols
  multiCoreMerge: MultiCoreMerge
  coreSortFilter: CoreSortFilter
  exceptRowSet: Set<number>
  cellStyleArray: Array
  tableViewDetail:TableViewDetail
  coreAutoFillSelector:CoreAutoFillSelector
  coreInputEditor: CoreInputEditor

  constructor(sheetName, coreSheetSetting, coreWorkbookEditor) {
    // 兼容coreSheetSetting是Object的时候的情况
    this.coreSheetSetting =  coreSheetSetting instanceof CoreSheetSetting? coreSheetSetting : new CoreSheetSetting(coreSheetSetting); // 会使用默认配置+用户配置
    // save data begin
    this.validations = new Validations(); // 似乎是验证用户输入的字符串

    // ========== 编辑历史 ==========
    this.multiPreAction = new MultiPreAction(this); // 所有的改动历史信息
    this.changeDataForCalc = null; // 需要传递给calc的信息

    // ========== 单元格以外的可见元素 ===========
    this.name = sheetName || DEFAULT_SHEET_NAME; // 表格名称在用
    this.coreSheetName = sheetName // 不再使用.name属性，而是用coreSheetName属性
    this.coreSelector = new CoreSelectorProxy(this); // 选择器; sheetComp 还有一个Selector类
    this.coreMoveSelector = new CoreMoveSelector(this) // 移动框
    this.coreAutoFillSelector = new CoreAutoFillSelector(this)
    this.coreScrollBarProxy = new CoreScrollBarProxy(this); // 滚动条
    this.coreInputEditor = new CoreInputEditor(this)


    // ========== 与单元格渲染有关的属性 =============
    this.isShowFormula = false; // 应该是切换状态: 是否展示公式
    this.cellStyleArray = coreSheetSetting.cellStyleArray; // Array<Object> 一个数组，每个元素都是一个style对象{format:,font:}
    this.coreSortFilter = CoreSortFilter.fromSortFilterSetting(coreSheetSetting.sortFilterSetting, this); // 自动筛选
    this.exceptRowSet = new Set(); // 因为autofilter而被隐藏的行
    this.exceptColSet = new Set() // 隐藏的列


    // =========== 与单元格数据有关的属性 ==============
    // ======= 对应到wk的数据 ==============
    this.coreWorkbook = coreWorkbookEditor // 这个workbookEditor是对应多个sheet
    this.calc = this.coreWorkbook.calc;



    // // =======  本sheet的数据 ==============
    this.coreRows = new CoreRows(this, this.coreSheetSetting.rowID2RowObj)// 每一行的数据
    this.coreCols = new CoreCols(this, this.coreSheetSetting.colID2ColObj) // 每一列的数据
    this.multiCoreMerge = new MultiCoreMerge(this); // [CellRangeProxy, ...]
    this.coreClipSelector = new CoreClipSelector(this); // 剪切板
    this.postChangeData = () => { // 每次在数据更新之后会执行的函数
    };


    // ========== 与截图与图表有关的属性 ============
    this.pasteDirectionsArr = []; // 与截图有关的信息
    this.chart = new Chart(); // 图表？

    // ============== 行为属性，需要有其他的属性 =============
    this.tableViewForEvent = new TableViewForEvent(this, this.coreSheetSetting.freezeRiCi)
    this.coreEventProxy = new CoreEventProxy(this,{})




    // ============== 没有用到的属性 ==============
    this.moveBhv = new MoveBhv(); // 猜测是一个要被移动的Rangeq
    this.hyperlinks = {}; // 没有地方用到
    this.comments = {};// 没有地方用到



  }
  get tableViewDetail(){
    return this.tableViewForEvent.tableViewDetail
  }
  get coreSheetID(){ // 关联起来
    return this.coreWorkbook.calcWorkbookEditor.multiSheet.getSheetByName(this.coreSheetName).sheetID
  }
  get calcWorkbookEditor():WorkbookEditor{
    return this.coreWorkbook.calcWorkbookEditor
  }

  // 重新导入数据，在恢复历史版本或初始化的时候需要用到
  refreshByCoreSheetSetting(coreSheetSetting: CoreSheetSetting){
    // cols
    this.coreRows.len = coreSheetSetting
    // rows
    // merges
    // autofill
    // autoSortFilter
    // freeze
    // pictures
    // styles

  }
  // =========== 获取信息 =================
  getSheetName2ValueToTextSetting(){
    let theObj = {}
    theObj[this.coreSheetName] = this.coreSheetSetting.cellLoc2TextToValueConfig
    return theObj
  }
  getSheetName2SheetOption(){
    let theObj = {}
    theObj[this.coreSheetName] = {
      maxEditableRow : this.coreSheetSetting.rowConfig.len - 1, // 配置最大行ID与最大列ID
      maxEditableCol : this.coreSheetSetting.colConfig.len - 1
    }
    return theObj

  }

  getSelectedValidator() {
      const {riOfEditingCell, ciOfEditingCell} = this.coreSelector;
      const v = this.validations.get(riOfEditingCell, ciOfEditingCell);
      return v ? v.validator : null;
  }

  getSelectedValidation() {
    const { riOfEditingCell, ciOfEditingCell, selectedCoreRange } = this.coreSelector;
    const v = this.validations.get(riOfEditingCell, ciOfEditingCell);
    const ret = { ref: selectedCoreRange.toString() };
    if (v !== null) {
      ret.mode = v.mode;
      ret.validator = v.validator;
    }
    return ret;
  }

  makeCellPropArr(range, dsri, dsci) {
    let { coreRows } = this;
    let darr = [];
    let cells = coreRows.eachRange(range);
    for (let i = 0; i < cells.length; i++) {
      let { ri, ci, cell } = cells[i];

      if (isHave(cell) && isHave(cell.style) === false) {
        let cstyle = this.defaultStyle();
        cell.style = this.addStyle(cstyle);
      }

      let cellProp = new CellProp(ri + dsri, ci + dsci, cell, xy2expr(ri + dsri, ci + dsci));
      darr.push(cellProp);
    }

    return darr;
  }

  setCellByCellProp(pArr, cb) {
    let { coreRows } = this;
    for (let i = 0; i < pArr.length; i++) {
      let { ri, ci, cell } = pArr[i];
      if (isHave(cell) && isHave(cell.style)) {
        coreRows.setCell(ri, ci, cell, CELL_PROP_STYLE);
      }
      cb(ri, ci);
    }
  }



  editorChangeToHistory(oldCell, { ri, ci }, type) {
    if (ri === -1 || ci === -1) {
      return { 'state': false };
    }
    let newCell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
    if(isHave(newCell) === false){ // 没有输入任何文字的时候，newCell 为null
      return
    }
    let { multiPreAction } = this;
    let expr = xy2expr(ci, ri);
    let step = multiPreAction.getStepObjByChangeDetail(type, {
      ri,
      ci,
      expr,
      text: newCell.text
    });

    let oc = new CellProp(ri, ci, oldCell, expr);
    let nc = new CellProp(ri, ci, newCell, expr);
    multiPreAction.addStep(step, {
      oldCell: [oc],
      newCell: [nc]
    });
    // this.changeDataForCalc = this.getChangeDataToCalc();
    return {
      'state': true
    };
  }

  changeToHistory({ ri, type, ci, cellRange, property, value, oldCell, oldMergesData, len }, oldStep) {
    if (type === -1) {
      return { 'state': false, };
    }

    let { multiPreAction } = this;
    const { coreSelector } = this;

    let step = multiPreAction.getStepObjByChangeDetail(type, {
      expr: '',
      property,
      value,
      oldCell,
      range: coreSelector.selectedCoreRange,
      ri,
      ci,
      cellRange: cellRange,
    });
    multiPreAction.addStep(step, {
      oldCell,
      oldMergesData,
      newMergesData: this.multiCoreMerge.getA1A2StrArray(),
      oldStep,
      len,
    });
    return {
      'state': true
    };
  }


  getClipboardRect() {
    const { coreClipSelector } = this;
    if (!coreClipSelector.isClear()) {
      return this.tableViewForEvent.getRangePstLTHW(coreClipSelector.clipCellRange);
    }
    return { // 没有innerClipBoard的时候，应该不可见
      left: -100,
      top: -100,
      height: 0,
      width: 0,
      l: 0,
      t: 0,
      scroll: this.coreScrollBarProxy
    };
  }





  isSignleSelected() {
    const {
      sri, sci, eri, eci,
    } = this.coreSelector.selectedCoreRange;
    const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(sri, sci);
    if (cell && cell.merge) {
      const [rn, cn] = cell.merge;
      if (sri + rn === eri && sci + cn === eci) return true;
    }
    return !this.coreSelector.selectedCoreRange.isEndLargerThanStart();
  }

  canAutofilter() {
    return !this.coreSortFilter.isSortFilterActive();
  }


  getMax() {
    let mci = this.coreCols.len;
    let mri = this.coreRows.len;

    return {
      mri,
      mci
    };
  }


  // isEmpty(cell) {
  //     return this.coreRows.isEmpty(cell);
  // }

  getCellTextByDataFormat(style, cell, nrindex, cindex, filter) : {state: boolean, cellText: string}{ // 会废弃掉
    let cellProxy = new CellProxyForDraw(cell);
    return cellProxy.renderFormat(style, nrindex, cindex, this, filter);
  }

  isFormula(text) {
    return this.coreRows.isFormula(text);
  }

  toString(text) {
    return this.coreRows.toString(text);
  }

  // isBackEndFunc(text) {
  //     return this.coreRows.isBackEndFunc(text);
  // }

  // isReferOtherSheet(cell) {
  //     return this.coreRows.isReferOtherSheet(cell);
  // }

  getCellTextOrDefault(ri, ci) {
    const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
    return (cell && cell.getText()) ? cell.getText() : '';
  }

  getCellStyle(ri, ci) {
    const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
    if (cell && cell.cellStyleID !== undefined) {
      return this.cellStyleArray[cell.cellStyleID];
    }
    return null;
  }

  // getCellStyleHandle(index, type, cell, ri, ci) {
  //     let style = this.styles[index];
  //
  //     if (style && style.format === type) {
  //         return true;
  //     }
  //     return false;
  // }

  getCellStyleSetting(ri, ci):CellStyleSettings { // 需要转移到CoreTableView
    const { cellStyleArray } = this;
    const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
    if(cell && cell.cellStyleID !== undefined){
      return new CellStyleSettings(this.cellStyleArray[cell.cellStyleID])
    }
    else {
      return new CellStyleSettings()
    }
  }

  getSelectedCellStyle() :CellStyleSettings{// 需要转移到CoreTableView
    const { riOfEditingCell, ciOfEditingCell } = this.coreSelector;
    return this.getCellStyleSetting(riOfEditingCell, ciOfEditingCell);
  }

  getCellByExpr(src, table, name, inputText, pos) {
    // let p1 = inputText.substring(0, pos);
    // let p2 = inputText.substring(pos, inputText.length);
    // inputText = p1 + src + p2;
    // let name2SheetProxy = parseCell2.call(table, this.viewRange(), true, inputText);
    // return {
    //     "text": name2SheetProxy['Sheets'][name].A1.w ? name2SheetProxy['Sheets'][name].A1.w : name2SheetProxy['Sheets'][name].A1.v,
    //     "formulas": p1 + `${name}!` + src + p2
    // };
  }


  // setCellWithFormulas(ri, ci, text, formulas, what = 'all') {
  //     const {coreRows} = this;
  //     coreRows.setCellAll(ri, ci, text, formulas, what);
  // }


  equationIsActive() {
    return this.isShowFormula;
  }

  defaultStyle() {
    return this.coreSheetSetting.toolBarStyle;
  }

  // 如果nstyle 在this.styles已经存在，范围位置，如果没有存在则返回新的地址
  addStyle(nstyle) {
    const { cellStyleArray } = this;
    for (let i = 0; i < cellStyleArray.length; i += 1) {
      const style = cellStyleArray[i];
      if (helper.isObjEquals(style, nstyle)) return i;
    }
    cellStyleArray.push(nstyle);
    return cellStyleArray.length - 1;
  }

  // addPicture(pic) {
  //     const {pictures} = this;
  //
  // }



}
