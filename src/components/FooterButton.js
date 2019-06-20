import React from 'react';
import { Grid, Button } from 'indigo-react';

import Footer from './Footer';

export default function FooterButton(props) {
  return (
    <Footer>
      <Grid className="pt2">
        <Grid.Divider />
        <Grid.Item full>
          <Button {...props} />
        </Grid.Item>
      </Grid>
    </Footer>
  );
}
