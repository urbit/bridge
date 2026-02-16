import { Box } from '@tlon/indigo-react';
import { Grid } from 'indigo-react';
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
      <Grid.Item className="mt10">
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
        <div className="activation-qualifier">
          <div className="activation-note"> Planet activation codes will give you a self-custody <a className="linkout" href="https://docs.urbit.org/user-manual/id/layer-2-for-planets">Layer 2 Urbit 'planet'↗</a> and a Master Ticket wallet.
          </div>
          <div className="activation-note">
            This is a legacy feature not actively maintained in Bridge, if you run into issues we recommend you either: <br></br>
            <ol>
              <li>
                <a className="linkout" href="https://join.tlon.io/0v3.r87kb.fjpft.3k7b5.pbsr5.5em17">Claim a free Layer 2 planet from Tlon↗</a>
              </li>
              <br></br>
              <li>
                <a className="linkout" href="https://docs.urbit.org/user-manual/id/get-id#l1-planet-markets">Buy a Layer 1 identity on Ethereum↗</a>
              </li>
            </ol>
          </div>
        </div>
      </Grid.Item>
    </Grid>
  );
}
