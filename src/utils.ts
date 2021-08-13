import minimatch from 'minimatch';
import {
  ReportDataItem,
  Module,
  DependencyMap,
  ReportData,
  Chunk,
  SizeType
} from './types';

export const nodeModuleRegex = /\/node_modules\//;

export function genDependenceMap(
  parsedSizeMap: Record<string, number>,
  modules: Module[]
): DependencyMap {
  const dependencyMap: DependencyMap = {};
  modules.forEach((module) => {
    module.reasons.forEach((reason) => {
      if (!dependencyMap[reason.moduleName]) {
        dependencyMap[reason.moduleName] = [];
      }
      const list = dependencyMap[reason.moduleName];
      if (list.findIndex(({ name }) => name === module.name) === -1) {
        list.push({
          ...module,
          size: getSize(parsedSizeMap, module)
        });
      }
    });
  });
  return dependencyMap;
}

export function withUnit(size: number): string {
  const units = ['', 'k', 'm', 'g'];
  let s = size;
  let u = 0;
  while (s > 1024) {
    s /= 1024;
    u++;
  }
  if (~~s === s) {
    return `${s} ${units[u]}B`;
  }
  return `${s.toFixed(2)} ${units[u]}B`;
}

export function genSizeMap(
  reportData: ReportData,
  sizeType: SizeType
): Record<string, number> {
  const sizeMap: Record<string, number> = {};
  const walk = (chartDataItem: ReportDataItem): void => {
    if (typeof chartDataItem.id === 'number') {
      sizeMap[chartDataItem.path] = chartDataItem[sizeType];
    } else if (Array.isArray(chartDataItem.groups)) {
      chartDataItem.groups.forEach(walk);
    }
  };

  reportData.forEach((chunk) => chunk.groups.forEach(walk));
  return sizeMap;
}

export function getSize(
  parsedSizeMap: Record<string, number>,
  module: Module
): number {
  return parsedSizeMap[module.name] || 0;
}

export function filterChunkDirectlyRequiredModules(
  chunk: Chunk,
  modules: Module[],
  dependencyMap: DependencyMap,
  entry?: string
): Module[] {
  const requiredNodeModules: Module[] = [];
  const requiredNotNodeModules: Module[] = [];
  const walk = (modules: Module[] = []): void => {
    const nodeModules = modules.filter((module) =>
      nodeModuleRegex.test(module.name)
    );
    nodeModules.forEach((module) => {
      if (
        requiredNodeModules.findIndex(({ name }) => name === module.name) === -1
      ) {
        requiredNodeModules.push(module);
      }
    });

    const notNodeModules = modules.filter(
      (module) => !nodeModuleRegex.test(module.name)
    );
    notNodeModules.forEach((module) => {
      if (
        requiredNotNodeModules.findIndex(({ name }) => name === module.name) ===
        -1
      ) {
        requiredNotNodeModules.push(module);
        walk(dependencyMap[module.name]);
      }
    });
  };

  let entries = [];
  if (entry) {
    const entryFiles = minimatch.match(
      chunk.modules.map(({ name }) => name),
      entry
    );
    console.log('Entry files', entryFiles);
    entries = chunk.modules.filter(
      ({ name }) => entryFiles.indexOf(name) !== -1
    );
  } else {
    entries = chunk.origins
      .map(({ request }) =>
        modules.find(
          ({ name }) => request && request.indexOf(name.substr(1)) !== -1
        )
      )
      .filter((entry) => !!entry) as Module[];

    console.log(chunk.origins, entries);

    // if (!entries.length) {
    //   throw new Error(
    //     "Can't find entry file automatically, please use -e to set entry file"
    //   );
    // }
  }

  walk(entries);
  return requiredNodeModules;
}
