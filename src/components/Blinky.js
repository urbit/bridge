import React, { useState } from 'react';

import useInterval from 'lib/useInterval';

export const kLoadingCharacter = '▓';
export const kInterstitialCharacter = '░';

export const matchBlinky = obj =>
  obj.matchWith({
    Nothing: () => <Blinky />,
    Just: p => p.value,
  });

export default function Blinky({
  a = kLoadingCharacter,
  b = kInterstitialCharacter,
}) {
  const [value, setValue] = useState(true);
  useInterval(() => setValue(val => !val), 1000);

  return value ? a : b;
}
