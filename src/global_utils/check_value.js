export function isHave(param) {
  if (typeof param === 'undefined') {
    return false;
  }
  if (param === null) {
    return false;
  }
  return true;
}

export function assertTrue(aCondition, msg =""){
  if(aCondition!== true){
    throw new Error(msg)
  }
}
