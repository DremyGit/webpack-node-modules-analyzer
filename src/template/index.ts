import DataView from './dataview';
import Chart from './chart';
import { ChunkSizeInfo } from '../types';
import { withUnit } from './util';

declare global {
  interface Window {
    data: ChunkSizeInfo[];
  }
}

window.onload = (): void => {
  const select = document.getElementById('chunks') as HTMLSelectElement;

  window.data.forEach(function (chunkData, index) {
    const option = document.createElement('option');
    option.value = index.toString();
    option.innerText = `${chunkData.name} (${withUnit(chunkData.chunkSize)})`;
    select.appendChild(option);
  });

  const dataview = new DataView();
  const chart = new Chart('chart');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select.onchange = (e: any): void => {
    chart.render(dataview.convert(window.data[e.target.value]));
  };

  if (window.data && window.data[0]) {
    chart.render(dataview.convert(window.data[0]));
  }
};
