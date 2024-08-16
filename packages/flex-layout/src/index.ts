import { LayoutManager, layoutContext } from './layout-context';
import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js';
import { styleMap } from 'lit/directives/style-map.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { provide } from '@lit/context';
import type { Preset, Rect } from './types';
import './flex-panel';
import './flex-panel-stack';

export type DragHintInfo = Rect & {
  snap?: 'tabbar' | 'left' | 'right' | 'top' | 'bottom';
  tabId?: string;
};

@customElement('sp-flex-layout')
export class FlexLayout extends LitElement {
  @provide({ context: layoutContext })
  manager = new LayoutManager(this, (ids) => {
    // If id list is provided, update only specific panels
    if (ids) {
      for (const id of ids) {
        const stack = this.stackRefs[id];
        stack?.requestUpdate();
      }
    } else {
      this.requestUpdate();
    }
  });

  @property({
    attribute: false,
  })
  set preset(val: Preset | undefined) {
    if (val) {
      this.manager.loadPreset(val);
    }
  }

  get preset() {
    return this.manager.preset;
  }

  @property({
    type: Number,
  })
  gap = 4

  @property({
    attribute: 'storage-key',
  })
  storageKey?: string

  @property({
    attribute: 'storage-ver',
  })
  storageVer?: string

  containerRef = createRef();

  onDragover(evt: DragEvent) {
    evt.preventDefault();
    const target = evt.target as HTMLElement;
    const { id } = target.dataset;
    const stack = this.manager.layoutInfo?.find(e => e.id == id);
    
    if (stack) {
      const rect = target.getBoundingClientRect();
      let dragHint: DragHintInfo = {
        left: stack.left,
        right: stack.right,
        top: stack.top,
        bottom: stack.bottom,
      };
      this.dragHint = dragHint;

      const tabbar = findEventSource(
        evt.composedPath(),
        '.tab-group__nav',
        evt.target as HTMLElement,
      );

      // snap on tabbar
      if (tabbar) {
        const tab = findEventSource(
          evt.composedPath(),
          'sl-tab',
          evt.target as HTMLElement,
        );
        
        if (tab) {
          // drag over a sl-tab
          const rect = tab.getBoundingClientRect();
          const containerRect = this.containerRef.value!.getBoundingClientRect();
          dragHint.unit = 'px';
          dragHint.left = rect.left - containerRect.left;
          dragHint.right = rect.right - containerRect.left;
          dragHint.top = rect.top - containerRect.top;
          dragHint.bottom = rect.bottom - containerRect.top;
          dragHint.tabId = tab.getAttribute('panel')!;
        } else {
          // drag over other parts of tabbar
          const slot = tabbar.querySelector('slot[name="nav"]')
          const lastTab = (slot as HTMLSlotElement).assignedElements().slice(-1)[0];
          const tabbarRect = tabbar.getBoundingClientRect();
          const containerRect = this.containerRef.value!.getBoundingClientRect();
          dragHint.unit = 'px';
          dragHint.left = tabbarRect.left - containerRect.left;
          dragHint.right = tabbarRect.right - containerRect.left;
          dragHint.top = tabbarRect.top - containerRect.top;
          dragHint.bottom = tabbarRect.bottom - containerRect.top;
          if (lastTab) {
            const rect = lastTab.getBoundingClientRect();
            dragHint.left = rect.right - containerRect.left;
          }
        }
        dragHint.snap = 'tabbar';
        return;
      }

      let d;
      // snap left edge
      d = Math.abs(rect.left - evt.clientX);
      if (d < rect.width / 4) {
        dragHint.right = stack.left + (stack.right - stack.left) / 2;
        dragHint.snap = 'left';
        return;
      }

      // snap right edge
      d = Math.abs(rect.right - evt.clientX);
      if (d < rect.width / 4) {
        dragHint.left = stack.left + (stack.right - stack.left) / 2;
        dragHint.snap = 'right';
        return;
      }

      // snap top edge
      d = Math.abs(rect.top - evt.clientY);
      if (d < rect.height / 4) {
        dragHint.bottom = stack.top + (stack.bottom - stack.top) / 2;
        dragHint.snap = 'top';
        return;
      }

      // snap bottom edge
      d = Math.abs(rect.bottom - evt.clientY);
      if (d < rect.height / 4) {
        dragHint.top = stack.top + (stack.bottom - stack.top) / 2;
        dragHint.snap = 'bottom';
        return;
      }
    } else {
      this.dragHint = undefined;
    }
  }

  onDrop(evt: DragEvent) {
    const { dragHint } = this;
    const { layoutInfo } = this.manager;
    if (dragHint && layoutInfo) {
      const target = evt.target as HTMLElement;
      const targetStackId = target.dataset.id!;
      const panel = this.manager.getNode(targetStackId);
      const { snap, tabId } = dragHint;
      const panelId = evt.dataTransfer?.getData('panelId');
      if (!panelId) return;
      if (panel && panel.children?.length == 1 && panel.children[0].id == panelId) {
        // If the panel is the only one inside stack, nothing needs to be done
        this.dragHint = undefined;
        return;
      }
      if (!snap || snap == 'tabbar') {
        // move panel to new stack
        let tabIndex;
        if (tabId) {
          const tab = this.manager.getNode(tabId)
          tabIndex = this.manager.parentNode(tab)?.children?.indexOf(tab);
        }
        this.manager.movePanel(panelId, targetStackId, tabIndex);
      } else {
        // remove source path first
        let removed = this.manager.removeNode(panelId);
        // split panel
        let newStack = this.manager.splitPanel(targetStackId, snap);
        this.manager.insertNode(newStack, removed);
      }
      this.dragHint = undefined;
    }
    this.manager.saveLayout();
  }

  onDragend() {
    this.dragHint = undefined;
  }

  @state()
  dragHint?: DragHintInfo

  stackRefs: Record<string, any> = {}

  onRemove(evt: CustomEvent) {
    const { id } = evt.detail;
    this.manager.removeNode(id);
    this.manager.saveLayout();
  }

  renderLayout() {
    return html`
      <div class="flex-layout"
        ${ref(this.containerRef)}
        @dragover=${this.onDragover}
        @drop=${this.onDrop}
        @dragend=${this.onDragend}
      >
        ${repeat(this.manager.layoutInfo ?? [], e => e.id, (e) => {
          const id = e.id!;
          const panel = this.manager.getNode(id);
          return html`
            <sp-flex-panel-stack
              ${ref(el => {
                if (id) {
                  if (el) {
                    this.stackRefs[id] = el;
                  } else {
                    delete this.stackRefs[id];
                  }
                }
              })}
              id=${ifDefined(e.id)}
              style=${styleMap(styleFromRect(e))}
              @remove=${this.onRemove}
              .panels=${panel.children}
            ></sp-flex-panel-stack>`;
        })}
        ${when(this.dragHint, () => {
          return html`
            <div class="drag-hint"
              data-snap=${ifDefined(this.dragHint?.snap)}
              style=${styleMap(styleFromRect(this.dragHint!))}
            ></div>`;
        })}
      </div>
    `;
  }

  render() {
    return html`
      ${when(
        this.manager.layoutInfo,
        () => this.renderLayout(),
        () => html`<slot name="placeholder"></slot>`
      )}
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: flex;
    }
    .flex-layout {
      position: relative;
      flex: 1;
    }
    .drag-hint {
      position: absolute;
      transition: all 0.3s;
      background: var(--sl-color-neutral-500);
      opacity: 0.3;
      pointer-events: none;
    }
  `
}

function styleFromRect(rect: Rect) {
  const { unit = 'percent', left, right, top, bottom } = rect;
  const style: Record<string, string> = {};
  if (unit == 'px') {
    style.left = `${left}px`;
    style.top = `${top}px`;
    style.width = `${right - left}px`;
    style.height = `${bottom - top}px`;
  } else if (unit == 'percent') {
    style.left = `${left * 100}%`;
    style.top = `${top * 100}%`;
    style.width = `${(right - left) * 100}%`;
    style.height = `${(bottom - top) * 100}%`;
  }
  return style;
}

/**
 * Find an element from composedPath
 * @param path composedPath
 * @param selector selector of element to find
 * @param el Element to stop looking
 * @returns HTMLElement
 */
function findEventSource(path: EventTarget[], selector: string, el: HTMLElement) {
  for (const e of path) {
    if (!(e instanceof HTMLElement)) continue;
    if (matchSelector(e, selector)) {
      return e;
    }
    if (e == el) {
      return;
    }
  }
}

function matchSelector(el: HTMLElement, selector: string) {
  let match = selector.match(/[.#]?[\w-_]+(?:$|(?=[.#$]))/g);
  if (!match) return false;
  for (const s of match) {
    if (s.startsWith('.')) {
      if (!el.classList.contains(s.substring(1))) return false;
    } else if (s.startsWith('#')) {
      if (el.id != s.substring(1)) return;
    } else {
      if (el.tagName.toLowerCase() != s) return false;
    }
  }
  return true;
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-flex-layout': FlexLayout,
  }
}
