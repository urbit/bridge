import Maybe from 'folktale/maybe';
import React from 'react';
import * as ob from 'urbit-ob';

import { Button } from '../components/old/Base';
import { H1, P } from '../components/old/Base';
import { InnerLabel, PointInput, ValidatedSigil } from '../components/old/Base';

import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { compose } from '../lib/lib';
import { withPointCursor } from '../store/pointCursor';
import View from 'components/View';

class ViewPoint extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pointName: '',
    };

    this.handlePointInput = this.handlePointInput.bind(this);
  }

  handlePointInput = pointName => {
    if (pointName.length < 15) {
      this.setState({ pointName });
    }
  };

  render() {
    const { pointName } = this.state;
    const { history, setPointCursor } = this.props;

    // NB (jtobin):
    //
    // could use a better patp parser in urbit-ob
    let valid;
    try {
      valid = ob.isValidPatp(pointName);
    } catch (err) {
      valid = false;
    }

    return (
      <View>
        <H1>{'View a Point'}</H1>

        <P>{'Enter a point name to view its public information.'}</P>

        <PointInput
          autoFocus
          prop-size="lg"
          prop-format="innerLabel"
          className="mono"
          placeholder="e.g. ~zod"
          onChange={this.handlePointInput}
          value={pointName}>
          <InnerLabel>{'Point Name'}</InnerLabel>
          <ValidatedSigil
            className={'tr-0 mt-05 mr-0 abs'}
            patp={pointName}
            show
            size={68}
            margin={8}
          />
        </PointInput>

        <Button
          className={'mt-8'}
          disabled={valid === false}
          onClick={() => {
            setPointCursor(Maybe.Just(parseInt(ob.patp2dec(pointName), 10)));
            // ^ pointCursor expects native number type, not string
            history.popAndPush(ROUTE_NAMES.SHIP);
          }}>
          {'Continue  →'}
        </Button>
      </View>
    );
  }
}

export default compose(
  withHistory,
  withPointCursor
)(ViewPoint);
