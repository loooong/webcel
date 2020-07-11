/* global window */

// import {setColor} from "../plug-in/revision";

import { FinElement } from '../basic_unit/element';

let removeEvent = []; // 所有的事件都在这个单例里面可以集中管理？todo: 可以采用类似mylog的方式来做重构

export function bind(target, name, fn) {
    target.addEventListener(name, fn);
    removeEvent.push({
        name: name,
        fn: fn,
        target: target
    })
}

export function remove() {
    for (let i = 0; i < removeEvent.length; i++) {
        let re = removeEvent[i];
        unbind(re.target, re.name, re.fn);
    }
}


export function unbind(target, name, fn) {
    target.removeEventListener(name, fn);
}


export function fireAEventToDocument(keyCode, metaKey, name = "keydown", buttons = -1) {
    let event = document.createEvent('HTMLEvents'); // 创建一个全局事件？
    event.initEvent(name, true, true);
    event.eventType = 'message';
    event.buttons = buttons;
    event.keyCode = keyCode;
    event.metaKey = metaKey;
    document.dispatchEvent(event);
}


export function bindMouseMoveThenUpFunc(target, movefunc, upfunc) {
    bind(target, 'mousemove', movefunc);
    target.xEvtUp = (evt) => {
        unbind(target, 'mousemove', movefunc);
        unbind(target, 'mouseup', target.xEvtUp);
        upfunc(evt);
    };
    bind(target, 'mouseup', target.xEvtUp);
}


function calTouchDirection(spanx, spany, evt, cb) {
    let direction = '';
    if (Math.abs(spanx) > Math.abs(spany)) {
        // horizontal
        direction = spanx > 0 ? 'right' : 'left';
        cb(direction, spanx, evt);
    } else {
        // vertical
        direction = spany > 0 ? 'down' : 'up';
        cb(direction, spany, evt);
    }
}

// cb = (direction, distance) => {}
export function bindTouch(target, {move, end}) {
    let startx = 0;
    let starty = 0;
    bind(target, 'touchstart', (evt) => {
        const {pageX, pageY} = evt.touches[0];
        startx = pageX;
        starty = pageY;
    });
    bind(target, 'touchmove', (evt) => {
        if (!move) return;
        const {pageX, pageY} = evt.changedTouches[0];
        const spanx = pageX - startx;
        const spany = pageY - starty;
        if (Math.abs(spanx) > 10 || Math.abs(spany) > 10) {
            calTouchDirection(spanx, spany, evt, move);
            startx = pageX;
            starty = pageY;
        }
        evt.preventDefault();
    });
    bind(target, 'touchend', (evt) => {
        if (!end) return;
        const {pageX, pageY} = evt.changedTouches[0];
        const spanx = pageX - startx;
        const spany = pageY - starty;
        calTouchDirection(spanx, spany, evt, end);
    });
}
