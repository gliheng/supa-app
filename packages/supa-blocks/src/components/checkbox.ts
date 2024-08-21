import { consume, provide } from '@lit/context';
import { LitElement, css, html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { dataContext, DataController, formContext, FormController } from '../context';

@customElement('sl-ext-checkbox')
export class CheckboxElement extends LitElement {
  @consume({ context: dataContext })
  @property({ attribute: false })
  private ctrl?: DataController;

  @consume({ context: formContext })
  @property({ attribute: false })
  private formCtrl?: FormController;

  connectedCallback() {
    super.connectedCallback();
    this.formCtrl?.register(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.formCtrl?.unregister(this);
  }

  @property({
    type: String
  })
  label: string;

  onInput(evt: InputEvent) {
    const name = this.getAttribute('name');
    if (name) {
      this.ctrl.update(name, evt.target.value);
    }
  }

  render() {
    const name = this.getAttribute('name');
    let value;
    if (name) {
      value = this.ctrl.get(name);
    }
    return html`
      <sl-checkbox
        ?checked=${value}
        @input=${this.onInput}
      >${this.label}</sl-checkbox>
    `;
  }

  static styles = css`
    :host {
      display: inline-block;
    }
  `
}
