import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { RowDataSource } from 'data-grid';

class EditDataModel extends RowDataSource {
  constructor() {
    super({
      columnDefaults: {
        resizable: true,
      },
      columns: [
        {
          field: 'name',
          headerName: 'Name',
        },
      ],
    });
  }
  async loadData() {
    const data = [{name: 'hello'}];
    return {
      count: data.length,
      data,
    };
  }
}

@customElement('edit-data-grid-demo')
export class EditDataGridDemoElement extends LitElement {
  get dataSource() {
    return new EditDataModel();
  }

  render() {
    return html`
      <sp-data-grid .dataSource=${this.dataSource} .config=${{
        cellWidth: 200,
        cellHeight: 40,
      }}></sp-data-grid>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: flex;
    }
  `
}
