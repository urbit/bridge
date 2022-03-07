import { Anchor, BaseButton, Box, Col, Text } from '@tlon/indigo-react';
import useLocalStorageState from 'lib/useLocalStorageState';

const L2_VULN_KEY = 'l2vuln-2022-03-07';

export const L2VulnAlert = () => {
  const [showAlert, setShowAlert] = useLocalStorageState(L2_VULN_KEY, true);

  if (!showAlert) {
    return null;
  }

  return (
    <Box
      position="relative"
      p={3}
      mb={3}
      bg="washedBlue"
      borderWidth="1px"
      borderColor="lightBlue"
      borderStyle="solid"
      borderRadius={3}>
      <Col>
        <BaseButton
          position="absolute"
          top="3px"
          right="8px"
          fontSize="18px"
          fontWeight="200"
          cursor="pointer"
          bg="transparent"
          onClick={() => setShowAlert(false)}>
          &#215;
        </BaseButton>
        <Text bold mb={2}>
          ~2022.03.07 - L2 Planet invite fix
        </Text>
        <Text mb={2}>
          Due to an L2 security vulnerability, we strongly recommend you use the
          "Update Invites" button to rekey any L2 planet invites that were
          previously yet to be claimed.
        </Text>
        <Anchor href="https://twitter.com/urbit" target="_blank">
          Learn More About This Issue
        </Anchor>
      </Col>
    </Box>
  );
};
