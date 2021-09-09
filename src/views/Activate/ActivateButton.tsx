import { Box, Button } from '@tlon/indigo-react';
import { MouseEventHandler } from 'react';
import withFadeable from './withFadeable';

interface ActivateButtonProps {
  children: React.ReactNode | string;
  onClick: MouseEventHandler;
  success?: boolean;
}

const ActivateButton = ({
  children,
  onClick,
  success,
}: ActivateButtonProps & React.ComponentPropsWithoutRef<'button'>) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      flexWrap="nowrap"
      height={'100%'}
      justifyContent="flex-end">
      <Button
        onClick={onClick}
        backgroundColor={success ? 'rgb(70,156,106)' : 'black'}
        color={'white'}
        padding={'16px'}
        fontFamily="Inter"
        height={'50px'}
        fontWeight={'400'}
        fontSize={'18px'}>
        {children}
      </Button>
    </Box>
  );
};

export default ActivateButton;

export const FadeableActivateButton = withFadeable(ActivateButton);
