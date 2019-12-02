import { useEffect } from 'react';
import { useForm } from 'react-final-form';

/**
 * pauses validation when it becomes unmounted
 *
 * NOTE: this is useful because for some reason, final-form will
 * re-run validation when a field is unregistered (even post submission !?),
 * which react-final-form does on unmount. So when we redirect away from
 * a page with a form on it, all of the validation is re-triggered.
 *
 * Normally, for boring sync-validation-only situations, this is ok, but for
 * long-running validators like ours (deriving seeds, checking chain, etc)
 * having them re-triggered when a form leaves the page is hilariously bad.
 *
 * So here we disable validation when unmounting, saving ourselves
 * from the footgun.
 *
 * see: https://github.com/final-form/react-final-form/issues/408
 */
export default function ValidationPauser() {
  const form = useForm();

  useEffect(() => () => form.pauseValidation(), [form]);

  return null;
}
