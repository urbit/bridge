import { Box, Text } from '@tlon/indigo-react';
import { stripSigPrefix } from 'form/formatters';
import useImpliedTicket from 'lib/useImpliedTicket';
import { useMemo } from 'react';
import withFadeable from './withFadeable';

type MasterKeyPresenterArgs = {
  className?: string;
};

const MasterKeyPresenter = ({ className }: MasterKeyPresenterArgs) => {
  // TODO: use actual MK ticket :)
  const { impliedTicket } = useImpliedTicket();

  const ticketSegments = useMemo(() => {
    return impliedTicket ? stripSigPrefix(impliedTicket).split('-') : null;
  }, [impliedTicket]);

  return (
    <Box
      display={'flex'}
      flexDirection={'row'}
      flexWrap={'nowrap'}
      width={'80%'}
      height={'min-content'}
      justifyContent={'space-evenly'}
      className={className}>
      {ticketSegments &&
        ticketSegments.map((segment: string, i: number) => {
          return (
            <>
              <Box
                background={'rgba(0,0,0,0.05)'}
                padding={'12px 10px'}
                fontFamily={'Source Code Pro'}
                borderRadius={'5px'}
                border={'solid 1px gray'}>
                {segment}
              </Box>
              {i < ticketSegments.length - 1 ? (
                <Text key={i} alignSelf="center" color="gray" mx={1}>
                  —
                </Text>
              ) : null}
            </>
          );
        })}
    </Box>
  );
};

export default MasterKeyPresenter;

export const FadeableMasterKeyPresenter = withFadeable(MasterKeyPresenter);
