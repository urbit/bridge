import React, { useRef } from 'react';
import { Button } from 'indigo-react';

export default function LoginButton({ url, className, code, ...rest }) {
  const formEl = useRef(null);
  return (
    <form
      style={{ display: 'contents' }}
      action={url}
      method="POST"
      target="_blank"
      ref={formEl}>
      <input name="password" value={code} type="hidden" />
      <input name="redirect" value="/" type="hidden" />
      <Button
        type="submit"
        accessory="↗"
        solid
        success
        className={className}
        onClick={() => formEl.current.submit()}
        {...rest}>
        Open OS
      </Button>
    </form>
  );
}
