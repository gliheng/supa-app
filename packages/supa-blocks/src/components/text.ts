import { consume } from '@lit/context';
import { LitElement, css, html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { dataContext, DataController } from '../context';


@customElement('sl-ext-text')
export class TextElement extends LitElement {
  @consume({ context: dataContext })
  @property({ attribute: false })
  private ctrl?: DataController;

  connectedCallback(): void {
    super.connectedCallback();
  }

  @property({ type: String })
  template: string = '';

  render() {
    const [interpolated, values] = this.ctrl?.interpolate(this.template, this);
    if (values.some((e) => e === undefined)) {
      return nothing;
    }
    return html`${interpolated}`;
  }

  static styles = css`
    h1 {
      font-size: 1.2rem;
      border-bottom: 1px solid silver;
    }
  `
}
