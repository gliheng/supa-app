import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import 'tile-layout';

function createElement(name: string, text: string, color: string) {
  @customElement(name)
  class Element extends LitElement {
    render() {
      return html`<p>${text}</p>`;
    }
    static styles = css`
      :host {
        background: var(${unsafeCSS(color)});
        flex: 1;
        display: flex;
        color: white;
        font-size: var(--sl-font-size-3x-large);
        align-items: center;
        justify-content: center;
      }
    `
  }
  return Element;
}

createElement('tile-a-element', 'A', '--sl-color-yellow-500');
createElement('tile-b-element', 'B', '--sl-color-green-500');
createElement('tile-c-element', 'C', '--sl-color-purple-500');
createElement('tile-d-element', 'D', '--sl-color-indigo-500');
createElement('tile-e-element', 'E', '--sl-color-sky-500');
createElement('tile-f-element', 'F', '--sl-color-pink-500');
createElement('tile-g-element', 'G', '--sl-color-violet-500');
createElement('tile-h-element', 'H', '--sl-color-rose-500');

@customElement('tile-layout-demo')
export class TileLayoutDemoElement extends LitElement {
  get preset() {
    return [
      {
        use: 'tile-a-element',
        x: 0,
        y: 0,
        w: 2,
        h: 2,
        closable: true,
      },
      {
        use: 'tile-b-element',
        x: 2,
        y: 0,
        w: 2,
        h: 2,
        closable: true,
      },
      {
        use: 'tile-c-element',
        x: 4,
        y: 0,
        w: 2,
        h: 2,
        closable: true,
      },
      {
        use: 'tile-d-element',
        x: 6,
        y: 0,
        w: 2,
        h: 2,
        closable: true,
      },
      {
        use: 'tile-e-element',
        x: 8,
        y: 0,
        w: 2,
        h: 2,
        closable: true,
      },
      {
        use: 'tile-h-element',
        x: 10,
        y: 0,
        w: 2,
        h: 2,
        closable: true,
      },
    ];
  }

  render() {
    return html`
      <sp-tile-layout .preset=${this.preset}>
        <div class="placeholder" slot="placeholder">
          Empty layout
        </div>
      </sp-tile-layout>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }
    .placeholder {
      align-items: center;
      justify-content: center;
      display: flex;
      flex: 1;
      color: var(--sl-color-neutral-500);
    }
  `
}

export const examples = [
  {
    name: 'TileLayoutDemo',
    label: 'Tile layout demo',
    element: 'tile-layout-demo',
    width: 800,
    height: 600,
  },
];

declare global {
  interface HTMLElementTagNameMap {
    'tile-layout-demo': TileLayoutDemoElement
  }
}
