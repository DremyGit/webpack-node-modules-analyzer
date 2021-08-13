#! /usr/bin/env node
import yargs from 'yargs';
import Analyzer from '.';
import { SizeType } from './types';

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
  .option('entry', {
    alias: 'e',
    string: true,
    description: '<filename> Webpack entry file with glob support',
    requiresArg: true
  })
  .option('sizeType', {
    string: true,
    description: 'parsedSize or statSize',
    default: 'parsedSize',
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
  .option('depth', {
    alias: 'd',
    number: true,
    default: 1,
    requiresArg: true,
    description: 'depth of dependency'
  })
  .option('module', {
    alias: 'm',
    string: true,
    requiresArg: true,
    description: 'only output specified module info'
  })
  .help().argv;

new Analyzer({
  statsFile: argv.statsData,
  reportFile: argv.reportData,
  entry: argv.entry,
  sizeType: argv.sizeType as SizeType
}).output(argv);
