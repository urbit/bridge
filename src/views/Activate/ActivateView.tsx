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
        border={'1px solid rgb(204, 204, 204)'}
        border-radius={'5px'}
        padding={'10px'}
        width={'550px'}
        height={'550px'}
        max-width={'550px'}
        max-height={'550px'}
        className={cn(className)}
        mb={3}>
        <Box gridArea="header">{header}</Box>
        <Box gridArea="content">{children}</Box>
        <Box gridArea="footer">{footer ? footer : null}</Box>
      </Box>
      <Box>{step ? step : null}</Box>
    </>
  );
}
