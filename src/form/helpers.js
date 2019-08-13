import { some } from 'lodash';

// we have warnings if some of the values are truthy
export const hasWarnings = warnings => some(warnings, v => !!v);
