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
  const passes = useMemo(() => validations.map(v => v.pass), [validations]);

  // the input has errored if it
  // 1) did not pass validation
  // 2) has an error text
  // 3) has been focused before
  // 4) is not currently focused
  // returning the error text at the end
  const errors = useMemo(
    () =>
      configs.map(
        (config, i) =>
          config.error ||
          (!validations[i].pass &&
            hasBeenFocused[config.name] &&
            !focused[config.name] &&
            validations[i].error)
      ),
    [configs, validations, hasBeenFocused, focused]
  );

  // visibly tell the user that their input has passed if
  // 1) it has passed
  // 2) there are no errors
  // 3) they are or have interacted with the input before
  const visiblePasses = useMemo(
    () =>
      configs.map(
        (config, i) =>
          validations[i].pass &&
          !errors[i] &&
          (hasBeenFocused[config.name] || focused[config.name])
      ),
    [configs, validations, errors, hasBeenFocused, focused]
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
