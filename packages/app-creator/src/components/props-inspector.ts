import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('props-inspector')
export class PropsInspectorElement extends LitElement {
  render() {
    return html`
      No component selected
    `;
  }
  static styles = css`
  :host {
    width: 300px;
    background: white;
    text-align: center;
    box-shadow: var(--sl-shadow-large);
  }
  `
}
