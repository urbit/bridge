import React, { useCallback } from 'react';
import { useField } from 'react-final-form';
import UploadButton from 'components/UploadButton';
import { AccessoryIcon } from 'indigo-react-local';

export default function UploadInput({ name, label, ...rest }) {
  const {
    input,
    meta: { validating, submitting, touched, active, error },
  } = useField(name, { type: 'text' });

  const handleUpload = useCallback(
    element => {
      input.onFocus();

      const file = element.files.item(0);
      const reader = new FileReader();

      reader.onload = e => {
        input.onChange({ target: { value: e.target.result } });
      };

      const failure = _ => {
        input.onBlur();
      };

      reader.onerror = failure;
      reader.onabort = failure;

      reader.readAsText(file);
    },
    [input]
  );

  return (
    <UploadButton
      onChange={handleUpload}
      accessory={
        touched && !active && error ? (
          <AccessoryIcon.Failure />
        ) : validating || submitting ? (
          <AccessoryIcon.Pending />
        ) : (
          undefined
        )
      }
      {...rest}>
      {label}
    </UploadButton>
  );
}
