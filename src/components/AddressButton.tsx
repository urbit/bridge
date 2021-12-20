import * as need from 'lib/need';
import { Button, ButtonProps } from '@tlon/indigo-react';
import { useCallback } from 'react';
import { useForm } from 'react-final-form';
import { useWallet } from 'store/wallet';

interface AddressButtonProps {
  inputName: string;
  children?: React.ReactNode;
  rest?: ButtonProps;
}

export const AddressButton = ({
  inputName,
  children,
  ...rest
}: AddressButtonProps) => {
  const { change, focus } = useForm();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      change(inputName, address);
      focus(inputName);
    },
    [address, change, focus, inputName]
  );

  return (
    <Button onClick={onClick} {...rest} className={'secondary'} type="button">
      {children}
    </Button>
  );
};
