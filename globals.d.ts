declare module "\*.svg" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module "\*.png" {
  import React = require("react");
  export const ReactComponent: React.FC<React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>>>;
  const src: string;
  export default src;
}