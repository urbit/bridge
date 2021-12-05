import * as need from 'lib/need';
import { Button, ButtonProps } from '@tlon/indigo-react';
import { useCallback } from 'react';
import { useForm } from 'react-final-form';
import { useWallet } from 'store/wallet';

interface AddressButtonProps {
  children?: React.ReactNode;
  rest?: ButtonProps;
}

export const AddressButton = ({ children, ...rest }: AddressButtonProps) => {
  const { change } = useForm();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);

  const onClick = useCallback(
    (_event: React.MouseEvent<HTMLSpanElement>) => {
      change('owner', address);
    },
    [address, change]
  );

  return (
    <Button onClick={onClick} {...rest} className={'secondary'} type="button">
      {children}
    </Button>
  );
};
