export type Descriptor = {
  type: string;
  children?: Descriptor[] | Descriptor;
  class?: string;
  id?: string;
  props?: Record<string, any>;
  data?:  Record<string, any>;
  style?: Record<string, any>;
} & Record<string, any> | string;

declare global {
  interface HTMLElement {
    data?: Record<string, any>;
  }
}
