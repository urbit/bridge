import { Box } from '@tlon/indigo-react';
import { Grid, Text } from 'indigo-react';
import HeaderButton from 'components/L2/Headers/HeaderButton';
import { useHistory } from 'store/history';
import Window from 'components/L2/Window/Window';
import BodyPane from 'components/L2/Window/BodyPane';

import './ActivateView.scss';

interface ActivateViewProps {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode | string;
  footer?: React.ReactNode;
  gridRows?: string;
  gridAreas?: string;
  hideBack?: boolean;
  onBack?: () => void;
}

export default function ActivateView({
  className,
  children,
  header,
  footer,
  gridRows,
  gridAreas,
  onBack,
  hideBack = false,
}: ActivateViewProps) {
  const { pop }: any = useHistory();

  return (
    <Grid>
      <Grid.Item
        full
        as={Text}
        className="flex justify-center mt9 mb7 w-max-mobile">
        <Grid.Item as={Text}>Bridge /&nbsp;</Grid.Item>
        <Grid.Item className="fw-bold" as={Text}>
          Activate
        </Grid.Item>
      </Grid.Item>
      <Grid.Item>
        {!hideBack && (
          <HeaderButton
            className="mb4"
            icon="ChevronWest"
            onClick={onBack || (() => pop())}
          />
        )}
        <Window className="activate-view">
          <BodyPane>
            <Box className="w-full" gridArea="header">
              {header}
            </Box>
            <Box className="w-full" gridArea="content">
              {children}
            </Box>
            <Box className="w-full" gridArea="footer">
              {footer ? (
                <Box
                  className="h-full flex-col"
                  flexWrap="nowrap"
                  justifyContent="flex-end">
                  {footer}
                </Box>
              ) : null}
            </Box>
          </BodyPane>
        </Window>
      </Grid.Item>
    </Grid>
  );
}
