import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import 'supa-app';
import '@shoelace-style/shoelace';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { library } from './apps';

setBasePath('/node_modules/@shoelace-style/shoelace/dist');

@customElement('supa-app-launcher')
export class SupaAppElement extends LitElement {
  render() {
    return html`
      <sp-supa-app
        storage-key="supa-app-demo"
        .library=${library}
      >
      </sp-supa-app>
    `
  }

  static styles = css`
    :host {
      width: 100vw;
      height: 100vh;
      display: flex;
    }
  `;
}
