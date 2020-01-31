import { useCallback } from 'react';
import { saveAs } from 'file-saver';
import { sigil, stringRenderer } from 'urbit-sigil-js';
import * as ob from 'urbit-ob';

import {
  dataURItoBlob,
  loadImg,
  initCanvas,
  cleanupCanvas,
} from 'lib/SigilDownloader';

export default function useSigilDownloader(canvasRef) {
  const downloadSigil = useCallback(
    (point, colors, size) => {
      const patp = ob.patp(point);

      const _size = size / window.devicePixelRatio;

      const DATA_URI_PREFIX = 'data:image/svg+xml;base64,';

      // initialize canvas element
      const canvas = initCanvas(canvasRef.current, { x: _size, y: _size });
      const ctx = canvas.getContext('2d');

      // make sigil svg and encoded into base64
      const svg = sigil({
        patp,
        renderer: stringRenderer,
        size: _size,
        colors,
        margin: (54 / 256) * _size,
      });

      // FF rendering hack
      const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
      svgDocument.documentElement.width.baseVal.valueAsString = `${size}px`;
      svgDocument.documentElement.height.baseVal.valueAsString = `${size}px`;
      const svgText = new XMLSerializer().serializeToString(svgDocument);
      const svg64 = btoa(svgText);

      return loadImg(DATA_URI_PREFIX + svg64, _size, _size)
        .then(img => {
          ctx.drawImage(img, 0, 0, _size, _size);
          const png = dataURItoBlob(canvas.toDataURL('image/png'));
          saveAs(png, `${patp.slice(1)}-sigil.png`);
          ctx.clearRect(0, 0, _size, _size);
        })
        .catch(() => 'Error generating sigil')
        .then(r => {
          cleanupCanvas(canvasRef.current);
          return r;
        });
    },
    [canvasRef]
  );
  return { downloadSigil };
}
