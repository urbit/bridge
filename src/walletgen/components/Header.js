import React from 'react';
import { seq } from '../lib/lib';

import { useOnline, ONLINE_STATUS } from '../../bridge/store/online';

const StatusIndicator = props => (
  <div className={`flex h-9 align-center ${props.c2} flex-shrink-0`}>
    <div className={`${props.c1} h-9`}>
      {props.error === true ? <Ex /> : <Check />}
    </div>
    <p className={'pr-4 text-sm text-600 c-white m-0'}>{props.message}</p>
  </div>
);

function ChooseIndicator(props) {
  const online = useOnline();

  switch (online) {
    case ONLINE_STATUS.ONLINE:
      return (
        <StatusIndicator
          message={'You are online.'}
          c1={'bg-red'}
          c2={'bg-red'}
          error
        />
      );
    case ONLINE_STATUS.OFFLINE:
      return (
        <StatusIndicator
          message={'You are offline.'}
          c1={'bg-green'}
          c2={'bg-green'}
        />
      );
    case ONLINE_STATUS.UNKNOWN:
    default:
      return (
        <StatusIndicator
          message={'Checking network connection..'}
          c1={'bg-orange'}
          c2={'bg-orange'}
        />
      );
  }
}

const ProgressIndicator = ({ currentStep, totalSteps }) => (
  <div className={'relative h-9 col- mb-0'}>
    <div
      className={
        'absolute ml-3 h-9 flex align-center text-sm white text-600'
      }>{`Step ${currentStep} of ${totalSteps}`}</div>
    <div className={'flex'}>
      {seq(totalSteps).map((step, index) => (
        <div
          key={index}
          className={`${
            index + 1 > currentStep ? 'bg-gray' : 'bg-blue'
          } h-9 col-`}>
          {''}
        </div>
      ))}
    </div>
  </div>
);

const Header = props => (
  <header className={'col'}>
    <div className={'flex justify-between'}>
      <ProgressIndicator
        totalSteps={props.totalSteps}
        currentStep={props.currentStep}
      />
      <ChooseIndicator />
    </div>
    <div className={'col-md-8 h-15 flex align-center'}>
      <h1 className={'m-0 p-0'}>{'Wallet Generator'}</h1>
    </div>
  </header>
);

const Ex = () => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.2857 18L12 22.2857L13.7143 24L18 19.7143L22.2857 24L24 22.2857L19.7143 18L23.9999 13.7143L22.2857 12L18 16.2857L13.7143 12L12 13.7143L16.2857 18Z"
        fill="white"
      />
    </svg>
  );
};

const Check = () => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.9999 14.6329L23.2766 13L16.1699 19.7341L12.7233 16.4682L11 18.1012L16.1699 23L17.2451 21.9812L17.8932 21.3671L24.9999 14.6329Z"
        fill="white"
      />
    </svg>
  );
};

export default Header;
