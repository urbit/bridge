import React, { useRef } from 'react';
import * as ob from 'urbit-ob';
import { saveAs } from 'file-saver';
import { sigil, stringRenderer } from 'urbit-sigil-js';

import { dataURItoBlob, loadImg, initCanvas } from 'lib/SigilDownloader';

// const attachClickHandler = (children, handler) => Array.isArray(children) ? children.map((Child,key) => (<Child key={key} onClick={handler} />)) : (<children onClick={handler}>);
export default function SigilDownloader({ point, children }) {
  const downloadSigil = () => {
    const patp = ob.patp(point);

    const _size = 1024 / window.devicePixelRatio;
    const pngSize = 1024;

    const DATA_URI_PREFIX = 'data:image/svg+xml;base64,';

    // initialize canvas element
    const canvas = initCanvas(canvasRef.current, { x: _size, y: _size });
    const ctx = canvas.getContext('2d');

    // make sigil svg and encoded into base64
    const svg = sigil({
      patp,
      full: true,
      renderer: stringRenderer,
      size: _size,
      colors: ['#FFFFFF', '#000000'],
      margin: (54 / 256) * _size,
    });

    // FF rendering hack
    const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
    svgDocument.documentElement.width.baseVal.valueAsString = `${pngSize}px`;
    svgDocument.documentElement.height.baseVal.valueAsString = `${pngSize}px`;
    const svgText = new XMLSerializer().serializeToString(svgDocument);
    const svg64 = btoa(svgText);

    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
    saveAs(svgBlob, `${patp}.svg`);

    const pngTask = loadImg(DATA_URI_PREFIX + svg64, _size, _size).then(img => {
      ctx.drawImage(img, 0, 0, _size, _size);
      const png = dataURItoBlob(canvas.toDataURL('image/png'));
      saveAs(png, `${patp}.png`);
      ctx.clearRect(0, 0, pngSize, pngSize);
    });

    return pngTask;
  };
  const canvasRef = useRef(null);

  return (
    <>
      {React.Children.map(children, child =>
        React.cloneElement(child, { onClick: downloadSigil })
      )}
      <canvas style={{ display: 'none' }} ref={canvasRef} />
    </>
  );
}
