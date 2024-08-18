import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js';

const materials = [
  {
    label: 'Button',
    type: 'button',
  },
  {
    label: 'Text',
    type: 'text',
  },
  {
    label: 'Image',
    type: 'img',
  },
];

@customElement('material-repository')
export class MaterialRepository extends LitElement {

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dragleave', () => this.onHide());
  }

  onDragstart(evt: DragEvent) {
    const type = (evt.target as HTMLElement).getAttribute('data-type');
    if (type) {
      evt.dataTransfer?.setData('material', type);
    }
  }

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
      <div >
        ${repeat(materials, (e) => {
          return html`<div
            class="material-item"
            draggable="true"
            data-type=${e.type}
            @dragstart=${this.onDragstart}
          >${e.label}</div>`;
        })}
      </div>
    `;
  }
  static styles = css`
    :host {
      display: block;
      background: white;
      height: 100%;
    }
    .close-btn {
      position: absolute;
      top: 0;
      right: 0;
    }
    .material-item {
      margin: var(--sl-spacing-small) 0;
    }
  `
}
