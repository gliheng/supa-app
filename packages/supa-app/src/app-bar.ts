import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import { RunningApp, WindowManagerMixin } from './window-context';
import { createRef, ref } from 'lit/directives/ref.js';
import { SlDialog } from '@shoelace-style/shoelace';
import { LauncherOverlayElement } from './launcher-overlay';
import './launcher-overlay';
import './layout-button';
import './button-bar';

@customElement('sp-app-bar')
export class AppBarElement extends WindowManagerMixin(LitElement) {
  launcherDialog = createRef<SlDialog>();
  launcherOverlay = createRef<LauncherOverlayElement>();

  async showLauncher() {
    await this.launcherDialog.value?.show();
    this.launcherOverlay.value?.focusInput();
  }

  closeLauncher() {
    this.launcherDialog.value?.hide();
  }

  onHide() {
    this.launcherOverlay.value?.reset();
  }

  render() {
    return html`
      <sl-icon-button
        name="grid"
        label="Show Launcher"
        @click=${this.showLauncher}
      ></sl-icon-button>
      <sp-run-list></sp-run-list>
      <sp-layout-button></sp-layout-button>
      <sl-dialog ${ref(this.launcherDialog)} @sl-after-hide=${this.onHide} label="Launcher" no-header>
        <sp-launcher-overlay ${ref(this.launcherOverlay)} @close=${this.closeLauncher}></sp-launcher-overlay>
      </sl-dialog>
    `
  }

  static styles = css`
    :host {
      border-bottom: 1px solid #aaa;
      background-color: #ddd;
      display: flex;
      align-items: center;
      flex-direction: row;
    }
    sp-layout-button {
      margin-right: 4px;
    }
  `;
}

@customElement('sp-run-list')
export class RunListElement extends WindowManagerMixin(LitElement) {
  activateApp(e: RunningApp) {
    this.manager?.activateApp(e.id);
  }

  reorder(evt: CustomEvent) {
    const { data: id, i } = evt.detail;
    this.manager.reorderApp(id, i);
  }

  close(evt: CustomEvent) {
    const { data: id } = evt.detail;
    this.manager.closeApp(id);
  }

  render() {
    const { zMap, apps, topDepth: top, pinned } = this.manager;
    const buttons = apps.map(e => {
      const isPinned = pinned.has(e.id);
      let variant = zMap.get(e.id) == top ? 'neutral' : 'default';
      if (isPinned) {
        variant = 'primary';
      }
      return {
        id: e.id,
        name: e.label,
        variant,
        onClick: this.activateApp.bind(this, e),
        closable: !isPinned && e.closable,
      };
   });
    return html`
      <sp-button-bar
        .buttons=${buttons}
        @reorder=${this.reorder}
        @close=${this.close}>
      </sp-button-bar>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      min-width: 0;
    }
  `;
}
