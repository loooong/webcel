import { AA, SYN_CONTAINER, SYN_OPERATOR, SYN_RANG_REF, SYN_SINGLE_REF, SYN_SPLIT_MARK } from '../calc_utils/config';
import {
  SingleCellRefer
} from './syntax_ref_cell';
import { BaseSyntaxUnitProxy } from '../../internal_module/syntax_builder_core';
import { AARangeRefer, RangeRefer } from './syntax_ref_range';

/**
 * @property {BigInt} pstID 第几个语法单元
 * @property {String} wholeStr
 */
export class ExpSyntaxUnitProxy extends BaseSyntaxUnitProxy {
  getParser() {
    let aParser;
    if (this.isA1Unit()) { // 更精细的解析
      aParser = new SingleCellRefer(this.wholeStr, this.typeProxy);
    } else if (this.isAAUnit()) {
      aParser = new AARangeRefer(this.wholeStr, this.typeProxy);
    } else if (this.isA1A2Unit()) {
      aParser = new RangeRefer(this.wholeStr, this.typeProxy);
    } else {
      return null;
    }
    aParser.parseRefString();
    return aParser;
  }



  /**
   * 判定是否是一个引用单元
   * @return {Boolean}
   */
  isReferUnit(){
    return this.typeProxy.isIncludeType(SYN_SINGLE_REF) ||  this.typeProxy.isIncludeType(SYN_RANG_REF)
  }
  isAAUnit(){
    return this.typeProxy.isMarchTypeArray([SYN_RANG_REF, AA])
  }
  isA1Unit(){
    return this.typeProxy.isIncludeType(SYN_SINGLE_REF)
  }
  isA1A2Unit(){
    return this.typeProxy.isIncludeType(SYN_RANG_REF) && (this.typeProxy.isIncludeType(AA) === false)
  }

}
