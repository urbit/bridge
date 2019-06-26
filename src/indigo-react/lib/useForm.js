import { useCallback, useMemo, useState } from 'react';
import { keyBy, get, every, some } from 'lodash';

import { compose } from 'lib/lib';
import { kDefaultValidator } from 'lib/validators';

// interface InputConfig {
//   name: string;
//   validators: Function[];
//   transformers: Function[];
//   initialValue: string;
//   autoFocus: boolean;
//   disabled: boolean;
//   ...extra,
// }

const defaultsFor = (configs, mapper) =>
  configs.reduce(
    (memo, config) => ({ ...memo, [config.name]: mapper(config) }),
    {}
  );

/**
 * useForm managest a set of inputs for rendering them in a loop
 */
export default function useForm(configs = []) {
  const byName = useMemo(() => keyBy(configs, 'name'), [configs]);

  // track values
  const [values, _setValues] = useState(() =>
    defaultsFor(configs, config => config.initialValue)
  );
  const setValue = useCallback(
    (name, value) => _setValues(values => ({ ...values, [name]: value })),
    [_setValues]
  );
  // ^ NB(shrugs): because we're not syncing the initialValue of _additional_
  // configs that are added, we won't be able to set an initialValue for a
  // dynamic form that then triggers validation. for initial configs,
  // initialValue can be a validated string and everything will be happy,
  // but for dynamically added input configs, we won't get validation, etc
  // until there's a traditional state update.

  // track focused states
  const [focused, _setFocused] = useState(() =>
    defaultsFor(configs, config => config.autoFocus && !config.disabled)
  );
  const focuses = useMemo(
    () => configs.map(config => focused[config.name] || false), //
    [configs, focused]
  );

  const setFocused = useCallback(
    (name, value) => _setFocused(values => ({ ...values, [name]: value })),
    [_setFocused]
  );

  // track whether or not input has been focused
  const [hasBeenFocused, _setHasBeenFocused] = useState({});
  const setHasBeenFocused = useCallback(
    (name, value) =>
      _setHasBeenFocused(values => ({ ...values, [name]: value })),
    [_setHasBeenFocused]
  );

  const transform = useCallback(
    (name, value) => compose(...get(byName, [name, 'transformers'], []))(value),
    [byName]
  );
  const validate = useCallback(
    (name, value) =>
      compose(
        ...get(byName, [name, 'validators'], []),
        kDefaultValidator
      )(value),
    [byName]
  );

  const onChange = useCallback(
    name => e => setValue(name, transform(name, e.target.value)), //
    [setValue, transform]
  );
  const onFocus = useCallback(
    name => e => setFocused(name, true), //
    [setFocused]
  );
  const onBlur = useCallback(
    name => e => {
      setFocused(name, false);
      setHasBeenFocused(name, true);
    },
    [setFocused, setHasBeenFocused]
  );

  // memo-compute whether or not the current value is valid
  const validations = useMemo(
    () => configs.map(config => validate(config.name, values[config.name])), //
    [configs, validate, values]
  );

  const datas = useMemo(() => validations.map(v => v.data), [validations]);

  // the input has errored if it
  // 1) has been focused before
  // 2)
  //   a) did not pass validation and has an error text
  //   b) or has a specific error from parent state
  // (and we implicitly return the error text at the end)
  const errors = useMemo(
    () =>
      configs.map(
        (config, i) =>
          hasBeenFocused[config.name] && //
          (validations[i].error || config.error)
      ),
    [configs, validations, hasBeenFocused]
  );

  // this input has passed if
  // 1) it has passed local validation
  // 2) there are no errors
  const passes = useMemo(
    () => validations.map((v, i) => v.pass && !errors[i]),
    [validations, errors]
  );

  // visibly tell the user that their input has passed if
  // 1) they are or have interacted with the input before
  // 2) and it has passed as defined above
  const visiblePasses = useMemo(
    () =>
      configs.map(
        (config, i) =>
          (focused[config.name] || hasBeenFocused[config.name]) && //
          passes[i]
      ),
    [configs, hasBeenFocused, focused, passes]
  );

  const inputs = useMemo(
    () =>
      configs.map(
        ({ name, error, autoFocus, disabled, initialValue, ...rest }, i) => ({
          // Input props
          name,
          data: datas[i],
          pass: passes[i],
          visiblyPassed: visiblePasses[i],
          error: errors[i],
          focused: focuses[i],
          autoFocus: autoFocus && !disabled,
          disabled,
          ...rest,
          // dom properties below:
          bind: {
            value: values[name] || initialValue,
            onChange: onChange(name),
            onFocus: onFocus(name),
            onBlur: onBlur(name),
            autoFocus: autoFocus && !disabled,
          },
        })
      ),
    [
      configs,
      datas,
      visiblePasses,
      passes,
      errors,
      focuses,
      values,
      onBlur,
      onChange,
      onFocus,
    ]
  );

  const pass = every(passes);
  const error = some(errors);

  return {
    inputs,
    pass,
    error,
  };
}
