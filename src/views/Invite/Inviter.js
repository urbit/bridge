import React, { useState, useCallback } from 'react';
import { Grid } from 'indigo-react';

import { useConditionalBlockWindowClose } from 'lib/useBlockWindowClose';

import Tabs from 'components/Tabs';

import InviteMail from 'views/Invite/Email';
import InviteUrl from 'views/Invite/Url';

const Inviter = () => {
  const [tab, setTab] = useState(NAMES.MAIL);
  const [submitting, setSubmitting] = useState(false);

  useConditionalBlockWindowClose(submitting);
  const onTabChange = useCallback(
    newTab => {
      if (!submitting) {
        setTab(newTab);
      }
    },
    [submitting, setTab]
  );
  return (
    <Grid.Item
      full
      as={Tabs}
      center
      className="flex1"
      views={VIEWS}
      options={OPTIONS}
      currentTab={tab}
      onTabChange={onTabChange}
      setSubmitting={setSubmitting}
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

export default Inviter;
