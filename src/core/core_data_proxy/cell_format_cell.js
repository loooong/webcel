import { isHave } from '../../global_utils/check_value';
import { CalcCell, EditingCalcCell } from '../../calc/calc_data_proxy/calc_cell';
import { CoreSheet } from './core_sheet_change';
import { CellStyleSettings } from './core_sheet_proxy';
import { CellLocStrProxy } from '../../internal_module/proxy_cell_loc';

/**
 * Cell类，代表一个单元格的数据格式。
 */
export class FormatCell { // todo: 应该去掉text与formula，而是直接使用关联的calcCell的相关数据
    cellStyleID: number // 在coreSheetStyleArray 中的位置标记
    associatedCalcCell: CalcCell
    text: string // 含义还不明确
    formulas:string // text与formulas这两个属性只在初始化的时候有用。之后formula与text都是用calcCell对应的值
    coreSheet: CoreSheet
    merge:string
    cellLocProxy: CellLocStrProxy

    textInCalcCell: string
    formulaInCalcCell:string
    constructor(coreSheet, cellLocStr = "-1_-1_") {
        this.coreSheet = coreSheet
        this.text = "";
        this.formulas = "";
        this.cellStyleID = null;
        this.merge = null;
        this.cellLocProxy = new CellLocStrProxy(cellLocStr)
    }

    static fromCellSetting(cellSetting, coreSheet, cellLocStr){
        let formatCell = new FormatCell(coreSheet,cellLocStr)
        Object.assign(formatCell, cellSetting)
        return formatCell
    }
    get associatedCalcCell(){
        let calcCell = this.coreSheet.calcWorkbookEditor.multiCalcCell.getCellBySheetIDAndCellLoc(this.coreSheet.coreSheetID, this.cellLocProxy.cellLocStr)
        if(isHave(calcCell)){
            return calcCell
        }
        else {
            return  new EditingCalcCell(undefined,undefined,{f:"", text:""}) // 没找到的时候
        }
    }

    get textInCalcCell():string{ // 做一个关联; 在初始化之后，这个属性与.text属性都是一样的
        return this.associatedCalcCell.cellObj.text
    }

    get formulaInCalcCell():string{// 做一个关联; 在初始化之后，这个属性与.text属性都是一样的
        return this.associatedCalcCell.formulaString
    }
    getStyleSetting(): CellStyleSettings{
        return new CellStyleSettings(this.coreSheet.cellStyleArray[this.cellStyleID])
    }
    getText(){
        if(isHave(this.textInCalcCell) === false){
            return ""
        }
        else {
            let res = this.textInCalcCell
            return res
        }
    }

    /**
     * 设置单元格信息
     */
    updateFormatCellByObject(cellOBj = {}) {
        Object.assign(this, cellOBj)
    }
}

