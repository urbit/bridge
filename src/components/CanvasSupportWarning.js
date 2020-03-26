import React, { useRef, useState, useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Flex, LinkButton, P } from 'indigo-react';
import cn from 'classnames';

import WarningBox from 'components/WarningBox';
import { RestartButton } from './Buttons';

const hasCanvasSupport = canvas => {
  canvas.width = 1;
  canvas.height = 1;
  //  Brave returns an empty string to combat tracking
  const testImage = canvas.toDataURL('image/png');
  if (testImage.length === 0) {
    return true;
  }

  // FF returns a white image
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';

  // so draw a black pixel and look for it
  ctx.fillRect(0, 0, 1, 1);
  const { data } = ctx.getImageData(0, 0, 1, 1);
  // ensure pixel has RBGA(0,0,0,255)
  return data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 255;
};

const cleanupCanvas = canvas => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1, 1);
};
export default function CanvasSupportWarning({
  className,
  warningClassName,
  supported,
  setSupported,
  ...rest
}) {
  const ref = useRef();

  useEffect(() => {
    setSupported(Just(hasCanvasSupport(ref.current)));

    return () => {
      cleanupCanvas(ref.current);
    };
  }, [setSupported]);

  return (
    <Flex col className={className}>
      <canvas ref={ref} style={{ display: 'none ' }} />
      {!supported.getOrElse(true) && (
        <>
          <Flex.Item as={WarningBox} className={cn(warningClassName, 'f6 mb4')}>
            Something is blocking your web browser from rendering your wallets.
            <br />
            <LinkButton href="https://urbit.org/using/bridge-troubleshooting">
              Learn More
            </LinkButton>{' '}
          </Flex.Item>
          <Flex.Item
            as={RestartButton}
            solid
            className="mb4"
            onClick={() => {
              setSupported(Just(hasCanvasSupport(ref.current)));
            }}>
            Retry
          </Flex.Item>
        </>
      )}
    </Flex>
  );
}
