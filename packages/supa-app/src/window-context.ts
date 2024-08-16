import { createContext, consume } from '@lit/context';
import { property } from 'lit/decorators.js'
import mitt from 'mitt';
import { nanoid } from 'nanoid';
import omit from 'lodash-es/omit';
import { getDefaultConfig, AppConfig, Library, Layouts } from './config';
import { LitElement } from 'lit';
import { getStorage } from './storage.js';
import type { SupaAppElement } from '.';

export const windowContext = createContext<any>('window');

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type LitElementConstructor<T = LitElement> = new (...args: any[]) => T;

const CONFIG_KEY = 'state';

function methodName(topic: string) {
  return '_on' + topic[0].toUpperCase() + topic.substring(1);
}

export const WindowManagerMixin = <T extends LitElementConstructor>(superClass: T, topics: EventNames[] = ['update']) => {
  class WindowManagerMixinClass extends superClass {
    @consume({ context: windowContext })
    @property({ attribute: false })
    public manager!: WindowManager;

    connectedCallback(): void {
      super.connectedCallback();
      topics.forEach((topic) => {
        this.manager.notifier.on(topic, (this as any)[methodName(topic)] ?? this._onUpdate);
      });
    }

    _onUpdate = () => {
      this.requestUpdate();
    }

    disconnectedCallback(): void {
      super.disconnectedCallback();
      topics.forEach((topic) => {
        this.manager.notifier.off(topic, (this as any)[methodName(topic)] ?? this._onUpdate);
      });
    }
  }
  return WindowManagerMixinClass;
}

export type Events = {
  update: void;
  layout: string | undefined;
  setRects: Rect[],
  clearRects: void;
  reorder: void;
};

export type EventNames =  keyof Events;

export class WindowManager {
  constructor(private host: SupaAppElement) {}

  notifier = mitt<Events>();
  private _config = getDefaultConfig();

  private _layout?: string;
  get layout() {
    return this._layout;
  }
  set layout(v: string | undefined) {
    this._layout = v;
    this.notifier.emit('layout', v);
  }

  get layoutConfig() {
    return this._config.layouts.find(e => e.name == this._layout);
  }

  set library(val: Library) {
    Object.assign(this._config, { library: val });
  }

  get library() {
    return this._config.library;
  }

  set layouts(val: Layouts) {
    Object.assign(this._config, { layouts: val });
  }

  get layouts() {
    return this._config.layouts;
  }

  apps: RunningApp[] = [];
  zMap: Map<string, number> = new Map();
  activeApp?: string;
  pinned: Set<string> = new Set();

  get storage() {
    if (!this.host.storageKey) return;
    return getStorage(this.host.storageKey);
  }

  startup() {
    // load pinned apps
    const saved = this.storage?.read(CONFIG_KEY) as {
      ver: string;
      pinnedApps: AppConfig[];
    };
    if (saved) {
      const { ver, pinnedApps } = saved;
      if (ver == this.host.storageVer) {
        pinnedApps?.forEach((cfg) => {
          const app = this.startApp(cfg);
          this.pinned.add(app.id);
        });
      }
    }

    // Run configured startup apps
    let startup = this.host.startup;
    startup?.forEach((name) => {
      this.startAppByName(name);
    });
  }

  startApp(cfg: AppConfig) {
    const id = nanoid();
    // New apps added at the back
    const app = {
      ...cfg,
      id,
    };
    this.apps.push(app);
    // New apps added after active app
    // const idx = this.apps.findIndex(e => e.id == this.activeApp) + 1;
    // this.apps.splice(idx, 0, {
    //   ...app,
    //   id,
    // });
    this.zMap.set(id, (this.topDepth ?? 0) + 1);
    this.activeApp = id;
    this.onUpdate();
    return app;
  }
  
  onUpdate() {
    queueMicrotask(() => {
      this.notifier.emit('update');
      this.notifier.emit('reorder');
  
      this.storage?.save(CONFIG_KEY, {
        ver: this.host.storageVer,
        pinnedApps: this.apps
          .filter(e => this.pinned.has(e.id))
          .map(e => omit(e, ['id'])),
      });
    });
  }

  startAppByName(name: string) {
    const app = this.library.find(e => e.name == name);
    if (!app) throw `Cannot find app: ${name}`;
    this.startApp(app);
  }

  pinApp(id: string) {
    if (this.pinned.has(id)) {
      this.pinned.delete(id);
    } else {
      this.pinned.add(id);
    }

    this.onUpdate();
  }

  closeApp(id: string) {
    this.zMap.delete(id);
    const idx = this.apps.findIndex(e => e.id == id);
    this.apps.splice(idx, 1);
    const z = this.topDepth;
    const entry = [...this.zMap.entries()].find(([_, depth]) => depth == z);
    if (entry) {
      this.activeApp = entry[0];
    }
    this.onUpdate();
  }

  get topDepth() {
    if (this.zMap.size == 0) return undefined;
    return Math.max(...this.zMap.values());
  }

  activateApp(id: string) {
    const top = this.topDepth!;
    if (this.zMap.get(id) != top) {
      this.zMap.set(id, top + 1);
      this.notifier.emit('update');
      this.activeApp = id;
    }
  }

  reorderApp(id: string, i: number) {
    const idx = this.apps.findIndex(e => e.id == id);
    const app = this.apps.splice(idx, 1);
    this.apps.splice(i, 0, app[0]);
    this.onUpdate();
  }
}

export interface RunningApp extends AppConfig {
  id: string;
}
