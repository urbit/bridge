import React from 'react';
import PropTypes from 'prop-types';

class HorizontalSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      option: this.props.options[0].value,
    };

    this.selectOption = this.selectOption.bind(this);
  }

  selectOption(opt) {
    this.props.onChange(opt);
    this.setState({ option: opt });
  }

  getOptionElems() {
    return this.props.options.map(opt => {
      let active = opt.value === this.state.option ? 'btn-primary active' : '';
      return (
        <button
          key={opt.value.toString()}
          className={`btn ${active} h-10 ph-4 flex sans ${this.props.className}`}
          onClick={() => this.selectOption(opt.value)}>
          {opt.title}
        </button>
      );
    });
  }

  render() {
    const optionElems = this.getOptionElems();

    return <div className="btn-group">{optionElems}</div>;
  }
}

HorizontalSelector.propTypes = {
  className: PropTypes.string,
  options: PropTypes.array,
};

HorizontalSelector.defaultProps = {
  className: '',
  options: [],
};

export default HorizontalSelector;
