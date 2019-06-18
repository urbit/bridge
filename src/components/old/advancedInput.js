import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { compose, defaultTo, t, f } from '../../lib/lib';

// =============================================================================
// Utils

const initMessage = data => ({
  data: data,
  pass: true,
  error: '',
});

// Validation display triggers
const displayTriggers = {
  eagerSuccess: r => t(r.pass),
  eagerFailure: r => f(r.pass),
  tactfulSuccess: r => t(r.pass) && t(r.beenFocussed),
  tactfulFailure: r => f(r.pass) && t(r.beenFocussed) && f(r.focussed),
};

// =============================================================================
// AdvancedInput

const advancedInput = ({ WrappedComponent, validators, transformers }) => {
  // set argument defaults
  validators = defaultTo(validators, []);
  transformers = defaultTo(transformers, []);

  class AdvancedInputHOC extends Component {
    constructor(props) {
      super(props);
      this.state = {
        focussed: false,
        beenFocussed: false,
      };
      this.onFocus = this.onFocus.bind(this);
      this.onBlur = this.onBlur.bind(this);
      this.onChange = this.onChange.bind(this);
    }

    onFocus = () => this.setState({ focussed: true });

    onBlur = () => this.setState({ focussed: false, beenFocussed: true });

    onChange = value => {
      const { props } = this;

      // =======================================================================
      // 0. RUN VALUE TRANSFORMERS

      // This applies functions to the input value and updates state with the
      // new value. This is useful for ship/point names which technically
      // should always have a sig prepending them, but users might not know/care
      // about such a technicality. ValueTransformers are executed from right to
      // left.
      const newValue = compose(...transformers)(value);

      props.onChange(newValue);
    };

    render() {
      const { state, props } = this;

      // =======================================================================
      // RUN VALIDATORS AND DETERMINE STYLES

      // Run validation chain on the transformed value. Validators are executed
      // from right to left and exit on the first validation failure.

      const report = compose(
        ...validators,
        initMessage
      )(props.value);

      // Makes a uniform data structure to pass to display triggers. This
      // removes the need to rely on argument order for these functions.
      const stateReport = {
        pass: report.pass,
        beenFocussed: state.beenFocussed,
        focussed: state.focussed,
        submitted: props.submitted,
      };

      // Determine if the passing validation style or message should be shown
      const displayPass = displayTriggers.eagerSuccess(stateReport);

      // Determine if the failing validation style or message should be shown
      const displayFailure = displayTriggers.tactfulFailure(stateReport);

      // Generate class strings for validation state. VCN stands for validation
      // class names
      const valClassname = styleSelector(displayPass, displayFailure);

      return (
        <WrappedComponent
          {...props}
          // Events
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onChange={this.onChange}
          // stateReport
          focussed={state.focussed}
          beenFocussed={state.beenFocussed}
          displayPass={displayPass}
          displayFailure={displayFailure}
          // 'error' prop refers to an error message string, not the presence
          // of an error.
          error={report.error}
          didPass={report.pass}
          value={props.value}
          className={props.className}
          disabled={props.disabled}
          valClassname={valClassname}
          advanced={true}
        />
      );
    }
  }

  AdvancedInputHOC.propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    value: PropTypes.string,
    submitted: PropTypes.bool,
  };

  AdvancedInputHOC.defaultProps = {
    className: '',
    style: {},
    value: '',
    submitted: false,
  };

  return AdvancedInputHOC;
  // END advancedInput()
};

const styleSelector = (pass, fail) => {
  if (fail === true)
    return 'br-yellow outline-yellow f-br-yellow bg-yellow-light';
  if (pass === true) return 'br-green outline-green f-br-green';
  return 'br-gray-50 f-br-blue outline-blue';
};

export default advancedInput;
