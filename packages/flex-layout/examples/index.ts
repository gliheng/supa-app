import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import 'flex-layout';

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

createElement('flex-a-element', 'A', '--sl-color-yellow-500');
createElement('flex-b-element', 'B', '--sl-color-green-500');
createElement('flex-c-element', 'C', '--sl-color-purple-500');
createElement('flex-d-element', 'D', '--sl-color-indigo-500');
createElement('flex-e-element', 'E', '--sl-color-sky-500');
createElement('flex-f-element', 'F', '--sl-color-pink-500');
createElement('flex-g-element', 'G', '--sl-color-violet-500');
createElement('flex-h-element', 'H', '--sl-color-rose-500');

@customElement('flex-layout-demo')
export class FlexLayoutDemoElement extends LitElement {
  get preset() {
    return {
      use: '$row',
      children: [
        {
          use: '$tab',
          flex: 1,
          children: [
            {
              use: 'flex-a-element',
              label: 'a panel',
            },
            {
              use: 'flex-b-element',
              label: 'b panel',
            },
          ],
        },
        {
          use: '$col',
          flex: 2,
          children: [
            {
              use: '$tab',
              children: [
                {
                  use: 'flex-c-element',
                  label: 'c panel',
                },
                {
                  use: 'flex-d-element',
                  label: 'd panel',
                },
              ],
            },
            {
              use: '$tab',
              children: [
                {
                  use: 'flex-e-element',
                  label: 'e panel',
                },
                {
                  use: 'flex-f-element',
                  label: 'f panel',
                },
                {
                  use: 'flex-g-element',
                  label: 'g panel',
                },
                {
                  use: 'flex-h-element',
                  label: 'h panel',
                },
              ],
            },    
          ],
        },
      ]
    };
  }
  render() {
    return html`
      <sp-flex-layout .preset=${this.preset}>
        <div class="placeholder" slot="placeholder">
          Empty layout
        </div>
      </sp-flex-layout>
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
    name: 'FlexLayoutDemo',
    label: 'Flex layout demo',
    element: 'flex-layout-demo',
    width: 800,
    height: 600,
  },
];

declare global {
  interface HTMLElementTagNameMap {
    'flex-layout-demo': FlexLayoutDemoElement
  }
}
