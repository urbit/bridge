import React from 'react'
import PropTypes from 'prop-types'
import makeBlockie from 'ethereum-blockies-base64'
import Button from './Button'
import { invert } from '../lib/state'

const isValidAddress = (address) => /^0x[0-9a-fA-F]{40}$/.test(address);

class ShowBlockie extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      open: false
    }

    this.toggle = this.toggle.bind(this)
    // this.close = this.close.bind(this)

  }

  toggle = () => this.setState(invert('open', this.state))

  render() {
    const { props, state } = this

    const display = state.open
      ? ''
      : 'super-hidden'

    const isValid = isValidAddress(props.address)

    return (
      <div className={`flex flex-column items-start ${props.className}`}>
        <Button
          onClick={this.toggle}
          disabled={!isValid}
          prop-type='link'
          prop-size='sm'>
          { state.open
            ? 'Hide Blockie'
            : 'Display Blockie'
          }
          </Button>
          {
            !isValid
              ? <div/>
              : <img
                className={`${display} mt-2`}
                alt={ props.address }
                src={ makeBlockie(props.address) }
                style={{
                  width: props.size,
                  height: props.size,
                }} />
          }

      </div>
    )
  }
}


ShowBlockie.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


ShowBlockie.defaultProps = {
  className: '',
  style: {},
  size: 64,
  address: '',

};


export default ShowBlockie;
