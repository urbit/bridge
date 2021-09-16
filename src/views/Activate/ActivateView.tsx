import { Box } from '@tlon/indigo-react';
import cn from 'classnames';

interface ActivateViewProps {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode | string;
  footer?: React.ReactNode;
  gridRows?: string;
  gridAreas?: string;
}

export default function ActivateView({
  className,
  children,
  header,
  footer,
  gridRows,
  gridAreas,
}: ActivateViewProps) {
  return (
    <>
      <Box
        display="grid"
        gridTemplateColumns="1fr"
        gridTemplateRows={gridRows || '20% 60% 20%'}
        gridTemplateAreas={gridAreas || "'header' 'content' 'footer'"}
        border={'1px solid rgb(204, 204, 204)'}
        border-radius={'5px'}
        padding={'10px'}
        width={'512px'}
        height={'512px'}
        max-width={'512px'}
        max-height={'512px'}
        className={cn(className)}
        mb={3}>
        <Box gridArea="header">{header}</Box>
        <Box gridArea="content">{children}</Box>
        <Box gridArea="footer">
          {footer ? (
            <Box
              display="flex"
              flexDirection="column"
              flexWrap="nowrap"
              height={'100%'}
              justifyContent="flex-end">
              {footer}
            </Box>
          ) : null}
        </Box>
      </Box>
    </>
  );
}
