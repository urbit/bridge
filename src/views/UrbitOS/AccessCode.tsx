import { CopyButtonWide } from 'components/CopyButtonWide';
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
        text={code}
        data-testid="access-code"
        // Allow the Copy Button Tooltip to flow over the Grid border
        style={{ overflow: 'unset' }}>
        Access Key
      </Grid.Item>
    </>
  ) : null;
};

export default AccessCode;
