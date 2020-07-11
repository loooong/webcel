export class MyLogProxy{
  constructor(){
    this.logArray = []
  }
  myPrint(printType, ...printArray){ // printType 有0，1，2，3级别，级别越高越可能被展示
    if(printType < PRINT_LEVEL3){ // 低于级别的不会输出出来
      return
    }
    console.log(new Date().toLocaleTimeString(),...printArray) // 打印出时间
    console.trace()
    this.logArray.push(printArray)
  }
}

export const myLog = new MyLogProxy()
export const PRINT_LEVEL0 = 0
export const PRINT_LEVEL1 = 1
export const PRINT_LEVEL2 = 2
export const PRINT_LEVEL3 = 3

