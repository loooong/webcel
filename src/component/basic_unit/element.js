/* global document */
import { myLog, PRINT_LEVEL0, PRINT_LEVEL3 } from '../../log/new_log';
import { bind, unbind } from '../utils/event_helper';
import { isHave } from '../../global_utils/check_value';
import { RelativePstDetail } from '../../core/core_data_proxy/position_detail';

export class FinElement {
    el: HTMLElement
    clickOutSideDealFunc: Function
        constructor(tag, className = '') {
        if (typeof tag === 'string') {
            this.el = document.createElement(tag);
            if(isHave(className))
            {this.el.className = className;}
        } else {
            this.el = tag;
        }
        this.data = {};
    }
    // ========== 查询数据  =============
    // 获取相对于本元素的鼠标位置
    getRelativePstDetailByEvent(evt: MouseEvent){
        let domRect = this.el.getBoundingClientRect(); // 相对viewPort的位置
        let xRelativeToLeft = evt.clientX - domRect.left;
        let yRelativeToTop = evt.clientY - domRect.top;
        let xRelativeToRight = evt.clientX - domRect.right;
        let yRelativeToBottom = evt.clientY - domRect.bottom;
        return new RelativePstDetail(xRelativeToLeft, yRelativeToTop,xRelativeToRight, yRelativeToBottom)
    }


    // =============更新数据==============

    data(key, value) {
        if (value !== undefined) {
            this.data[key] = value;
            return this;
        }
        return this.data[key];
    }

    on(eventNames, handler):FinElement {
        const [fen, ...suffixArray] = eventNames.split('.');
        let eventName = fen;
        if (eventName === 'mousewheel' && /Firefox/i.test(window.navigator.userAgent)) {
            eventName = 'DOMMouseScroll';
        }
        this.el.addEventListener(eventName, function eventListen(evt)  {
            handler(evt);
            myLog.myPrint(PRINT_LEVEL0,this)
            for (let i = 0; i < suffixArray.length; i += 1) {
                const k = suffixArray[i];
                if (k === 'left' && evt.button !== 0) {
                    return;
                }
                if (k === 'right' && evt.button !== 2) {
                    return;
                }
                if (k === 'stop') { // .stop代表停止事件冒泡
                    evt.stopPropagation();
                }
            }
        });
        return this;
    }
    // 设置css属性之后再获取offset属性
    updateElLTWH(cssProperty2Number) {
        if (cssProperty2Number !== undefined) {
            Object.keys(cssProperty2Number).forEach((k) => {
                if (typeof cssProperty2Number[k] !== "number"){
                    throw new Error("应该为数字类型！")
                }
                this.css(k, `${cssProperty2Number[k]}px`);
            });
            return this;
        }
        return this.getElLTWH()
    }

    getElLTWH(){
        const {
            offsetTop, offsetLeft, offsetHeight, offsetWidth,
        } = this.el;
        return {
            top: offsetTop,
            left: offsetLeft,
            height: offsetHeight,
            width: offsetWidth,
        };
    }
    updateScrollByLeftTopValue(v) {
        const {el} = this;
        if (v !== undefined) {
            if (v.left !== undefined) {
                el.scrollLeft = v.left;
            }
            if (v.top !== undefined) {
                el.scrollTop = v.top;
            }
        }

        return {left: el.scrollLeft, top: el.scrollTop};
    }

    box() {
        return this.el.getBoundingClientRect();
    }

    parent():FinElement {
        return new FinElement(this.el.parentNode);
    }

    children(...childrenElements) {
        if (arguments.length === 0) {
            return this.el.childNodes;
        }
        childrenElements.forEach(ele => this.appendChildByStrOrEl(ele));
        return this;
    }
    getCursorPst():false|number{
        let selection = window.getSelection();
        if (selection.rangeCount <= 0) { // 不存在光标
            return false;
        }
        const range = selection.getRangeAt(0); // section中的第0个range
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(this.el); // 设置 startContainer 属性和 endContainer 属性为this.textFel.el
        preSelectionRange.setEnd(range.startContainer, range.startOffset); // 把起始与结束的节点都设置为this.el
        return  preSelectionRange.toString().length;
    }


    /*
    first() {
      return this.el.firstChild;
    }

    last() {
      return this.el.lastChild;
    }

    remove(ele) {
      return this.el.removeChild(ele);
    }

    prepend(ele) {
      const { el } = this;
      if (el.children.length > 0) {
        el.insertBefore(ele, el.firstChild);
      } else {
        el.appendChild(ele);
      }
      return this;
    }

    prev() {
      return this.el.previousSibling;
    }

    next() {
      return this.el.nextSibling;
    }
    */

    appendChildByStrOrEl(arg: string|FinElement|Element):FinElement {
        let ele = arg;
        if (typeof arg === 'string') {
            ele = document.createTextNode(arg);
        } else if (arg instanceof FinElement) {
            ele = arg.el;
        }
        if(ele  instanceof Node === false ){
            debugger
        }
            this.el.appendChild(ele);


        return this;
    }

    isContainElement(ele) {
        return this.el.contains(ele);
    }

    className(v) {
        if (v !== undefined) {
            this.el.className = v;
            return this;
        }
        return this.el.className;
    }

    addClass(name) {
        this.el.classList.add(name);
        return this;
    }

    hasClass(name) {
        return this.el.classList.contains(name);
    }

    removeClass(name) {
        this.el.classList.remove(name);
        return this;
    }

    toggle(cls = 'active') {
        return this.toggleClass(cls);
    }

    toggleClass(name) {
        return this.el.classList.toggle(name);
    }

    active(flag = true, cls = 'active') {
        if (flag) this.addClass(cls);
        else this.removeClass(cls);
        return this;
    }

    updateActiveClassByFlag(flag = true) {
        this.active(flag, 'checked');
        return this;
    }

    disabled(flag = true) {
        if (flag) this.addClass('disabled');
        else this.removeClass('disabled');
        return this;
    }

    // key, value
    // key
    // {k, v}...
    updateAttrByKeyValue(key, value) {
        if (value !== undefined) {
            this.el.setAttribute(key, value);
        } else {
            if (typeof key === 'string') {
                return this.el.getAttribute(key);
            }
            Object.keys(key).forEach((k) => {
                this.el.setAttribute(k, key[k]);
            });
        }
        return this;
    }

    removeAttr(key) {
        this.el.removeAttribute(key);
        return this;
    }

    updateInnerHtml(content) {
        if (content !== undefined) {
            this.el.innerHTML = content;
            return this;
        }
        return this.el.innerHTML;
    }

    val(v) {
        if (v !== undefined) {
            this.el.value = v;
            return this;
        }
        return this.el.value;
    }

    cssRemoveKeys(...keys) {
        keys.forEach(k => this.el.style.removeProperty(k));
        return this;
    }

    // css( propertyName )
    // css( propertyName, value )
    // css( properties )
    css(name: Object|string, aString: string) {
        if (aString === undefined && typeof name !== 'string') {
            Object.keys(name).forEach((k) => {
                this.el.style[k] = name[k];
            });
            return this;
        }
        if (aString !== undefined) {
            this.el.style[name] = aString;
            return this;
        }
        return this.el.style[name];
    }

    set_focus(pos, el = this.el) {
        if (!this) {
            return;
        }
        const savedSel = {
            start: pos,
            end: pos,
        };
        let charIndex = 0;
        const
          range = document.createRange();
        range.setStart(el, 0);
        range.collapse(true);
        const nodeStack = [el];
        let node;
        let foundStart = false;
        let
          stop = false;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType === 3) {
                const nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                    range.setStart(node, savedSel.start - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                    range.setEnd(node, savedSel.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                let i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    updateCursorPstAtTextElByStartEnd(startPst:number, endPst:number){
        let charIndex = 0;
        const
          cursorRange = document.createRange();
        cursorRange.setStart(this.el, 0); // 设置起始位置
        cursorRange.collapse(false);// 让起始与结尾位置重合
        const nodeStack = [this.el];
        let node;
        let isFoundStart = false;
        let isStop = false;
        // 在多节点中找到位置
        while (!isStop && (node = nodeStack.pop())) {
            if (node.nodeType === Node.TEXT_NODE) {
                const nextCharIndex = charIndex + node.length;
                // 找到start的位置
                if (!isFoundStart && startPst >= charIndex && startPst <= nextCharIndex) {
                    cursorRange.setStart(node, startPst - charIndex);
                    isFoundStart = true; // 落在这个node内部
                }
                // 找到end的位置
                if (isFoundStart && endPst >= charIndex && endPst <= nextCharIndex) {
                    cursorRange.setEnd(node, endPst - charIndex);
                    isStop = true;
                }
                charIndex = nextCharIndex;
            } else {
                // 增加子节点刚到nodeStack中去
                let i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        const windowSelection = window.getSelection(); // 获取用户选择的文本范围或光标的当前位置。
        windowSelection.removeAllRanges();
        windowSelection.addRange(cursorRange); // 设置选中区域
        myLog.myPrint(PRINT_LEVEL3, windowSelection, cursorRange)

    }

    updateCssPropertyByObject(aObj){
        Object.assign(this.el.style, aObj)
        return this;
    }

    removeEl() {
        if (!this.el || !this.el.parentNode) {
            return;
        }
        this.el.parentNode.removeChild(this.el);
    }

    computedStyle() {
        return window.getComputedStyle(this.el, null);
    }

    isDisplayBlock() {
        return this.el.style['display'] === 'block';
    }

    updateDisplayToBlock(key = 'display', text = 'block') {
        this.css(key, text);
        return this;
    }

    hide(key = 'display', value = 'none') {
        this.css(key, value);
        return this;
    }
    // the leftSpanElIndex mouse button: mousedown → mouseup → click
// the right mouse button: mousedown → contenxtmenu → mouseup
// the right mouse button in firefox(>65.0): mousedown → contenxtmenu → mouseup → click on window
    bindClickOutside(cb) { // 可以转移到FinElement上去
        this.clickOutSideDealFunc = (evt) => {
            // ignore double click
            if (evt.detail === 2 || this.isContainElement(evt.target)) return;
            if (cb) cb(this);
            else {
                this.hide();
                this.unbindClickoutside();
            }
        };
        bind(window.document.body, 'click', this.clickOutSideDealFunc);
    }
    unbindClickoutside() {
        if (this.clickOutSideDealFunc) {
            unbind(window.document.body, 'click', this.clickOutSideDealFunc);
            delete this.clickOutSideDealFunc;
        }
    }


}

export const h = (tag, className = '') => new FinElement(tag, className);
