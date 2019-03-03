import React from 'react'

const CheckBox = ({
  name,
  id,
  title,
  subtitle,
  onChange,
  className,
  state,
}) => {
  const isCheckedClassname = state === true ? 'isChecked' : 'isNotChecked'
  return (
    <div className={`checkbox flex ${isCheckedClassname} ${className}`}>
      <label>
        <input
          name={name}
          id={id}
          type={'checkbox'}
          className={`rc-checkbox-input`}
          checked={state}
          onChange={onChange} />

        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M2 3.55661V0H0V5.55661H12.4182V3.55661H2Z' transform='translate(3.84906 11.3371) rotate(-45)' fill='white'/>
        </svg>

      </label>
      <div>
        <p onChange={onChange} checked={state}>{title}</p>
        { subtitle === '' ? null : <p>{subtitle}</p> }
      </div>
    </div>
  )
}


export default CheckBox
