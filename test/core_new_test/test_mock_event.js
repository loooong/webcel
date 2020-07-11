import { describe, it } from 'mocha';
import { CoreSheet } from '../../src/core/core_data_proxy/core_sheet_change';

describe('模拟鼠标键盘操作', () => {
  let data = new CoreSheet("sheet1", {}, {});

  describe(' 基本操作 ', () => {
    it('选中某个单元格', function () {
      // 鼠标mouseDown某个位置
      // 鼠标mouseUp 同一个位置
      let { state, msg } = data.selectorCellText(1, 1, '="""', "input");
      assert.equal(state, true);
    });
    it('选中一个区域', function () {
      // 鼠标mouseDown某个位置
      // bindMouseMoveThenUpFunc 到某个位置
      // mouseUp 某个位置，最终workbookServer的coreSelector 的数值发生相应的变化
      let { state, msg } = data.selectorCellText(1, 1, '="""', "input");
      assert.equal(state, true);
    });



  });
})
