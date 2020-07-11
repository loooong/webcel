export function isCalcResError(res) {
  let res2 = typeof res !== 'undefined' && typeof res.msg === 'string';
  if(res2){
    debugger
  }
  return res2
}

export function getSortedArray(array){
  return array.sort((a,b) => a-b)
}

export function getArrayByEqualStep(beginValue, valueNumber, step = 1) {
  return Array.from(Array(valueNumber))
    .map((e, i) => beginValue + step * i);
}
