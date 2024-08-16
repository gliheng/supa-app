import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { DataSource } from 'data-grid';

class ExcelDataModel implements DataSource {
  constructor(public rows: number, public cols: number) {}

  getData() {
    return {
      rows: this.rows,
      cols: this.cols,
      leftSticky: 0,
      rightSticky: 0,
      topSticky: 0,
      bottomSticky: 0,
    };
  }

  getViewData(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
    const data = [];
    for (let i = rowStart; i < rowEnd; i++) {
      const row = [];
      for (let j = colStart; j < colEnd; j++) {
        row.push({
          data: excelCoord(i, j),
          row: i,
          col: j,
        });
      }
      data.push(row);
    }
    return data;
  }
}

@customElement('excel-data-grid-demo')
export class ExcelDataGridDemoElement extends LitElement {
  get dataSource() {
    return new ExcelDataModel(10000, 10000);
  }

  render() {
    return html`
      <sp-data-grid .dataSource=${this.dataSource}></sp-data-grid>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: flex;
    }
  `
}

function excelCoord(i: number, j: number) {
  let col = excelCol(j);
  return `${col}${i+1}`;
}

function excelCol(i: number) {
  i++;
  let ret = [];
  while (i) {
    ret.push(String.fromCharCode('A'.charCodeAt(0) + (i - 1) % 26));
    i = Math.floor((i - 1)/26);
  }
  ret.reverse();
  return ret.join('');
}
