import { useCallback, useEffect } from 'react';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import ActivateView from './ActivateView';

import { useHistory } from 'store/history';

import { ROUTE_NAMES } from 'lib/routeNames';
import { useLocalRouter } from 'lib/LocalRouter';
import useImpliedTicket from 'lib/useImpliedTicket';
import useHasDisclaimed from 'lib/useHasDisclaimed';

import { useActivateFlow } from './ActivateFlow';
import PointPresenter from './PointPresenter';
import { Box, Text } from '@tlon/indigo-react';
import ActivateHeader from './ActivateHeader';
import ActivateCodeForm from './ActivateCodeForm';

export default function ActivateCode() {
  const history = useHistory();
  const { names, push } = useLocalRouter();
  const { impliedPatp, impliedTicket } = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();
  const { isIn, setIsIn } = useActivateFlow();

  const goToLogin = useCallback(() => history.popAndPush(ROUTE_NAMES.LOGIN), [
    history,
  ]);

  const goToMasterKey = useCallback(() => {
    if (!hasDisclaimed) {
      push(names.DISCLAIMER, { next: names.MASTER_KEY });
    } else {
      push(names.MASTER_KEY);
    }
  }, [hasDisclaimed, names.DISCLAIMER, names.MASTER_KEY, push]);

  // Fade in on load
  useEffect(() => {
    setIsIn(true);
  }, [setIsIn]);

  return (
    <View inset>
      <ActivateView
        header={
          <ActivateHeader copy={'Welcome. This is your Urbit.'} isIn={isIn} />
        }
        footer={<ActivateCodeForm afterSubmit={goToMasterKey} />}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'center'}>
          {!impliedTicket && (
            <Text className="mb2">Enter your activation code to continue.</Text>
          )}
          {impliedPatp && <PointPresenter patp={impliedPatp} isIn={isIn} />}
        </Box>
      </ActivateView>

      <FooterButton as={ForwardButton} onClick={goToLogin}>
        Login
      </FooterButton>
    </View>
  );
}
