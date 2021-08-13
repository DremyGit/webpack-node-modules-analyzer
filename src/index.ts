import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  Stats,
  ReportData,
  ChunkSizeInfo,
  ReportDataItem,
  PackageSizeInfo,
  FileSizeInfo,
  SizeType
} from './types';
import { Package } from './package';
import {
  genSizeMap,
  genDependenceMap,
  getSize,
  filterChunkDirectlyRequiredModules,
  withUnit
} from './utils';
import { renderHTML } from './render';

interface AnalyzerOptions {
  statsFile: string;
  reportFile: string;
  entry?: string;
  sizeType: SizeType;
}

interface AnalyzeOutputOptions {
  list?: boolean;
  gt?: number;
  module?: string;
  depth?: number;
  output?: string[];
}

export default class Analyzer {
  private statsData: Stats;
  private reportData: ReportData;
  private data: ChunkSizeInfo[];
  private sizeType: SizeType;

  constructor(options: AnalyzerOptions) {
    this.statsData = JSON.parse(
      readFileSync(path.resolve(options.statsFile), 'utf8')
    );
    this.reportData = JSON.parse(
      readFileSync(path.resolve(options.reportFile), 'utf8')
    );
    this.sizeType = options.sizeType || 'parsedSize';
    this.data = getHierarchyData(this.statsData, this.reportData, {
      entry: options.entry,
      sizeType: this.sizeType
    });
  }

  output(options: AnalyzeOutputOptions): void {
    if (options.list) {
      if (options.module) {
        this.outputModule(options);
      } else {
        this.outputList(options);
      }
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

  outputModule({
    module,
    depth = 1
  }: {
    module?: string;
    depth?: number;
  }): void {
    this.data.forEach((chunk) => {
      const pack = chunk.children.find((dep) => dep.name === module);
      if (pack) {
        outputChunkInfo(chunk);
        outputDependencyInfo([pack], depth);
        console.log('');
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
  reportData: ReportData,
  options: {
    entry?: string;
    sizeType: SizeType;
  }
): ChunkSizeInfo[] {
  const parsedSizeMap = genSizeMap(reportData, options.sizeType);
  const dependencyMap = genDependenceMap(parsedSizeMap, statsData.modules);

  return statsData.chunks
    .map((chunk) => {
      const chunkDirectlyRequiredModules = filterChunkDirectlyRequiredModules(
        chunk,
        statsData.modules,
        dependencyMap,
        options.entry
      );

      const pageRequirePackages = chunkDirectlyRequiredModules.map((module) =>
        new Package({
          ...module,
          size: getSize(parsedSizeMap, module)
        }).analyzeDependencies(dependencyMap, chunkDirectlyRequiredModules)
      );

      let chunkFileIndex = 0;
      const reportIndex = reportData.findIndex(
        ({ label }) => (chunkFileIndex = chunk.files.indexOf(label)) !== -1
      );

      return {
        name: chunk.files[chunkFileIndex],
        chunkSize: reportData[reportIndex][options.sizeType],
        nodeModulesSize:
          (reportData[reportIndex].groups.find(
            ({ path }) => path === './node_modules'
          ) as ReportDataItem)?.[options.sizeType] ?? 0,
        children: pageRequirePackages
          .sort((a, b) => b.totalSize - a.totalSize)
          .map((pack) => pack.toHierarchy())
          .filter(
            (item, index, arr) =>
              arr.findIndex(({ name }) => name === item.name) === index
          )
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
