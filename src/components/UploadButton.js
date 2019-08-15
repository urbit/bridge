import React, { useRef } from 'react';
import { Button } from 'indigo-react';

export default function UploadButton({ children, onChange, ...rest }) {
  const button = useRef();

  return (
    <label htmlFor="file" {...rest}>
      <Button accessory="↑" solid>
        {children}
      </Button>
      <input
        id="file"
        ref={button}
        className="super-hidden"
        type="file"
        onChange={() => onChange(button.current)}
      />
    </label>
  );
}
