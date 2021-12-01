import { Badge, TextProps } from '@tlon/indigo-react';
import { useCallback } from 'react';
import { useForm } from 'react-final-form';

interface PatpBadgeProps {
  children?: React.ReactNode;
  className?: string;
  rest?: TextProps;
}

export const PatpBadge = ({ children, className, ...rest }: PatpBadgeProps) => {
  const { change, focus } = useForm();

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      const patp = event.currentTarget.innerText;
      focus('point');
      change('point', patp);
    },
    [change, focus]
  );

  return (
    <Badge onClick={onClick} {...rest} className={className}>
      {children}
    </Badge>
  );
};
