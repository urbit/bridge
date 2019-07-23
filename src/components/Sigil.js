import { sigil, reactRenderer } from 'urbit-sigil-js';

export default function Sigil({ patp, size, colors, ...rest }) {
  return sigil({
    patp,
    renderer: reactRenderer,
    size,
    colors,
    ...rest,
  });
}
