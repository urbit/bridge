import React, { useCallback, useEffect, useState } from 'react';
import { Box, Row, Icon, StatelessTextInput } from '@tlon/indigo-react';
import { DEFAULT_GAS_PRICE_GWEI } from 'lib/constants';
import useGasPrice from 'lib/useGasPrice';

import Dropdown from './Dropdown';
import './FeeDropdown.scss';
import { defaultGasValues } from 'lib/getSuggestedGasPrice';

const PRICE_LABELS = ['Fast', 'Normal', 'Slow'];

export interface GasPriceData {
  price: number;
  wait: string;
  maxFeePerGas: string; // hex
  maxPriorityFeePerGas: number;
  suggestedBaseFeePerGas: number;
}

// Convert seconds to minutes prettily
export const formatWait = (wait: number) => Math.round((wait * 100) / 60) / 100;
export const formatDisplay = ({ price, wait }: GasPriceData) =>
  `${price} gwei (${wait} min)`;

export default function FeeDropdown({
  setGasPrice,
}: {
  setGasPrice: (g: GasPriceData) => void;
}) {
  const { suggestedGasPrices }: { suggestedGasPrices: {
    fast: GasPriceData,
    average: GasPriceData,
    low: GasPriceData,
  }} = useGasPrice(DEFAULT_GAS_PRICE_GWEI);

  const [open, setOpen] = useState(false);
  const [useCustom, setUseCustom] = useState(false);
  const [custom, setCustom] = useState<string | undefined>();
  const [selected, setSelected] = useState<GasPriceData>(
    suggestedGasPrices.average
  );

  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanedValue = e.target.value.replace(/[^0-9]/g, '');
    const cleanedNum = Number(cleanedValue);
    setCustom(cleanedValue);
    setGasPrice(defaultGasValues(cleanedNum).average);

    let customWait = 'Unknown';

    const { fast, average, low } = suggestedGasPrices;

    if (cleanedNum < low.price) {
      customWait = `> ${low.wait}`;
    } else if (cleanedNum < average.price) {
      customWait = `~${low.wait}`;
    } else if (cleanedNum < fast.price) {
      customWait = `~${average.wait}`;
    } else {
      customWait = `< ${fast.wait}`;
    }

    setSelected({ 
      price: cleanedNum,
      wait: customWait,
      maxFeePerGas: cleanedNum,
      maxPriorityFeePerGas: cleanedNum,
      suggestedBaseFeePerGas: cleanedNum
    });
  };

  useEffect(() => {
    setSelected(suggestedGasPrices.average);
  }, [suggestedGasPrices]);

  const selectPrice = useCallback(
    (value: GasPriceData) => () => {
      setSelected(value);
      setGasPrice(value);
      setOpen(false);
    },
    [setGasPrice, setSelected, setOpen]
  );

  if (useCustom) {
    return (
      <Row className="fee-dropdown custom">
        <StatelessTextInput
          value={custom}
          className="custom-input"
          placeholder="Custom gwei"
          onChange={handleCustom}
          autoFocus
        />
        <Icon
          icon="ChevronSouth"
          onClick={() => {
            setOpen(true);
            setUseCustom(false);
            setCustom('');
          }}
        />
      </Row>
    );
  }

  return (
    <Dropdown
      className="fee-dropdown"
      open={open}
      value={formatDisplay(selected)}
      toggleOpen={() => setOpen(!open)}>
      <Box className="prices">
        {Object.values(suggestedGasPrices).map(
          (value: GasPriceData, ind: number) => (
            <Row
              className="price"
              onClick={selectPrice(value)}
              key={`gas-price-${ind}`}>
              <Box className="speed">{PRICE_LABELS[ind]}</Box>
              <Box className="time">{formatDisplay(value)}</Box>
            </Row>
          )
        )}
        <Row className="price" onClick={() => setUseCustom(true)}>
          <Box className="time">Custom...</Box>
        </Row>
      </Box>
    </Dropdown>
  );
}
