import { createFactory } from 'react';

// inspired by recompose/nest
export const nest = (components = []) => ({ children, ...props }) =>
  components
    .map(createFactory)
    .reduceRight((child, factory) => factory(props, child), children);
