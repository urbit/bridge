import React, { Component } from 'react';

import Button from '../components/Button';
import UploadButton from '../components/UploadButton';

import { compose } from '../../bridge/lib/lib';

import { PROFILE_STATES } from '../lib/constants';

const NEXT_STEP_NUM = 3;

const validateBase64 = ({ data, pass, error }) => {
  if (pass !== true) return { data, pass, error };

  try {
    atob(data);
    return { data: atob(data), pass: true, error: '' };
  } catch (e) {
    console.error(e);
    return { data: data, pass: false, error: 'File is not valid base64.' };
  }
};

const validateJSON = ({ data, pass, error }) => {
  if (pass !== true) return { data, pass, error };

  try {
    JSON.parse(data);
    return { data: JSON.parse(data), pass: true, error: '' };
  } catch (e) {
    console.error(e);
    return {
      data: data,
      pass: false,
      error: 'File does not decode into valid JSON.',
    };
  }
};

const validateFile = ({ data, pass, error }) => {
  if (pass !== true) return { data, pass, error };

  if (data.file.type !== 'text/plain') {
    return { data: data, pass: false, error: 'File must be a .txt file' };
  }

  if (data.file.name.includes('urbit-ships') === false) {
    return {
      data: data,
      pass: false,
      error: 'This does not appear to be the correct file.',
    };
  }

  return { data: data.event.target.result, pass, error };
};

const validateObject = ({ data, pass, error }) => {
  if (pass !== true) return { data, pass, error };

  const checkStringField = (obj, field) =>
    field in obj && typeof obj[field] === 'string';

  const checkShipField = (obj, field) =>
    field in obj || Array.isArray(obj[field]);

  const meetsRequirements = obj =>
    checkStringField(obj, 'idCode') &&
    checkShipField(obj, 'planets') &&
    checkShipField(obj, 'stars') &&
    checkShipField(obj, 'galaxies');

  const didPass = meetsRequirements(data) ? true : false;

  const err =
    didPass === false
      ? 'File is missing data, or the data is of incorrect data type.'
      : '';

  return { data: data, pass: didPass, error: err };
};

// const preview = ship => {
//   const name = ob.patp(ship)
//   const sig = sigil.pour({
//     patp: name,
//     colorway: ['black', 'white'],
//     renderer: ReactSVGComponents,
//     size: 64
//   })
//
//   return (
//     <div className={'col-md-8'}>
//       <div className={'flex items-center bg-white black'} key={ ship }>
//         <div className={'col-md-5 pt-2 pl-5'}>
//           { sig }
//         </div>
//         <div className={'col-md-5'}>
//           <h4 className={'text-mono text-500 mb-0'}>
//             { name }
//           </h4>
//         </div>
//       </div>
//     </div>
// <div className={'flex h-16 w-60 bg-white black items-center'} key={ ship }>
//   { sig }
//   <div className={'pl-4 text-mono text-500'}>
//     { name }
//   </div>
// </div>
//   )
// }

// const shipList = profile => {
//   const ships = Object.keys(profile)
//   return(
//     <div>
//       <h2>Total Ships: { ships.length }</h2>
//
//       <div className={''}>
//         { ships.map(preview) }
//       </div>
//     </div>
//   )
// }

class Upload extends Component {
  constructor(props) {
    super(props);
    this.handleTXTUpload = this.handleTXTUpload.bind(this);
  }

  handleTXTUpload = event => {
    const { setGlobalState } = this.props;
    const file = event.files.item(0);
    const reader = new FileReader();

    reader.onload = event => {
      const validated = compose(
        validateObject,
        validateJSON,
        validateBase64,
        validateFile
      )({ data: { event: event, file: file }, pass: true, error: '' });

      if (validated.pass === true) {
        const { galaxies, stars, planets } = validated.data;
        setGlobalState({
          'profile.error': validated.error,
          'profile.state': PROFILE_STATES.UPLOAD_SUCCESS,
          'profile.value': validated.data,
          'profile.shipCount': galaxies.length + stars.length + planets.length,
        });
      } else {
        setGlobalState({
          'profile.error': validated.error,
          'profile.state': PROFILE_STATES.UPLOAD_ERROR,
          'profile.value': null,
        });
      }
    };

    reader.readAsText(file);
  };

  render() {
    const { setGlobalState } = this.props;

    const { props } = this;

    const success =
      props['profile.state'] === PROFILE_STATES.UPLOAD_SUCCESS ||
      props['profile.state'] === PROFILE_STATES.INPUT_SUCCESS;

    let uploadButtonClass =
      props['profile.state'] === PROFILE_STATES.UPLOAD_ERROR
        ? 'btn shape-orange'
        : props['profile.state'] === PROFILE_STATES.UPLOAD_SUCCESS
        ? 'btn btn-success'
        : 'btn btn-primary';

    let uploadButtonText =
      props['profile.state'] === PROFILE_STATES.UPLOAD_ERROR
        ? 'Choose file again'
        : props['profile.state'] === PROFILE_STATES.UPLOAD_SUCCESS
        ? 'urbit-ships.txt'
        : 'Choose file';

    return (
      <div className={'col-md-6'}>
        <h2>
          {'Upload your '}
          <code>{'urbit-ships.txt'}</code>
        </h2>

        <p>
          {
            'This file contains your email and tells us what Urbit address space you own. Don’t have it? Return to Registration to download it.'
          }
        </p>

        <UploadButton
          className={`${uploadButtonClass} table mt-4`}
          onChange={this.handleTXTUpload}
          accept={'.txt'}>
          {uploadButtonText}
        </UploadButton>

        {props['profil.error'] !== '' ? (
          <p className={'orange'}>{props['profile.error']}</p>
        ) : (
          <div />
        )}
        {
          // { success
          //   ? <ShipList ships={props['profile.value'].galaxies} title={'Galaxies'} />
          //   : <div />
          // }
          //
          // { success
          //   ? <ShipList ships={props['profile.value'].stars} title={'Stars'} />
          //   : <div />
          // }
          //
          // { success
          //   ? <ShipList ships={props['profile.value'].planet} title={'Planets'} />
          //   : <div />
          // }
        }

        <div className={'btn-tray'}>
          {success ? (
            <div>
              {
                // <p>Missing ships? Email <a href={'mailto:registration@urbit.org'}>{'registration@urbit.org'}</a></p>
              }
              <Button
                className={
                  success ? 'btn btn-primary mt-8' : 'btn shape-gray-10'
                }
                disabled={!success}
                text={"I'm ready to begin →"}
                onClick={() =>
                  setGlobalState({
                    route: '/Understand',
                    currentStep: NEXT_STEP_NUM,
                  })
                }
              />
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }
}

// const ShipList = (ships, title) => {
//   if (ships.length > 0) {
//     return (
//       <div>
//         <h2>{ title }</h2>
//         { ships.map(ship => preview(ship)) }
//       </div>
//     )
//   } else {
//     return <div />
//   }
// }

export default Upload;
