/* global window, document */
import './index.less';
import { bugout } from './log/log_proxy';
import { WorkbookComp } from './component/a_top_comp/workbook_comp';

if (window) {
    window.financialCell = window.financialCell || {};
    window.bugout = bugout;
    window.financialCell.WorkbookComp = WorkbookComp
}

