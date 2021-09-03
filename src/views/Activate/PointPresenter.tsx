import { Box, Text } from '@tlon/indigo-react';
import Sigil from 'components/Sigil';

type PointPresenterArgs = {
  patp: string;
  className?: string;
};

const PointPresenter = ({ patp, className }: PointPresenterArgs) => {
  return patp ? (
    <>
      <Box
        width={128}
        height={128}
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        justifyContent="center"
        alignItems="center"
        background="white"
        padding={32}
        className={className}>
        <Box background="black" borderRadius={5} padding={32}>
          <Sigil
            patp={patp}
            size={64}
            display="block"
            colors={['black', 'white']}
            icon
            padding={32}
            borderRadius={5}
          />
        </Box>
        <Text display="block" className={'mono'}>
          {patp}
        </Text>
      </Box>
    </>
  ) : null;
};

export default PointPresenter;
