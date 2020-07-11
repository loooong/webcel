/**
 * @property ri
 * @property ci
 * @property cellRange
 * @property property
 * @property value
 * @property len
 * @property expr
 * @property range
 * @property oldCell
 */
export class ChangeDataDetail {
  constructor() {
    this.type = -1;
    this.ri = -1;
    this.ci = -1;
    this.cellRange = '';
    this.property = '';
    this.value = '';
    this.len = -1;
    this.expr = '';
    this.range = '';
    this.oldCell = {};
    this.newData = {};
    this.oldMergesData = {};
  }
}
