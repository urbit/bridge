import { Box, Button } from '@tlon/indigo-react';
import { MouseEventHandler } from 'react';
import withFadeable from './withFadeable';

interface ActivateButtonProps {
  children: React.ReactNode | string;
  onClick: MouseEventHandler;
  disabled?: boolean;
  success?: boolean;
}

const ActivateButton = ({
  children,
  onClick,
  disabled = false,
  success = false,
  ...rest
}: ActivateButtonProps & React.ComponentPropsWithoutRef<'button'>) => {
  const backgroundColor = success ? '#009F65' : 'black';

  return (
    <Button
      onClick={onClick}
      backgroundColor={backgroundColor}
      color={'white'}
      padding={'16px'}
      fontFamily="Inter"
      height={'50px'}
      fontWeight={'400'}
      fontSize={'18px'}
      disabled={disabled}
      opacity={disabled ? 0.2 : 1.0}
      {...rest}>
      {children}
    </Button>
  );
};

export default ActivateButton;

export const FadeableActivateButton = withFadeable(ActivateButton);
