import React, { useMemo } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import ob from 'urbit-ob';
import BN from 'bn.js';
import 'style/anim.css';

import * as need from 'lib/need';
import { chunkStr, Matrix, walk, rand } from 'lib/card';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import { buildKeyType } from 'lib/point';

import { useWallet } from 'store/wallet';

import { sigil, reactRenderer } from 'urbit-sigil-js';

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
  inverted,
  animationMode = 'none',
  keyType,
}) {
  const [cols, rows, tile] = [35, 12, 12];

  const loading = Nothing.hasInstance(address) || Nothing.hasInstance(point);
  const defaultMatrix = () => {
    return Matrix.new(rows, cols);
  };

  const patp = ob.patp(point.value);

  const makeMatrix = addr => {
    // remove the 0x
    const onlyTheNumberPart = addr.substring(2);
    // make bigNum from hex
    const int = new BN(onlyTheNumberPart, 16);
    // make a bigger number
    const big = int.pow(new BN(10));
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

  const matrix = address.matchWith({
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
        minWidth: `${16 + 16 + cols * tile}px`,
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
function MiniPassport({ point, inverted, ...rest }) {
  useSyncOwnedPoints([point]);
  const { wallet } = useWallet();
  const address = need.addressFromWallet(wallet);

  const patp = ob.patp(point);
  const permissions = usePermissionsForPoint(address, point);
  const keyType = buildKeyType(permissions);
  const sigil = useMemo(
    () =>
      makeSigil(44, patp, inverted ? ['white', 'black'] : ['black', 'white']),
    [inverted, patp]
  );
  return (
    <div
      style={{
        fontFamily: 'Inter',
        backgroundColor: inverted ? 'white' : 'black',
        border: inverted ? '2px solid #E6E6E6' : '2px solid black',
        borderRadius: '20px',
        marginBottom: '16px',
        maxWidth: `${230}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
      {...rest}>
      <div
        style={{
          height: '44px',
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
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
            <div
              style={{
                fontWeight: '600',
                color: inverted ? 'black' : 'white',
                fontSize: '14px',
                fontFamily: 'Source Code Pro',
              }}>
              {patp}
            </div>
            {keyType !== '' ? (
              <div
                style={{
                  marginTop: '8px',
                  fontWeight: '500',
                  color: inverted ? 'black' : 'white',
                  fontSize: '12px',
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
    </div>
  );
}

Passport.Mini = MiniPassport;

export default Passport;
