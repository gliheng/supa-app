export interface Box {
  use?: string;
  closable?: boolean
  static?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Preset = Box[]

export type LayoutInfo = ({
  id: string;
} & Box)[]
