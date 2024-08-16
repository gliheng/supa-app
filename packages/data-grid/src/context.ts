import { createContext } from '@lit/context';
import mitt from 'mitt';

export const dataGridDataContext = createContext<any>('dataGridData');
export const dataGridConfigContext = createContext<any>('dataGridConfig');

export class DataManager {
  emitter = mitt<{
    load: boolean;
    update: void;
  }>();
  source: any;
  data: any;
  cols = 0;
  rows = 0;
  topSticky = 0;
  leftSticky = 0;
  rightSticky = 0;
  bottomSticky = 0;
  loading = false;

  setSource(s: any) {
    this.source = s;
  }

  async load() {
    this.loading = true;
    this.emitter.emit('load', this.loading);
    const obj = await this.source.getData();
    Object.assign(this, obj);
    this.loading = false;
    this.emitter.emit('load', this.loading);
  }

  *iterateCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
    const viewData = this.source.getViewData(rowStart, rowEnd, colStart, colEnd);
    for (let i = 0; i < rowEnd - rowStart; i++) {
      for (let j = 0; j < colEnd - colStart; j++) {
        yield viewData[i]?.[j] ?? {
          row: i + rowStart,
          col: j + colStart,
        };
      }
    }
  }
}
