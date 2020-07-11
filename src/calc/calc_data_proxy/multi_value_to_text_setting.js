import {
  ValueToTextFactory,
  ValueToTextSetting
} from '../../internal_module/cellv_to_text_factory';
import { BaseNumCellVToText } from '../../internal_module/cellv_to_text_num';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';
import { WorkbookEditor } from '../calc_cmd/workbook_editor';

export class MultiValue2TextSetting {
  workbookEditor: WorkbookEditor;

  constructor(workbookEditor) {
    this.workbookEditor = workbookEditor;
    this.sheetID2CellLoc2ValueToTextSetting = {}; // 0-> 0_0 -> {valueToTextType: } 这样的形式
    this.valueToTextFactor = new ValueToTextFactory();
  }

  getValueToTextSetting(sheetID, cellLoc): ValueToTextSetting {
    if (this.sheetID2CellLoc2ValueToTextSetting.hasOwnProperty(sheetID)) {
      return this.sheetID2CellLoc2ValueToTextSetting[sheetID][cellLoc];
    }
  }

  getValueToTextBhv(sheetID, cellLoc): BaseNumCellVToText {
    let setting = this.getValueToTextSetting(sheetID, cellLoc);
    return this.valueToTextFactor.createValueToTextBhv(setting);
  }

  getCellLoc2ValueToTextSettingBySheetID(sheetID): { [key: string]: ValueToTextSetting } {
    return this.sheetID2CellLoc2ValueToTextSetting[sheetID];
  }

  // ============ 更新数据 ===================
  updateBySheetID2CellLoc2ValueToTextSetting(sheetID2CellLoc2ValueToTextSetting) {
    Object.assign(this.sheetID2CellLoc2ValueToTextSetting, sheetID2CellLoc2ValueToTextSetting);
  }

  addSheetByCellLoc2ValueToTextSetting(sheetID, sheetID2CellLoc2ValueToTextSetting) {
    this.sheetID2CellLoc2ValueToTextSetting[sheetID] = sheetID2CellLoc2ValueToTextSetting;
  }

  clearContent() {
    this.sheetID2CellLoc2ValueToTextSetting = {};
  }

  moveV2TextByOld2NewRowID(sheetID, old2NewRowID: Map) {
    if (this.sheetID2CellLoc2ValueToTextSetting.hasOwnProperty(sheetID) === false) {
      return; // 不存在这个sheetID的信息，不发生变更
    }
    let newCellLoc2ValueToTextSetting = {};
    for (let [cellLoc, valueToTextSetting] of Object.entries(this.sheetID2CellLoc2ValueToTextSetting[sheetID])) {
      let cellLocProxy = new CellLocStrProxy(cellLoc);
      if (old2NewRowID.has(cellLocProxy.rowID)) {
        cellLocProxy.updateByColIDRowID(undefined, old2NewRowID.get(cellLocProxy.rowID));
        newCellLoc2ValueToTextSetting[cellLocProxy.cellLocStr] = valueToTextSetting;
      } else {
        newCellLoc2ValueToTextSetting[cellLoc] = valueToTextSetting; // 不发生变化
      }
    }
    this.sheetID2CellLoc2ValueToTextSetting[sheetID] = newCellLoc2ValueToTextSetting;
  }
}
