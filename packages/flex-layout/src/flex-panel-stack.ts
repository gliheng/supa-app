import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js';
import type { NormalizedPreset } from './types';
import { createRef, ref } from 'lit/directives/ref.js';

@customElement('sp-flex-panel-stack')
export class FlexPanelStack extends LitElement {
  tabRef = createRef();

  _id!: string

  @property()
  set id(v: string) {
    this.dataset.id = v;
    this._id = v;
  }

  get id() {
    return this._id;
  }

  @property({
    attribute: false,
  })
  panels: NormalizedPreset[] = []

  onTabClose(evt: CustomEvent) {
    const panel = (evt.target as HTMLElement).getAttribute('panel');
    const event = new CustomEvent(
      'remove',
      { composed: true, detail: { id: panel } },
    );
    this.dispatchEvent(event);
  }

  onDragstart(evt: DragEvent) {
    const target = evt.target as HTMLElement;
    const panelId = target.getAttribute('panel');
    evt.dataTransfer?.setData('panelId', panelId!);
  }

  async updated() {
    const tab = this.tabRef.value as any;
    if (!tab) return;
    const activeTab = tab.activeTab?.getAttribute('panel');
    if (!activeTab) {
      return;
    }
    // If active tab is removed, select first tab
    if (!this.panels.find(e => e.id == activeTab)) {
      const first = this.panels[0]?.id;
      if (first) {
        tab.show(first);
      }
    }
  }

  render() {
    return html`
      <sl-tab-group
        ${ref(this.tabRef)}
        @sl-close=${this.onTabClose}
      >
        ${repeat(this.panels, e => e.id, (panel) => {
          return html`
            <sl-tab
              draggable="true"
              slot="nav"
              panel=${panel.id}
              closable
              @dragstart=${this.onDragstart}
            >${panel.label}</sl-tab>
            <sl-tab-panel name=${panel.id}>
              <sp-flex-panel element=${panel.use}></sp-flex-panel>
            </sl-tab-panel>
          `;
        })}
      </sl-tab-group>
    `;
  }
  static styles = css`
    :host {
      position: absolute;
      display: flex;
    }
    sl-tab-group {
      width: 100%;
      height: 100%;
      position: relative;
    }
    sl-tab-group::part(base) {
      height: 100%;
      display: flex;
    }
    sl-tab-group::part(nav) {
      overflow: hidden;
    }
    sl-tab-group::part(body) {
      flex: 1;
      display: flex;
    }
    sl-tab::part(base) {
      padding: var(--sl-spacing-x-small) var(--sl-spacing-small);
    }
    sl-tab-panel {
      flex: 1;
    }
    sl-tab-panel[active] {
      display: flex;
    }
    sl-tab-panel::part(base) {
      display: flex;
      flex: 1;
      padding: 0;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-flex-panel-stack': FlexPanelStack,
  }
}
