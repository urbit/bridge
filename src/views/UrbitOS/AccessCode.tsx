import { CopyButtonWide } from 'components/CopyButton';
import { Grid } from 'indigo-react';

type AccessCodeArgs = {
  code: boolean | string;
};

const AccessCode = ({ code }: AccessCodeArgs) => {
  return code ? (
    <>
      <Grid.Divider />
      <Grid.Item
        full
        detail="This is your code to access Urbit OS"
        as={CopyButtonWide}
        text={code}>
        Access Key
      </Grid.Item>
    </>
  ) : null;
};

export default AccessCode;
