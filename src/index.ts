import { Stats, ReportData, ChunkSizeInfo, ReportDataItem } from './types';
import { Package } from './package';
import {
  genParsedSizeMap,
  genDependenceMap,
  getParsedSize,
  filterChunkDirectlyRequiredModules
} from './utils';

export function getHierarchyData(
  statsData: Stats,
  reportData: ReportData
): ChunkSizeInfo[] {
  const parsedSizeMap = genParsedSizeMap(reportData);
  const dependencyMap = genDependenceMap(parsedSizeMap, statsData.modules);

  return statsData.chunks
    .map((chunk, index) => {
      const chunkDirectlyRequiredModules = filterChunkDirectlyRequiredModules(
        chunk,
        statsData.modules,
        dependencyMap
      );

      const pageRequirePackages = chunkDirectlyRequiredModules.map((module) =>
        new Package({
          ...module,
          size: getParsedSize(parsedSizeMap, module)
        }).analyzeDependencies(dependencyMap, chunkDirectlyRequiredModules)
      );

      return {
        name: chunk.files[0],
        chunkSize: reportData[index].parsedSize,
        nodeModulesSize:
          (reportData[index].groups.find(
            ({ path }) => path === './node_modules'
          ) as ReportDataItem)?.parsedSize ?? 0,
        children: pageRequirePackages
          .sort((a, b) => b.totalSize - a.totalSize)
          .map((pack) => pack.toHierarchy())
      };
    })
    .sort((a, b) => b.chunkSize - a.chunkSize);
}
