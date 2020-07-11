export class MySet extends Set {
  /**
   * 获取并集
   * @param other
   * @return {Set<T>}
   */
  getUnion(other) {
    return new MySet(Array.from(this)
      .concat(Array.from(other)));
  }

  // 获取差集
  getDiff(other) {
    let theArray = Array.from(this)
      .filter(value => other.has(value) === false);
    return new MySet(theArray);
  }

}
