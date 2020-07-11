import { CoreWorkbookProxy } from '../../core/core_cmd/core_workbook_editor';
import { SpreadsheetComp } from './spreadsheet_comp';
import { sampleCoreSheetSetting } from '../../global_utils/setting_sample';

export class WorkbookComp {
  coreWorkbook: CoreWorkbookProxy;

  constructor() {
    this.coreWorkbook = new CoreWorkbookProxy();
    this.sheetID2SpreadSheet = {} // 一个sheetID会对应一组数据：spreadSheet,sheetComp, coreSheet,calcSheet
  }

  createASpreadsheet(targetElOrName, sheetSetting = {}, sheetName = 'sheet1'):SpreadsheetComp {
    let coreSheet = this.coreWorkbook.dealCreateASheet(sheetName, sheetSetting) // 创建数据层
    let curSpreadSheet = new SpreadsheetComp(targetElOrName, coreSheet);// 创建组件+挂载
    this.sheetID2SpreadSheet[curSpreadSheet.sheetComp.coreSheet.coreSheetID] = curSpreadSheet
    return curSpreadSheet
  }

  createASpreadSheetByDefaultSetting(targetElOrName){
    return this.createASpreadsheet(targetElOrName, sampleCoreSheetSetting)
  }


}
