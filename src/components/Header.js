import React, { Component } from 'react';

export class Header extends Component {
  render() {
    return (
      <nav class="absolute-ns mb2-ns pl6 pt7 f5">
        <a class="gray3" href="/">
          Urbit
        </a>
        <span class="gray3"> / </span>
        <a href="/">Bridge</a>
      </nav>
    );
  }
}

export default Header;
