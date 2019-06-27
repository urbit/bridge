import React, { useState, useRef } from 'react';

import useInterval from 'lib/useInterval';

// TODO: make these characters display as the same width
export const kLoadingCharacter = '▓';
export const kInterstitialCharacter = '░';
const BLINK_AFTER_MS = 2500; // ms

export const matchBlinky = obj =>
  obj.matchWith({
    Nothing: () => <Blinky delayed />,
    Just: p => p.value,
  });

export default function Blinky({
  a = kLoadingCharacter,
  b = kInterstitialCharacter,
  delayed = false,
}) {
  const [value, setValue] = useState(true);
  const now = useRef(new Date());

  useInterval(() => {
    // only start blinking if we've elapsed enough time and want to delay
    if (!delayed || new Date() - now.current > BLINK_AFTER_MS) {
      setValue(val => !val);
    }
  }, 1000);

  return value ? a : b;
}
