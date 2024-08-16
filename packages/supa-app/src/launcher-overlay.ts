import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { WindowManagerMixin } from './window-context';
import { createRef, ref } from 'lit/directives/ref.js';
import { AppConfig } from './config';

@customElement('sp-launcher-overlay')
export class LauncherOverlayElement extends WindowManagerMixin(LitElement) {
  iptRef = createRef<HTMLInputElement>();

  focusInput() {
    this.iptRef.value?.focus();
  }

  reset() {
    this.iptRef.value!.value = '';
    this.filtered = undefined;
    this.current = 0;
  }

  close() {
    const event = new Event('close', { composed: true });
    this.dispatchEvent(event);
  }

  startApp(e: AppConfig) {
    this.manager?.startAppByName(e.name);
  }

  onInput(evt: InputEvent) {
    const list = this.manager?.library.filter(e => !e.hideInLauncher);
    const key = (evt.target as HTMLInputElement).value.toLowerCase();
    if (key) {
      this.filtered = list.filter(e => e.label.toLowerCase().indexOf(key) != -1);
      this.current = 0;
    } else {
      this.filtered = undefined;
    }
  }

  onKeydown(evt: KeyboardEvent) {
    const { code } = evt;
    if (code == 'ArrowDown') {
      this.current = Math.min(this.current + 1, this.list.length - 1);
    } else if (code == 'ArrowUp') {
      this.current = Math.max(this.current - 1, 0);
    } else if (code == 'Enter') {
      this.startApp(this.list[this.current]);
      this.close();
    }
  }

  @state()
  filtered?: AppConfig[]

  get list() {
    return this.filtered ?? this.manager?.library.filter(e => !e.hideInLauncher);
  }

  @state()
  current = 0

  render() {
    const apps = this.list;
    let section;
    if (apps.length) {
      section = html`
        <section class="app-list" @click=${this.close}>
          ${apps.map((e, i) =>
            html`
              <div class="btn"
                ?data-active=${i == this.current}
                @click="${this.startApp.bind(this, e)}"
              >
                <sl-icon slot="prefix" name="gear"></sl-icon>
                <span>${e.label}</span>
              </sl-button>
            `
          )}
        </section>
      `;
    } else {
      section = html`
        <section class="no-data">
          <sl-icon name="exclamation-square"></sl-icon>
          No match
        </section>
      `;
    }

    return html`<div>
      <sl-input
        ${ref(this.iptRef)}
        @input=${this.onInput}
        @keydown=${this.onKeydown}
        @sl-clear=${this.onInput}
        size="small"
        clearable
      >
        <sl-icon name="search" slot="prefix"></sl-icon>
      </sl-input>
      ${section}
    </div>`;
  }

  static styles = css`
    section {
      padding: 20px;
    }
    section.no-data {
      color: var(--sl-color-gray-500);
    }
    section.no-data sl-icon {
      margin-right: 4px;
      font-size: 20px;
      vertical-align: middle;
    }
    section.app-list {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
    section.app-list sl-icon {
      font-size: 30px;
    }
    section.app-list .btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0;
      border-radius: 4px;
    }
    section.app-list .btn > span {
      margin-top: 4px;
    }
    section.app-list .btn:hover {
      background-color: var(--sl-color-primary-100);
      cursor: default;
    }
    section.app-list .btn[data-active] {
      background-color: var(--sl-color-primary-200);
    }
  `;
}