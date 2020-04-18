import { PackageSizeInfo, FileSizeInfo, ChunkSizeInfo } from '../types';

export type ChartData = ChartDataItem[];

export interface ChartDataRoot {
  name: string;
  nodeModulesSize: number;
}

export type ChartDataType = 'chunk' | 'package' | 'child-package' | 'file';

export interface BaseChartDataItem {
  name: string;
  path: string[];
  depth: number;
  value: number;
  x: number;
  y: number;
}

export interface ChunkDataItem extends BaseChartDataItem {
  type: 'chunk';
  chunkSize: number;
  nodeModulesSize: number;
  data: ChunkSizeInfo;
  parentData: null;
  parent: null;
}

export interface PackageDataItem extends BaseChartDataItem {
  type: 'package';
  data: PackageSizeInfo;
  parentData: null;
  parent: null;
}

export interface ChildPackageDataItem extends BaseChartDataItem {
  type: 'child-package';
  data: PackageSizeInfo;
  parentData: PackageSizeInfo;
  parent: PackageDataItem | ChildPackageDataItem;
}

export interface FileDataItem extends BaseChartDataItem {
  type: 'file';
  size: number;
  fullName: string;
  data: FileSizeInfo;
  parentData: PackageSizeInfo;
  parent: PackageDataItem | ChildPackageDataItem;
}

export type ChartDataItem =
  | ChunkDataItem
  | PackageDataItem
  | ChildPackageDataItem
  | FileDataItem;
