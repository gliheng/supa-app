export type Preset = {
  use: '$row' | '$col' | '$tab' | '$grid' | string,
  flex?: number;
  label?: string;
  children?: Preset[],
}

export type NormalizedPreset = {
  id: string;
  parent?: string;
  children?: NormalizedPreset[],
} & Preset

export type Node = Omit<NormalizedPreset, id | parent> & Record<string, any>;

export type LayoutInfo = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id?: string;
}[]

export interface Rect {
  unit?: 'percent' | 'px';
  left: number;
  right: number;
  top: number;
  bottom: number;
}
