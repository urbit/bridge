import { sigil, reactRenderer } from '@tlon/sigil-js';

export default function Sigil({ patp, size, colors, ...rest }) {
  return sigil({
    patp,
    renderer: reactRenderer,
    style: { width: '100%', height: '100%' }, // NOTE: scale to container
    size,
    margin: true,
    colors,
    ...rest,
  });
}
