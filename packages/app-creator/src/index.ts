import { LitElement, css, html, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js';
import { SlTabGroup } from '@shoelace-style/shoelace';
import './components/data-source';
import './components/component-tree';
import './components/material-repository';
import './components/layout-canvas';
import './components/props-inspector';
import './components/code-editor';

@customElement('app-creator')
export class AppCreatorElement extends LitElement {
  tabGroup = createRef<SlTabGroup>()

  @state()
  showTabContent = false;

  async onTabClick() {
    const currentActive = (this.tabGroup.value as any).activeTab;
    setTimeout(() => {
      const nextActive = (this.tabGroup.value as any).activeTab;
      if (currentActive == nextActive) {
        this.showTabContent = !this.showTabContent;
      } else {
        this.showTabContent = true;
      }
    }, 0);
  }

  onHideTabContent() {
    this.showTabContent = false;
  }

  render() {
    return html`
      <sl-tab-group
        ${ref(this.tabGroup)}
        placement="start"
        ?data-show-content=${this.showTabContent}
      >
        <sl-tab slot="nav" panel="ui" @click=${this.onTabClick}>
          <sl-icon name="plus-square" label="Add component"></sl-icon>
        </sl-tab>
        <sl-tab slot="nav" panel="list" @click=${this.onTabClick}>
          <sl-icon name="list-nested" label="Component list"></sl-icon>
        </sl-tab>
        <sl-tab slot="nav" panel="code" @click=${this.onTabClick}>
          <sl-icon name="code" label="Code"></sl-icon>
        </sl-tab>
        <sl-tab slot="nav" panel="data-source" @click=${this.onTabClick}>
          <sl-icon name="database" label="Data source"></sl-icon>
        </sl-tab>
        <sl-tab-panel name="ui">
          <material-repository
            @hide=${this.onHideTabContent}
          ></material-repository>
        </sl-tab-panel>
        <sl-tab-panel name="list">
          <component-tree
            @hide=${this.onHideTabContent}
          ></component-tree>
        </sl-tab-panel>
        <sl-tab-panel name="data-source">
          <data-source
            @hide=${this.onHideTabContent}
          ></data-source>
        </sl-tab-panel>
        <sl-tab-panel name="code">
          <code-editor
            @hide=${this.onHideTabContent}
          ></code-editor>
        </sl-tab-panel>
      </sl-tab-group>
      <layout-canvas></layout-canvas>
      <props-inspector></props-inspector>
    `;
  }
  static styles = css`
    :host {
      display: flex;
      position: relative;
    }
    sl-tab-group {
      display: flex;
      align-items: stretch;
    }
    props-editor {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
    }
    sl-tab-group::part(body) {
      display: none;
    }
    sl-tab-group[data-show-content]::part(body) {
      display: block;
    }
    sl-tab-group::part(tabs) {
      height: 100%;
    }
    sl-tab::part(base) {
      font-size: 1.2rem;
      padding: 0.8rem;
    }
    sl-tab-panel {
      position: absolute;
      z-index: 1;
      min-width: 200px;
      height: 100%;
      background: white;
      box-shadow: var(--sl-shadow-large);
      --padding: var(--sl-spacing-x-small);
    }
    sl-tab-panel::part(base) {
      height: 100%;
    }
    props-inspector {
      z-index: 0;
    }
  `
}
