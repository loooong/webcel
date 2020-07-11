import { Calc } from '../../src/calc/calc_cmd/calc';
import assert from 'assert';
import {
  ERROR_CIRCULAR,
  ERROR_NA,
  ERROR_NAME,
  ERROR_REF, FAIL_OBJ_SHIFT_RANGE_OVERLAP_CUT_RANGE
} from '../../src/calc/calc_utils/error_config';
import { DEFAULT_MAX_ROW } from '../../src/calc/calc_utils/config';

describe('单元格编辑', function () {
  //
  it('移动单元格', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '=-1+1*0.5-2^2/0.5' };
    workbook.Sheets.Sheet1.B1 = {f: '=FLOOR.MATH(-8.1,2)'}; // 负号运算符
    workbook.Sheets.Sheet1.A2 = {f: '=A1+1'}
    workbook.Sheets.Sheet1.A3 = {f: '=A2+1+B1'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    let res = workbook.Sheets.Sheet1.A3.calcCell.updateFormulaStringByShiftArray([2,3],true)
    assert.equal(res, "=D4+1+E3");
  });

  // 更新单元格之后能更新连带的单元格
  it('基本运算', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '=-1+1*0.5-2^2/0.5' };
    workbook.Sheets.Sheet1.B1 = {f: '=FLOOR.MATH(-8.1,2)'}; // 负号运算符
    workbook.Sheets.Sheet1.A2 = {f: '=A1+1'}
    workbook.Sheets.Sheet1.A3 = {f: '=A2+1+B1'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), -8.5);
    let sheetID2CellLoc2Formula = {
      0: {"0_0": "=1"}
    }

    calc.calcWorkbookProxy.workbookEditor.editUpdateBySheetID2CellLoc2Formula(sheetID2CellLoc2Formula)
    workbook.Sheets = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    assert.equal(workbook.Sheets.Sheet1.A2.v.toNumber(), 2);
    assert.equal(workbook.Sheets.Sheet1.B1.v.toNumber(), -10);
    assert.equal(workbook.Sheets.Sheet1.A3.v.toNumber(), -7);
  });
  // 更新多个单元格之后能更新连带的单元格
  it('多个单元格更新', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '=-1' };
    workbook.Sheets.Sheet1.A2 = {f: '=A1+1'}
    workbook.Sheets.Sheet1.A3 = {f: '=A1+1+B2'}
    workbook.Sheets.Sheet1.B1 = {f: '=sum(A1:A3)'};


    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.B1.v.toNumber(), -1);
    let sheetID2CellLoc2Formula = {
      0: {"0_0": "=1",
        "1_0":"=A1+2",
        "1_1":"2",
        "1_2":"=B1+A1",
      },
    }

    calc.calcWorkbookProxy.workbookEditor.editUpdateBySheetID2CellLoc2Formula(sheetID2CellLoc2Formula)
    workbook.Sheets = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    assert.equal(workbook.Sheets.Sheet1.A2.v.toNumber(), 3);
    assert.equal(workbook.Sheets.Sheet1.A3.v.toNumber(), 4);
    assert.equal(workbook.Sheets.Sheet1.B1.v.toNumber(), 8);
  });

  // 通过sheetName来更新, 跨sheet的引用
  it('通过sheetName来更新', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    // assert.equal(workbook.Sheets.Sheet1.B1.v.toNumber(), -1);
    let sheetName2CellLoc2Formula = {
      Sheet1:{
        "0_0":"2",
        "1_1":"-1"
      },
      Sheet2:{
        "0_0":"-1",
        "0_1":"=Sheet1!A1-1",
        "0_2":"=Sheet2!A1+1",
        "0_3":"=Sheet3!A1+1", // 不存在的sheet，需要报错
      }
    }

    calc.calcWorkbookProxy.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula)
    workbook.Sheets = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_0"), -1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_1"), 1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_2"), 0)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_3").toString(), ERROR_REF) // 存在#REF错误

    sheetName2CellLoc2Formula = {
      Sheet3:{
        "0_0":"2",
        "0_3":"=average(Sheet1!A:B) + 1",
      }
    }
    calc.calcWorkbookProxy.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_3").toString(), ERROR_REF) // 存在#REF错误的单元格不会被通知
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("2!A1_0_3").toNumber(), 1.5)
    sheetName2CellLoc2Formula = {
      Sheet2:{
        "0_3":"=Sheet3!A1+1", // 不存在的sheet，需要报错
      }
    }
    calc.calcWorkbookProxy.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_3").toNumber(), 3)

  });

  it('对sheet创建，重命名，删除', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    // assert.equal(workbook.Sheets.Sheet1.B1.v.toNumber(), -1);
    let sheetName2CellLoc2Formula = {
      Sheet1:{
        "0_0":"2",
      },
      Sheet2:{
        "0_0":"-1",
        "0_1":"=Sheet1!A1-1",
        "0_2":"=Sheet2!A1+1",
      }
    }
    calc.calcWorkbookProxy.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula)
    sheetName2CellLoc2Formula = { // 创建sheet
      Sheet2:{
        "0_3":"=Sheet3!A1+1",
      },
      Sheet3:{
      }
    }
    calc.calcWorkbookProxy.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula)
    workbook.Sheets = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_3"), 1)
  });

  it('renameSheet', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet2 = {};
    workbook.Sheets.Sheet1.A1 = {f: '=-1+1*0.5-2^2/0.5' };
    workbook.Sheets.Sheet1.B1 = {f: '=FLOOR.MATH(-8.1,2)'}; // 负号运算符
    workbook.Sheets.Sheet1.A2 = {f: '=Sheet1!A1+1'}
    workbook.Sheets.Sheet2.A3 = {f: '=Sheet1!A2+1+B1'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), -8.5);
    let res = calc.calcWorkbookProxy.workbookEditor.editRenameSheet("Sheet1","new1")
    let sheetName2CellLoc2Formula = { // 创建sheet
      Sheet2:{
        "0_3":"=Sheet3!A3+1",
      },
      Sheet3:{
      }
    }
    calc.calcWorkbookProxy.workbookEditor.editUpdateByFormulaOptionAndValueToTextOption(sheetName2CellLoc2Formula)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_2_0"), -6.5)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_1"), 0)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_0_3"), 1)

    console.log("")
  });
  it('deleteSheet', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet2 = {};
    workbook.Sheets.Sheet1.A1 = {f: '1' };
    workbook.Sheets.Sheet1.B1 = {f: '0'}; // 负号运算符
    workbook.Sheets.Sheet1.A2 = {f: '-1'}
    workbook.Sheets.Sheet2.A3 = {f: '=Sheet1!A2+1+B1'}
    workbook.Sheets.Sheet2.A4 = {f: '=sum(Sheet1!A2:A3)+1'}
    workbook.Sheets.Sheet2.A5 = {f: '=sum(Sheet1!A:B)+1'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    let res = calc.calcWorkbookProxy.workbookEditor.editDeleteSheetByName("Sheet1")

    let sheetsObj = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_2_0").toString(), "#REF!")
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_3_0").toString(), "#REF!")
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_4_0").toString(), "#REF!")
    assert.equal(sheetsObj.Sheet2.A3.f, "=#REF!+1+B1")
    // 引用无效
    assert.equal(Object.keys(calc.calcWorkbookProxy.workbookEditor.multiCalcCell.getCellByFullLoc("1!A1_3_0").fullLocStr2refID).length,0)

    console.log("")
  });
  it('合并与取消合并', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet2 = {};
    workbook.Sheets.Sheet1.A1 = {f: '1' };
    workbook.Sheets.Sheet1.B1 = {f: '0'}; // 负号运算符
    workbook.Sheets.Sheet1.A2 = {f: '-1'}
    workbook.Sheets.Sheet1.C2 = {f: '2'}
    workbook.Sheets.Sheet2.A3 = {f: '=Sheet1!A2+1+B1'}
    workbook.Sheets.Sheet2.A4 = {f: '=sum(Sheet1!A2:A3)+1'}
    workbook.Sheets.Sheet2.A5 = {f: '=sum(Sheet1!A:B)+1'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    let res = calc.calcWorkbookProxy.workbookEditor.editMergeRange("Sheet1", "0_0_2_2")
    workbook.Sheets = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_0_1").toString(), "")
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_2_0").toNumber(), 1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_3_0").toNumber(), 1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("1!A1_4_0").toNumber(), 2)
    let res2 = calc.calcWorkbookProxy.workbookEditor.editMergeRange("Sheet1", "0_0_3_3") // 会把之前的合并单元格也合并掉
    workbook.Sheets = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()

    assert.equal(calc.calcWorkbookProxy.workbookEditor.multiMergeLoc.getMergeLocBySheetID(0)[0], "0_0_3_3")
    let res3 = calc.calcWorkbookProxy.workbookEditor.editUnMergeRange("Sheet1", "0_0_1_1") // 会把之前的合并单元格取消合并
    workbook.Sheets = calc.calcWorkbookProxy.workbookEditor.getSheetsObj()

    assert.equal(calc.calcWorkbookProxy.workbookEditor.multiMergeLoc.getMergeLocBySheetID(0).length, 0)


    console.log("")
  });
  it('插入range向右移动', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '1' };
    workbook.Sheets.Sheet1.A2 = {f: '-1'}
    workbook.Sheets.Sheet1.A3 = {f: '=Sheet1!A2+1+B1'}
    workbook.Sheets.Sheet1.A4 = {f: '=sum(Sheet1!A2:A3)+1'}
    workbook.Sheets.Sheet1.A5 = {f: '=sum(Sheet1!F:E)+1'} // F:E 在计算中会判定为 E:F
    workbook.Sheets.Sheet1.B1 = {f: '0'}; // 负号运算符
    workbook.Sheets.Sheet1.E2 = {f: '2'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    let res = calc.calcWorkbookProxy.workbookEditor.editMergeRange("Sheet1", "0_0_1_1") // 合并单元格
    let res2 = calc.calcWorkbookProxy.workbookEditor.editInsertRangeShiftRight("Sheet1", "0_0_0_0") // 应该返回错误，因为会打散合并单元格
    assert.equal(typeof res2.msg, "string")


    let res3 = calc.calcWorkbookProxy.workbookEditor.editInsertRangeShiftRight("Sheet1", "0_0_3_1") // 插入Range，会发生重新计算，与代码重构
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_0_2").toNumber(), 1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_1_6").toNumber(), 2)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_4_0").toNumber(), 1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_3_2").toNumber(), 2) // C4
    console.log("")
  });
  it('插入range向下移动', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '1' };
    workbook.Sheets.Sheet1.A2 = {f: '-1'}
    workbook.Sheets.Sheet1.A3 = {f: '=Sheet1!A2+1+B1'}
    workbook.Sheets.Sheet1.A4 = {f: '=sum(Sheet1!A2:A3)+1'}
    workbook.Sheets.Sheet1.A5 = {f: '=sum(Sheet1!E:F)+1'} // todo: 如果CD顺序不一致会自动调整么？
    workbook.Sheets.Sheet1.B1 = {f: '0'}; // 负号运算符
    workbook.Sheets.Sheet1.E2 = {f: '2'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    let res = calc.calcWorkbookProxy.workbookEditor.editMergeRange("Sheet1", "0_0_1_1") // 合并单元格
    let res2 = calc.calcWorkbookProxy.workbookEditor.editInsertRangeShiftDown("Sheet1", "0_0_0_0") // 应该返回错误，因为会打散合并单元格
    assert.equal(typeof res2.msg, "string")


    let res3 = calc.calcWorkbookProxy.workbookEditor.editInsertRangeShiftDown("Sheet1", "0_0_3_1") // 插入Range，会发生重新计算，与代码重构
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_4_0").toNumber(), 1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_6_0").toNumber(), 1)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_7_0").toNumber(), 2)
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_8_0").toNumber(), 3) // C4
    assert.equal(calc.calcWorkbookProxy.workbookEditor.multiSheet.getFirstSheet().maxEditableRow, 1003)
    console.log("")
  });
  it('删除range向左移动', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '1' };
    workbook.Sheets.Sheet1.A2 = {f: '=C4+1'};
    workbook.Sheets.Sheet1.B1 = {f: '0'}; // 负号运算符
    workbook.Sheets.Sheet1.B2 = {f: '-1'}
    workbook.Sheets.Sheet1.B3 = {f: '=Sheet1!A2+1+B1'}
    workbook.Sheets.Sheet1.B4 = {f: '=sum(Sheet1!A2:A3)+1'}
    workbook.Sheets.Sheet1.C4 = {f: '=C1+D1'}
    workbook.Sheets.Sheet1.C5 = {f: '=sum(Sheet1!A:B)+1'}
    workbook.Sheets.Sheet1.E2 = {f: '=A2-C5'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    let res = calc.calcWorkbookProxy.workbookEditor.editMergeRange("Sheet1", "0_4_1_4") // 合并单元格
    let res2 = calc.calcWorkbookProxy.workbookEditor.editDeleterRangeShiftLeft("Sheet1", "0_0_0_0") // 应该返回错误，因为会打散合并单元格
    assert.equal(typeof res2.msg, "string")

    let res3 = calc.calcWorkbookProxy.workbookEditor.editDeleterRangeShiftLeft("Sheet1", "0_0_4_0") // 删除Range
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_2_0").err.message, ERROR_REF)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_2_0"), "=#REF!+1+A1") //因为引用了

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_3_0").err.message, ERROR_REF)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_3_0"), "=sum(#REF!)+1") //因为引用了

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_4_1").err.message, ERROR_CIRCULAR) // 循环依赖； Excel在这个情况下是#REF错误
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_4_1"), "=sum(Sheet1!A:B)+1") //因为引用了

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_3_1").toNumber(), 0)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_3_1"), "=B1+C1") //因为引用了

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_0_3").err.message, ERROR_CIRCULAR) //因为引用了B5
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_0_3"), "=#REF!-B5") //因为引用了
    assert.equal(calc.calcWorkbookProxy.workbookEditor.multiSheet.getFirstSheet().maxEditableCol, 25)
    assert.equal(calc.calcWorkbookProxy.workbookEditor.multiMergeLoc.getMergeLocBySheetID(0)[0], "0_3_1_3") // 合并单元格也会移动
    console.log("")
  });

  it('删除range向上移动', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '1' };
    workbook.Sheets.Sheet1.A2 = {f: '=C4+1'};
    workbook.Sheets.Sheet1.B1 = {f: '0'}; // 负号运算符
    workbook.Sheets.Sheet1.B2 = {f: '-1'}
    workbook.Sheets.Sheet1.B3 = {f: '=Sheet1!A2+1+B2'}
    workbook.Sheets.Sheet1.B4 = {f: '=sum(Sheet1!A2:A3)+1'}
    workbook.Sheets.Sheet1.C4 = {f: '=C2+D2'}
    workbook.Sheets.Sheet1.C5 = {f: '=sum(Sheet1!A:B)+1'}
    workbook.Sheets.Sheet1.E2 = {f: '=A2-C5'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    assert.equal(workbook.Sheets.Sheet1.A1.v.toNumber(), 1);
    let res = calc.calcWorkbookProxy.workbookEditor.editMergeRange("Sheet1", "0_4_1_4") // 合并单元格
    let res2 = calc.calcWorkbookProxy.workbookEditor.editDeleterRangeShiftUp("Sheet1", "0_4_0_4") // 应该返回错误，因为会打散合并单元格
    assert.equal(typeof res2.msg, "string")

    let res3 = calc.calcWorkbookProxy.workbookEditor.editDeleterRangeShiftUp("Sheet1", "0_0_0_3") // 删除Range
    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_0_0"), 1)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_0_0"), "=C3+1")

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_1_1"),1)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_1_1"), "=Sheet1!A1+1+B1")

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_2_1"),2)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_2_1"), "=sum(Sheet1!A1:A2)+1")

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_2_2").toNumber(), 0)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_2_2"), "=C1+D1")

    assert.equal(calc.calcWorkbookProxy.getValueByFullLoc("0!A1_3_2"),4)
    assert.equal(calc.calcWorkbookProxy.getFormulaStringByFullLoc("0!A1_3_2"), "=sum(Sheet1!A:B)+1")
    assert.equal(calc.calcWorkbookProxy.workbookEditor.multiSheet.getFirstSheet().maxEditableRow, DEFAULT_MAX_ROW)
    console.log("")
  });
  it('复制黏贴', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '=sf(A4)' };// 存在#NAME! 错误
    workbook.Sheets.Sheet1.A2 = {f: '=C4+ $A1+ A$1 + $A$1'};
    workbook.Sheets.Sheet1.B1 = {f: '=sum(A1:$A$2)'}; // 负号运算符
    workbook.Sheets.Sheet1.B2 = {f: '=average(C:$F)&"A:A" + $A$1 + A$1 + average(A1:$B1)'}
    workbook.Sheets.Sheet1.B3 = {f: '=Sheet1!A2+1+B1'}
    workbook.Sheets.Sheet1.B4 = {f: '=sum(Sheet1!A2:A3)+1'}
    workbook.Sheets.Sheet1.E1 = {f: '=A1+AB1'}
    workbook.Sheets.Sheet1.E2 = {f: '=sum(Sheet1!A:B)+1'}

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    calc.workbookEditor.editInternalCopyPasteEqualArea("Sheet1", "0_0_1_1", "Sheet1","2_2_3_3")
    let sheetsObj = calc.workbookEditor.getSheetsObj()
    assert.equal(sheetsObj.Sheet1.C3.f, "=sf(C6)") // 存在NAME error的公式，也可以被正确解析
    assert.equal(sheetsObj.Sheet1.C3.v.toString(), ERROR_NAME)
    assert.equal(sheetsObj.Sheet1.C4.f, "=E6+ $A3+ C$1 + $A$1")
    assert.equal(sheetsObj.Sheet1.D3.f, "=sum($A$2:C3)")
    assert.equal(sheetsObj.Sheet1.D4.f, "=average(E:$F)&\"A:A\" + $A$1 + C$1 + average($B3:C3)")

    calc.workbookEditor.editInternalCopyPasteEqualArea("Sheet1", "0_4_1_4", "Sheet1","0_3_1_3") // 移动到D1:D2
    let sheetsObj2 = calc.workbookEditor.getSheetsObj()
    assert.equal(sheetsObj2.Sheet1.D1.f, "=#REF!+AA1")
    assert.equal(sheetsObj2.Sheet1.D1.v.toString(), ERROR_REF)

    assert.equal(sheetsObj2.Sheet1.D2.f, "=sum(#REF!)+1")

    console.log("")
  });

  it('复制黏贴到形状不同的区域内', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '=SUM(A2:A3)  + A2' };
    workbook.Sheets.Sheet1.B1 = {f: '=A4+ $A5+ A$6 + $A$7'};

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    calc.workbookEditor.editMergeRange("Sheet1", "0_1_0_2")
    calc.workbookEditor.editInternalCopyPasteAnyArea("Sheet1", "0_0_0_2",
      "Sheet1","2_2_5_7") // 1*3 的区域黏贴到4*6的区域
    let sheetsObj = calc.workbookEditor.getSheetsObj()
    assert.equal(sheetsObj.Sheet1.C3.f, "=SUM(C4:C5)  + C4") // 保留空格
    assert.equal(sheetsObj.Sheet1.C3.v.toNumber(), 0)
    assert.equal(sheetsObj.Sheet1.C4.f, "=SUM(C5:C6)  + C5")
    assert.equal(sheetsObj.Sheet1.D3.f, "=C6+ $A7+ C$6 + $A$7")
    assert.equal(sheetsObj.Sheet1.D4.f, "=C7+ $A8+ C$6 + $A$7")
    assert.equal(sheetsObj.Sheet1.F3.f, "=SUM(F4:F5)  + F4")
    assert.equal(sheetsObj.Sheet1.G3.f, "=F6+ $A7+ F$6 + $A$7")

    console.log("")
  });
  it('剪切黏贴', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '-1' };
    workbook.Sheets.Sheet1.A2 = {f: '1' };
    workbook.Sheets.Sheet1.B1 = {f: '=SUM(A2:A3)  + A2' };
    workbook.Sheets.Sheet1.C1 = {f: '=A4+ $A5+ A$6 + $A$7'};
    workbook.Sheets.Sheet1.C2 = {f: '=sum (A1:B2)'};
    workbook.Sheets.Sheet1.C5 = {f: '=sum (A1:B2)'};
    workbook.Sheets.Sheet1.C6 = {f: '=SUM(F1:G2)-1'}; // 会被减去

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    calc.workbookEditor.editMergeRange("Sheet1", "2_1_2_2")
    calc.workbookEditor.editCutPasteRange("Sheet1", "0_1_2_2",
      "Sheet1","0_4_5_7") // B1:C3 -> E1:F3
    let sheetsObj = calc.workbookEditor.getSheetsObj()
    assert.equal(sheetsObj.merge.Sheet1[0], "E3:F3")
    assert.equal(sheetsObj.Sheet1.E1.f, "=SUM(A2:A3)  + A2")
    assert.equal(sheetsObj.Sheet1.E1.v.toNumber(), 2)
    assert.equal(sheetsObj.Sheet1.F2.f, "=sum (A1:E2)")
    assert.equal(sheetsObj.Sheet1.C6.f, "=SUM(G1:G2)-1")
    assert.equal(sheetsObj.Sheet1.C6.v, -1)
    console.log("")
  });
  it('插入复制黏贴的区域', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '-1' };
    workbook.Sheets.Sheet1.A2 = {f: '1' };
    workbook.Sheets.Sheet1.B1 = {f: '=SUM(A2:A3)  + A2' };
    workbook.Sheets.Sheet1.C1 = {f: '=A4+ $A5+ A$6 + $A$7'};
    workbook.Sheets.Sheet1.C2 = {f: '=sum(A1:B2)'};
    workbook.Sheets.Sheet1.C5 = {f: '=sum(A1:B2)'};
    workbook.Sheets.Sheet1.C6 = {f: '=SUM(F1:G2)-1'}; // 会被减去

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    calc.workbookEditor.editInsertCopyPasteRange("Sheet1", "0_2_1_3",
      "Sheet1","0_0_5_7",1) // C1:D2 -> A1:B2
    let sheetsObj = calc.workbookEditor.getSheetsObj()
    assert.equal(sheetsObj.Sheet1.A1.f, "=#REF!+ $A5+ #REF! + $A$7")
    assert.equal(sheetsObj.Sheet1.A2.f, "=sum(#REF!)")
    console.log("")
  });
  it('插入剪切黏贴的区域', function () {
    let workbook = {};
    workbook.Sheets = {};
    workbook.Sheets.Sheet1 = {};
    workbook.Sheets.Sheet1.A1 = {f: '-1' };
    workbook.Sheets.Sheet1.A2 = {f: '1' };
    workbook.Sheets.Sheet1.B1 = {f: '=SUM(A2:A3)  + A2' };
    workbook.Sheets.Sheet1.C1 = {f: '=A4+ $A5+ A$6 + $A$7'};
    workbook.Sheets.Sheet1.C2 = {f: '=sum(A1:B2)'};
    workbook.Sheets.Sheet1.C3 = {f: '=AVERAGE(C2:D2)'};
    workbook.Sheets.Sheet1.C5 = {f: '=SUM(A2:B3)+AVERAGE(A:B)'};
    workbook.Sheets.Sheet1.C6 = {f: '=SUM(A3:B4)-1-E1-A11'}; // 会被减去

    let calc = new Calc();
    calc.calculateWorkbook(workbook);
    calc.workbookEditor.editInsertCutPasteRange("Sheet1", "0_2_0_4",
      "Sheet1","1_0_5_7",1) // C1:E1 -> A2:C2
    let sheetsObj = calc.workbookEditor.getSheetsObj()
    assert.equal(sheetsObj.Sheet1.A2.f, "=A5+ $A6+ A$7 + $A$8")
    assert.equal(sheetsObj.Sheet1.B1.f, "=SUM(A3:A4)  + A3")
    assert.equal(sheetsObj.Sheet1.C3.f, "=sum(A1:B3)")
    assert.equal(sheetsObj.Sheet1.C4.f, "=AVERAGE(D2:D2)")
    assert.equal(sheetsObj.Sheet1.C6.f, "=SUM(A3:B4)+AVERAGE(A:B)")
    assert.equal(sheetsObj.Sheet1.C6.v, 1.5)

    assert.equal(sheetsObj.Sheet1.C7.f, "=SUM(A4:B5)-1-C2-A12")
    assert.equal(sheetsObj.Sheet1.C7.v, -1)
    let res2 = calc.workbookEditor.editInsertCutPasteRange("Sheet1", "1_0_1_2",
      "Sheet1","0_2_0_4",1) //A2:C2 -> C1:E1 报错
    assert.equal(res2.msg , FAIL_OBJ_SHIFT_RANGE_OVERLAP_CUT_RANGE.msg)

    console.log("")
  });


})
