import { Box } from '@tlon/indigo-react';

interface AddressRowProps {
  address: string;
}

export const AddressRow = ({ address }: AddressRowProps) => {
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
