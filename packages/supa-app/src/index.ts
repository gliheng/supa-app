import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { provide, consume } from '@lit/context';
import { windowContext, WindowManager } from './window-context';
import { Library, Layouts } from './config';
import './app-bar';
import './wallpaper';
import './window-area';
import { when } from 'lit/directives/when.js';

@customElement('sp-supa-app')
export class SupaAppElement extends LitElement {
  @provide({ context: windowContext })
  manager = new WindowManager(this);

  set library(val: Library) {
    this.manager.library = val;
  }

  set layouts(val: Layouts) {
    this.manager.layouts = val;
  }

  @property()
  set layout(val: string | undefined) {
    this.manager.layout = val;
  }
  get layout() {
    return this.manager.layout;
  }

  @property({
    attribute: 'hide-app-bar',
    type: Boolean,
  })
  hideAppBar = false;

  @property({
    converter: {
      fromAttribute(value) {
        return value?.split(',');
      },
      toAttribute(value) {
        return (value as string[]).join(',');
      },
    }
  })
  set startup(val: string[]) {
    this._startup = val;
  }
  get startup() {
    return this._startup;
  }
  _startup: string[] = [];

  @property({
    attribute: 'storage-key',
  })
  storageKey?: string

  @property({
    attribute: 'storage-ver',
  })
  storageVer?: string

  connectedCallback(){
    super.connectedCallback();
    this.manager.startup();
  }

  render() {
    return html`
      ${when(!this.hideAppBar, () => html`<sp-app-bar></sp-app-bar>`)}
      <sp-wallpaper></sp-wallpaper>
      <sp-window-area></sp-window-area>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: grid;
      grid-template-rows: 40px auto;
      grid-template-areas:
       "appbar"
       "main";
    }
    :host([hide-app-bar]) {
      grid-template-rows: auto;
      grid-template-areas: "main";
    }
    sp-app-bar {
      grid-area: appbar;
    }
    sp-wallpaper {
      grid-area: main;
    }
    sp-window-area {
      grid-area: main;
    }
  `;
}
