import React from 'react';
import PropTypes from 'prop-types';

import { DropdownItem, DropdownDivider } from '../components/Base';

class InnerLabelDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
    };

    this.toggle = this.toggle.bind(this);
    this.close = this.close.bind(this);
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen,
    });
  }

  close() {
    this.setState({
      isOpen: false,
    });
  }

  selectOption(opt) {
    this.close();
    this.props.handleUpdate(opt);
  }

  getOptionElems() {
    return this.props.options.map((opt, i) => {
      if (opt.type === 'divider') {
        return <DropdownDivider key={`divider-${i}`} />;
      } else {
        return (
          <DropdownItem
            key={opt.title}
            onClick={() => this.selectOption(opt.value)}>
            {opt.title}
          </DropdownItem>
        );
      }
    });
  }

  render() {
    const { props, state } = this;

    const optionElems = this.getOptionElems();

    const menuVisibility = state.isOpen === true ? 'visible' : 'hidden';

    const selectedClasses = state.isOpen === true ? 'br-blue' : 'br-gray-50';

    const fullWidthClass = props.fullWidth ? 'full-width' : '';

    return (
      <div className={`rel table ${fullWidthClass} ${props.className}`}>
        <div
          className={`fix full o-0 ${menuVisibility}`}
          onClick={this.close}
        />

        <button
          className={`h-10 mp-0 bg-white outline-blue sans ${fullWidthClass}`}
          onClick={this.toggle}
          disabled={props.disabled}>
          <div className={'flex'}>
            <div
              className={`ph-4 flex align-center b-2 br-0 b-solid h-10 ${selectedClasses} ${fullWidthClass}`}>
              <div className={'text-400 mr-2'}>{props.title}</div>
              <div className={'text-600'}>{props.currentSelectionTitle}</div>
            </div>
            <div className={'white bg-blue s-10 flex-center-all text-sm'}>
              {'▼'}
            </div>
          </div>
        </button>

        <div
          className={`abs flex-column bg-white t-12 l-0 w-100 z-1 ${menuVisibility}`}>
          <div className={'pv-1 b-solid b-gray-50 b-2 bb-0'} />

          {optionElems}

          <div className={'pv-1 b-solid b-gray-50 b-2 bt-0'} />
        </div>
      </div>
    );
  }
}

InnerLabelDropdown.propTypes = {
  disabled: PropTypes.bool,
  className: PropTypes.string,
  title: PropTypes.string,
  style: PropTypes.object,
  currentSelectionTitle: PropTypes.string,
  children: PropTypes.node,
};

InnerLabelDropdown.defaultProps = {
  disabled: false,
  className: '',
  title: '',
  style: {},
  currentSelectionTitle: '',
};

export default InnerLabelDropdown;
