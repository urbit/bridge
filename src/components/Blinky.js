import React, { useState, useRef } from 'react';
import { times } from 'lodash';

import useInterval from 'lib/useInterval';
import { formatDots } from 'lib/dateFormat';

// TODO: make these characters display as the same width
export const LOADING_CHARACTER = '▓';
export const INTERSTITIAL_CHARACTER = '░';
const BLINK_AFTER_MS = 2500; // ms

const buildDate = char =>
  [4, 2, 2].map(t => times(t, () => char).join('')).join('.');
const DATE_A = buildDate(LOADING_CHARACTER);
const DATE_B = buildDate(INTERSTITIAL_CHARACTER);

export const matchBlinky = obj =>
  obj.matchWith({
    Nothing: () => <Blinky delayed />,
    Just: p => p.value,
  });

export const matchBlinkyDate = obj =>
  obj.matchWith({
    Nothing: () => <Blinky a={DATE_A} b={DATE_B} delayed />,
    Just: p => formatDots(p.value),
  });

export const blinkIf = (test, right) => (test ? <Blinky /> : right);

export default function Blinky({
  a = LOADING_CHARACTER,
  b = INTERSTITIAL_CHARACTER,
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

  return <span className="arial">{value ? a : b}</span>;
}
