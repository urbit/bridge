import React, { useState } from 'react';
import { Text, Box, Checkbox, Icon, Row } from '@tlon/indigo-react';
import './AdvancedOptions.scss';
import styled from 'styled-components';

interface AdvancedOptionsProps {
  options: {
    selected: boolean;
    key: string;
    label: string;
    onClick: () => void;
  }[];
}

// Hide this input completely
const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  margin: 0px;
`;

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
                  <HiddenInput
                    checked={option.selected}
                    name={option.key}
                    id={option.key}
                    type="checkbox"
                    readOnly
                  />
                  <Checkbox
                    className={`checkbox ${option.selected ? 'checked' : ''}`}
                    {...option}
                    height="16px"
                    width="16px"
                  />
                  <Box className="text">
                    <Text style={{ fontSize: '14px' }}>{option.label}</Text>
                  </Box>
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
