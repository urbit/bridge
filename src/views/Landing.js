import React from 'react'
import { Button } from '../components/Base'
import { Row, Col } from '../components/Base'
import { H1, P } from '../components/Base'

import { ROUTE_NAMES } from '../lib/router'

const Landing = (props) =>
    <Row>
      <Col>
        <H1>{ 'Welcome' }</H1>


        <P>
        { 'Bridge is a tool for managing and viewing assets on ' +
          'Azimuth, the Urbit address space.' }
        </P>



        <Button
          prop-type='link'
          prop-size='lg'
          className={'mb-4 mt-8'}
          onClick={ () => props.pushRoute(ROUTE_NAMES.NETWORK) }
        >
          { 'Unlock a Wallet  →' }
        </Button>

        <P>
        { "If you own Azimuth assets and want to manage them in some " +
          "way, start here.  You'll need either your Urbit ticket or a " +
          "keypair." }
        </P>

        {
        //  FIXME add address view
        //  <LinkButton
        //    size={'l'}
        //    className={'mb-4 mt-10'}
        //    onClick={ () => props.pushRoute(ROUTE_NAMES.NETWORK) }
        //  >
        //    { 'View an Address  →' }
        //  </LinkButton>

        //  <p>
        //  { "Lorem" }
        //  </p>
        }
      </Col>
    </Row>

export default Landing
