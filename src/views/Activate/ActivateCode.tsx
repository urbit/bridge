import { useCallback } from 'react';

import View from 'components/View';
import ActivateView from './ActivateView';

import { useLocalRouter } from 'lib/LocalRouter';
import useImpliedTicket from 'lib/useImpliedTicket';
import useHasDisclaimed from 'lib/useHasDisclaimed';

import { ReactComponent as PlaceholderSigil } from 'assets/blank-planet-sigil.svg';
import { FadeablePointPresenter as PointPresenter } from './PointPresenter';
import { Box } from '@tlon/indigo-react';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateCodeForm as ActivateCodeForm } from './ActivateCodeForm';
import useFadeIn from './useFadeIn';

export default function ActivateCode() {
  const { names, push }: any = useLocalRouter();
  const { impliedPatp, impliedTicket } = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();

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
        hideBack={Boolean(impliedTicket)}
        header={<ActivateHeader content={'Planet Code'} />}
        footer={<ActivateCodeForm afterSubmit={goToMasterKey} />}>
        <Box className="flex-col align-center justify-center w-full h-full">
          {!impliedTicket && (
            <Box className="mb2 sans gray5" fontSize={14}>
              Enter your planet code below
            </Box>
          )}
          {impliedPatp ? (
            <PointPresenter patp={impliedPatp} />
          ) : (
            <PlaceholderSigil className="mt9 mb8" />
          )}
        </Box>
      </ActivateView>
    </View>
  );
}
