import { describe, it } from 'mocha';
import { Recast } from '../../src/core/core_data_proxy/recast';
import { EditorTextProxyOLD } from '../../src/core/core_data_proxy/editor_text';
import { calcDecimals, changeFormat, dateDiff, formatDate } from '../../src/global_utils/date';
// import {isHave} from "../../src/helper/dataproxy_helper";
import { copyPasteTemplate } from '../util/templates';
import { formatNumberRender } from '../../src/core/old_1/format';
import { FormatProxy } from '../../src/core/old_1/format_proxy';
import { CellRangeProxy } from '../../src/internal_module/cell_range';
import { PaintFormat } from '../../src/core/core_data_proxy/paint_format';
import { isHave } from '../../src/global_utils/check_value';
import {
  getUniqueRefStrArray,
  splitStr
} from '../../src/component/comp_cell_editor/ref_selector_control_old';
import { CoreWorkbookProxy } from '../../src/core/core_cmd/core_workbook_editor';


let assert = require('assert');

// 越简单的放后面
describe('core模块测试集合', () => {
    let coreWorkbookEditor = new CoreWorkbookProxy()
    let data = coreWorkbookEditor.dealCreateASheet("sheet1",{},{})
    describe('  recast test  ', () => {
        it(' ="""  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '="""', "input");
            assert.equal(state, true);
        });

        it(' =""  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '=""', "input");
            assert.equal(state, false);
        });

        it(' =()  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '=()', "input");
            assert.equal(state, true);
        });

        it(' =(s)  ', function () {
            let {state, msg} = data.selectorCellText(1, 1, '=(s)', "input");
            assert.equal(state, false);
        });

        it(' =(s)  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '=()', "input");
            assert.equal(state, true);
        });

        it(' =(sasd  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '=(sasd', "input");
            assert.equal(state, true);
        });

        it(' ==  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '==', "input");
            assert.equal(state, true);
        });

        it(' =12+12+  ', function () {
            let {state, msg} = data.selectorCellText(-1, -1, '=12+12+', "input");
            assert.equal(state, true);
        });

        it(' =AMORLINC(2400,39679,39813,300,1,0.15,1) ', () => {
            let {state, msg} = data.selectorCellText(1, 1, '=AMORLINC(2400,39679,39813,300,1,0.15,1)', "input");
            assert.equal(state, false);
        });

        it(' =INDEX({1,2;3,4},0,2) ', () => {
            let {state, msg} = data.selectorCellText(1, 1, '=INDEX({1,2;3,4},0,2)', "input");
            assert.equal(state, false);
        });
    });

    describe('  getUniqueRefStrArray  ', () => {
        it(' =A1(1, 2)', function () {
            let arr = getUniqueRefStrArray('=A1(1, 2)');
            assert.equal(arr.length, 0);
            arr = getUniqueRefStrArray('=A1+A2');
            assert.equal(arr.length, 2);
        });

        it(' =A1(A2, A3, $A$2, 1, 2, add(1, A5)) ', function () {
            let arr = getUniqueRefStrArray('=A1(A2, A3, $A$2, 1, 2, add(1, A5))', false, true);

        });

        it(' =A9:B12 ', function () {
            let arr = getUniqueRefStrArray('=A9:B12', false, true);

        });
    });

    describe('  paste  ', () => {
        it(' paste =D1 ', () => {
            // let tableProxy = created CoreTableProxy(data);
            // tableProxy.coreRows._ = {
            //     "13": {
            //         "cells": {
            //             "5": {
            //                 formulas: "=F4",
            //                 style: 7,
            //                 text: "=F4",
            //                 value: "=F4",
            //             }
            //         }
            //     }
            // };
            // let reference = [{
            //     ri: 13,
            //     ci: 5
            // }];

        });
    });

    describe('  depend cell  ', () => {
        it(' =A1(A2, A3, $A$2, 1, 2, add(1, A5:B5)) ', function () {
            data.coreRows.getDependCell('A10', {text: "", formulas: "=A1(A2, A3, $A$2, 1, 2, add(1, A5:B5))"});
            let {depend} = data.coreRows.getCell(1, 0);
            assert.equal(depend[0], 'A10');
            let args = data.coreRows.getCell(4, 0);
            assert.equal(args.depend[0], 'A10');
            args = data.coreRows.getCell(4, 1);
            assert.equal(args.depend[0], 'A10');
        });

        it(' mergeCell ', function () {
            let args = data.coreRows.mergeCellExpr("A1:A6");

            let {state, mergeArr} = args;

            assert.equal(mergeArr[0], 'A1');
            assert.equal(mergeArr[1], 'A2');
            assert.equal(mergeArr[2], 'A3');
            assert.equal(mergeArr[3], 'A4');
            assert.equal(mergeArr[4], 'A5');

            let arr = data.coreRows.mergeCellExpr("A3:A1").mergeArr;
            assert.equal(arr[0], 'A1');
            assert.equal(arr[1], 'A2');
            assert.equal(arr[2], 'A3');
        });
    });

    describe('  cell change action  ', () => {
        it(' editorChangeToHistory ', function () {
            data.coreRows.setCell(1, 1,{text: "2"})
            let {state} = data.editorChangeToHistory({text: "1",}, {ri: 1, ci: 1}, 1);
            let args = data.multiPreAction.getItems(1);
            assert.equal(state, true);
            assert.equal(args[0].ri, '1');
            assert.equal(args[0].ci, '1');
            assert.equal(args[0].action, '在B2中键入"2"');
            assert.equal(args[0].expr, 'B2');
            assert.equal(args[0].oldCell[0].cell.text, '1');

            data.coreRows.setCell(2, 2, {"text": "=add(1, 0)"})
            args = data.editorChangeToHistory({text: "1", formulas: "=add(1, 0)"}, {
                ri: 2,
                ci: 2
            }, 1);
            assert.equal(args.state, true);
        });

        it('  changeToHistory  ', function () {
            data.multiPreAction.undoItems = [];
            data.coreSelector.selectedCoreRange = new CellRangeProxy(0, 0, 3, 3);
            let args = data.changeToHistory({type: 2});
            assert.equal(args.state, true);
            assert.equal(data.multiPreAction.undoItems[0].action, '删除A1:D4的单元格内容');

            args = data.changeToHistory({type: 3, ri: 0,});
            assert.equal(args.state, true);

            assert.equal(data.multiPreAction.undoItems[1].action, '行宽');
            assert.equal(data.multiPreAction.undoItems[1].height, '25');
            assert.equal(data.multiPreAction.undoItems[1].ri, '0');
            assert.equal(data.multiPreAction.undoItems[1].type, '3');
        });

        describe('  history  ', () => {
            it(' undo ', function () {
                data.multiPreAction.undo();
            });
        });
    });

    describe('  formatProxy  ', () => {
        it('  1.23/1/123  ', function () {
            let formatProxy = new FormatProxy();
            let _cell = formatProxy.makeFormatCell({text: "1.23", formula: "1.23"}, {
                symbol: "%",
                position: "end"
            }, (s) => {
                return Number(s * 100).toFixed(2);
            });

            assert.equal(_cell.text, '123.00%');
            assert.equal(_cell.formulas, '123.00');
            assert.equal(_cell.value, '1.23');

            _cell = formatProxy.makeFormatCell({text: "1", formula: "1"}, {symbol: "%", position: "end"}, (s) => {
                return Number(s * 100).toFixed(2);
            });
            assert.equal(_cell.text, '100.00%');
            assert.equal(_cell.formulas, '100.00');
            assert.equal(_cell.value, '1');

            _cell = formatProxy.makeFormatCell({text: "123", formula: "123"}, {symbol: "%", position: "end"}, (s) => {
                return Number(s * 100).toFixed(2);
            });
            assert.equal(_cell.text, '12300.00%');
            assert.equal(_cell.formulas, '12300.00');
            assert.equal(_cell.value, '123');
        });

        it('  1.23.23  ', function () {
            let formatProxy = new FormatProxy();
            let _cell = formatProxy.makeFormatCell({text: "1.23.23", formula: "1.23.23"}, {
                symbol: "%",
                position: "end"
            }, (s) => {
                return calcDecimals(s, (s2) => {
                    return s2 * 100;
                });
            });
            assert.equal(_cell, null);
        });
    });

    describe('  special_formula_process  ', () => {
        it('  *HYPERLINK*/*MULTIPLECELLS*  ', function () {
            // let args = specialWebsiteValue('*HYPERLINK*!{"text":"www.baidu.com","url":"www.baidu.com"} ', "=ADD()");
            // assert.equal(args.state, true);
            // assert.equal(args.text, "www.baidu.com");
            // assert.equal(args.type, 2);
            //
            // let workbookProxy = {
            //     "A1": {
            //         "v": "1",
            //         "f": "1"
            //     },
            //     "B1": {
            //         "v": "2",
            //         "f": "2"
            //     }
            // }
            // args = specialWebsiteValue('*MULTIPLECELLS*!' + JSON.stringify(workbookProxy), "=ADD()");
            //
            // assert.equal(args.state, true);
            // assert.equal(args.type, 1);
            // let wb2 = {};
            // multipleCellsRender(wb2, args.text);
            // assert.equal(wb2['A1'].v, 1);
            // assert.equal(wb2['B1'].f, 2);
        });
    });


    describe('  formatNumberRender  ', () => {
        it('  1.23.23  ', function () {
            assert.equal(formatNumberRender("1.23.23", -1), "1.23.23");
        });

        it('  asd  ', function () {
            assert.equal(formatNumberRender("asd", -1), "asd");
        });
    });

    describe(' F4 ', () => {
        it(' =A1 ', () => {
            let editorText = new EditorTextProxyOLD('A1');
            editorText.setText('=A1');
            let args = editorText.f4ShortcutKey(3);

            assert.equal(args.inputText, '=$A$1');
            assert.equal(args.pos, 5);

            args = editorText.f4ShortcutKey(args.pos);

            assert.equal(args.inputText, '=$A1');
            assert.equal(args.pos, 4);

            args = editorText.f4ShortcutKey(args.pos);

            assert.equal(args.inputText, '=A$1');
            assert.equal(args.pos, 4);
        });

        it(' =A1+A2 ', () => {
            let editorText = new EditorTextProxyOLD('A1');
            editorText.setText('=A1+A2');
            let args = editorText.f4ShortcutKey(3);

            assert.equal(args.inputText, '=$A$1+A2');
            assert.equal(args.pos, 5);

            args = editorText.f4ShortcutKey(args.pos);

            assert.equal(args.inputText, '=$A1+A2');
            assert.equal(args.pos, 4);
        });
    });


    describe(' autofilter  ', () => {
        it(' number autofilter ', () => {
            let cell = {"text": "1", "formulas": "1"};
            copyPasteTemplate(cell, data);

            let cell1 = data.coreRows.getCell(4, 4);
            let cell2 = data.coreRows.getCell(9, 4);
            let cell3 = data.coreRows.getCell(12, 4);
            assert.equal(cell1.text, '2');
            assert.equal(cell1.formulas, '2');

            assert.equal(cell2.text, '7');
            assert.equal(cell2.formulas, '7');

            assert.equal(cell3.text, '10');
            assert.equal(cell3.formulas, '10');
        });

        it(' A1: "asd" A2: "" ', function () {
            let cell = {"text": "asd", "formulas": "asd"};
            data.coreRows.setCell(3, 4, cell, 'all_with_no_workbook');
            data.coreRows.setCell(4, 4, {"text": ""}, 'all_with_no_workbook');
            const srcCellRange = new CellRangeProxy(3, 4, 4, 4, 0, 0);
            const dstCellRange = new CellRangeProxy(5, 4, 12, 4, 0, 0);
            data.coreRows.copyPaste(srcCellRange, dstCellRange, 'all', true);

            assert.equal(data.coreRows.getCell(5, 4).text, 'asd');
            assert.equal(data.coreRows.getCell(5, 4).formulas, 'asd');
            assert.equal(data.coreRows.getCell(6, 4).text, '');
            assert.equal(data.coreRows.getCell(6, 4).formulas, '');
            assert.equal(data.coreRows.getCell(7, 4).text, 'asd');
            assert.equal(data.coreRows.getCell(7, 4).formulas, 'asd');

        });

        it(' =123 ', () => {
            let cell = {"text": "=123", "formulas": "=123"};
            copyPasteTemplate(cell, data);

            let cell1 = data.coreRows.getCell(4, 4);
            let cell2 = data.coreRows.getCell(9, 4);
            let cell3 = data.coreRows.getCell(12, 4);
            assert.equal(cell1.text, '=123');
            assert.equal(cell1.formulas, '=123');

            assert.equal(cell2.text, '=123');
            assert.equal(cell2.formulas, '=123');

            assert.equal(cell3.text, '=123');
            assert.equal(cell3.formulas, '=123');
        });

        it('  2019-01-01 1 autofilter  ', function () {
            let cell = {"text": "2019-01-01 1", "formulas": "2019-01-01 1"};
            copyPasteTemplate(cell, data);

            let cell1 = data.coreRows.getCell(4, 4);
            let cell2 = data.coreRows.getCell(9, 4);
            let cell3 = data.coreRows.getCell(12, 4);

            assert.equal(cell1.text, '2019-01-01 2');
            assert.equal(cell1.formulas, '2019-01-01 2');

            assert.equal(cell2.text, '2019-01-01 7');
            assert.equal(cell2.formulas, '2019-01-01 7');

            assert.equal(cell3.text, '2019-01-01 10');
            assert.equal(cell3.formulas, '2019-01-01 10');
        });

        it(' 12as212a autofilter', function () {
            let cell = {"text": "12as212a", "formulas": "12as212a"};
            copyPasteTemplate(cell, data);

            let cell1 = data.coreRows.getCell(4, 4);
            let cell2 = data.coreRows.getCell(9, 4);
            let cell3 = data.coreRows.getCell(12, 4);

            assert.equal(cell1.text, '12as213a');
            assert.equal(cell1.formulas, '12as213a');

            assert.equal(cell2.text, '12as218a');
            assert.equal(cell2.formulas, '12as218a');

            assert.equal(cell3.text, '12as221a');
            assert.equal(cell3.formulas, '12as221a');
        });

        it(' null autofilter', function () {
            let cell = {};
            copyPasteTemplate(cell, data);
            let cell1 = data.coreRows.getCell(4, 4);
            let cell2 = data.coreRows.getCell(9, 4);
            let cell3 = data.coreRows.getCell(12, 4);

            assert.equal(cell1.text, '');
            assert.equal(cell1.formulas, '');

            assert.equal(cell2.text, '');
            assert.equal(cell2.formulas, '');

            assert.equal(cell3.text, '');
            assert.equal(cell3.formulas, '');
        });

        it(' letter autofilter ', () => {
            let cell = {"text": "a", "formulas": "a"};
            copyPasteTemplate(cell, data);

            let cell1 = data.coreRows.getCell(4, 4);
            let cell2 = data.coreRows.getCell(9, 4);
            let cell3 = data.coreRows.getCell(12, 4);

            assert.equal(cell1.text, 'a');
            assert.equal(cell1.formulas, 'a');

            assert.equal(cell2.text, 'a');
            assert.equal(cell2.formulas, 'a');

            assert.equal(cell3.text, 'a');
            assert.equal(cell3.formulas, 'a');
        });
    });



    describe('  set cell  ', () => {
        it(' setCellAll - value not empty ', function () {
            let cell = {"text": "2019-01-01", "formulas": "2019-01-01" };
            data.coreRows.setCell(1, 1, cell, 'number');

            // 用户点击单元格
            data.coreRows.setCellAll(1, 1, "2019-01-01");
            cell = data.coreRows.getCell(1, 1);
            assert.equal(cell.text, '2019-01-01');
            assert.equal(cell.formulas, '2019-01-01');
        });

        it('  setCellText  ', function () {
            data.coreRows.setCellText(1, 1, {text: "=add(1, 3)", style: 1},  'style');
            let cell = data.coreRows.getCell(1, 1);

            assert.equal(cell.text, '=add(1, 3)');
            assert.equal(cell.formulas, '=add(1, 3)');

            data.coreRows.setCellText(1, 1, {text: "1", style: 1}, 'format');
            cell = data.coreRows.getCell(1, 1);
            assert.equal(cell.text, '1');
            assert.equal(cell.formulas, '=add(1, 3)');
        });
    });

    describe('  get cell  ', () => {
        it(' getCell ', function () {
            let cell = {"style": 1};
            data.coreRows.setCell(1, 1, cell, 'all');
            cell = data.coreRows.getCell(1, 1);
            assert.equal(cell.style, '1');

            cell = {"text": 1};
            data.coreRows.setCell(1, 1, cell, 'all');
            cell = data.coreRows.getCell(1, 1);
            assert.equal(cell.text, '1');
        });
    });

    describe(' PaintFormat ', () => {
        it(' 没有style ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {},
                        1: {},
                        2: {},
                        3: {},
                        4: {},
                    }
                },
            });
            // 一列多行
            let sRange = new CellRangeProxy(0, 0, 0, 4);
            // 一列多行
            let dRange = new CellRangeProxy(1, 1, 1, 8);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 1);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 0);
            assert.equal(pArr[2].cell.cellStyleID, 0);
            assert.equal(pArr[3].cell.cellStyleID, 0);
            console.log(pArr)
        });

        it(' 1行多列 * 1行多列 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
            });
            // 一列多行
            let sRange = new CellRangeProxy(0, 0, 0, 4);
            // 一列多行
            let dRange = new CellRangeProxy(1, 1, 1, 8);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 1);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 1);
            assert.equal(pArr[2].cell.cellStyleID, 2);
            assert.equal(pArr[3].cell.cellStyleID, 1);
            assert.equal(pArr[4].cell.cellStyleID, 3);
            assert.equal(pArr[5].cell.cellStyleID, 0);
            assert.equal(pArr[6].cell.cellStyleID, 1);
        });


        it(' 1行多列 * 1列多行 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                    }
                },
                1: {
                    cells: {
                        0: {style: 1},
                    }
                },
                2: {
                    cells: {
                        0: {style: 2},
                    }
                },
                3: {
                    cells: {
                        0: {style: 1},
                    }
                },
                4: {
                    cells: {
                        0: {style: 3},
                    }
                }
            });
            // 1行多列
            let sRange = new CellRangeProxy(0, 0, 0, 4);
            // 1列多行
            let dRange = new CellRangeProxy(1, 1, 8, 1);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 4);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 0);
            assert.equal(pArr[2].cell.cellStyleID, 0);
            assert.equal(pArr[3].cell.cellStyleID, 0);
            assert.equal(pArr[4].cell.cellStyleID, 0);
            assert.equal(pArr[5].cell.cellStyleID, 0);
            assert.equal(pArr[6].cell.cellStyleID, 0);
            assert.equal(pArr[7].cell.cellStyleID, 0);
        });

        it(' 1行多列 * 多列多行 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
            });
            // 1行多列
            let sRange = new CellRangeProxy(0, 0, 0, 4);
            // 1列多行
            let dRange = new CellRangeProxy(1, 1, 8, 5);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 5);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 1);
            assert.equal(pArr[2].cell.cellStyleID, 2);
            assert.equal(pArr[3].cell.cellStyleID, 1);
            assert.equal(pArr[4].cell.cellStyleID, 3);
            assert.equal(pArr[5].cell.cellStyleID, 0);
            assert.equal(pArr[6].cell.cellStyleID, 1);
            assert.equal(pArr[7].cell.cellStyleID, 2);
        });


        it(' 多行多列 * 多列多行 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                1: {
                    cells: {
                        0: {style: 0},
                        1: {style: 2},
                        2: {style: 2},
                        3: {style: 3},
                        4: {style: 1},
                    }
                },
                2: {
                    cells: {
                        0: {style: 0},
                        1: {style: 0},
                        2: {style: 0},
                        3: {style: 0},
                        4: {style: 0},
                    }
                },
                3: {
                    cells: {
                        0: {style: 1},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                4: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 2},
                        4: {style: 3},
                    }
                },
            });
            // 1行多列
            let sRange = new CellRangeProxy(0, 0, 4, 4);
            // 1列多行
            let dRange = new CellRangeProxy(1, 1, 9, 6);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 9);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 1);
            assert.equal(pArr[2].cell.cellStyleID, 2);
            assert.equal(pArr[3].cell.cellStyleID, 1);
            assert.equal(pArr[4].cell.cellStyleID, 3);
            assert.equal(pArr[5].cell.cellStyleID, 0);
            assert.equal(pArr[6].cell.cellStyleID, 0);
            assert.equal(pArr[7].cell.cellStyleID, 2);
            assert.equal(pArr[8].cell.cellStyleID, 2);
            assert.equal(pArr[9].cell.cellStyleID, 3);
            assert.equal(pArr[10].cell.cellStyleID, 1);
            assert.equal(pArr[11].cell.cellStyleID, 0);
            assert.equal(pArr[12].cell.cellStyleID, 0);
            assert.equal(pArr[13].cell.cellStyleID, 0);
        });

        it(' 多行多列 * 1行多列 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                1: {
                    cells: {
                        0: {style: 0},
                        1: {style: 2},
                        2: {style: 2},
                        3: {style: 3},
                        4: {style: 1},
                    }
                },
                2: {
                    cells: {
                        0: {style: 0},
                        1: {style: 0},
                        2: {style: 0},
                        3: {style: 0},
                        4: {style: 0},
                    }
                },
                3: {
                    cells: {
                        0: {style: 1},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                4: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 2},
                        4: {style: 3},
                    }
                },
            });
            // 1行多列
            let sRange = new CellRangeProxy(0, 0, 4, 4);
            // 1列多行
            let dRange = new CellRangeProxy(5, 5, 5, 11);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 3);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 1);
            assert.equal(pArr[2].cell.cellStyleID, 2);
            assert.equal(pArr[3].cell.cellStyleID, 1);
            assert.equal(pArr[4].cell.cellStyleID, 3);

        });

        it(' 多行多列 * 1列多行 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                1: {
                    cells: {
                        0: {style: 0},
                        1: {style: 2},
                        2: {style: 2},
                        3: {style: 3},
                        4: {style: 1},
                    }
                },
                2: {
                    cells: {
                        0: {style: 0},
                        1: {style: 0},
                        2: {style: 0},
                        3: {style: 0},
                        4: {style: 0},
                    }
                },
                3: {
                    cells: {
                        0: {style: 1},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                4: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 2},
                        4: {style: 3},
                    }
                },
            });
            // 多行多列
            let sRange = new CellRangeProxy(0, 0, 4, 4);
            // 1列多行
            let dRange = new CellRangeProxy(5, 5, 11, 5);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 7);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 0);
            assert.equal(pArr[2].cell.cellStyleID, 0);
            assert.equal(pArr[3].cell.cellStyleID, 1);
            assert.equal(pArr[4].cell.cellStyleID, 0);
            assert.equal(pArr[5].cell.cellStyleID, 0);
            assert.equal(pArr[6].cell.cellStyleID, 0);
        });


        it(' 1列多行 * 1列多行 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                    }
                },
                1: {
                    cells: {
                        0: {style: 1},
                    }
                },
                2: {
                    cells: {
                        0: {style: 2},
                    }
                },
                3: {
                    cells: {
                        0: {style: 1},
                    }
                },
                4: {
                    cells: {
                        0: {style: 3},
                    }
                }
            });
            // 1列多行
            let sRange = new CellRangeProxy(0, 0, 4, 0);
            // 1列多行
            let dRange = new CellRangeProxy(1, 1, 8, 1);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 6);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 1);
            assert.equal(pArr[2].cell.cellStyleID, 2);
            assert.equal(pArr[3].cell.cellStyleID, 1);
            assert.equal(pArr[4].cell.cellStyleID, 3);
            assert.equal(pArr[5].cell.cellStyleID, 0);
            assert.equal(pArr[6].cell.cellStyleID, 1);
            assert.equal(pArr[7].cell.cellStyleID, 2);
        });

        it(' 1列多行 * 1行多列 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                1: {
                    cells: {
                        0: {style: 0},
                        1: {style: 2},
                        2: {style: 2},
                        3: {style: 3},
                        4: {style: 1},
                    }
                },
                2: {
                    cells: {
                        0: {style: 0},
                        1: {style: 0},
                        2: {style: 0},
                        3: {style: 0},
                        4: {style: 0},
                    }
                },
                3: {
                    cells: {
                        0: {style: 1},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                4: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 2},
                        4: {style: 3},
                    }
                },
            });
            // 1列多行
            let sRange = new CellRangeProxy(0, 0, 4, 0);
            // 1行多列
            let dRange = new CellRangeProxy(1, 1, 1, 8);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 2);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 0);
            assert.equal(pArr[2].cell.cellStyleID, 0);
            assert.equal(pArr[3].cell.cellStyleID, 0);
            assert.equal(pArr[4].cell.cellStyleID, 0);
            assert.equal(pArr[5].cell.cellStyleID, 0);

        });

        it(' 1列多行 * 多列多行 ', function () {
            data.coreRows.setData({
                0: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                1: {
                    cells: {
                        0: {style: 1},
                        1: {style: 2},
                        2: {style: 2},
                        3: {style: 3},
                        4: {style: 1},
                    }
                },
                2: {
                    cells: {
                        0: {style: 2},
                        1: {style: 0},
                        2: {style: 0},
                        3: {style: 0},
                        4: {style: 0},
                    }
                },
                3: {
                    cells: {
                        0: {style: 1},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 1},
                        4: {style: 3},
                    }
                },
                4: {
                    cells: {
                        0: {style: 0},
                        1: {style: 1},
                        2: {style: 2},
                        3: {style: 2},
                        4: {style: 3},
                    }
                },
            });
            // 1列多行
            let sRange = new CellRangeProxy(0, 0, 4, 0);
            // 多列多行
            let dRange = new CellRangeProxy(1, 1, 8, 5);

            let paintFormat = new PaintFormat(sRange, dRange);
            let paintType = paintFormat.getPaintType();
            assert.equal(paintType, 8);

            let sri = dRange.sri;
            let sci = dRange.sci;

            let dsri = sri - sRange.sri;
            let dsci = sci - sRange.sci;
            let darr = data.makeCellPropArr(sRange, dsri, dsci);

            let pArr = paintFormat.makePaintArr(paintType, darr);
            assert.equal(pArr[0].cell.cellStyleID, 0);
            assert.equal(pArr[1].cell.cellStyleID, 0);
            assert.equal(pArr[2].cell.cellStyleID, 0);
            assert.equal(pArr[3].cell.cellStyleID, 0);
            assert.equal(pArr[4].cell.cellStyleID, 0);
            assert.equal(pArr[5].cell.cellStyleID, 1);
        });
    });

    describe('  tryParseToNum  ', () => {
        it(' text: 322.12 value: 322.121 to number', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "322.12", "formulas": "322.12", "style": style};
            data.coreRows.setCell(1, 1, cell, 'number');
            let {state, text} = data.tryParseToNum(cell, 1, 1);

            assert.equal(state, true);
            assert.equal(text, '322.12');

            cstyle.format = 'normal';
            style = data.addStyle(cstyle);
            cell.style = style;
            data.coreRows.setCell(1, 1, cell, 'normal');
            let args = data.tryParseToNum(cell, 1, 1);

            assert.equal(args.state, true);
            assert.equal(args.text, '322.12');
        });

        // 可能小数点的情况以后会发生变化
        it(' text:  1899-12-31 value: 1.23 to date', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);

            let cell = {"text": "1899-12-31", "formulas": "1899-12-31", "style": style};
            data.coreRows.setCell(1, 1, cell, 'date');
            let args = data.tryParseToNum(cell, 1, 1);
            console.log(args);
            assert.equal(args.state, true);
            assert.equal(args.text, '1899-12-31');
        });

        it(' text:  1899-12-31 ', function () {
            let cell = {"text": "1899-12-31", "formulas": "1899-12-31"};
            data.coreRows.setCell(1, 1, cell);
            let args = data.tryParseToNum(cell, 1, 1);
            assert.equal(args.state, true);
            assert.equal(args.text, '1');
        });

        it(' text: "" ', function () {
            let cstyle = {};
            cstyle.format = 'rmb';
            let style = data.addStyle(cstyle);
            let cell = {"text": "", "formulas": "", style: style};
            data.coreRows.setCell(1, 1, cell);
            let args = data.tryParseToNum(cell, 1, 1);

            assert.equal(args.state, false);
        });

        it(' text: "asd" ', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);
            let cell = {"text": "asd", "formulas": "asd", style: style};
            data.coreRows.setCell(1, 1, cell);
            let args = data.tryParseToNum(cell, 1, 1);
            assert.equal(args.state, false);
            assert.equal(args.text, 'asd');
        });

        it(' text: null ', function () {
            let cstyle = {};
            cstyle.format = 'percent';
            let style = data.addStyle(cstyle);
            let cell = {  style: style};
            data.coreRows.setCell(1, 1, cell);
            let args = data.tryParseToNum(cell, 1, 1);
            console.log(args)
            assert.equal(args.state, false);
        });

        it(' text:  1899-12-312 ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "1899-12-31", "formulas": "1899-12-31", "style": style};
            data.coreRows.setCell(1, 1, cell);
            let args = data.tryParseToNum(cell, 1, 1);
            assert.equal(args.state, true);
            assert.equal(args.text, "1899-12-31");
        });

        it(' 44048 -> ￥', function () {
            let cstyle = {};
            cstyle.format = 'rmb';
            let style = data.addStyle(cstyle);
            let cell = {"text": "44048", "formulas": "44048", "style": style};
            data.coreRows.setCell(1, 1, cell, 'rmb');
            let {state, text} = data.tryParseToNum(cell, 1, 1);
            assert.equal(state, true);
            assert.equal(text, '￥44048');

            cell = {"text": "2019-01-01", "formulas": "2019-01-01", "style": style};
            data.coreRows.setCell(1, 1, cell, 'rmb');
            let args = data.tryParseToNum(cell, 1, 1);

            assert.equal(args.state, true);
            assert.equal(args.text, '￥43466');
        });

        it('  44048 -> % ', function () {
            let cstyle = {};
            cstyle.format = 'percent';
            let style = data.addStyle(cstyle);
            let cell = {"text": "44048", "formulas": "44048", "style": style};
            data.coreRows.setCell(1, 1, cell, 'percent');
            let {state, text} = data.tryParseToNum(cell, 1, 1);

            assert.equal(text, '4404800.00%');
            assert.equal(state, true);
        });

        it(' 2019-01-01 to number', function () {
            let cstyle = {};
            cstyle.format = 'number';
            let style = data.addStyle(cstyle);

            let cell = {"text": "2019-01-01", "formulas": "2019-01-01", "style": style};
            data.coreRows.setCell(1, 1, cell, 'number');
            let args = data.tryParseToNum(cell, 1, 1);

            assert.equal(args.state, true);
            assert.equal(args.text, '43466.00');

        });

        it(' 2019-01-01 to normal', function () {
            let cstyle = {};
            cstyle.format = 'normal';
            let style = data.addStyle(cstyle);

            let cell = {
                "text": "43466",
                "formulas": "43466",
                "style": style,
            };
            data.coreRows.setCell(1, 1, cell, 'normal');
            let {state, text} = data.tryParseToNum(cell, 1, 1);

            cell = data.coreRows.getCell(1, 1);
            assert.equal(state, true);
            assert.equal(text, '43466');
            assert.equal(cell.formulas, '43466');
        });


        it('  57294 number to date    ', function () {
            let cstyle = {};
            cstyle.format = 'date';
            let style = data.addStyle(cstyle);
            let cell = {"text": "57294", "formulas": "=D3", "style": style};
            data.coreRows.setCell(1, 1, cell, 'normal');
            let args = data.tryParseToNum(cell, 1, 1);
            assert.equal(args.text, "2056-11-10");
            cell = data.coreRows.getCell(1, 1);
            assert.equal(cell.formulas, "=D3");
        });


    });

    describe(' range move pos ', () => {

        it('  getCellTextByShift  ', function () {
            let args = data.coreRows.getCellTextByShift(splitStr('=AVERAGE(B1:B5)'), 1, 2);
            assert.equal(args.bad, false);
            assert.equal(args.result, '=AVERAGE(C3:C7)');

            args = data.coreRows.getCellTextByShift(splitStr('=AVERAGE(B$3:$B10)'), 1, 2);
            assert.equal(args.bad, false);
            assert.equal(args.result, '=AVERAGE(B$5:$B12)');

            args = data.coreRows.getCellTextByShift(splitStr('=C4'), 0, 1, true, true, 3, true);
            assert.equal(args.bad, false);
            assert.equal(args.result, '=C5');
        });
    });

    describe('  recast  ', () => {
        it(' =() recast', function () {
            let recast = new Recast('=()');
            let error = false;
            try {
                recast.parse();
            } catch {
                error = true;
            }
            assert.equal(error, true);
        });

        it(' ="asffsdf""fghfg" ', function () {
            let recast = new Recast('="asffsdf""fghfg"');
            let error = false;
            try {
                recast.parse();
            } catch {
                error = true;
            }
            assert.equal(error, false);
        });

        it(' =INDEX({1,2;3,4},0,2) ', function () {
            let recast = new Recast('=INDEX({1,2;3,4},0,2) ');
            let error = false;
            try {
                recast.parse();
            } catch {
                error = true;
            }
            assert.equal(error, false);
        });
    });

    describe('  isHave ', () => {
        it(' isHave ', function () {
            let cell = {
                "text": "abc"
            };
            assert.equal(isHave(cell.text), true);
            assert.equal(isHave(cell.formulas), false);
        });
    });

    describe('  dateDiff  ', () => {
        it(' asd/2019-01-01/... ', function () {
            let result = dateDiff('asd');
            assert.equal(result.isValid, false);

            result = dateDiff('2019-01-01');
            assert.equal(result.isValid, true);
            assert.equal(result.diff, 43466);

            result = dateDiff('2019-01-01  1:11:11');
            assert.equal(result.isValid, false);

            result = dateDiff('2019年01月01日');
        });
    });

    describe('changeFormat', () => {
        it(' 2019-01-01 -> 2019年1月1日', function () {

            assert.equal(changeFormat('2019-01-01'), '2019年01月01日');
        });
    });

    describe('  formatDate  ', () => {
        it(' 123.00/123/123.1/123.1a/123.a.as/123.121 ', function () {
            let args = formatDate('123.00');
            assert.equal(args.state, true);
            assert.equal(args.date, '1900-05-02');

            args = formatDate('123');
            assert.equal(args.state, true);
            assert.equal(args.date, '1900-05-02');

            args = formatDate('123.1');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '1900-05-02  2:24:00');
            assert.equal(args.date, '1900-05-02');

            args = formatDate('123.1a');
            assert.equal(args.state, false);
            assert.equal(args.date, 'Invalid Date');

            args = formatDate('123.a.as');
            assert.equal(args.state, false);
            assert.equal(args.date, 'Invalid Date');

            args = formatDate('123.121');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '1900-05-02  2:54:14');
            assert.equal(args.minute, true);


            args = formatDate('123.121');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '1900-05-02  2:54:14');

            args = formatDate('41241.12');
            assert.equal(args.state, true);
            assert.equal(args.date_formula, '2012-11-28  2:52:48');
            assert.equal(args.minute, true);

            args = formatDate('41241');
            assert.equal(args.state, true);
            assert.equal(args.date, '2012-11-28');

            args = formatDate('41241.a');
            assert.equal(args.state, false);
            assert.equal(args.date, 'Invalid Date');

            args = formatDate('2019-01-01');
            assert.equal(args.state, false);
            assert.equal(args.date, 'Invalid Date');
        });
    })
});
