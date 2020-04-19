import * as G2 from '@antv/g2';
import { withUnit, getTypeColor } from '../util';
import { ChartData, ChartDataItem } from '../types';

export default class ListView {
  private view: G2.View;

  constructor(chart: G2.Chart) {
    this.view = chart.createView({
      region: {
        start: { x: 0.7, y: 0 },
        end: { x: 1, y: 1 }
      },
      padding: [0, 20]
    });

    this.view.axis('name', false);
    this.view.axis('value', false);

    this.view.coordinate('rect').transpose().reflect('y');

    this.view.legend(false);
    this.view.tooltip(false);

    this.view.option('sortable', true);

    this.view
      .interval()
      .position('name*value')
      .color('type', getTypeColor)
      .size(12)
      .label('name*value', (name, value) => ({
        content: `${name} ${withUnit(-value)}`,
        style: {
          fill: '#8d8d8d',
          textAlign: 'right'
        },
        offset: -6
      }));
  }

  update(data: ChartData, filterPath: string[]): void {
    const fileredData = data
      .filter(
        ({ path, depth }) =>
          (depth === filterPath.length || depth === filterPath.length + 1) &&
          filterPath.every((p, i) => path[i] === p)
      )
      .sort((a, b) => b.value - a.value);
    this.updateTitle(fileredData[0]);
    this.view.scale('name', {
      range: [0.05, 0.05 + (fileredData.length - 2) * 0.03]
    });
    this.view.changeData(
      fileredData.slice(1).map((item) => ({ ...item, value: -item.value }))
    );
  }

  on(eventName: string, eventHandler: (ev: G2.Event) => void): void {
    this.view.on(eventName, eventHandler);
  }

  private updateTitle(data: ChartDataItem): void {
    this.view.annotation().clear(true);
    this.view.annotation().text({
      content: data.type === 'chunk' ? 'node_modules' : data.name,
      position: ['0%', 2],
      style: {
        fontSize: 18
      }
    });
    this.view.annotation().text({
      content: withUnit(
        data.type === 'chunk' ? data.nodeModulesSize : data.value
      ),
      position: ['100%', 2],
      style: {
        fontSize: 20,
        textAlign: 'right'
      }
    });
  }
}
