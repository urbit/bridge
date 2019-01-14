import React from 'react'
import makeBlockie from 'ethereum-blockies-base64'

const isValidAddress = (address) =>
  /^0x[0-9a-fA-F]{40}$/.test(address)

const Blockie = props =>
    isValidAddress(props.address)
  ? <img className={`s-10 ${props.className}`} alt={ props.address } src={ makeBlockie(props.address) } />
  : <div className={`s-10 ${props.className}`} />

export default Blockie
