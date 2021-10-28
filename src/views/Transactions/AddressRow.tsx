import { Box } from '@tlon/indigo-react';

export const AddressRow = ({ address }) => {
  return (
    <>
      <Box className="address-row">
        <Box className="icon"></Box>
        <Box className="info">
          <Box className="address">{address}</Box>
        </Box>
      </Box>
    </>
  );
};
