import React from 'react';
import { Grid, Button } from 'indigo-react';

import Footer from './Footer';

export default function FooterButton({ as: As = Button, ...props }) {
  return (
    <Footer>
      <Grid className="pt2">
        <Grid.Divider />
        <Grid.Item full>
          <As {...props} />
        </Grid.Item>
      </Grid>
    </Footer>
  );
}
