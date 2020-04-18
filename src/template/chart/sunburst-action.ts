import * as G2 from '@antv/g2';
import { findParent } from '../util';
import { ChartDataItem } from '../types';

type Element = import('@antv/g2/lib/geometry/element').default;

export default class Action extends G2.InteractionAction {
  private timer: number | null = null;

  private setCursor(cursor: import('@antv/g-base/lib/types').Cursor): void {
    const view = this.context.view;
    view.getCanvas().setCursor(cursor);
  }

  private getElements(): Element[] {
    return ([] as Element[]).concat(
      ...this.context.view.geometries.map((geometry) => geometry.elements)
    );
  }

  private getTargetElement(): Element | undefined {
    const event = this.context.event;
    let element;
    const target = event.target;
    if (target) {
      element = target.get('element');
    }
    return element;
  }

  active(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    const targetElement = this.getTargetElement();
    if (!targetElement) {
      return;
    }
    const targetData = targetElement.getData() as ChartDataItem;
    if (!targetData) {
      return;
    }

    if (targetData.type !== 'file' && targetData.type !== 'chunk') {
      this.setCursor('pointer');
    }
    const elements = this.getElements();
    const failedPaths = {};
    elements.forEach((element, index) => {
      const data = element.getData() as ChartDataItem;
      if (findParent(data, targetData, failedPaths) || index === 0) {
        element.setState('inactive', false);
      } else {
        element.setState('inactive', true);
      }
      element.setState('active', false);
    });

    if (targetElement === elements[0]) {
      targetElement.setState('active', false);
    } else {
      targetElement.setState('active', true);
    }
  }

  reset(): void {
    this.setCursor('default');
    this.timer = window.setTimeout(() => {
      this.getElements().forEach((element) => {
        element.setState('active', false);
        element.setState('inactive', false);
      });
    }, 100);
  }
}
