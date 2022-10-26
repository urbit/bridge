import React from 'react';

/**
 * A very useful Flutter widget reimplemented with
 * the world's dumbest css hack.
 *
 * Simply: container div with appropriate relative padding,
 * then absolutely pin the child.
 *
 * via: https://www.w3schools.com/howto/howto_css_aspect_ratio.asp
 */
export default function AspectRatio({ aspectRatio = 1, children }) {
  const percent = `${(1 / aspectRatio) * 100}%`;

  return (
    <div className="rel" style={{ paddingTop: percent }}>
      <div className="abs" style={{ top: 0, bottom: 0, left: 0, right: 0 }}>
        {children}
      </div>
    </div>
  );
}
