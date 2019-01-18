import Tx from 'ethereumjs-tx'
import React from 'react'
import Web3 from 'web3'
import { Button } from '../Base'
import { Input, InnerLabel } from '../Base'

import { ledgerSignTransaction } from '../../lib/ledger'
import { trezorSignTransaction } from '../../lib/trezor'
import { WALLET_NAMES, addressFromSecp256k1Public } from '../../lib/wallet'
import { BRIDGE_ERROR } from '../../lib/error'

class Signer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      nonce: '',
      gasPrice: '5',
      chainId: '',
      gasLimit: '600000'
    }

    const dummy = new Web3()
    this.toHex = dummy.utils.toHex
    this.toWei = dummy.utils.toWei
    this.fromWei = dummy.utils.fromWei

    this.handleNonceInput = this.handleNonceInput.bind(this)
    this.handleChainIdInput = this.handleChainIdInput.bind(this)
    this.handleGasPriceInput = this.handleGasPriceInput.bind(this)
    this.handleGasLimitInput = this.handleGasLimitInput.bind(this)
    this.signTransaction = this.signTransaction.bind(this)
  }

  componentDidMount() {
    const { web3, wallet } = this.props

    const addr = wallet.matchWith({
      Just: (wal) => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    web3.map(w3 =>
      this.getTxnInfo(w3, addr)
      .then(txInfo => this.setState(txInfo))
    )
  }

  getTxnInfo = async (web3, addr) => {
    let nonce = await web3.eth.getTransactionCount(addr)
    let chainId = await web3.eth.net.getId()
    let gasPrice = await web3.eth.getGasPrice()
    return {
      nonce: nonce,
      chainId: chainId,
      gasPrice: this.fromWei(gasPrice, 'gwei')
    }
  }

  handleNonceInput(nonce) {
    this.setState({ nonce })
  }

  handleChainIdInput(chainId) {
    this.setState({ chainId })
  }

  handleGasPriceInput(gasPrice) {
    this.setState({ gasPrice })
  }

  handleGasLimitInput(gasLimit) {
    this.setState({ gasLimit })
  }

  async signTransaction(signingArgs) {
    const { wallet, walletType, txn, walletHdPath } = this.props
    const { setSignedTransaction } = this.props

    let { nonce, chainId, gasPrice, gasLimit } = signingArgs
    nonce = this.toHex(nonce)
    chainId = this.toHex(chainId)
    gasPrice = this.toHex(this.toWei(gasPrice, 'gwei'))
    gasLimit = this.toHex(gasLimit)

    const wal = wallet.matchWith({
      Just: (w) => w.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    const sec = wal.privateKey

    const utx = txn.matchWith({
      Just: (tx) =>
        Object.assign(tx.value, { nonce, chainId, gasPrice, gasLimit }),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_TXN
      }
    })

    const stx = new Tx(utx)

    if (walletType === WALLET_NAMES.LEDGER) {
      await ledgerSignTransaction(stx, walletHdPath)
    } else if (walletType === WALLET_NAMES.TREZOR) {
      await trezorSignTransaction(stx, walletHdPath)
    } else {
      stx.sign(sec)
    }

    setSignedTransaction(stx)
  }

  render() {

    const { state, props } = this

    const signingArgs = this.state
    const { nonce, gasPrice, gasLimit, chainId } = signingArgs

    const signButton =
      <Button
        disabled={ props.disabled }
        prop-size={'lg wide'}
        prop-color={this.props['prop-color']}
        onClick={ () => this.signTransaction(signingArgs) }
      >
        { 'Sign Transaction' }
      </Button>

    const dialogue = props.web3.matchWith({
      Just: () => <div />,
      Nothing: () =>
        <div>
          <Input
            className='mono'
            prop-size='md'
            prop-format='innerLabel'
            value={ state.nonce }
            onChange={ v => this.handleNonceInput(v) }>
            <InnerLabel>
              { 'Nonce' }
            </InnerLabel>
          </Input>

          <Input
            className='mono mt-4 mb-8'
            prop-size='md'
            prop-format='innerLabel'
            value={ state.chainId }
            onChange={ v => this.handleChainIdInput(v) }>
            <InnerLabel>
              { 'Chain ID' }
            </InnerLabel>
          </Input>

        </div>
    })

    return (
      <div className={this.props.className}>
        <Input
          className='mono mt-4'
          prop-size='md'
          prop-format='innerLabel'
          value={ state.gasPrice }
          onChange={ v => this.handleGasPriceInput(v) }>
          <InnerLabel>
            { 'Gas Price (gwei)' }
          </InnerLabel>
        </Input>

        <Input
          className='mono mt-4'
          prop-size='md'
          prop-format='innerLabel'
          value={ state.gasLimit }
          onChange={ v => this.handleGasLimitInput(v) }>
          <InnerLabel>
            { 'Gas Limit' }
          </InnerLabel>
        </Input>
        { dialogue }
        { signButton }
      </div>
    )
  }
}

export default Signer
