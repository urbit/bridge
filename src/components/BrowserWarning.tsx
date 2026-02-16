import React from 'react';
import { Box } from '@tlon/indigo-react';
import styled from 'styled-components';

const WarningBox = styled(Box)`
  background: #fff4e5;
  color: #663c00;
  border: 1px solid #ffb74d;
  padding: 0.75rem 1rem;
  text-align: center;
  font-weight: 600;
  margin-bottom: 1rem;
`;

interface Props {
  show: boolean;
}
export const BrowserWarning: React.FC<Props> = ({ show }) => {
  if (!show) return null;
  return (
    <WarningBox role="alert">
      For the best experience we recommend using a Chromium‑based browser
      (Chrome, Brave, etc.).
    </WarningBox>
  );
};

