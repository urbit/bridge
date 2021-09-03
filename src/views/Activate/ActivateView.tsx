import { Box } from '@tlon/indigo-react';
import cn from 'classnames';

// import Steps from 'components/Steps';
type ActivateViewProps = {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode | string;
  footer?: React.ReactNode;
  step?: number | null;
};

export default function ActivateView({
  className,
  children,
  header,
  footer,
  step = null,
}: ActivateViewProps) {
  return (
    <>
      <Box
        display="grid"
        gridTemplateColumns="1fr"
        gridTemplateRows="20% 60% 20%"
        gridTemplateAreas={"'header' 'content' 'footer'"}
        className={cn(className, 'activate-view')}>
        <Box gridArea="header">{header}</Box>
        <Box gridArea="content">{children}</Box>
        <Box gridArea="footer">{footer ? footer : null}</Box>
      </Box>
      <Box>{step ? step : null}</Box>
    </>
  );
}
