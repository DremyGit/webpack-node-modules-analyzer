import * as G2 from '@antv/g2';
import SunburstView from './sunburst';
import { ChartData, ChartDataItem } from '../types';
import ListView from './list';
import { Event } from '@antv/g2';

export default class Charts {
  private chart: G2.Chart;
  private sunburstView: SunburstView;
  private listView: ListView;
  private filterPath: string[] = [];
  private hoverPath?: string[];
  private data?: ChartData;

  constructor(container: string) {
    this.chart = new G2.Chart({
      container,
      autoFit: true,
      height: document.documentElement.clientHeight - 40,
      padding: 0
    });
    this.sunburstView = new SunburstView(this.chart);
    this.listView = new ListView(this.chart);

    this.sunburstView.on('element:click', (ev) => {
      const path = this.getEventFilterPath(ev, false);
      if (path) {
        if (path.length <= this.filterPath.length) {
          this.filterPath = this.filterPath.slice(0, -1);
        } else {
          this.filterPath = path;
        }
        this.update();
      }
    });

    this.listView.on('element:click', (ev) => {
      const path = this.getEventFilterPath(ev, false);
      if (path) {
        if (path.length <= this.filterPath.length) {
          this.filterPath = this.filterPath.slice(0, -1);
        } else {
          this.filterPath = path;
        }
        this.update();
      }
    });

    this.sunburstView.on('element:mouseover', (ev) => {
      const path = this.getEventFilterPath(ev);
      if (path) {
        this.hoverPath = path;
        this.update(this.listView);
      }
    });
    this.sunburstView.on('element:mouseleave', () => {
      if (this.hoverPath) {
        this.hoverPath = undefined;
        this.update(this.listView);
      }
    });
  }

  private getEventFilterPath(
    ev: Event,
    includeFile = true
  ): string[] | undefined {
    if (!ev.data) {
      return;
    }
    const { path, type } = ev.data.data as ChartDataItem;
    if (type === 'file' && !includeFile) {
      return;
    }

    return path;
  }

  render(data: ChartData): void {
    this.data = data;
    this.filterPath = [];
    this.update();
  }

  private update(view?: SunburstView | ListView): void {
    if (this.data) {
      if (view === this.sunburstView) {
        this.sunburstView.update(this.data, this.filterPath);
      } else if (view === this.listView) {
        this.listView.update(this.data, this.hoverPath || this.filterPath);
      } else {
        this.sunburstView.update(this.data, this.filterPath);
        this.listView.update(this.data, this.hoverPath || this.filterPath);
      }
    }
  }
}
