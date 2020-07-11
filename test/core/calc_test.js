import {describe, it} from "mocha";
import {CoreSheet} from "../../src/core/core_data_proxy/core_sheet_change";
import {PreAction} from "../../src/core/core_data_proxy/pre_action";
import {CellRangeProxy} from "../../src/internal_module/cell_range";
import {FormatCell} from "../../src/core/core_data_proxy/cell_format_cell";

let assert = require('assert');

describe('calc', () => {
    let data = new CoreSheet("sheet1", {}, {});

    it(' bug1 ', function () {
        let cell = new FormatCell()
        cell.updateFormatCellByObject({text: "=ABS(-1)", formulas: "=ABS(-1)", style: 1})
        data.coreRows.setCell(1, 1, cell, 'all');

        let changeDataForCalc = new PreAction({
            type: 11,
            ri: -1,
            ci: -1,
            oldCell:data.coreRows.eachRange(new CellRangeProxy(0, 0, 10, 10)),
            newCell: data.coreRows.eachRange(new CellRangeProxy(0, 0, 10, 10))
        }, data);
        data.calc.updateByCoreWorkbookAndChangeDetail(data.coreRows, changeDataForCalc);
        data.calc.updateByCoreWorkbookAndChangeDetail(data.coreRows, changeDataForCalc);

        let cell1 = data.coreRows.getCell(1,1);
        console.log(cell1);
        assert.equal(cell1.text, '1');
        assert.equal(cell1.formulas, '=ABS(-1)');
        assert.equal(cell1.cellStyleID, 1);
    });

    it(' bug2 ', function () {
        let cell = new FormatCell()
        cell.updateFormatCellByObject({text: "1", formulas: "1", depend: ['B2']});
        data.coreRows.setCell(0, 0, cell, 'all');
        let changeDataForCalc = new PreAction({
            type: 1,
            ri: 0,
            ci: 0,
            action: "在A1中键入1",
            oldCell:data.coreRows.eachRange(new CellRangeProxy(0, 0, 0, 0)),
            newCell: data.coreRows.eachRange(new CellRangeProxy(0, 0, 0, 0))
        }, data);


        let cell2 = new FormatCell();
        cell2.updateFormatCellByObject({text: "=A1", formulas: "=A1", depend: ['C3']})
        data.coreRows.setCell(1, 1, cell2, 'all');

        let cell3 = new FormatCell()
        cell3.updateFormatCellByObject({text: "=B2", formulas: "=B2"})
        data.coreRows.setCell(2, 2, cell3, 'all');

        data.calc.updateByCoreWorkbookAndChangeDetail(data.coreRows, changeDataForCalc);
        data.coreRows.setCell(0, 0, {text: "2", formulas: "2", depend: ['B2']}, 'all');
        changeDataForCalc = new PreAction({
            type: 1,
            ri: 0,
            ci: 0,
            action: "在A1中键入1",
            oldCell:data.coreRows.eachRange(new CellRangeProxy(0, 0, 0, 0)),
            newCell: data.coreRows.eachRange(new CellRangeProxy(0, 0, 0, 0))
        }, data);
        data.calc.updateByCoreWorkbookAndChangeDetail(data.coreRows, changeDataForCalc);

        cell2 = data.coreRows.getCell(1,1);
        cell3 = data.coreRows.getCell(2, 2);

        assert.equal(cell2.text, '2');
        assert.equal(cell2.formula, '2');
        assert.equal(cell3.text, '2');
        assert.equal(cell3.formula, '2');

        console.log(data.coreRows.getCell(0, 0));
        console.log(data.coreRows.getCell(1,1));
        console.log(data.coreRows.getCell(2, 2));
    });

    it(' bug3 ', function () {
        let cell2 = new FormatCell();
        cell2.updateFormatCellByObject({text: "=A1", formulas: "=A1"})
        data.coreRows.setCell(1, 1, cell2, 'all');

        data.calc.updateByCoreWorkbookAndChangeDetail(data.coreRows, changeDataForCalc);
        cell2 = data.coreRows.getCell(1,1);

        let changeDataForCalc = new PreAction({
            type: 11,
            ri: -1,
            ci: -1,
            oldCell:data.coreRows.eachRange(new CellRangeProxy(0, 0, 10, 10)),
            newCell: data.coreRows.eachRange(new CellRangeProxy(0, 0, 10, 10))
        }, data);
        data.calc.updateByCoreWorkbookAndChangeDetail(data.coreRows, changeDataForCalc);
        data.calc.updateByCoreWorkbookAndChangeDetail(data.coreRows, changeDataForCalc);

        assert.equal(cell2.text, '0');
        assert.equal(cell2.formula, '=A1');
    });


});
