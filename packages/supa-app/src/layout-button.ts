import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { WindowManagerMixin } from './window-context';
import { SlDropdown } from '@shoelace-style/shoelace';

@customElement('sp-layout-button')
export class LayoutGridElement extends WindowManagerMixin(LitElement, ['layout']) {
  _onLayout = () => {
    this.requestUpdate();
  }

  dropdownRef = createRef();

  changeLayout(type: string) {
    (this.dropdownRef.value as SlDropdown).hide();
    if (this.manager) {
      const curr = this.manager.layout;
      if (curr == type) {
        this.manager.layout = undefined;
      } else {
        this.manager.layout = type;
      }
    }
  }

  render() {
    const layout = this.manager?.layout;
    return html`
      <sl-dropdown placement="bottom-start" ${ref(this.dropdownRef)}>
        <sl-button slot="trigger" size="small" circle>
          <sl-icon name="grid"></sl-icon>
        </sl-button>
        <div class="layout-list">
        ${repeat(this.manager.layouts, (e) => e.name, (e, id) => {
          return html`
            <sl-button
              size="small"
              variant="${layout == e.name ? 'primary' : 'default'}"
              @click=${this.changeLayout.bind(this, e.name)}
            >
              <sl-icon name=${e.icon}></sl-icon>
            </sl-button>
          `;
        })}
        </div>
      </sl-dropdown>
    `;
  }
  static styles = css`
    .layout-list {
      display: grid;
      gap: 2px;
      grid-template-columns: var(--layout-list-columns, repeat(4, 30px));
      margin-top: 5px;
    }
  `;
}
