import React from 'react'

const InputBox = ({
  disabled,
  autocomplete,
  autofocus,
  className,
  title,
  onChange,
  currentValue,
  placeholder,
  containerClassnames
}) => {
  return (
    <div className={containerClassnames}>
      <label>{title}</label>
      <input
        className={className}
        placeholder={placeholder}
        type='text'
        value={currentValue}
        autoFocus={autofocus}
        autoComplete={autocomplete}
        disabled={disabled}
        onChange={e => onChange(e)} />
    </div> )
}



export default InputBox
