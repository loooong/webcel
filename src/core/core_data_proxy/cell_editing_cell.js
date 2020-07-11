// 正在编辑的单元格
import { EditingCalcCell } from '../../calc/calc_data_proxy/calc_cell';
import { CellStyleSettings } from './core_sheet_proxy';
import { A1 } from '../../calc/calc_utils/config';

export class EditingFormatCell {
  editingCalcCell: EditingCalcCell;
  cellStyleSetting: CellStyleSettings;

  constructor(editingCalcCell, cellStyleSetting) {
    this.editingCalcCell = editingCalcCell;
    this.cellStyleSetting = cellStyleSetting;
  }

  getRefUnitArrayByType(refType = A1) {
    return this.refUnitArrayObj[refType];
  }

  getRefStrArrayByType(refType) {
    let theUnitArray = this.getRefUnitArrayByType(refType);
    return theUnitArray.map(theUnit => theUnit.wholeStr);
  }

  updateRefArrayByNewStr(wholeFormula) {
    this.editingCalcCell.updateByCellObj({ f: wholeFormula });
    this.editingCalcCell.execFormula();
    this.refUnitArrayObj = this.editingCalcCell.rootSyntaxUnit.getRefUnitArrayObj(); // 引用语法单元
  }

}
