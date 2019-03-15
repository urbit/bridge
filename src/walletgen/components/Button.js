import React from 'react'

const Button = ({ disabled, onClick, text, className }) =>
  <button
    className={className}
    onClick={onClick}
    disabled={disabled}
  >
    {text}
  </button>

export default Button

