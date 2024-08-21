import { createContext } from '@lit/context';
import { ReactiveController, ReactiveControllerHost } from 'lit';

export const dataContext = createContext<any>('data');

export const formContext = createContext<any>('form');

export class DataController implements ReactiveController {
  deps = new Map();

  constructor(public host: ReactiveControllerHost) {
    host.addController(this);
    this.host.contextData = {}
  }
  track(el: HTMLElement, ...keys: string[]) {
    keys.forEach((key) => {
      let set = this.deps.get(key);
      if (!set) {
        set = new Set();
        this.deps.set(key, set);
      }
      set.add(el);
    })
  }
  hostConnected() {
  }
  hostDisconnected() {
  }
  update(name: string, val: any) {
    this.host.contextData[name] = val;
    const set = this.deps.get(name);
    if (set) {
      for (const el of set) {
        el?.requestUpdate();
      }
    }
  }
  get(key: string) {
    return this.host.contextData[key];
  }
  interpolate(tmpl: string, el: HTMLElement): [string, any[]] {
    const values: any[] = [];
    return [tmpl.replace(/\$\{([\w]+)\}/g, (match, name) => {
      this.track(el, name);
      const val = this.get(name) ?? this.host.parentDataCtrl?.get(name)
      values.push(val);
      return val ?? '';
    }), values];
  }
}

export class FormController implements ReactiveController {
  ipts = new Set();
  constructor(public host: ReactiveControllerHost) {
    host.addController(this);
  }
  hostConnected() {
  }
  hostDisconnected() {
  }
  register(ipt: HTMLElement) {
    this.ipts.add(ipt);
  }
  unregister(ipt: HTMLElement) {
    this.ipts.delete(ipt);
  }
}