import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { azimuth, ecliptic } from 'azimuth-js'
import * as ob from 'urbit-ob'

import { Row, Col, H1, P, Anchor } from '../components/Base'
import { ShowBlockie, ValidatedSigil } from '../components/Base'
import { PointInput, AddressInput, InnerLabel } from '../components/Base'

import StatelessTransaction from '../components/StatelessTransaction'

import { NETWORK_NAMES } from '../lib/network'
import { BRIDGE_ERROR } from '../lib/error'
import { getNthSpawnCandidate } from '../lib/child'
import { canDecodePatp } from '../lib/txn'

import Scramble from 'react-scramble'

import {
  isValidAddress,
} from '../lib/wallet'

const setFind = (set, pred) => {
  for (const e of set) {
    if (pred(e)) {
      return e
    }
  }
  return undefined
}

class IssueChild extends React.Component {
  constructor(props) {
    super(props)

    const issuingPoint = props.pointCursor.matchWith({
      Just: (pt) => parseInt(pt.value, 10),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    const getCandidate = (n) => ob.patp(getNthSpawnCandidate(issuingPoint, n))

    const suggestions = [
      getCandidate(0),
      getCandidate(1),
      getCandidate(2),
      getCandidate(3)
    ]

    this.state = {
      receivingAddress: '',
      issuingPoint: issuingPoint,
      desiredPoint: '',
      isAvailable: Nothing(), // use Nothing to allow attempt when offline
      suggestions: suggestions,
      validChildren: new Set(),
      autoComplete: '',
      scrambleStart: [],
      placeHolderVisible: false
    }

    this.handlePointInput = this.handlePointInput.bind(this)
    this.handleAddressInput = this.handleAddressInput.bind(this)
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this)
    this.statelessRef = React.createRef();
  }

  handleAddressInput = (receivingAddress) => {
    this.setState({ receivingAddress })
    this.statelessRef.current.clearTxn()
  }

  componentWillMount() {

    const { contracts } = this.props
    const { issuingPoint } = this.state


    const validContracts = contracts.matchWith({
      Just: cs => cs.value,
      Nothing: _ => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    azimuth.getUnspawnedChildren(validContracts, issuingPoint).then(ps => {
      const children = ps.map(ob.patp)
      this.setState((prevState, _) => {
        for (let i = 0; i < prevState.suggestions.length; i++) {
          if (children[i] !== prevState.suggestions[i]) {
            prevState.scrambleStart[i]()
          }
        }
        return { validChildren: new Set(children),
                 suggestions: children.slice(0, 4),
                 placeHolderVisible: true }})
    })
  }

  handlePointInput(desiredPoint) {
    if (desiredPoint.length < 15) {

      const suggestedPoint = setFind(this.state.validChildren, (e => e.startsWith(desiredPoint))) || ''
      const rendered = ' '.repeat(desiredPoint.length) + suggestedPoint.substring(desiredPoint.length)

      const available = Just(this.state.validChildren.has(desiredPoint))

      this.setState({
        desiredPoint,
        isAvailable: available,
        autoComplete: rendered
      })
      this.statelessRef.current.clearTxn()

    }
  }


  createUnsignedTxn() {
    const { state, props } = this

    if (isValidAddress(state.receivingAddress) === false) return Nothing()
    if (state.isAvailable === false) return Nothing()
    if (canDecodePatp(state.desiredPoint) === false) return Nothing()

    const validContracts = props.contracts.matchWith({
      Just: (cs) => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const pointDec = ob.patp2dec(state.desiredPoint)

    const txn = ecliptic.spawn(
      validContracts,
      pointDec,
      state.receivingAddress
    )

    return Just(txn)
  }


  validatePoint = patp => {
    const point = this.point

    let vpatp = false
    try {
      vpatp = ob.isValidPatp(patp)
    } catch(_) {
    }

    let vchild = false
    try {
      vchild = ob.sein(patp) === ob.patp(point)
    } catch(_) {
    }

    return vpatp && vchild
  }

  render() {
    const { props, state } = this

    const validAddress = isValidAddress(state.receivingAddress)

    const canGenerate = props.web3.matchWith({
      Nothing: () => {
        return validAddress === true
      },
      Just: () => {
        return validAddress === true &&
          state.isAvailable.value === true
      }
    })

    const esvisible =
        props.networkType === NETWORK_NAMES.ROPSTEN ||
        props.networkType === NETWORK_NAMES.MAINNET

    const esdomain =
        props.networkType === NETWORK_NAMES.ROPSTEN
      ? "ropsten.etherscan.io"
      : "etherscan.io"

    return (
      <Row>
        <Col>
          <H1>
            { 'Issue a Child From ' } <code>{ `${ob.patp(state.issuingPoint)}` }</code>
          </H1>


          <P>
          {
            `Please enter the point you would like to issue, and specify the
            receiving Ethereum address.  If you need to create an address, you
            can also use Wallet Generator.`
          }
          </P>

          <P>
          {
            `Your point can only issue children with particular names. Some
            valid suggestions for `
          }
            {
              <code>
                { ob.patp(state.issuingPoint) }
              </code>
            }
            {
              ' are '
            }
            <code>
              <Scramble
                text={ state.suggestions[0] }
                speed='fast'
                bindMethod={c => {
                  this.setState((prevState, _) => {
                    return {scrambleStart: prevState.scrambleStart.concat([c.start])}
                  })
                }}
                steps={[
                  {
                    roll: 10,
                    action: '+',
                    type: 'all',
                  },
                  {
                    action: '-',
                    type: 'forward',
                  }
                ]}
              />
            </code>
            { ', ' }
            <code>
              <Scramble
                text={ state.suggestions[1] }
                speed='fast'
                bindMethod={c => {
                  this.setState((prevState, _) => {
                    return {scrambleStart: prevState.scrambleStart.concat([c.start])}
                  })
                }}
                steps={[
                  {
                    roll: 10,
                    action: '+',
                    type: 'all',
                  },
                  {
                    action: '-',
                    type: 'forward',
                  }
                ]}
              />
            </code>
            { ', and ' }
            <code>
              <Scramble
                text={ state.suggestions[2] }
                speed='fast'
                bindMethod={c => {
                  this.setState((prevState, _) => {
                    return {scrambleStart: prevState.scrambleStart.concat([c.start])}
                  })
                }}
                steps={[
                  {
                    roll: 10,
                    action: '+',
                    type: 'all',
                  },
                  {
                    action: '-',
                    type: 'forward',
                  }
                ]}
              />
            </code>
            { '.' }
          </P>

          <PointInput
            prop-size='lg'
            prop-format='innerLabel'
            className={'mono mt-8'}
            placeholder={ state.placeHolderVisible ? `e.g. ${state.suggestions[3]}`: '' }
            value={ state.desiredPoint }
            onChange={ this.handlePointInput }>
            <InnerLabel>{ 'Point to Issue' }</InnerLabel>
            <div
              style={{marginTop: '8.8rem', marginLeft: '4.6rem', fontSize: '5rem', color: '#757575', whiteSpace: 'pre-wrap'}}
              className='abs tl-0 mono'>
              { state.autoComplete }
            </div>
            <ValidatedSigil
              className={'tr-0 mt-05 mr-0 abs'}
              patp={state.desiredPoint}
              size={68}
              margin={8}
              validator={() => this.validatePoint(state.desiredPoint)} />
          </PointInput>

          <AddressInput
            className='text-mono mt-8'
            prop-size='lg'
            prop-format='innerLabel'
            placeholder={ `e.g. 0x84295d5e054d8cff5a22428b195f5a1615bd644f` }
            value={ state.receivingAddress }
            disabled={ Nothing.hasInstance(state.isAvailable) || !state.isAvailable.value }
            onChange={ v => this.handleAddressInput(v) }>
            <InnerLabel>{ 'Receiving Address' }</InnerLabel>
            <ShowBlockie className={'mt-1'} address={state.receivingAddress} />
          </AddressInput>

          <Anchor
            className={'mt-1'}
            prop-size={'sm'}
            prop-disabled={!isValidAddress(state.receivingAddress) || !esvisible}
            target={'_blank'}
            href={`https://${esdomain}/address/${state.receivingAddress}`}>
              {'View on Etherscan ↗'}
          </Anchor>

          <StatelessTransaction
            // Upper scope
            web3={props.web3}
            contracts={props.contracts}
            wallet={props.wallet}
            walletType={props.walletType}
            walletHdPath={props.walletHdPath}
            networkType={props.networkType}
            setTxnHashCursor={props.setTxnHashCursor}
            setTxnConfirmations={props.setTxnConfirmations}
            popRoute={props.popRoute}
            pushRoute={props.pushRoute}
            // Other
            canGenerate={canGenerate}
            createUnsignedTxn={this.createUnsignedTxn}
            ref={this.statelessRef} />
        </Col>
      </Row>
    )
  }
}

export default IssueChild
