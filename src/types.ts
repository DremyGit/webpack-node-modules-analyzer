export interface Stats {
  chunks: Chunk[];
  modules: Module[];
}

export interface Chunk {
  files: string[];
  modules: Module[];
  origins: Origin[];
}

export interface Origin {
  request: string | null;
}

export interface Module {
  identifier: string;
  name: string;
  size: number;
  issuerName: string;
  reasons: Reason[];
}

export interface Reason {
  moduleName: string;
  userRequest: string;
}

export interface DependencyMap {
  [moduleName: string]: Module[];
}

export interface Dependency {
  name: string;
  totalSize: number;
  size: number;
  dependencies?: Dependency[];
}

export interface Package {
  name: string;
  size: number;
  totalSize: number;
}

export type ReportData = {
  label: string;
  isAsset: boolean;
  statSize: number;
  parsedSize: number;
  gzipSize: number;
  groups: ReportDataItem[];
}[];

export interface ReportDataItem {
  id?: number;
  path: string;
  statSize: number;
  parsedSize: number;
  gzipSize: number;
  groups?: ReportDataItem[];
}

export interface PackageSizeInfo {
  name: string;
  totalSize: number;
  children: (PackageSizeInfo | FileSizeInfo)[];
}

export interface FileSizeInfo {
  name: string;
  size: number;
}

export interface ChunkSizeInfo {
  name: string;
  chunkSize: number;
  nodeModulesSize: number;
  children: PackageSizeInfo[];
}
