import { createFactory } from 'react';

export default (components = []) => ({ children, ...props }) =>
  components
    .map(createFactory)
    .reduceRight((child, factory) => factory(props, child), children);
