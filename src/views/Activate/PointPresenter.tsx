import { Box, Text } from '@tlon/indigo-react';
import { CSSTransition } from 'react-transition-group';
import Sigil from 'components/Sigil';

type PointPresenterArgs = {
  patp: string;
  isIn: boolean;
  className?: string;
};

const PointPresenter = ({
  patp,
  isIn = false,
  className,
}: PointPresenterArgs) => {
  return patp ? (
    <>
      <CSSTransition in={isIn} classNames="fadeable" timeout={300}>
        <Box
          width={256}
          height={256}
          display="flex"
          flexDirection="column"
          flexWrap="nowrap"
          justifyContent="center"
          alignItems="center"
          background="white"
          className={className}>
          <Box
            background="black"
            borderRadius={5}
            padding={32}
            mb={3}
            width={64}
            height={64}>
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
          <Box>
            <Text
              display="block"
              fontFamily={'Source Code Pro'}
              fontSize={'18px'}
              textAlign={'center'}>
              {patp}
            </Text>
          </Box>
        </Box>
      </CSSTransition>
    </>
  ) : null;
};

export default PointPresenter;
