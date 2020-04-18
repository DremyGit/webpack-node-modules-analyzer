import { ChartDataItem, ChartDataType } from './types';

export function findParent(
  source: ChartDataItem,
  target: ChartDataItem,
  failedPaths: Record<string, boolean>
): boolean {
  if (!source) {
    return false;
  }
  if (source === target) {
    return true;
  }
  if (target.type === 'chunk' || source.type === 'chunk') {
    return true;
  }

  if (target.type === 'file') {
    return source.type === 'file' && source.fullName === target.fullName;
  }

  if (failedPaths[source.path.join(' > ')]) {
    return false;
  }

  if (source.type === 'package') {
    return source.name === target.name;
  }

  if (source.name === target.name) {
    return true;
  }

  const success = findParent(source.parent, target, failedPaths);
  if (!success) {
    failedPaths[source.path.join(' > ')] = true;
  }
  return success;
}

export function autoFitSize(
  baseSize: number,
  threashold: number,
  k: number,
  length = 0
): number {
  return Math.min(baseSize, baseSize - Math.max(length - threashold, 0) / k);
}

export function withUnit(size: number): string {
  const units = ['', 'K', 'M', 'G'];
  let s = size;
  let u = 0;
  while (s > 1024) {
    s /= 1024;
    u++;
  }
  if (~~s === s) {
    return `${s}${units[u]}B`;
  }
  return `${s.toFixed(2)}${units[u]}B`;
}

export function getSizeColor(size: number): string {
  if (size >= 50 * 1024) {
    return '#E15554';
  }
  if (size >= 20 * 1024) {
    return '#E9CE63';
  }
  if (size >= 10 * 1024) {
    return '#4D9DE0';
  }
  return '#3BB273';
}

export function getTypeColor(type: ChartDataType): string {
  switch (type) {
    default:
    case 'chunk':
      return '#FFF';

    case 'package':
      return '#6D98BA';

    case 'child-package':
      return '#CC8B86';

    case 'file':
      return '#c9c9c9';
  }
}
