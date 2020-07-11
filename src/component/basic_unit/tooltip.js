/* global document */
import {h} from './element';
import {bind} from '../utils/event_helper';
import {CSS_PREFIX} from '../../global_utils/config_for_core_and_component';

export default function tooltip(html, target) {
  if (target.classList.contains('active')) {
    return;
  }
  const {
    left, top, width, height,
  } = target.getBoundingClientRect();
  const el = h('div', `${CSS_PREFIX}-tooltip`).updateInnerHtml(html).updateDisplayToBlock();
  document.body.appendChild(el.el);
  const elBox = el.box();
  el.css('left', `${left + (width / 2) - (elBox.width / 2)}px`)
    .css('top', `${top + height + 2}px`);
  bind(target, 'mouseleave', () => {
    if (document.body.contains(el.el)) {
      document.body.removeChild(el.el);
    }
  });

  bind(target, 'click', () => {
      if (document.body.contains(el.el)) {
      document.body.removeChild(el.el);
    }
  });
}
