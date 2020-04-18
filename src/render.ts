import { readFileSync } from 'fs';
import path from 'path';
import { ChunkSizeInfo } from './types';

export function renderHTML(data: ChunkSizeInfo[]): string {
  const html = readFileSync(
    path.resolve(__dirname, './template/index.html'),
    'utf8'
  );
  return html.replace('[/* data */]', JSON.stringify(data));
}
