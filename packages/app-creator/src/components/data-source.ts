import { LitElement, css, html } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js';
import { choose } from 'lit/directives/choose.js';
import { map } from 'lit/directives/map.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

type DataSource = 'sql' | 'restful' | 'graphql';

interface DataSourceDef {
  id: string;
  name: string;
  type: DataSource;
  params?: any;
}

@customElement('restful-data-source-editor')
export class RestfulDataSourceEditor extends LitElement {
  @property()
  id = ''

  @property({
    type: Object,
  })
  params: any

  @state()
  currentMethod = METHODS[0]

  connectedCallback() {
    super.connectedCallback();
    this.currentMethod = this.params?.method ?? METHODS[0];
  }

  @query('sl-input')
  input: any

  onSelect = (e: CustomEvent) => {
    this.currentMethod = e.detail.item.value;
  }

  onSave() {
    const evt = new CustomEvent('save', {
      composed: true,
      detail: {
        id: this.id,
        params: {
          method: this.currentMethod,
          url: this.input.value,
        },
      },
    });
    this.dispatchEvent(evt);
  }

  render() {
    return html`
      <div class="toolbar">
        <sl-dropdown @sl-select=${this.onSelect}>
          <sl-button slot="trigger" caret style="width: 100%">${this.currentMethod}</sl-button>
          <sl-menu>
            ${map(METHODS, (e) => html`<sl-menu-item value=${e}>${e}</sl-menu-item>`)}
          </sl-menu>
        </sl-dropdown>
        <sl-input placeholder="https://www.example.com/" value=${this.params?.url ?? ''}></sl-input>
        <sl-button variant="primary" @click=${this.onSave}>Save</sl-button>
      </div>
    `;
  }

  static styles = css`
    .toolbar {
      display: flex;
      gap: var(--sl-spacing-x-small);
    }
    .toolbar {
      sl-dropdown {
        width: 80px;
      }
      sl-input {
        flex: 1;
      }
    }
  `
}

@customElement('data-source')
export class DataSourceElement extends LitElement {
  @state()
  dataSourceList: DataSourceDef[] = []

  @state()
  currentView = ''

  showDataSource = () => {
    this.currentView = 'add';
  }

  addDataSource = (type: DataSource) => {
    const id = String(Math.random());
    this.dataSourceList.push({
      type,
      id,
      name: type,
    });
    this.currentView = id;
  }

  onSave = (evt: CustomEvent) => {
    const { id, params } = evt.detail;
    const item = this.dataSourceList.find(e => e.id == id);
    if (item) {
      item.params = params;
    }
  }

  renderDataSourceDetail(id: string) {
    const item = this.dataSourceList.find(e => e.id == id);
    return html`
      ${keyed(id, html`<restful-data-source-editor id=${id} params=${JSON.stringify(item?.params)} @save=${this.onSave}></restful-data-source-editor>`)}
    `;
  }

  renderDataSourceList() {
    return html`
      <div @click=${this.addDataSource.bind(this, 'restful')}>REST API</div>
      <div @click=${this.addDataSource.bind(this, 'graphql')}>GraphQL</div>
      <div @click=${this.addDataSource.bind(this, 'sql')}>SQL</div>
    `;
  }

  render() {
    return html`
      <div class="left">
        <sl-button variant="primary" icon="plus" pill @click="${this.showDataSource}">
          <sl-icon slot="prefix" name="plus"></sl-icon>
          Add
        </sl-button>
        <div class="list">
          ${repeat(this.dataSourceList, e => e.id, (e) => html`
            <div class="item" class=${classMap({
              item: true,
              current: this.currentView == e.id,
            })} @click=${() => this.currentView = e.id}>${e.name}</div>
          `)}
        </div>
      </div>
      <div class="right">
        ${choose(this.currentView, [
          ['', () => html``],
          ['add', () => html`${this.renderDataSourceList()}`],
        ], () => html`${this.renderDataSourceDetail(this.currentView)}`)}
      </div>
    `;
  }
  static styles = css`
    :host {
      display: flex;
      gap: var(--sl-spacing-small);
    }
    .left {
      width: 200px;
      sl-button {
        width: 100%;
      }
    }
    .left .list {
      padding-top: var(--sl-spacing-small);
    }
    .left .list .item {
      height: 2rem;
      line-height: 2rem;
      padding: 0 var(--sl-spacing-2x-small);
    }
    .left .list .item.current {
      background-color: var(--sl-color-orange-500);
      color: var(--sl-color-amber-200);
    }
    .right {
      flex: 1;
    }
  `
}
