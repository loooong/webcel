// ======== multi_relation_dealer 的options参数==========
export class RangeDealerOption {
  constructor(rangeProxy, shiftRightNumber = 0, shiftDownNumber = 0, crossSheet = false) {
    this.rangeProxy = rangeProxy;
    this.shiftRightNumber = shiftRightNumber;
    this.shiftDownNumber = shiftDownNumber;
    this.shiftNumber = 0;
    this.rightOrDownOrBothOrNon = this.getRightOrDownOrBothOrNon(crossSheet);
  }

  getRightOrDownOrBothOrNon(crossSheet) {
    if(crossSheet){
      return 2 // crossSheet的情况直接按照情况2来。
    }
    if (this.shiftRightNumber !== 0) {
      if (this.shiftDownNumber !== 0) {
        this.shiftNumber = [this.shiftDownNumber,this.shiftRightNumber];
        return 2;
      } else {
        this.shiftNumber = this.shiftRightNumber;
        return 0;
      }
    } else if (this.shiftDownNumber !== 0) {
      this.shiftNumber = this.shiftDownNumber;
      return 1;
    } else {
      this.shiftNumber = 0;
      return 3;
    }
  }

}

export class SheetDealerOption {
  constructor(toDealSheetID) {
    this.toDealSheetID = toDealSheetID;
  }

}
