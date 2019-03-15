import React, { Component } from 'react';

class UploadButton extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange() {
    this.props.onChange(this.input);
  }

  render() {
    return (
        <label className={this.props.className}>
          <input
            className={'hidden'}
            accept={'.txt'}
            ref={(ref) => { this.input = ref; }}
            onChange={this.onChange}
            disabled={this.props.disabled}
            type="file"
          />
          {this.props.children}
        </label>
		);
  }
}

export default UploadButton;
