import React, { useRef, useState, useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Flex } from 'indigo-react';

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
  }, []);

  return (
    <Flex col className={className}>
      <canvas ref={ref} style={{ display: 'none ' }} />
      {!supported.getOrElse(true) && (
        <>
          <Flex.Item as={WarningBox} className="mb4">
            Something is blocking your web browser from rendering your wallets.
            Please turn off any anti-fingerprinting extensions and try again.
            <br />
            <br />
            Brave users: Please set the device recognition setting in the brave
            shield menu to "Cross-site device recognition blocked"
            <br />
            <br />
            Firefox users: Please click on the icon of an image in your URL bar
            and allow bridge.urbit.org to use your HTML5 canvas image data
          </Flex.Item>
          <Flex.Item
            as={RestartButton}
            solid
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
