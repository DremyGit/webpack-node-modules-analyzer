import DataSet from '@antv/data-set';
import { ChunkSizeInfo } from '../types';
import {
  ChartData,
  BaseChartDataItem,
  ChartDataItem,
  PackageDataItem,
  FileDataItem,
  ChildPackageDataItem,
  ChunkDataItem
} from './types';

export default class ChunkDataView {
  private dataview: import('@antv/data-set/lib/view').View;

  constructor() {
    this.dataview = new DataSet.DataView();
  }

  convert(chunkData: ChunkSizeInfo): ChartData {
    const view = this.dataview
      .source(chunkData, {
        type: 'hierarchy'
      })
      .transform({
        type: 'hierarchy.partition',
        field: 'size',
        as: ['x', 'y']
      });

    return view
      .getAllNodes()
      .filter(({ value }) => value !== 0)
      .map<ChartDataItem>(({ data, depth, value, x, y, parent }) => {
        const dataItem: BaseChartDataItem = {
          name: data.name,
          path: [data.name],
          depth,
          value,
          x,
          y
        };
        if ('chunkSize' in data) {
          const chunkDataItem: ChunkDataItem = {
            ...dataItem,
            type: 'chunk',
            chunkSize: chunkData.chunkSize,
            nodeModulesSize: chunkData.nodeModulesSize,
            data,
            parentData: null,
            parent: null
          };
          return chunkDataItem;
        } else if ('size' in data) {
          const fileDataItem: FileDataItem = {
            ...dataItem,
            type: 'file',
            size: data.size,
            fullName: data.fullName,
            data,
            parentData: parent.data,
            parent
          };
          return fileDataItem;
        } else if (depth === 1) {
          const packageDataItem: PackageDataItem = {
            ...dataItem,
            type: 'package',
            data,
            parentData: null,
            parent: null
          };
          return packageDataItem;
        } else {
          const childPackageDataItem: ChildPackageDataItem = {
            ...dataItem,
            type: 'child-package',
            data,
            parentData: parent.data,
            parent
          };
          return childPackageDataItem;
        }
      })
      .map((item, index, arr) => {
        if (item.type !== 'package') {
          item.parent = arr.find(({ data }) => item.parentData === data) as any;
        }
        switch (item.type) {
          case 'file':
            item.fullName = item.parent.name + '/' + item.name;

          case 'child-package':
            item.path = item.parent.path.concat(item.name);
            break;

          case 'chunk':
            item.path = [];
            break;

          case 'package':
            break;
        }
        return item;
      });
  }
}
