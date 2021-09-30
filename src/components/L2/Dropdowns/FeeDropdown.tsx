import React, { useCallback, useEffect, useState } from 'react';
import { Box, Row } from '@tlon/indigo-react';
import { DEFAULT_GAS_PRICE_GWEI } from 'lib/constants';
import useGasPrice from 'lib/useGasPrice';

import Dropdown from './Dropdown';
import './FeeDropdown.scss';

const PRICE_LABELS = ['Fast', 'Average', 'Slow'];

export interface GasPrice {
  price: number;
  wait: number;
}

const formatPriceWait = ({ price, wait }: GasPrice) =>
  `${price} gwei (${Math.round(wait * 100) / 100} min)`;

const FeeDropdown = ({ setGasPrice }: { setGasPrice: (g: number) => void }) => {
  const { suggestedGasPrices } = useGasPrice(DEFAULT_GAS_PRICE_GWEI);

  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<GasPrice>(
    suggestedGasPrices.average
  );

  useEffect(() => {
    setSelected(suggestedGasPrices.average);
  }, [suggestedGasPrices]);

  const selectPrice = useCallback(
    (value: GasPrice) => () => {
      setSelected(value);
      setGasPrice(value.price);
      setOpen(false);
    },
    [setGasPrice, setSelected, setOpen]
  );

  return (
    <Dropdown
      className="fee-dropdown"
      open={open}
      value={formatPriceWait(selected)}
      toggleOpen={() => setOpen(!open)}>
      <Box className="prices">
        {Object.values(suggestedGasPrices).map(
          (value: GasPrice, ind: number) => (
            <Row
              className="price"
              onClick={selectPrice(value)}
              key={value.wait}>
              {PRICE_LABELS[ind]}: {formatPriceWait(value)}
            </Row>
          )
        )}
      </Box>
    </Dropdown>
  );
};

export default FeeDropdown;
