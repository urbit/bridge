import { useField } from 'react-final-form';

// inspired by: https://codesandbox.io/s/lm4p3m92q
// renders childen if the relevant field's value is the test value
export default function Condition({ when, is, children }) {
  const {
    input: { value },
  } = useField(when, { subscription: { value: true } });

  return value === is ? children : null;
}
