import { MultiRelation } from '../calc_data_proxy/multi_relation';
import {
  FAIL_OBJ_EDIT,
  FAIL_OBJ_INSERT_RANGE_OVERLAP,
  FAIL_OBJ_SHIFT_RANGE_OVERLAP_CUT_RANGE
} from '../calc_utils/error_config';
import {
  DeleteRangeShiftLeftDealer,
  DeleteRangeShiftUpDealer,
  InsertRangeShiftDownDealer,
  InsertRangeShiftRightDealer
} from '../edit_dealer/insert_range';
import { AutoFillDealer } from '../edit_dealer/autofill';
import { MultiSheetProxy } from '../calc_data_proxy/multi_sheet';
import { MultiMergeLoc } from '../calc_data_proxy/multi_merge_loc';
import { MultiCalcCell } from '../calc_data_proxy/multi_calcCell';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';
import { MergeRangeDealer } from '../edit_dealer/merge_range';
import { RangeLocProxy } from '../calc_data_proxy/loc_range_loc';
import { WorkbookSolver } from './workbook_solver';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { CalcWorkbookProxy } from './calc_workbook';
import { isCalcResError } from '../../global_utils/func_for_calc_core';
import { MultiValue2TextSetting } from '../calc_data_proxy/multi_value_to_text_setting';
import { myLog, PRINT_LEVEL3 } from '../../log/new_log';

export function genEqualDiffArray(start, arrayLength, diff = 1) {
  return [...Array(arrayLength)].map((e, i) => start + diff * i);
}

export class WorkbookEditor { // 对workbook进行修改的行为类
  calcWorkbook: CalcWorkbookProxy;
  multiSheet: MultiSheetProxy;
  multiMergeLoc: MultiMergeLoc;
  multiCalcCell: MultiCalcCell;
  multiRelation: MultiRelation;
  workbookSolver: WorkbookSolver;
  multiValue2TextSetting: MultiValue2TextSetting;

  constructor(calcWorkbook) {
    this.calcWorkbook = calcWorkbook;
    this.multiSheet = new MultiSheetProxy(this.calcWorkbook);
    this.multiMergeLoc = new MultiMergeLoc(this, {});
    this.multiCalcCell = new MultiCalcCell(this, {}, {});
    this.multiRelation = new MultiRelation(this, {});
    this.workbookSolver = new WorkbookSolver(this);
    this.multiValue2TextSetting = new MultiValue2TextSetting(this); // todo: 需要处理删除sheet，剪切黏贴等操作
  }

  // 从coreSheetArray中获取数据来更新WorkbookEditor
  refreshSelfByCoreSheetArray(coreSheetArray: Array<CoreSheet>) {
    this.clearContentForAllSheet(true); // 删除所有的sheet
    let sheetName2CellLoc2Formula = {};
    let sheetName2CellLoc2ValueToTextSetting = {};
    let sheetName2SheetOptions = {};
    for (let coreSheet of coreSheetArray) { // 获取sheetName2CellLoc2Formula
      Object.assign(sheetName2CellLoc2Formula, coreSheet.coreRows.getSheetName2CellLoc2Formula());
      Object.assign(sheetName2CellLoc2ValueToTextSetting, coreSheet.getSheetName2ValueToTextSetting());
      Object.assign(sheetName2SheetOptions, coreSheet.getSheetName2SheetOption());
    }
    this.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula, sheetName2SheetOptions, sheetName2CellLoc2ValueToTextSetting); // 更新多Sheet
    for (let coreSheet of coreSheetArray) { // 用计算好的数据更新给coreRoes
      let rowID2ColIndex2CoreCell = this.getRowID2ColIndex2CoreCellBySheetName(coreSheet.coreSheetName); // todo：未来要支持多sheet
      coreSheet.coreRows.updateAllByRowID2ColIndex2CoreCell(rowID2ColIndex2CoreCell);
    }
  }

  editAddASheetByCoreSheet(coreSheet: CoreSheet) {
    let sheetName2CellLoc2Formula = coreSheet.coreRows.getSheetName2CellLoc2Formula();
    // 更新workbookEditor； coreSheet需要把相关的信息传递workbookEditor
    // maxEditableRow, maxEditableCol, 合并单元格等数据需要workbookEditor来维护更新
    this.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula, coreSheet.getSheetName2SheetOption(), coreSheet.getSheetName2ValueToTextSetting());
    // 获取merge的情况
    let sheetID2mergeFullLoc = {};
    sheetID2mergeFullLoc[coreSheet.coreSheetID] = coreSheet.coreSheetSetting.mergeLocArray; // 加入merge的情况
    this.multiMergeLoc.simpleUpdateBySheetID2mergeFullLoc(sheetID2mergeFullLoc); // 更新合并单元格
    // 更新单元格数值
    let rowID2ColIndex2CoreCell = this.getRowID2ColIndex2CoreCellBySheetName(coreSheet.coreSheetName);
    coreSheet.coreRows.updateAllByRowID2ColIndex2CoreCell(rowID2ColIndex2CoreCell);
    // 获取text2value的情况
  }

  // =========== 查询 ===========

  getRowID2ColIndex2CoreCellBySheetName(sheetName: string): {} {
    let calcSheet = this.multiSheet.getSheetByName(sheetName);
    let cellLoc2CellID = this.multiCalcCell.sheetID2CellLoc2CellID[calcSheet.sheetID];
    let rowID2ColIndex2CoreCell = {};
    for (let [cellLoc, cellID] of Object.entries(cellLoc2CellID)) {
      let cellLocProxy = new CellLocStrProxy(cellLoc);
      if (rowID2ColIndex2CoreCell.hasOwnProperty(cellLocProxy.rowID) === false) {
        rowID2ColIndex2CoreCell[cellLocProxy.rowID] = {};
      }
      let curCalcCell = this.multiCalcCell.getCellByID(cellID);
      rowID2ColIndex2CoreCell[cellLocProxy.rowID][cellLocProxy.colID] = curCalcCell.updateCellObj();
    }
    return rowID2ColIndex2CoreCell;
  }

  /**
   * 获取 Sheet1 -> A1 -> {f: ,v:} 这样的形式的结果
   */
  getSheetsObj() {
    let sheetsObj = {};
    for (let [sheetID, cellLoc2CellID] of Object.entries(this.multiCalcCell.sheetID2CellLoc2CellID)) {
      let cellName2CellOBj = {};
      sheetsObj[this.multiSheet.getNameByID(sheetID)] = cellName2CellOBj;
      for (let [cellLoc, cellID] of Object.entries(cellLoc2CellID)) {
        let curCell = this.multiCalcCell.getCellByID(cellID);
        let curCellName = new CellLocStrProxy(cellLoc).getCellName();
        cellName2CellOBj[curCellName] = {
          f: curCell.formulaString,
          v: curCell.cellObj.v,
          calcCell: curCell
        };
      }
    }
    sheetsObj['merge'] = this.multiMergeLoc.getSheetName2MergeRange();
    return sheetsObj;
  }

  getCellBySheetNameAndCellName(sheetName, cellName) {
    let sheetID = this.multiSheet.getIDByName(sheetName);
    let cellLocStr = CellLocStrProxy.cellName2CellLoc(cellName);
    return this.multiCalcCell.getCellBySheetIDAndCellLoc(sheetID, cellLocStr);
  }

  getCalcCellArrayByNames(cellNames, sheetName) {
    let theSheet = this.ensureGetSheet(sheetName);
    return cellNames.map((cellName) => theSheet.getCellByName(cellName));
  }

  ensureGetSheet(sheetName) {
    return this.multiSheet.ensureGetSheet(sheetName);
  }

  ensureGetCellByName(sheetName, cellName) {
    let theSheet = this.multiSheet.getSheetByName(sheetName);
    let theCalcCell = theSheet.getCellByName(cellName);
    if (typeof theCalcCell == 'undefined') {
      return theSheet.createCalcCell(cellName, { f: '' }); // 空的字符串
    } else {
      return theCalcCell;
    }
  }

  // ============== 编辑 =============
  clearContentForAllSheet(isDeleteSheet = true) { // 删除所有的信息，保留sheet的结构
    this.multiMergeLoc.clearContent();
    this.multiCalcCell.clearContent(isDeleteSheet);
    this.multiRelation.clearContent();
    this.multiValue2TextSetting.clearContent();
    if (isDeleteSheet) {
      this.multiSheet.clearContent();
    }
  }

  updateACellByCellObj(sheetID, cellLoc, cellObj) {

    let theCell = this.multiCalcCell.getCellBySheetIDAndCellLoc(sheetID, cellLoc);
    if (typeof theCell === 'undefined') {
      let theSheet = this.multiSheet.getSheetByID(sheetID);
      // 新建calcCell
      theCell = theSheet.createCalcCell(new CellLocStrProxy(cellLoc).getCellName(), cellObj);
    } else {
      theCell.updateByCellObj(cellObj);
    }
    return theCell;
  }


  // ============ edit前缀的方法，对外提供操作逻辑 ===========
  // ===== 批量更新单元格的公式
  /**
   * 如果没有发现指定的sheetName，会新建calcSheet，
   * 然后调用updateBySheetID2CellLoc2Formula进行更新
   * @param sheetName2CellLoc2Formula
   * @param sheetName2SheetOptions
   * @param sheetName2CellLoc2ValueToTextOptions
   */
  editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula, sheetName2SheetOptions = {}, sheetName2CellLoc2ValueToTextOptions = {}) {
    let sheetID2CellLoc2Formula = this.multiSheet.ensureGetSheetID2Loc2Formula(sheetName2CellLoc2Formula, sheetName2SheetOptions);
    let sheetID2CellLoc2ValueToTextOptions = {};
    for (let [sheetName, cellLoc2ValueToTextOptions] of Object.entries(sheetName2CellLoc2ValueToTextOptions)) {
      sheetID2CellLoc2ValueToTextOptions[this.multiSheet.getIDByName(sheetName)] = cellLoc2ValueToTextOptions;
    }
    this.multiValue2TextSetting.updateBySheetID2CellLoc2ValueToTextSetting(sheetID2CellLoc2ValueToTextOptions);
    this.editUpdateBySheetID2CellLoc2Formula(sheetID2CellLoc2Formula);
  }

  // {0!0_1 -> "=12" } 这样的数据结构，更新workbook
  editUpdateBySheetID2CellLoc2Formula(sheetID2CellLoc2Formula) {
    // 遍历所有的结果,更新calcCell的formulaString属性
    let beginArray = this.multiSheet.updateBySheetID2Loc2Formula(sheetID2CellLoc2Formula);
    let endFullLocSet = this.workbookSolver.getEndFullLocSet(beginArray);
    // 在beginArray内的话，需要重新解析公式；不在beginArray以内的话需要，只需要重新计算
    return this.workbookSolver.recalculateEndFullLocSet(beginArray, endFullLocSet);
  }


  editUpdateByName2CellObj(name2CellObj, sheetName) {
    let cellLoc2Formula = {};
    for (let [cellName, cellObj] of Object.entries(name2CellObj)) {
      cellLoc2Formula[CellLocStrProxy.cellName2CellLoc(cellName)] = cellObj.f;
    }
    let sheetName2CellLoc2Formula = {};
    sheetName2CellLoc2Formula[sheetName] = cellLoc2Formula;
    return this.editDeleteSheetByName(sheetName2CellLoc2Formula);
  }

  // ==== 对sheet的操作放在这里


  /**
   *
   * @param {String} oldSheetName
   * @param {String} newSheetName
   */
  editRenameSheet(oldSheetName, newSheetName) {
    let sheetID = this.multiSheet.replaceOldNameByNewName(oldSheetName, newSheetName);
    // (1)找到所有的引用了oldSheetName的单元格得到toChangeCellIdArray
    let cellID2RefSyntaxUnit = this.multiRelation.getToCellID2PstIDByFromSheetID(sheetID);
    let toChangeCellIdArray = Object.keys(cellID2RefSyntaxUnit);
    let changedCellArray = this.multiCalcCell.updateCellFormulaByRenameSheet(toChangeCellIdArray, oldSheetName, newSheetName);
    return changedCellArray; // 有改变的单元格列表
  }

  removeSheetBeforeUpdateFormula(sheetName) {
    let delSheetID = this.multiSheet.deleteSheetByName(sheetName);
    // 更新 sheetID2mergeLoc
    this.multiMergeLoc.deleteBySheetID(delSheetID);
    let toDelCellIDArray = this.multiCalcCell.removeCellBySheetID(delSheetID);
    this.multiRelation.removeRelationByToCellIDArray(toDelCellIDArray);
    return delSheetID;
  }

  /**
   * 删除指定的sheetName
   * @param sheetName
   */
  editDeleteSheetByName(sheetName) {
    let delSheetID = this.removeSheetBeforeUpdateFormula(sheetName);
    let beginCellIDArray = this.multiRelation.updateFormulaByDeleteSheet(delSheetID);
    return this.workbookSolver.recreateByBeginCellIDArray(beginCellIDArray);
  }


  // ==== 对range的操作放在这里 ====

  /**
   * 合并单元格
   * @param sheetName
   * @param rangeLoc 0_2_3_4 这样的形式；合并某一行某一列都会转变为这样的形式
   * @return {{msg}}
   */
  editMergeRange(sheetName, rangeLoc) {
    return new MergeRangeDealer(this).easyDeal(sheetName, rangeLoc);
  }

  /**
   * 取消合并单元格
   * 返回被取消合并的单元格范围列表
   */
  editUnMergeRange(sheetName, rangeLoc) {
    let theSheetID = this.multiSheet.getIDByName(sheetName);
    if (typeof theSheetID === 'undefined') { // 没有这个名字
      return FAIL_OBJ_EDIT;
    }
    let reqRangeProxy = new RangeLocProxy(rangeLoc);
    return this.multiMergeLoc.deleteMergeInRange(theSheetID, reqRangeProxy);
  }


  /**
   * 在某个sheet内插入空白区域， 向右移动
   * @param sheetName
   * @param rangeLoc
   */
  editInsertRangeShiftRight(sheetName, rangeLoc) {
    return new InsertRangeShiftRightDealer(this).easyDeal(sheetName, rangeLoc);
  }

  /**
   * 在某个sheet内插入空白区域， 向下移动
   * @param sheetName
   * @param rangeLoc
   */
  editInsertRangeShiftDown(sheetName, rangeLoc) {
    return new InsertRangeShiftDownDealer(this).easyDeal(sheetName, rangeLoc);
  }


  /**
   * 删除某块区域
   * @return {Array}
   * @param sheetName
   * @param rangeLoc
   */
  editDeleterRangeShiftLeft(sheetName, rangeLoc) {
    return new DeleteRangeShiftLeftDealer(this).easyDeal(sheetName, rangeLoc);
  }

  editDeleterRangeShiftUp(sheetName, rangeLoc) {
    return new DeleteRangeShiftUpDealer(this).easyDeal(sheetName, rangeLoc);
  }

  /**
   * 从原先的位置复制黏贴到新的位置上; 先做全等区域黏贴
   * @param oriSheetName
   * @param oriRangeLoc
   * @param dstSheetName
   * @param dstRangeLoc
   */
  editInternalCopyPasteEqualArea(oriSheetName, oriRangeLoc, dstSheetName, dstRangeLoc) {
    let oriSheetID = this.multiSheet.getIDByName(oriSheetName);
    let dstSheetID = this.multiSheet.getIDByName(dstSheetName);
    let oriRangeProxy = new RangeLocProxy(oriRangeLoc);
    let dstRangeProxy = new RangeLocProxy(dstRangeLoc);

    // 把dstRange中的合并单元格都删除，然后复制oriRange中的合并单元格，oriRange与dstRange不能与合并单元格有交叉。
    this.multiMergeLoc.pasteMergeRange(oriSheetID, oriRangeProxy, dstSheetID, dstRangeProxy);
    let shiftArray = oriRangeProxy.getShiftArrayToOther(dstRangeProxy);
    let dstSheetID2CellLoc2Formula = {};
    dstSheetID2CellLoc2Formula[dstSheetID] = this.getCellLoc2FormulaByShiftArray(oriSheetID, oriRangeProxy, shiftArray);
    // 更新。
    return this.editUpdateBySheetID2CellLoc2Formula(dstSheetID2CellLoc2Formula);
  }

  getCellLoc2FormulaByShiftArray(oriSheetID, oriRangeProxy, shiftArray) {
// 获取[shiftRightNumber, shiftDownNumber]，把oriRange中的structuralEquation 的formula进行更新。
    let oriCellLocArray = oriRangeProxy.getCellLocArray(); // 获取所有的位置
    //获取sheetID2CellLoc2Formula，
    let dstCellLoc2Formula = {};
    oriCellLocArray.forEach(
      cellLoc => {
        let dstCellLocProxy = new CellLocStrProxy(cellLoc);
        dstCellLocProxy.updateCellLocByShiftArray(shiftArray);
        let oriCalcCell = this.multiCalcCell.getCellBySheetIDAndCellLoc(oriSheetID, cellLoc);
        if (typeof oriCalcCell === 'undefined') {
          dstCellLoc2Formula[dstCellLocProxy.cellLocStr] = ''; // 为空
        } else {
          dstCellLoc2Formula[dstCellLocProxy.cellLocStr] =
            oriCalcCell.updateFormulaStringByShiftArray(shiftArray, false);
        }
      }
    );
    return dstCellLoc2Formula;
  }

  // 处理区域面积有差异的情况
  editInternalCopyPasteAnyArea(oriSheetName, oriRangeLoc, dstSheetName, dstRangeLoc) {
    let oriSheetID = this.multiSheet.getIDByName(oriSheetName);
    let dstSheetID = this.multiSheet.getIDByName(dstSheetName);
    let oriRangeProxy = new RangeLocProxy(oriRangeLoc);
    let dstRangeProxy = new RangeLocProxy(dstRangeLoc);
    let shiftArray = oriRangeProxy.getShiftArrayToOther(dstRangeProxy);

    // 如果 oriRange的行数 = 1，且dstRange的列数是oriRange的列数的整数倍那么可以循环黏贴dstRange的每一行
    if (oriRangeProxy.getRowNumber() === 1 && (dstRangeProxy.getColNumber() % oriRangeProxy.getColNumber() === 0)) {
      let shiftDownArray = genEqualDiffArray(shiftArray[0], dstRangeProxy.getRowNumber());
      let shiftRightArray = genEqualDiffArray(shiftArray[1],
        dstRangeProxy.getColNumber() / oriRangeProxy.getColNumber(), oriRangeProxy.getColNumber());
      // 把dstRange中的合并单元格都删除，然后复制oriRange中的合并单元格
      this.multiMergeLoc.pasteMergeManyTime(oriSheetID, oriRangeProxy, dstSheetID, dstRangeProxy, shiftDownArray, shiftRightArray);
      // 获取更新的数值
      let cellLoc2Formula = this.getCellLoc2FormulaByMultiShift(shiftDownArray, shiftRightArray, oriSheetID, oriRangeProxy);
      let dstSheetID2CellLoc2Formula = {};
      dstSheetID2CellLoc2Formula[dstSheetID] = cellLoc2Formula;
      return this.editUpdateBySheetID2CellLoc2Formula(dstSheetID2CellLoc2Formula);
    } else {  // 否则dstRange会转化为全等区域。
      let newDstRangeLoc = oriRangeProxy.updateByShiftArray(shiftArray);
      return this.editInternalCopyPasteEqualArea(oriSheetName, oriRangeLoc, dstSheetName, newDstRangeLoc);
    }

  }

  // ** 黏贴到多个区域获取cellLoc2Formula
  getCellLoc2FormulaByMultiShift(shiftDownArray, shiftRightArray, oriSheetID, oriRangeProxy) {
    let cellLoc2Formula = {};
    for (let shiftDownNumber of shiftDownArray) {
      for (let shiftRightNumber of shiftRightArray) {
        let curCellLoc2Formula = this.getCellLoc2FormulaByShiftArray(oriSheetID, oriRangeProxy, [shiftDownNumber, shiftRightNumber]);
        Object.assign(cellLoc2Formula, curCellLoc2Formula);
      }
    }
    return cellLoc2Formula;
  }

  /**把oriRange的单元格移动到dstRange中去。
   // *
   // *
   * @param oriSheetName
   * @param oriRangeLoc
   * @param dstSheetName
   * @param dstRangeLoc
   * @return {{msg}|*}
   */
  editCutPasteRange(oriSheetName, oriRangeLoc, dstSheetName, dstRangeLoc) {
    let oriSheetID = this.multiSheet.getIDByName(oriSheetName);
    let dstSheetID = this.multiSheet.getIDByName(dstSheetName);
    let oriRangeProxy = new RangeLocProxy(oriRangeLoc);
    let oldDstRangeProxy = new RangeLocProxy(dstRangeLoc);
    let shiftArray = oriRangeProxy.getShiftArrayToOther(oldDstRangeProxy);

    // * 首先会把dstRange直接转化为相同面积区域。
    let eqDstRangeLoc = oriRangeProxy.updateByShiftArray(shiftArray, false); // 不替换
    let eqDstRangeProxy = new RangeLocProxy(eqDstRangeLoc);

    // * [处理合并单元格]
    // * 与dstRange与oriRange有cross的合并单元格都会被删除。移动oriRange内的合并单元格到dstRange
    this.multiMergeLoc.cutPasteMergeRange(oriSheetID, oriRangeProxy, dstSheetID, eqDstRangeProxy);
    // *[处理calcCell移动]
    // 删除dstRange中的calcCell, 把oriRange中的calcCell移动到dstRange中去
    let removedCelArrayObj = this.multiCalcCell.cutPasteCellInRange(oriSheetID, oriRangeProxy, dstSheetID, eqDstRangeProxy);


    // * [处理oriRange移动导致的公式变化与需要做的更新]
    let beginCellID = this.multiRelation.updateFormulaByCutPasteRange(oriSheetID, oriRangeProxy, dstSheetID, eqDstRangeProxy);
    // dstRange会加入beginSet
    let beginCellID2 = beginCellID.concat(removedCelArrayObj.cellID);
    // * 最终，调用this.workbookEditor.recalculateByBeginCellIDArray(beginCellIDArray);
    this.workbookSolver.recreateByBeginCellIDArray(beginCellID2);
  }

// 插入复制黏贴的区域
  editInsertCopyPasteRange(oriSheetName, oriRangeLoc, dstSheetName, dstRangeLoc, rightOrDown = 0) {
    // 处理成全等区域
    let oriSheetID = this.multiSheet.getIDByName(oriSheetName);
    let dstSheetID = this.multiSheet.getIDByName(dstSheetName);
    let oriRangeProxy = new RangeLocProxy(oriRangeLoc);
    let oldDstRangeProxy = new RangeLocProxy(dstRangeLoc);
    let shiftArray = oriRangeProxy.getShiftArrayToOther(oldDstRangeProxy);

    // * 首先会把dstRange直接转化为相同面积区域。
    let eqDstRangeLoc = oriRangeProxy.updateByShiftArray(shiftArray, false); // 不替换
    let eqDstRangeProxy = new RangeLocProxy(eqDstRangeLoc);

    // 如果dstRange与oriRange有交叉, 则报错
    let isCrossSheet = oriSheetName !== dstSheetName;
    if (isCrossSheet && oriRangeProxy.getInteract(eqDstRangeProxy).length > 0) {
      return FAIL_OBJ_INSERT_RANGE_OVERLAP;
    }

    // 先执行插入
    let insertDealer = rightOrDown === 0 ? new InsertRangeShiftRightDealer(this) : new InsertRangeShiftDownDealer(this);
    let beginCellID1 = insertDealer.preSolveBeginCellIDArray(dstSheetID, eqDstRangeProxy);

    // 再执行复制黏贴
    this.multiMergeLoc.pasteMergeRange(oriSheetID, oriRangeProxy, dstSheetID, eqDstRangeProxy); // 黏贴合并单元格
    let dstSheetID2CellLoc2Formula = {};
    dstSheetID2CellLoc2Formula[dstSheetID] = this.getCellLoc2FormulaByShiftArray(oriSheetID, oriRangeProxy, shiftArray);
    let beginCellID2 = this.multiSheet.updateBySheetID2Loc2FormulaReturnCellIDArray(dstSheetID2CellLoc2Formula);

    // 重新计算
    let resBeginCellIDArray = beginCellID1.concat(beginCellID2);
    return this.workbookSolver.recreateByBeginCellIDArray(resBeginCellIDArray);
  }

  // 插入剪切黏贴的区域
  editInsertCutPasteRange(oriSheetName, oriRangeLoc, dstSheetName, dstRangeLoc, rightOrDown = 0) {
    // 处理成全等区域
    let oriSheetID = this.multiSheet.getIDByName(oriSheetName);
    let dstSheetID = this.multiSheet.getIDByName(dstSheetName);
    let oriRangeProxy = new RangeLocProxy(oriRangeLoc);
    let oldDstRangeProxy = new RangeLocProxy(dstRangeLoc);
    let shiftArray = oriRangeProxy.getShiftArrayToOther(oldDstRangeProxy);

    // * 首先会把dstRange直接转化为相同面积区域。
    let eqDstRangeLoc = oriRangeProxy.updateByShiftArray(shiftArray, false); // 不替换
    let eqDstRangeProxy = new RangeLocProxy(eqDstRangeLoc);

    let isSameSheet = oriSheetName === dstSheetName;
    if (isSameSheet) {
      // 如果dstRange与oriRange有交叉, 则报错
      if (oriRangeProxy.getInteract(eqDstRangeProxy).length > 0) {
        return FAIL_OBJ_INSERT_RANGE_OVERLAP;
      }
      // toShiftRange与oriRange不能有交叉
      let toShiftRangeProxy = eqDstRangeProxy.getRangeProxyToBottomOrRight(this.multiSheet.getSheetByID(dstSheetID), true, rightOrDown);
      if (toShiftRangeProxy.getInteract(oriRangeProxy).length > 0) {
        return FAIL_OBJ_SHIFT_RANGE_OVERLAP_CUT_RANGE;
      }
    }

    // 先执行插入；
    let insertDealer = rightOrDown === 0 ? new InsertRangeShiftRightDealer(this) : new InsertRangeShiftDownDealer(this);
    let beginCellID1 = insertDealer.preSolveBeginCellIDArray(dstSheetID, eqDstRangeProxy);

    // 再执行剪切黏贴
    // * [处理合并单元格]
    // * 与dstRange与oriRange有cross的合并单元格都会被删除。移动oriRange内的合并单元格到dstRange
    this.multiMergeLoc.cutPasteMergeRange(oriSheetID, oriRangeProxy, dstSheetID, eqDstRangeProxy);
    // *[处理calcCell移动]
    // 删除dstRange中的calcCell, 把oriRange中的calcCell移动到dstRange中去
    let removedCelArrayObj = this.multiCalcCell.cutPasteCellInRange(oriSheetID, oriRangeProxy, dstSheetID, eqDstRangeProxy);


    // * [处理oriRange移动导致的公式变化与需要做的更新]
    let beginCellID2 = this.multiRelation.updateFormulaByCutPasteRange(oriSheetID, oriRangeProxy, dstSheetID, eqDstRangeProxy);
    // dstRange会加入beginSet
    let resBeginCellIDArray = beginCellID1.concat(beginCellID2.concat(removedCelArrayObj.cellID));
    return this.workbookSolver.recreateByBeginCellIDArray(resBeginCellIDArray);

  }

  /**
   * 自动填充，选中oriRange，填充dstRange
   * @param sheetName
   * @param oriRange
   * @param dstRange
   */
  editAutoFill(sheetName, oriRange, dstRange) {
    return new AutoFillDealer();
  }

  // row重新排序导致的变化
  editUpdateByOldRowID2NewRowIDMap(sheetID, old2NewRowID: Map) {
    myLog.myPrint(PRINT_LEVEL3)
    // multiCalcCell发生变化
    let res = this.multiCalcCell.moveCellByOld2NewRowID(sheetID, old2NewRowID);
    if (isCalcResError(res)) {
      return res;
    }
    // multiCellValue2Text发生变化
    res = this.multiValue2TextSetting.moveV2TextByOld2NewRowID(sheetID, old2NewRowID);
    if (isCalcResError(res)) {
      return res;
    }
    // 找到引用oldRow范围内的cell，然后执行重新计算
    let rowIDArray = Array.from(old2NewRowID.keys()) // 获取所有的rowIDArray
    return this.workbookSolver.updateByMovedRowIDArray(sheetID, rowIDArray)
  }
}

