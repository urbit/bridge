import React, { useMemo } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import ob from 'urbit-ob';
import BN from 'bn.js';
import 'style/anim.css';
import { sigil, reactRenderer } from 'urbit-sigil-js';
import { Icon } from '@tlon/indigo-react';

import { chunkStr, Matrix, walk, rand } from 'lib/card';

import './SigilMini.scss';

function makeSigil(size, patp, colors) {
  const config = {
    margin: 0,
    renderer: reactRenderer,
    full: true,
    patp,
    colors,
    size,
  };

  return sigil(config);
}

const symbols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/**
 * Address is Maybe<string>
 * point is Maybe<string>
 * animationMode is 'slide' | 'step' | 'none'
 *
 */
function Passport({
  address,
  point,
  inverted = false,
  animationMode = 'none',
  keyType = '',
}) {
  const [cols, rows, tile] = [35, 12, 12];

  const loading = Nothing.hasInstance(address) || Nothing.hasInstance(point);
  const defaultMatrix = () => {
    return Matrix.new(rows, cols);
  };

  const patp = ob.patp(point.value);

  const makeMatrix = azimuthPoint => {
    // convert point to hex
    const azimuthPointHex = azimuthPoint.toString(16);

    // make bigNum from hex
    const int = new BN(azimuthPointHex, 16);

    // make a bigger number
    const big = int.pow(new BN(100));
    // parse that to a string and pad
    const b10 = big.toString(10).padStart(32, '0');
    // split the big number into parts
    const chunkSize = Math.ceil(b10.length / 8);
    const chunks = chunkStr(b10, chunkSize).map(c => new BN(c));
    // generate an empty matrix
    const startMatrix = Matrix.new(rows, cols);
    // do a few random walks starting at diff coordinates
    const [, matrix] = chunks.reduce((acc, chunk) => {
      return walk(chunk, acc[1]);
      // start with the 'random' points (not actually random, they are deterministic)
    }, rand(big, startMatrix));

    return matrix;
  };

  const matrix = point.matchWith({
    Just: ({ value }) => makeMatrix(value),
    Nothing: defaultMatrix,
  });

  const bgColor = inverted ? 'white' : 'black';

  const fgColor = inverted ? 'black' : 'white';

  const sigil = useMemo(
    () => Just.hasInstance(point) && makeSigil(64, patp, [bgColor, fgColor]),
    [patp, point, bgColor, fgColor]
  );
  return (
    <div
      style={{
        fontFamily: 'Inter',
        backgroundColor: bgColor,
        border: inverted ? '2px solid #E6E6E6' : '2px solid black',
        borderRadius: '20px',
        marginBottom: '16px',
        width: `${16 + 16 + cols * tile}px`,
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div
        style={{
          height: '64px',
          padding: '16px',
          display: 'flex',
        }}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}>
          {sigil}
          <div
            style={{
              marginLeft: '16px',
            }}>
            <div
              style={{
                fontWeight: '600',
                color: fgColor,
                fontSize: '16px',
                fontFamily: 'Source Code Pro',
              }}>
              {Just.hasInstance(point) && patp}
            </div>
            {keyType !== '' ? (
              <div
                style={{
                  marginTop: '8px',
                  fontWeight: '500',
                  color: fgColor,
                  fontSize: '14px',
                  fontFamily: 'Source Code Pro',
                }}>
                {keyType}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          paddingTop: '0px',
          filter: inverted ? 'invert(1)' : '',
        }}>
        {matrix.map((row, _row) => {
          return (
            <div
              key={`card:row:${_row}`}
              style={{ display: 'flex', justifyContent: 'space-between' }}>
              {row.map((v, _col) => {
                return (
                  <Cell
                    row={_row}
                    col={_col}
                    value={typeof symbols[v] === 'undefined' ? 13 : v}
                    spriteSheet={'a'}
                    spriteSheetHeight={12}
                    spriteSheetWidth={168}
                    inverted={inverted}
                    loading={loading}
                    animationMode={animationMode}
                    key={`cell-${_col}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Cell = props => {
  return (
    <div
      key={`card:cell:${props.row}:${props.col}:${props.value}`}
      className={
        props.loading
          ? 'blink'
          : props.animationMode === 'none'
          ? ''
          : `${props.animationMode}-h-${props.value}`
      }
      style={{
        backgroundImage: `url(/spritesheet_a.png)`,
        backgroundPosition:
          props.animationMode === 'none'
            ? `-${props.spriteSheetHeight * props.value}px 0px`
            : '',
        backgroundSize: `${props.spriteSheetWidth}px ${props.spriteSheetHeight}px`,
        width: `${props.spriteSheetHeight}px`,
        maxWidth: `${props.spriteSheetHeight}px`,
        height: `${props.spriteSheetHeight}px`,
        maxHeight: `${props.spriteSheetHeight}px`,
        animationDelay: `${props.value * 50}ms`,
      }}
    />
  );
};

/**
 * point is number
 *
 */
function MiniPassport({
  point,
  inverted = false,
  locked = false,
  processing = false,
  ...rest
}) {
  const patp = ob.patp(point);

  const contrast = locked ? '#666666' : 'black';

  const sigil = useMemo(
    () =>
      makeSigil(50, patp, inverted ? ['white', contrast] : [contrast, 'white']),
    [inverted, patp, contrast]
  );
  const className = `sigil ${locked ? 'locked' : ''} ${
    processing ? 'processing' : ''
  }`;

  return (
    <div {...rest} className="sigil-mini">
      <div className={className}>{sigil}</div>
      <span className="patp mono">{patp}</span>
      {locked && <Icon color="white" icon="Locked" className="lock" />}
    </div>
  );
}

Passport.Mini = MiniPassport;

export default Passport;
