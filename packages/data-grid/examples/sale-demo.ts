import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { nanoid } from 'nanoid';
import { RowDataSource, DataSource } from 'data-grid';
import moment from 'moment';

class SaleDataModel extends RowDataSource {
  constructor(public count: number) {
    super({
      columnDefaults: {
        resizable: true,
      },
      columns: [
        {
          field: 'orderId',
          headerName: 'Order ID',
          sticky: 'left',
        },
        {
          field: 'timestamp',
          headerName: 'Date',
          formatter(v) {
            return moment(v).format('YYYY-MM-DD h:mm:ss');
          },
        },
        {
          field: 'country',
          headerName: 'Country',
          render(v) {
            return html`<input></input>`;
          },
        },
        {
          field: 'user',
          headerName: 'User',
          sticky: 'right',
        },
        {
          field: 'product',
          headerName: 'Product',
        },
        {
          field: 'cash',
          headerName: 'Cash',
        },
        {
          field: 'discount',
          headerName: 'Discount',
        },
      ],
    });
  }
  async loadData() {
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    })
    const { count } = this;
    return {
      count,
      data: generateOrder(count),
    };
  }
}

function generateOrder(count: number): any[] {
  const data = [];
  const user = ['Bill', 'Sam', 'Tom'];
  const product = ['Katana', 'Violin', 'Keyboard', 'Mac Pro', 'Elden ring'];
  const discount = ['1', '0.9', '0.8', '0.7', '0.6'];
  for (let i = 0; i < count; i++) {
    data.push({
      orderId: nanoid(),
      timestamp: Date.now(),
      user: select(user),
      product: select(product),
      cash: Math.floor(Math.random() * 1000),
      discount: select(discount),
    });
  }
  return data;
}


function select<T>(arr: T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}

@customElement('sale-data-grid-demo')
export class SaleDataGridDemoElement extends LitElement {
  get dataSource() {
    return new SaleDataModel(100000);
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
