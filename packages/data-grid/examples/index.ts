import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { consume, Context } from '@lit/context';

import './excel-demo';
import './sale-demo';
import './edit-demo';

@customElement('data-grid-demo')
export class DataGridDemoElement extends LitElement {
  @consume({ context: 'window' as Context<string, any> })
  @property({ attribute: false })
  private manager?: any;

  openApp(name: string) {
    this.manager.startApp({
      name: 'DataGridDemo-' + name,
      label: 'Data Grid demo',
      element: name + '-data-grid-demo',
      width: 800,
      height: 600,    
    });
  }

  render() {
    return html`
      <h1>DataGrid demo</h1>
      <h2>Basic</h2>
      <ol>
        <li>
          <a href="javascript:void(0)" @click=${this.openApp.bind(this, 'sale')}>
            Sale table <sl-icon name="arrow-right"></sl-icon>
          </a>
        </li>
        <li>
          <a href="javascript:void(0)" @click=${this.openApp.bind(this, 'excel')}>
            Excel table <sl-icon name="arrow-right"></sl-icon>
          </a>
        </li>
        <li>
          <a href="javascript:void(0)" @click=${this.openApp.bind(this, 'edit')}>
            Edit grid <sl-icon name="arrow-right"></sl-icon>
          </a>
        </li>
      </ol>
    `;
  }

  static styles = css`
    :host {
      padding: var(--window-frame-padding);
    }
    h1 {
      margin: 0;
    }
    li sl-icon {
      vertical-align: middle;
    }
  `
}

export const examples = [
  {
    name: 'DataGridDemo',
    label: 'Data Grid demo',
    element: 'data-grid-demo',
    width: 500,
    height: 300,
    // closable: false,
    // hideInLauncher: true,
  },
];

declare global {
  interface HTMLElementTagNameMap {
    'data-grid-demo': DataGridDemoElement
  }
}
