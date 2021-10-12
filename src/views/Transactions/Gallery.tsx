import { Box, Icon } from '@tlon/indigo-react';
import { _iconIndex as iconIndex } from '@tlon/indigo-react';

export const Gallery = () => {
  const iconNames = Object.keys(iconIndex);
  return (
    <>
      {iconNames.map(name => {
        return (
          <>
            <Box padding={'5px'} marginBottom={'5px'} border={'solid 1px rgba(0,0,0,0.5)'}>
              {name}
              <Icon icon={name} height={'16px'} width={'16px'} />
            </Box>
          </>
        );
      })}
    </>
  );
};
