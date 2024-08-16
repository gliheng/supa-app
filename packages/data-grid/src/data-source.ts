import { TemplateResult } from 'lit';

export interface RawDataSource {
  getData(): Promise<{
    cols: number;
    rows: number;
    topSticky: number;
    leftSticky: number;
    rightSticky: number;
    bottomSticky: number;
  }>;

  getViewData(rowStart: number, rowEnd: number, colStart: number, colEnd: number): {
    data: any;
    row: number;
    col: number;
    formatted(d: any): string;
    render(d: any): TemplateResult;
  }[][];
}

export interface ColumnDef {
  field: string;
  headerName: string;
  formatter?: (v: any) => string;
  resizable?: boolean;
  sticky?: 'left' | 'right' | 'center';
};

export class RowDataSource implements RawDataSource {
  topSticky = 1;
  leftSticky = 0;
  rightSticky = 0;
  columns: ColumnDef[] = [];
  rowData = null;
  columnDefaults: Partial<ColumnDef> = {
    resizable: false,
  };

  constructor(private config: any) {
    const { columns, columnDefaults } = this.config;
    const cols = columns.concat();
    const a = [], b = [];
    for (let i = 0; i < cols.length;) {
      const col = cols[i];
      const { sticky } = col;
      if (sticky == 'left') {
        a.push(col);
        cols.splice(i, 1);
      } else if (sticky == 'right') {
        b.push(col);
        cols.splice(i, 1);
      } else {
        i++;
      }
    }
    this.leftSticky = a.length;
    this.rightSticky = b.length;
    this.columns = [...a, ...cols, ...b];
    Object.assign(this.columnDefaults, columnDefaults);
  }

  async getData() {
    const { count, data } = await this.loadData();
    this.rowData = data;
    return {
      cols: this.columns.length,
      rows: count + this.topSticky,
      topSticky: this.topSticky,
      leftSticky: this.leftSticky,
      rightSticky: this.rightSticky,
      bottomSticky: 0,
    };
  }

  loadData() {
    throw 'Need implemention';
  }

  getViewData(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
    const data = [];
    const addHeader = rowStart < this.topSticky;
    // TODO: We assume header is has height of 1 for simplicity
    let headerSize = this.topSticky;
    if (addHeader) {
      data.push(
        this.columns.slice(colStart, colEnd).map((col, i) => ({
          row: 0,
          col: colStart + i,
          data: col.headerName,
          hResize: col.resizable ?? this.columnDefaults.resizable,
          // vResize: true,
        }))
      );
    }

    return data.concat(this.rowData.slice(addHeader ? rowStart : rowStart - headerSize, rowEnd - headerSize).map((row, i) => {
      return this.columns.slice(colStart, colEnd).map((col, j) => {
        const cellData = row[col.field];
        const { formatter } = col;
        let formatted;
        if (formatter) {
          formatted = formatter(cellData);
        }
        const isSticky = j < this.leftSticky || (colEnd - j <= this.rightSticky);
        return {
          data: cellData,
          row: rowStart + i,
          col: colStart + j,
          // These are for debug
          // hResize: isSticky,
          // vResize: isSticky,
          formatted,
          render: col.render,
        };
      });
    }));
  }
}
