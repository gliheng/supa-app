import { createApp } from 'vue';
import React from 'react'
import ReactDOM from 'react-dom/client'

export function createWrapper(def: {
  name: string;
  type: 'vue' | 'react';
  css: any;
  component: any;
}) {
  const { name, type, css, component } = def;
  class WrapperElement extends HTMLElement {
    app?: any;
    res?: Promise<any[]>;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.res = Promise.all([css, component]);
    }

    async connectedCallback() {
      const [style, component] = await this.res!;
      if (!this.isConnected) {
        return;
      }

      const sheet = new CSSStyleSheet();
      sheet.replaceSync(style.default);
      this.shadowRoot!.adoptedStyleSheets = [sheet];
      if (type == 'vue') {
        this.app = createApp(component.default);
        this.app.mount(this.shadowRoot);
      } else if (type == 'react') {
        this.app = ReactDOM.createRoot(this.shadowRoot);
        this.app.render(
          React.createElement(
            React.StrictMode,
            null,
            React.createElement(component.default)
          ),
        )        
      }
    }

    disconnectedCallback() {
      if (type == 'vue') {
        this.app?.unmount();
      } else if (type == 'react') {
        this.app?.unmount();
      }
    }
  }

  customElements.define(name, WrapperElement);
}
