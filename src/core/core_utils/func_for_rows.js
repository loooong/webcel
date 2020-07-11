import { isHave } from '../../global_utils/check_value';

export function isFormula(text) {
  return text && text[0] === '=';
}

export function isEmpty(text, formulas, formatText) {
  if (isHave(text) && text !== '') {
    return false;
  }

  if (isHave(formulas) && formulas !== '') {
    return false;
  }

  return !isHave(formatText);
}

export function otherAutoFilter(d, darr, direction, isAdd, what, cb, other, dri) {
  // other 为 '=asd'或者'asd'也为false
  let ncell = this.getCellByTopCell(d, direction, isAdd, 'other', dri, 0);

  let { text, formulas } = ncell;
  let iText = formulas !== '' ? formulas : text;

  // if (other) {
  //     this.copyRender(darr, d.ri, d.ci, ncell, what, cb);
  // } else
  if (this.isFormula(iText)) {
    this.calcFormulaCellByTopCell(iText, darr, d, direction, isAdd, cb);
  } else {
    // 为 '=asd'或者'asd' 进这里
    this.calcCellByTopCell(cb, what, ncell, darr, isAdd, iText, d, text);
  }
}

export function numberAutoFilter(d, darr, direction, isAdd, diffValue, what, cb, isNumber) {
  let ncell = '';

  if (isAdd) {
    diffValue = Math.abs(diffValue);
  } else {
    diffValue = diffValue * -1;
  }

  if (!isNumber) {
    ncell = {
      'text': d.v,
      'formulas': d.v,
    };
    diffValue = 0;
  } else {
    ncell = this.getCellByTopCell(d, direction, isAdd);
  }

  this.calcNumberCellByTopCell(ncell, diffValue, darr, d, what, cb);
}

export function dateAutoFilter(d, line, isDown, darr, what, cb, isDate) {
  let direction = line;
  let ncell = '';
  let diff = isDown ? 1 : -1;
  if (!isDate) {
    ncell = {
      'text': d.v,
      'formulas': d.v,
    };
    diff = 0;
  } else {
    ncell = this.getCellByTopCell(d, direction, isDown, 'date');
  }
  this.calcDateCellByTopCell(ncell, darr, d, isDown, what, cb, diff);
}
