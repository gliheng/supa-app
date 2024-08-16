import { LitElement, html, css, nothing } from 'lit'
import { customElement } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js';
import { WindowManagerMixin } from './window-context';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { WindowFrameElement } from './window-frame';
import './window-frame';
import './layout-grid';

const PADDING = 3;
@customElement('sp-window-area')
export class WindowAreaElement extends WindowManagerMixin(LitElement, ['update', 'reorder', 'setRects', 'clearRects', 'layout']) {
  // TODO: setRects is used to set slots for controlled apps
  _onReorder = (i: number) => {
    if (this.manager?.layoutConfig) {
      queueMicrotask(() => {
        this._onSetRects(this.currentRects!);
      });
    }
  }

  layoutContainerRef = createRef<HTMLElement>();

  currentRects?: DOMRect[] = undefined;
  _onSetRects = (rects: DOMRect[]) => {
    this.currentRects = rects;
    this.manager?.apps.forEach((app, i) => {
      const el = this.frameRefs[app.id];
      if (i < rects.length) {
        const rect = rects[i];
        el.setRect(rect);
      } else {
        el.clearRect();
      }
    });
  }

  _onClearRects = () => {
    this.currentRects = undefined;
    Object.values(this.frameRefs).forEach((el) => {
      el.clearRect();
    });
  }

  frameRefs: Record<string, WindowFrameElement> = {}

  getSnapPoints = (id: string) => {
    const el = this.layoutContainerRef.value!;
    const xPoints = [PADDING, el.clientWidth - 2 * PADDING];
    const yPoints = [PADDING, el.clientHeight - 2 * PADDING];
    const draggingFrame = this.frameRefs[id];
    Object.values(this.frameRefs).forEach((el) => {
      if (id != el.id && !isOverlap(draggingFrame, el)) {
        xPoints.push(el.x, el.x + el.width);
        yPoints.push(el.y, el.y + el.height);
      }
    });
    return { x: xPoints, y: yPoints };
  }

  render() {
    let activeApp = this.manager.activeApp;
    const apps = this.manager?.apps;
    // layout-grid has to be always rendered to send layout signals here
    return html`
      <sp-layout-grid></sp-layout-grid>
      <div
        ${ref(this.layoutContainerRef)}
        class="layout-frames"
        data-layout=${this.manager.layout ?? nothing}
      >
        ${repeat(
          apps,
          e => e.id,
          (e, i) => {
            const id = e.id;
            const z = this.manager.zMap.get(id);
            const isPinned = this.manager.pinned.has(id);
            const style = { zIndex: z };
            return html`
              <sp-window-frame
                ${ref((el) => {
                  if (el) {
                    this.frameRefs[e.id] = el as WindowFrameElement;
                  } else {
                    delete this.frameRefs[e.id];
                  }
                })}
                style=${styleMap(style)}
                ?data-active=${activeApp == e.id}
                ?pinned=${isPinned}
                id=${e.id}
                .snapPoints=${this.getSnapPoints}
                .rect=${this.currentRects?.[i]}
                .config=${e}
                @activate=${() => {
                  this.manager.activateApp(id);
                }}
                @pin=${() => {
                  this.manager.pinApp(id);
                }}
                @close=${() => {
                  this.manager.closeApp(id);
                }}
              ></sp-window-frame>
            `;
          },
        )}
      </div>
    `
  }

  static styles = css`
    :host {
      overflow: hidden;
      position: relative;
      pointer-events: none;
    }
    :host > * {
      pointer-events: all;
    }
    .layout-frames:not([data-layout]) {
      position: absolute;
      inset: 0;
      sp-window-frame {
        padding: ${PADDING}px;
      }
    }
  `;
}

function isOverlap(a: {
  x: number;
  y: number;
  width: number;
  height: number;
}, b: {
  x: number;
  y: number;
  width: number;
  height: number;
}): boolean {
  return !(
    b.x >= a.x + a.width ||
    b.x + b.width <= a.x ||
    b.y >= a.y + a.height ||
    b.y + b.height <= a.y
  );
}
