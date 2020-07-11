// 测试 editor相关的用例
import {describe, it} from 'mocha';
import assert from "assert"
import { CoreSheet } from '../../src/core/core_data_proxy/core_sheet_change';
import { EditingCellProxy } from '../../src/component/comp_cell_editor/ref_selector_control_old';
import { isArrayEqual } from '../../src/calc/calc_data_proxy/loc_range_loc';
import { A1 } from '../../src/calc/calc_utils/config';
import { sampleCoreSheetSetting } from '../../src/global_utils/setting_sample';
import { CoreWorkbookProxy } from '../../src/core/core_cmd/core_workbook_editor';
import { CellRangeProxy } from '../../src/internal_module/cell_range';
import { isObjEquals } from '../../src/global_utils/dataproxy_helper';
import { MockTableCanvas } from '../../src/component/comp_table/table_canvas_comp';
import { SORT_DESC } from '../../src/core/core_data_proxy/core_sort_filter';
describe('测试core模块', () => {
  let theSheetName = "sheet1"
  let coreWorkbookEditor = new CoreWorkbookProxy()
  let coreSheet = coreWorkbookEditor.dealCreateASheet(theSheetName, sampleCoreSheetSetting)


  describe('基本功能 ', () => {
    it('初始化新的sheet', function () {
      let curCoreSheet = coreWorkbookEditor.getCoreSheetByName(theSheetName)
      let res = curCoreSheet.coreRows.multiCoreRow.getFormatCellByRowIDColID(0,0)
      assert.equal(res.formulas,"估值基准日期");
    });

    it('refresh', function () {
      let coreWorkbookEditor2 = new CoreWorkbookProxy()
      coreWorkbookEditor2.dealRefreshByCoreSheetSettingArray({sheet1:sampleCoreSheetSetting})
      let curCoreSheet = coreWorkbookEditor2.getCoreSheetByID(0)
      assert(curCoreSheet.coreRows.len, 26)
      assert(curCoreSheet.coreCols.len, 100)
    });

    it('递归获取与merge合并之后的区域', function () {
      let curCoreSheet = coreWorkbookEditor.getCoreSheetByName(theSheetName)
      curCoreSheet.multiCoreMerge.addMergeRange(new CellRangeProxy(6,4,9,5))
      curCoreSheet.multiCoreMerge.addMergeRange(new CellRangeProxy(11,3,15,4))
      let oriRange = new CellRangeProxy(5,4,11,4)
      let res = coreSheet.multiCoreMerge.expandToIncludeCrossMergeRange(oriRange)
      assert.ok(isArrayEqual(res.cellRangeIndexArray, [5,3,15,5]))
    });

    it('获取viewRange', function () {
      let curCoreSheet = coreWorkbookEditor.getCoreSheetByName(theSheetName)
      assert.equal(curCoreSheet.coreRows.multiCoreRow.getFormatCellByRowIDColID(0,0).cellStyleID, 0)
      curCoreSheet.tableViewForEvent.updateTableWHAndDevicePixelFunc(()=> 200, ()=>200, ()=>1) // 设置屏幕大小
      curCoreSheet.coreScrollBarProxy.updateByScrollX(0)
      curCoreSheet.coreScrollBarProxy.updateByScrollY(0)
      // headerWidth = 60, width = 100
      let colsInView = curCoreSheet.tableViewDetail.getColsInViewByMaxWidth()
      // headerHeight = 25, height = 10,10,10,
      let rowsInView = curCoreSheet.tableViewDetail.getRowsInViewByMaxHeight()
      let res = rowsInView.getInfoArray()
      assert.ok(isArrayEqual([colsInView.preTotalWidth, colsInView.totalWidth, colsInView.maxColID], [78, 185, 1]))
      assert.ok(isArrayEqual([rowsInView.preTotalHeight, rowsInView.totalHeight, rowsInView.maxRowID], [167, 185, 6]))

      curCoreSheet.coreScrollBarProxy.updateByScrollX(100) //移动滚动条
      curCoreSheet.coreScrollBarProxy.updateByScrollY(300)
      // headerWidth = 60, width = 100
      let colsInView2 = curCoreSheet.tableViewDetail.getColsInViewByMaxWidth()
      // headerHeight = 25, height = 10,10,10,...25.25...
      let rowsInView2 = curCoreSheet.tableViewDetail.getRowsInViewByMaxHeight()
      assert.ok(isArrayEqual([colsInView2.preTotalWidth, colsInView2.totalWidth, colsInView2.maxColID], [107, 245, 2]))
      assert.ok(isArrayEqual([rowsInView2.preTotalHeight, rowsInView2.totalHeight, rowsInView2.maxRowID], [150, 175, 17]))
      assert.equal(curCoreSheet.coreScrollBarProxy.scrollCi,1)
      assert.equal(curCoreSheet.coreScrollBarProxy.scrollRi,11)

    });

    it('测试tableView', function () {
      let curCoreSheet = coreWorkbookEditor.getCoreSheetByName(theSheetName)

      curCoreSheet.tableViewForEvent.updateTableWHAndDevicePixelFunc(()=> 500, ()=>500,()=>1) // 设置屏幕大小
      // autofilter
      curCoreSheet.coreSortFilter.applyFilterAndSortToRows()
      let singleSortFilterDetail = curCoreSheet.coreSortFilter.getDetailForFilterCompByCi(2)
      let maxScrollWidth = curCoreSheet.coreScrollBarProxy.getMaxScrollWidth()
      // 利用mockTableCanvas来获取数据
      let mockTableCanvas = new MockTableCanvas({}, curCoreSheet)

      curCoreSheet.coreScrollBarProxy.updateByScrollX(0)
      curCoreSheet.coreScrollBarProxy.updateByScrollY(125)
      let tableViewDetail = curCoreSheet.tableViewForEvent.easyRefreshTableViewDetail()
      tableViewDetail.updateAllTextLine(mockTableCanvas)

      curCoreSheet.coreScrollBarProxy.updateByScrollY(2000)
      let tableViewDetail2 = curCoreSheet.tableViewForEvent.easyRefreshTableViewDetail()
      tableViewDetail2.updateAllTextLine(mockTableCanvas)


      console.log("")
    });
    it('sortFilter更新', function () {
      let curCoreSheet = coreWorkbookEditor.getCoreSheetByName(theSheetName)

      curCoreSheet.tableViewForEvent.updateTableWHAndDevicePixelFunc(()=> 500, ()=>500,()=>1) // 设置屏幕大小
      // 执行原有的sortFilter
      curCoreSheet.coreSortFilter.applyFilterAndSortToRows()
      let sheetObj = coreWorkbookEditor.calcWorkbookEditor.getSheetsObj() // 方便看数据
      // 变更数据
      coreWorkbookEditor.dealInputFormulaOfSingleCell(curCoreSheet.coreSheetName, 4, 3, "12+1")
      // 执行新的排序
      let singleSortFilterDetail2 = curCoreSheet.coreSortFilter.getDetailForFilterCompByCi(1)
      singleSortFilterDetail2.updateByNewSortOrder(SORT_DESC) // 改变改需方法
      curCoreSheet.coreSortFilter.updateBySingleCoreSortFilter(singleSortFilterDetail2) // 更新排序

      // 利用mockTableCanvas来获取数据
      let mockTableCanvas = new MockTableCanvas({}, curCoreSheet)

      curCoreSheet.coreScrollBarProxy.updateByScrollX(0)
      curCoreSheet.coreScrollBarProxy.updateByScrollY(0)
      let tableViewDetail = curCoreSheet.tableViewForEvent.easyRefreshTableViewDetail()
      tableViewDetail.updateAllTextLine(mockTableCanvas)

      console.log("")
    });

    it('selector相关操作', function () {
      let curCoreSheet = coreWorkbookEditor.getCoreSheetByName(theSheetName)

      curCoreSheet.tableViewForEvent.updateTableWHAndDevicePixelFunc(()=> 500, ()=>500,()=>1) // 设置屏幕大小
      // 执行原有的sortFilter
      curCoreSheet.coreSortFilter.applyFilterAndSortToRows()
      let sheetObj = coreWorkbookEditor.calcWorkbookEditor.getSheetsObj() // 方便看数据
      // 执行新的排序
      let singleSortFilterDetail2 = curCoreSheet.coreSortFilter.getDetailForFilterCompByCi(1)
      singleSortFilterDetail2.updateByNewSortOrder(SORT_DESC) // 改变改需方法
      curCoreSheet.coreSortFilter.updateBySingleCoreSortFilter(singleSortFilterDetail2) // 更新排序

      // 利用mockTableCanvas来获取数据
      let mockTableCanvas = new MockTableCanvas({}, curCoreSheet)

      curCoreSheet.coreScrollBarProxy.updateByScrollX(0)
      curCoreSheet.coreScrollBarProxy.updateByScrollY(0)
      let tableViewDetail = curCoreSheet.tableViewForEvent.easyRefreshTableViewDetail()
      tableViewDetail.updateAllTextLine(mockTableCanvas)

      console.log("")
    });



    it('解析正在输入的formula', function () {
      coreSheet.calc.updateByCoreWorkbookAndChangeDetail(coreSheet)
      let aEditingCell =  new EditingCellProxy("=A1+A2 + sum(A1:A2",2,1, coreSheet) // 语法解析与rootExp都可以获取，计算结果为Error
      assert.equal(isArrayEqual(aEditingCell.getRefStrArrayByType(A1), ["A1", "A2"]), true);
    });
  });
})
