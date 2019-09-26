export const initCanvas = (canvas, size) => {
  const { x, y } = size;
  const ctx = canvas.getContext('2d');

  let ratio = window.devicePixelRatio || 1;

  canvas.width = x * ratio;
  canvas.height = y * ratio;
  canvas.style.width = x + 'px';
  canvas.style.height = y + 'px';

  ctx.scale(ratio, ratio);

  return canvas;
};

export const loadImg = src =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(`Error loading image. src: ${src}`);
    img.src = src;
  });

export const dataURItoBlob = dataURI => {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs
  const byteString = atob(dataURI.split(',')[1]);
  // separate out the mime component
  const mimeString = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0];
  // write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  // create a view into the buffer
  let ia = new Uint8Array(ab);
  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  // write the ArrayBuffer to a blob, and you're done
  const blob = new Blob([ab], { type: mimeString });
  return blob;
};
