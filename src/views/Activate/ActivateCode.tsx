import { useCallback } from 'react';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import ActivateView from './ActivateView';

import { useHistory } from 'store/history';

import { ROUTE_NAMES } from 'lib/routeNames';
import { useLocalRouter } from 'lib/LocalRouter';
import useImpliedTicket from 'lib/useImpliedTicket';
import useHasDisclaimed from 'lib/useHasDisclaimed';

import { FadeablePointPresenter as PointPresenter } from './PointPresenter';
import { Box, Text } from '@tlon/indigo-react';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateCodeForm as ActivateCodeForm } from './ActivateCodeForm';
import useFadeIn from './useFadeIn';

export default function ActivateCode() {
  const history = useHistory();
  const { names, push } = useLocalRouter();
  const { impliedPatp, impliedTicket } = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();

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
  useFadeIn();

  return (
    <View inset>
      <ActivateView
        header={<ActivateHeader content={'Welcome. This is your Urbit.'} />}
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
          {impliedPatp && <PointPresenter patp={impliedPatp} />}
        </Box>
      </ActivateView>

      <FooterButton as={ForwardButton} onClick={goToLogin}>
        Login
      </FooterButton>
    </View>
  );
}
