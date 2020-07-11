/**
 * 获取坐标位置
 * @param obj
 * @return {{t: number, l: number}}
 */

export function getLeftTopRelativeToViewPort(obj) { //获取某元素以浏览器左上角为原点的坐标
  let t = obj.offsetTop; //获取该元素对应父容器的上边距
  let l = obj.offsetLeft; //对应父容器的上边距
  //判断是否有父容器，如果存在则累加其边距
  while (obj.offsetParent) {//等效 obj = obj.offsetParent;while (obj != undefined)
    obj = obj.offsetParent;
    t += obj.offsetTop; //叠加父容器的上边距
    l += obj.offsetLeft; //叠加父容器的左边距
  }

  return {
    t: t,
    l: l
  };
}

function isTwoObjEquals(x, y) {
  let f1 = x instanceof Object;
  let f2 = y instanceof Object;
  if (!f1 || !f2) {
    return x === y;
  }
  if (Object.keys(x).length !== Object.keys(y).length) {
    return false;
  }
  let newX = Object.keys(x);
  for (let p in newX) {
    p = newX[p];
    let a = x[p] instanceof Object;
    let b = y[p] instanceof Object;
    if (a && b) {
      let equal = isTwoObjEquals(x[p], y[p]);
      if (!equal) {
        return equal;
      }
    } else if (x[p] !== y[p]) {
      return false;
    }
  }
  return true;
}

export function isHaveStyle(styles, style) {
  for (let i = 0; i < styles.length; i++) {
    if (isTwoObjEquals(styles[i], style)) {
      return i;
    }
  }
  return -1;
}
