import { FAIL_OBJ_EDIT } from '../calc_utils/error_config';
import { RangeLocProxy } from '../calc_data_proxy/loc_range_loc';

export class MergeRangeDealer {
  constructor(workbookEditor) {
    this.workbookEditor = workbookEditor;
  }

  easyDeal(sheetName, rangeLoc) {
    let theSheetID = this.workbookEditor.multiSheet.getIDByName(sheetName);
    if (typeof theSheetID === 'undefined') { // 没有这个名字
      return FAIL_OBJ_EDIT;
    }
    // 1. 根据sheetName, rangeLoc，寻找范围内的cellID，按照从左上方到右下方的fullLoc，进而获得cellIDArray
    let toMergeRangeProxy = new RangeLocProxy(rangeLoc);
    if (toMergeRangeProxy.isSingleCell()) { // 单个单元格不需要合并
      return;
    }
    // 2.更新 multiMergeLoc;
    let res = this.workbookEditor.multiMergeLoc.addMergeRange(theSheetID, toMergeRangeProxy);
    if (typeof res.msg === 'string') {
      return res;
    }
    // 3. 获取mergedCellValue: 在范围里面从左上角开始找到一个不为空的单元格，定为mergedCellValue,否则为"".
    let sheetID2CellLoc2Formula = this.workbookEditor.multiCalcCell.replaceAndDeleteFormulaAfterMerge(theSheetID, toMergeRangeProxy);

    // 5, 批量更新filteredCellLocArray对应的单元格数值
    return this.workbookEditor.editUpdateBySheetID2CellLoc2Formula(sheetID2CellLoc2Formula);
  }
}
