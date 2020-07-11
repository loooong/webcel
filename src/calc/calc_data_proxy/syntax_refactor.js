import { SingleCellRefer } from './syntax_ref_cell';
import { AARangeRefer, RangeRefer } from './syntax_ref_range';

export class BaseRefactorProxy {
  constructor(dealBhv) {
    this.dealBhv = dealBhv;
  }
  getTheFunc(){
    let self = this
    function f(syntaxUnit) {
      return self.dealSyntaxUnit(syntaxUnit)
    }
    return f
  }

  dealSyntaxUnit(syntaxUnit) {
    let theParser = syntaxUnit.syntaxParser
    if (theParser instanceof AARangeRefer) {
      return this.dealBhv.dealAA(syntaxUnit);
    } else if (theParser instanceof SingleCellRefer) {
      return this.dealBhv.dealA1(syntaxUnit);
    } else if (theParser instanceof RangeRefer) {
      return this.dealBhv.dealA1B2(syntaxUnit);
    }
  }
}

