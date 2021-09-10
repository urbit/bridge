import { Box, Button } from '@tlon/indigo-react';
import { MouseEventHandler } from 'react';
import withFadeable from './withFadeable';

interface ActivateButtonProps {
  children: React.ReactNode | string;
  onClick: MouseEventHandler;
  disabled?: boolean;
}

const ActivateButton = ({
  children,
  onClick,
  disabled,
  ...rest
}: ActivateButtonProps & React.ComponentPropsWithoutRef<'button'>) => {
  return (
    <Button
      onClick={onClick}
      backgroundColor={disabled ? 'rgba(0,0,0,0.2)' : 'black'}
      color={'white'}
      padding={'16px'}
      fontFamily="Inter"
      height={'50px'}
      fontWeight={'400'}
      fontSize={'18px'}
      {...rest}>
      {children}
    </Button>
  );
};

export default ActivateButton;

export const FadeableActivateButton = withFadeable(ActivateButton);
