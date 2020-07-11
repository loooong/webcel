import { CellVNumber } from './basic_cell_value';


export class DefaultValueToTextOption{
  constructor() {
    this.isDefault = true
  }
}

export class DefaultCellVToText{
  constructor(opt){
    this.opt = opt
  }
  convertCellVToText(cellV: CellVNumber){
    return cellV.toString()
  }
}
