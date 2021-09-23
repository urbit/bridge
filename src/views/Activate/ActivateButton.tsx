import { Button } from '@tlon/indigo-react';
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
  const backgroundColor = disabled
    ? 'rgba(0,0,0,0.2)'
    : success
    ? '#009F65'
    : 'black';

  return (
    <Button
      onClick={onClick}
      backgroundColor={backgroundColor}
      color={'white'}
      padding={'16px'}
      fontFamily="Inter"
      height={'40px'}
      fontWeight={'400'}
      fontSize={'14px'}
      borderRadius={'4px'}
      disabled={disabled}
      {...rest}>
      {children}
    </Button>
  );
};

export default ActivateButton;

export const FadeableActivateButton = withFadeable(ActivateButton);
