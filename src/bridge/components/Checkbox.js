import React from 'react';

const CheckBox = ({
  name,
  id,
  title,
  subtitle,
  onChange,
  className,
  state,
  children,
  childContainerClassname,
  disabled,
}) => {
  const isCheckedClassname = state === true ? 'cb-on' : 'cb-off';

  return (
    <div className={`cb flex items-center ${isCheckedClassname} ${className}`}>
      <label className={'s-6 m-0 mr-4 rel outline-blue'}>
        <input
          disabled={disabled}
          name={name}
          id={id}
          type={'checkbox'}
          className={'none'}
          checked={state}
          onChange={onChange}
        />

        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 3.55661V0H0V5.55661H12.4182V3.55661H2Z"
            transform="translate(4 11) rotate(-45)"
            fill="white"
          />
        </svg>
      </label>
      <div className={`user-select-none ${childContainerClassname} mt-1`}>
        {children}
      </div>
    </div>
  );
};

export default CheckBox;
