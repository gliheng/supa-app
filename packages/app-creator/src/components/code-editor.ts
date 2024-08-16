import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('code-editor')
export class CodeEditorElement extends LitElement {
  onHide() {
    this.dispatchEvent(new CustomEvent('hide'));
  }

  render() {
    return html`
      <sl-icon-button
        class="close-btn"
        name="x"
        label="Close"
        @click=${this.onHide}
      ></sl-icon-button>
      <div>code</div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      background: white;
    }
    .close-btn {
      position: absolute;
      top: 0;
      right: 0;
    }
    `
}
