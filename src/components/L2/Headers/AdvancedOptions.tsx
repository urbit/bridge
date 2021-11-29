import React, { useState } from 'react';
import { Box, Checkbox, Icon, Row } from '@tlon/indigo-react';
import './AdvancedOptions.scss';

interface AdvancedOptionsProps {
  options: {
    selected: boolean;
    key: string;
    label: string;
    onClick: () => void;
  }[];
}

export default function AdvancedOptions({ options }: AdvancedOptionsProps) {
  const showingAny = options.reduce(
    (anySelected, { selected }) => anySelected || selected,
    false
  );
  const [show, setShow] = useState(false);
  const toggleShow = () => setShow(!show);

  return (
    <Box className="advanced-options">
      <Icon
        className="toggle"
        icon="Gear"
        onClick={toggleShow}
        color={show || showingAny ? 'rgba(33, 157, 255, 1)' : 'black'}
      />
      {show && (
        <>
          <Box className="options-border">
            <Box className="options">
              {options.map((option, ind) => (
                <Row className="option" key={`adv-opt-${ind}`}>
                  <Checkbox
                    className={`checkbox ${option.selected ? 'checked' : ''}`}
                    {...option}
                    height="16px"
                    width="16px"
                  />
                  <Box className="text">{option.label}</Box>
                </Row>
              ))}
            </Box>
          </Box>
          <Box className="close-background" onClick={() => setShow(false)} />
        </>
      )}
    </Box>
  );
}
