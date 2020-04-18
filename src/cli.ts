#! /usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import yargs from 'yargs';
import chalk from 'chalk';
import { getHierarchyData } from '.';
import { renderHTML } from './render';
import { withUnit } from './utils';
import { ChunkSizeInfo, PackageSizeInfo } from './types';

const argv = yargs
  .option('statsData', {
    alias: 's',
    string: true,
    required: true,
    description: '<filename> Webpack stats.json file',
    requiresArg: true
  })
  .option('reportData', {
    alias: 'r',
    string: true,
    required: true,
    description: '<filename> Webpack Bundle Analyzer report.json file',
    requiresArg: true
  })
  .option('output', {
    alias: 'o',
    array: true,
    string: true,
    description: '<filename> Output file name, support .html and .json',
    requiresArg: true
  })
  .option('list', {
    alias: 'l',
    boolean: true,
    description: 'List packages required by each chunk directly'
  })
  .option('gt', {
    requiresArg: true,
    number: true,
    description: '<size>KB Filter list packages which size greater then it'
  })
  .help().argv;

const statsData = JSON.parse(
  readFileSync(path.resolve(argv.statsData), 'utf8')
);
const reportData = JSON.parse(
  readFileSync(path.resolve(argv.reportData), 'utf8')
);

const hierachyData = getHierarchyData(statsData, reportData);

start();

function start(): void {
  if (argv.list) {
    let threshold = 0;
    if (typeof argv.gt === 'number') {
      threshold = argv.gt * 1024;
    }
    hierachyData.forEach((chunk) => {
      if (
        chunk.children &&
        chunk.children[0] &&
        chunk.children[0].totalSize >= threshold
      ) {
        outputChunkInfo(chunk);
        chunk.children
          .filter(({ totalSize }) => totalSize >= threshold)
          .forEach(outputDependencyInfo);
        console.log('');
      }
    });
  } else if (!argv.output) {
    console.log(JSON.stringify(hierachyData, null, 2));
    return;
  }

  argv.output?.forEach((outputFile) => {
    let output: string | undefined;
    if (/\.html?$/.test(outputFile)) {
      output = renderHTML(hierachyData);
    } else if (/\.json$/.test(outputFile)) {
      output = JSON.stringify(hierachyData, null, 2);
    }

    if (output) {
      const outputFilePath = path.resolve(outputFile);
      writeFileSync(outputFilePath, output);
      console.log(
        chalk.gray('output node_modules analyze file:'),
        chalk.underline.gray(outputFilePath)
      );
    }
  });
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
function outputDependencyInfo(packageSizeInfo: PackageSizeInfo): void {
  console.log(
    '   ',
    chalk.green('→'),
    chalk.gray(packageSizeInfo.name),
    chalk.gray('(') +
      chalk.white(withUnit(packageSizeInfo.totalSize)) +
      chalk.gray(')')
  );
}
