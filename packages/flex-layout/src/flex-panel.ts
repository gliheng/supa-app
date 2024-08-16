import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ref } from 'lit/directives/ref.js';

@customElement('sp-flex-panel')
export class FlexPanel extends LitElement {
  @property()
  element: string = ''

  render() {
    return html`
      <div class="flex-panel" ${ref((el) => {
        if (el && el.children.length == 0) {
          el.appendChild(document.createElement(this.element));
        }
      })}></div>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: flex;
    }
    .flex-panel {
      flex: 1;
      display: flex;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-flex-panel': FlexPanel,
  }
}
