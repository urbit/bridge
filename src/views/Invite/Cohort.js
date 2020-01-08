import React, { useState } from 'react';
import { Grid } from 'indigo-react';

import Tabs from 'components/Tabs';

import InviteMail from 'views/Invite/Email';
import InviteUrl from 'views/Invite/Url';

const InviteCohort = () => {
  const [tab, setTab] = useState(NAMES.MAIL);
  return (
    <Grid.Item
      full
      as={Tabs}
      tabClassName="t-center flex1"
      className="flex1"
      views={VIEWS}
      options={OPTIONS}
      currentTab={tab}
      onTabChange={setTab}
    />
  );
};

const NAMES = {
  MAIL: 'MAIL',
  URL: 'URL',
};

const VIEWS = {
  [NAMES.MAIL]: InviteMail,
  [NAMES.URL]: InviteUrl,
};

const OPTIONS = [
  { text: 'Email', value: NAMES.MAIL },
  { text: 'URL', value: NAMES.URL },
];

export default InviteCohort;
