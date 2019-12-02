import React from 'react';

export default class WithErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { error };
  }
  constructor(props) {
    super(props);

    this.state = { error: null };
  }

  render() {
    if (this.state.error) {
      return this.props.render(this.state.error);
    }

    return this.props.children;
  }
}
