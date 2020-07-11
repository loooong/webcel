import { describe, it } from 'mocha';
import {CoreSheet}  from '../../src/core/core_data_proxy/core_sheet_change';

describe(' changeInsertRowOrCol/delete coreRows/cols ', () => {
  let workbookServer = new CoreSheet("sheet1", {}, {}); // 新建DataProxy类
  // 具体数据可以在获取： /test/core/runTest/html/test1.html
  //  通过preAction传递。  type=13为插入行/列，type=14为删除行/列，ri, ci为从哪里插入, property在config.js中定义，如下图， action为辅助说明。
  it('  changeInsertRowOrCol ', () => { //在行/列插入
    workbookServer.coreRows.setData({ // 直接把数据赋值给rows； 并且建立依赖关系？
      1: {
        cells: {
          0: {"text": "A2", "formulas": "A2"},
          1: {"text": "=A3", "formulas": "=A3", },
          // 1: {"text": "=A3", "formulas": "=A3", "merge": [1, 0]},
          2: {"text": "=A1:A2", "formulas": "=A1:A2"},
          3: {"text": "=$A3:A5", "formulas": "=$A3:A5"},
          4: {"text": "=abs(A4)", "formulas": "=abs(A4)"},
          5: {"text": "=abs($A4)", "formulas": "=abs($A4)"},
          6: {"text": '=add("A1" + A3:A5 + $A2:A$3)', "formulas": '=add("A1" + A3:A5 + $A2:A$3)', },
          // 6: {"text": '=add("A1" + A3:A5 + $A2:A$3)', "formulas": '=add("A1" + A3:A5 + $A2:A$3)', "merge": [0, 2]},
        }
      },
    });
    // coreWorkbook.merges.setData([
    //     'B2:B3', 'G2:I2'
    // ]);
    let res1 = workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, null);
    workbookServer.changeInsertRowOrCol('row', 1, 0); // 在第一行插入一行； 会改变rows，增加preAction的记录等
    let res2 = workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows,workbookServer.changeDataForCalc);
    assert.equal(workbookServer.coreRows.getCell(2, 0).formulas, "A2");
    assert.equal(workbookServer.coreRows.getCell(2, 1).formulas, "=A4");
    assert.equal(workbookServer.coreRows.getCell(2, 2).formulas, "=A2:A3");
    assert.equal(workbookServer.coreRows.getCell(2, 3).formulas, "=$A4:A6");
    assert.equal(workbookServer.coreRows.getCell(2, 4).formulas, "=ABS(A5)");
    assert.equal(workbookServer.coreRows.getCell(2, 5).formulas, "=ABS($A5)");
    assert.equal(workbookServer.coreRows.getCell(2, 6).formulas, '=add("A1" + A3:A5 + $A2:A$3)');

    workbookServer.changeInsertRowOrCol('column', 1, 0);   // 在第一列插入一列
    workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, workbookServer.changeDataForCalc);
    assert.equal(workbookServer.coreRows.getCell(2, 1).formulas, "A2");
    assert.equal(workbookServer.coreRows.getCell(2, 2).formulas, "=B4");
    assert.equal(workbookServer.coreRows.getCell(2, 3).formulas, "=B2:B3");
    assert.equal(workbookServer.coreRows.getCell(2, 4).formulas, "=$B4:B6");
    assert.equal(workbookServer.coreRows.getCell(2, 5).formulas, "=ABS(B5)");
    assert.equal(workbookServer.coreRows.getCell(2, 6).formulas, "=ABS($B5)");
    assert.equal(workbookServer.coreRows.getCell(2, 7).formulas, '=add("A1" + B3:B5 + $B2:B$3)');
  });

  it('  insert2  ', function () {
    workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, null);

    workbookServer.coreRows.setData({
      4: {
        cells: {
          0: {"text": "A2", "formulas": "A2"},
          1: {"text": "=A3", "formulas": "=A3"},
          2: {"text": "=A1:A2", "formulas": "=A1:A2"},
          3: {"text": "=$A3:A5", "formulas": "=$A3:A5"},
          4: {"text": "=abs(A4)", "formulas": "=abs(A4)"},
          5: {"text": "=abs($A4)", "formulas": "=abs($A4)"},
          6: {"text": "=abs($C4)", "formulas": "=abs($C4)"},
        }
      },
    });
    workbookServer.coreSelector.selectedCoreRange.sri = 2;
    workbookServer.coreSelector.selectedCoreRange.sci = 1;
    workbookServer.changeInsertRowOrCol('row', 1);      // 在第三行插入一行
    workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, workbookServer.changeDataForCalc["coreWorkbook"]);
    assert.equal(workbookServer.coreRows.getCell(5, 0).formulas, 'A2');
    assert.equal(workbookServer.coreRows.getCell(5, 1).formulas, '=A4');
    assert.equal(workbookServer.coreRows.getCell(5, 2).formulas, '=A1:A2');
    assert.equal(workbookServer.coreRows.getCell(5, 3).formulas, '=$A4:A6');
    assert.equal(workbookServer.coreRows.getCell(5, 4).formulas, '=ABS(A5)');
    assert.equal(workbookServer.coreRows.getCell(5, 5).formulas, '=ABS($A5)');
    assert.equal(workbookServer.coreRows.getCell(5, 6).formulas, '=ABS($A5)');

    workbookServer.changeInsertRowOrCol('column', 1);  // 在第二列插入一列
    workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, workbookServer.changeDataForCalc["coreWorkbook"]);
    assert.equal(workbookServer.coreRows.getCell(5, 0).formulas, 'A2');
    assert.equal(workbookServer.coreRows.getCell(5, 1).formulas, '');
    assert.equal(workbookServer.coreRows.getCell(5, 2).formulas, '=A4');
    assert.equal(workbookServer.coreRows.getCell(5, 3).formulas, '=A1:A2');
    assert.equal(workbookServer.coreRows.getCell(5, 4).formulas, '=$A4:A6');
    assert.equal(workbookServer.coreRows.getCell(5, 5).formulas, '=ABS(A5)');
    assert.equal(workbookServer.coreRows.getCell(5, 6).formulas, '=ABS($A5)');
    assert.equal(workbookServer.coreRows.getCell(5, 7).formulas, '=ABS($D5)');
  });

  it(' delete ', function () {
    workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, null);

    workbookServer.coreRows.setData({
      1: {
        cells: {
          0: {"text": "A2", "formulas": "A2", "style": 3},
          1: {"text": "=A3", "formulas": "=A3"},
          2: {"text": "=A1:A2", "formulas": "=A1:A2"},
          3: {"text": "=$A3:A5", "formulas": "=$A3:A5", "style": 1},
          4: {"text": "=abs(A4)", "formulas": "=abs(A4)"},
          5: {"text": "=abs($A4)", "formulas": "=abs($A4)"},
          6: {"text": '=add("A1" + A3:A5 + $A2:A$3)', "formulas": '=add("A1" + A3:A5 + $A2:A$3)', },
        }
      },
    });
    workbookServer.changeDelete('row', 1, 0); // 在第一行删除一行
    workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, workbookServer.changeDataForCalc);

    assert.equal(workbookServer.coreRows.getCell(0, 0).formulas, "A2");
    assert.equal(workbookServer.coreRows.getCell(0, 1).formulas, "=A2");
    assert.equal(workbookServer.coreRows.getCell(0, 2).formulas, "=A1:A1");
    assert.equal(workbookServer.coreRows.getCell(0, 3).formulas, "=$A2:A4");
    assert.equal(workbookServer.coreRows.getCell(0, 4).formulas, "=ABS(A3)");
    assert.equal(workbookServer.coreRows.getCell(0, 5).formulas, "=ABS($A3)");
    assert.equal(workbookServer.coreRows.getCell(0, 6).formulas, '=add("A1" + A2:A4 + $A1:A$2)');

    workbookServer.changeDelete('column', 1, 0); // 在第一列删除一列
    workbookServer.calc.updateByCoreWorkbookAndChangeDetail(workbookServer.coreRows, workbookServer.changeDataForCalc);
    assert.equal(workbookServer.coreRows.getCell(0, 0).formulas, "=#REF!");
    assert.equal(workbookServer.coreRows.getCell(0, 1).formulas, "=#REF!");
    assert.equal(workbookServer.coreRows.getCell(0, 2).formulas, "=#REF!");
    assert.equal(workbookServer.coreRows.getCell(0, 3).formulas, "=ABS(#REF!)");
    assert.equal(workbookServer.coreRows.getCell(0, 4).formulas, "=ABS(#REF!)");
    assert.equal(workbookServer.coreRows.getCell(0, 5).formulas, '=add("A1" +#REF! +#REF!)');
  });
});
