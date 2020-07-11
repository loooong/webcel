import { DragOption } from '../event_dealer/paste_event_bhv';

export class WinDragBhv{
    options: DragOption
    constructor(options, sheetComp){
        this.options = options
        this.sheetComp = sheetComp
    }
    register(el) {
        let options = this.options
        let sheetComp = this.sheetComp
        el.addEventListener('mousedown', function (e) {
            if (e.button !== 0) {
                //屏蔽左键以外的按键
                return;
            }


            //获取x坐标和y坐标
            let x = e.clientX;
            let y = e.clientY;

            //获取左部和顶部的偏移量
            let l = el.offsetLeft;
            let t = el.offsetTop;

            if (options && options.onBegin) {
                options.onBegin.call(el, {
                    left: x - l,
                    top: y - t
                });
            }


            //开关打开
            let isDown = true;
            //设置样式
            el.style.cursor = 'move';

            let nl = x, nt = y;


            window.onmousemove = function (e) {
                if (!isDown) {
                    return;
                }
                //获取x和y
                let nx = e.clientX;
                let ny = e.clientY;


                //计算移动后的左偏移量和顶部的偏移量
                nl = nx - (x - l);
                nt = ny - (y - t);

                // let drag = false;
                if (nl > 0) {
                    // drag = false;
                    el.style.left = nl + 'px';
                } else {
                    // drag = true;
                    el.style.left = 0 + 'px';
                }
                if (nt > 0) {
                    // drag = false;
                    el.style.top = nt + 'px';
                } else {
                    // drag = true;
                    el.style.top = 0 + 'px';
                }
                // el.style.leftSpanElIndex = nl + 'px';
                // el.style.top = nt + 'px';


                if (options && options.onDrag) {
                    options.onDrag.call(el, {
                        left: nl,
                        top: nt,
                        x: nx - x,
                        y: ny - y,
                        isDown: isDown
                    });
                }

                return false;
            };

            window.onmouseup = function () {
                //开关关闭
                isDown = false;
                el.style.cursor = 'default';

                if (options && options.onEnd) {
                    options.onEnd.call(el, {left: parseInt(el.style.left), top: parseInt(el.style.top)}, sheetComp);
                }

                return false;
            };
            // e.stopPropagation();
            if (e.stopPropagation) {
                e.stopPropagation();
            } else if (e.preventDefault) {
                e.preventDefault();
            } else {
                // window.event.returnValue === false;
            }
        });
    }
}
