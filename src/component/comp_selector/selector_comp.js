import { FinElement, h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { SingleSelectorComp } from './single_selector';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { myLog, PRINT_LEVEL2, PRINT_LEVEL3 } from '../../log/new_log';

export const SELECTOR_BORDER_WIDTH = 2;
export const START_Z_INDEX = 10;

// 复制某个区域的时候，会虚线框，对应clipboard
// 推测这个是为了应对冻结单元格的问题而分为4个部分
export class SelectorContainerComp {
    coreSheet: CoreSheet
    sheetComp: SheetComp
    el: FinElement
    primeSelectorComp: SingleSelectorComp

    constructor(coreSheet, sheetComp, isShownSelectedCellComp = false) {
        this.data = coreSheet;
        this.coreSheet = coreSheet


        // 组件
        this.sheetComp = sheetComp;
        this.primeSelectorComp = new SingleSelectorComp(coreSheet, this, sheetComp); // 应该是为了感应到鼠标选择框的
        this.primeSelectorComp.el.updateDisplayToBlock(); // 只有右下角的SelectorMargin会显示
        this.el = h('div', `${CSS_PREFIX}-selectors`)
          .children(
            this.primeSelectorComp.el,
          ).hide();
    }
    // ========= 查询数据 ==============
    get selectedWholeRange(): CellRangeProxy{ // 变为计算属性，实现了属性与coreSheet的绑定
        return this.coreSheet.coreSelector.selectedCoreRange
    }


    // ============ 更新组件 =================

    hide() {
        this.el.hide();
    }

    showClipboard() {
        let rangePst = this.coreSheet.tableViewForEvent.getRangePstDetailNew(this.coreSheet.coreClipSelector.clipCellRange)
        this.primeSelectorComp.updateClipboardLTWH(rangePst.getLTWH());
        this.primeSelectorComp.showClipboard()
    }
// =============== 状态更新， handle函数 =============
    updateSelfByCoreSelector(){ // 需要通知toolbar？
        const selectorLTWH = this.coreSheet.coreSelector.getWholeSelectedRangePstDetail().getLTWH()
        const clipLTWH = this.coreSheet.getClipboardRect();
        this.primeSelectorComp.updateAreaLTWHAndShow(selectorLTWH);
        this.primeSelectorComp.updateClipboardLTWH(clipLTWH);
        myLog.myPrint(PRINT_LEVEL3, {
            selectorLTWH,clipLTWH
        });

        // this.primeSelectorComp.el.updateElLTWH({
        //     leftSpanElIndex: 0,
        //     top: 0
        // });
    }
    updateSelfAndToolBarByCoreSelector(){
        this.updateSelfByCoreSelector()
        this.sheetComp.toolbarComp.reset();
    }

    // 根据firstSelectRiCi来更新
    updateByFirstSelectMerge() { // 只有firstSelect框
        // this.resetSelectOffset(cellRange);
        this.updateSelfByCoreSelector()
        this.el.updateDisplayToBlock();
        this.sheetComp.toolbarComp.reset();
    }

}
