import { html, render as _render } from 'lit';
import { compile } from './compiler';
import { Descriptor } from './types';
import './components';

export function render(desc: Descriptor, container: HTMLElement) {
  const code = compile(desc);
  const tmpl = Function('rt', 'with(rt) { return ' + code + '}')({
    html,
    getDataCtrl(evt: Event) {
      let el = evt.target;
      while (el && !el.dataCtrl) {
        el = el.parentElement;
      }
      if (el) {
        return el.dataCtrl;
      }
    },
  });
  _render(tmpl, container);
}
