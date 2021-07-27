import React from 'react';
import { render, screen } from '@testing-library/react';
import AccessCode from './AccessCode';

describe('AccessCode', () => {
  describe('when code is not available', () => {
    // Value is initialized as `false` in `useKeyfileGenerator`
    const testCode = false;

    it('does not render the component', () => {
      render(<AccessCode code={testCode} />);
      const element = screen.queryByTestId('custom-element');
      expect(element).not.toBeInTheDocument();
    });
  });

  describe('when code is available', () => {
    // Value has been loaded from `useKeyfileGenerator`
    const testCode = 'foo-bar';

    it('renders the component', () => {
      render(<AccessCode code={testCode} />);
      expect(
        screen.getByText('This is your code to access Urbit OS')
      ).toBeInTheDocument();
    });
  });
});
