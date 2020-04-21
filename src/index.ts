import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  Stats,
  ReportData,
  ChunkSizeInfo,
  ReportDataItem,
  PackageSizeInfo,
  FileSizeInfo
} from './types';
import { Package } from './package';
import {
  genParsedSizeMap,
  genDependenceMap,
  getParsedSize,
  filterChunkDirectlyRequiredModules,
  withUnit
} from './utils';
import { renderHTML } from './render';

interface AnalyzerOptions {
  statsFile: string;
  reportFile: string;
}

interface AnalyzeOutputOptions {
  list?: boolean;
  gt?: number;
  depth?: number;
  output?: string[];
}

export default class Analyzer {
  private statsData: Stats;
  private reportData: ReportData;
  private data: ChunkSizeInfo[];

  constructor(options: AnalyzerOptions) {
    this.statsData = JSON.parse(
      readFileSync(path.resolve(options.statsFile), 'utf8')
    );
    this.reportData = JSON.parse(
      readFileSync(path.resolve(options.reportFile), 'utf8')
    );
    this.data = getHierarchyData(this.statsData, this.reportData);
  }

  output(options: AnalyzeOutputOptions): void {
    if (options.list) {
      this.outputList(options);
    } else if (!options.output) {
      this.outputJSON();
      return;
    }

    options.output?.forEach((fileName) => {
      if (/\.html?$/.test(fileName)) {
        this.outputHTMLFile(fileName);
      } else if (/\.json$/.test(fileName)) {
        this.outputJSONFile(fileName);
      }
    });
  }

  outputList({ gt, depth = 1 }: { gt?: number; depth?: number }): void {
    let threshold = 0;
    if (typeof gt === 'number') {
      threshold = gt * 1024;
    }
    this.data.forEach((chunk) => {
      if (
        chunk.children &&
        chunk.children[0] &&
        chunk.children[0].totalSize >= threshold
      ) {
        outputChunkInfo(chunk);
        outputDependencyInfo(chunk.children, depth);
        console.log('');
      }
    });
  }

  outputJSON(): void {
    console.log(JSON.stringify(this.data, null, 2));
  }

  outputHTMLFile(fileName: string): void {
    this.outputFile(fileName, renderHTML(this.data));
  }

  outputJSONFile(fileName: string): void {
    this.outputFile(fileName, JSON.stringify(this.data, null, 2));
  }

  private outputFile(fileName: string, content: string): void {
    const outputFilePath = path.resolve(fileName);
    writeFileSync(outputFilePath, content);
    console.log(
      chalk.gray('output analyze file:'),
      chalk.underline.gray(outputFilePath)
    );
  }
}

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

function outputChunkInfo(chunk: ChunkSizeInfo): void {
  console.log(
    chalk.bold.white(chunk.name),
    chalk.gray('(') +
      chalk.bold.white(withUnit(chunk.chunkSize)) +
      chalk.gray(')')
  );
  console.log(
    ' ',
    'node_modules',
    `${chalk.gray('(')}${chalk.bold.white(
      withUnit(chunk.nodeModulesSize)
    )}, ${chalk.bold.white(
      ((chunk.nodeModulesSize / chunk.chunkSize) * 100).toFixed(2)
    )}%${chalk.gray(')')}`
  );
}
function outputDependencyInfo(
  dependencies: (PackageSizeInfo | FileSizeInfo)[],
  maxDepth: number,
  depth = 1
): void {
  dependencies.forEach((dependency) => {
    if ('totalSize' in dependency) {
      console.log(
        Array.from(Array(depth * 3))
          .map(() => ' ')
          .join(''),
        chalk.green('→'),
        chalk.gray(dependency.name),
        chalk.gray('(') +
          chalk.white(withUnit(dependency.totalSize)) +
          chalk.gray(')')
      );

      if (depth < maxDepth && Array.isArray(dependency.children)) {
        outputDependencyInfo(dependency.children, maxDepth, depth + 1);
      }
    }
  });
}
