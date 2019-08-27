import React, { useState, useCallback } from 'react';

export default function WithTooltip({ content, children }) {
  const [isHovered, setHovered] = useState(true);
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <div
      className="rel nowrap inline-block"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      {children}
      {isHovered && (
        <div
          className="abs mb1 bg-black white ph4 pv2 r4"
          style={{ bottom: '100%' }}>
          {content}
        </div>
      )}
    </div>
  );
}
