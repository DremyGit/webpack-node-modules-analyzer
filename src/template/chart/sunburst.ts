import * as G2 from '@antv/g2';
import Action from './sunburst-action';
import { autoFitSize, withUnit, getTypeColor } from '../util';
import { ChartData, ChartDataItem } from '../types';
import { Event } from '@antv/g2';

G2.registerAction('chunk-active', Action);
G2.registerInteraction('chunk-active', {
  start: [{ trigger: 'polygon:mouseenter', action: 'chunk-active:active' }],
  end: [{ trigger: 'polygon:mouseleave', action: 'chunk-active:reset' }]
});

export default class SunburstView {
  private view: G2.View;

  constructor(chart: G2.Chart) {
    this.view = chart.createView({
      region: {
        start: { x: 0, y: 0 },
        end: { x: 0.85, y: 1 }
      }
    });

    this.view.coordinate('polar', {
      innerRadius: 0
    });
    this.view.axis(false);
    this.view.legend(false);
    this.view.tooltip(false);
    this.view.scale({
      x: { nice: false, key: true },
      y: { nice: false, key: true }
    });
    this.view
      .polygon()
      .position('x*y')
      .color('type', getTypeColor)
      .style({
        stroke: '#FFF',
        lineWidth: 0.2
      })
      .animate({
        update: {
          duration: 600,
          animation: 'sector-path-update'
        }
      })
      .state({
        active: { style: { stroke: 'rgba(0,0,0,.3)' } },
        inactive: { style: { fillOpacity: 0.55 } }
      });

    this.view.removeInteraction('element-active');
    this.view.interaction('chunk-active');
    this.view.interaction('sunset-click');
  }

  private updateName(content: string): void {
    this.view.annotation().text(
      centerText({
        content,
        fontSize: autoFitSize(18, 10, 5, content.length),
        offsetY: -15
      })
    );
  }

  private updateSize(size: number): void {
    this.view.annotation().text(
      centerText({
        content: withUnit(size),
        fontSize: 22,
        offsetY: 15
      })
    );
  }

  private updateCenterInfo(data: ChartDataItem): void {
    this.view.annotation().clear(true);
    const { name, value } = data;
    this.updateName(data.type === 'chunk' ? 'node_modules' : name);
    this.updateSize(data.type === 'chunk' ? data.nodeModulesSize : value);
  }

  update(data: ChartData, filterPath: string[]): void {
    const filteredData = data.filter(({ path }) =>
      filterPath.every((p, i) => path[i] === p)
    );
    this.updateCenterInfo(filteredData[0]);
    this.view.changeData(filteredData);
  }

  on(eventName: string, eventHandler: (ev: Event) => void): void {
    this.view.on(eventName, eventHandler);
  }
}

const centerText = ({
  content,
  fontSize,
  fill,
  offsetY
}: {
  content: string;
  fontSize?: number;
  fill?: string;
  offsetY?: number;
}): import('@antv/g2/lib/interface').TextOption => ({
  position: ['50%', '50%'],
  content,
  style: {
    fontSize,
    fill,
    textAlign: 'center'
  },
  offsetY
});
