# Bridge

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

An application for interacting with Azimuth.

## Usage

**The latest version of Bridge is accessible online at [bridge.urbit.org](https://bridge.urbit.org). No setup needed.**

If you would rather host Bridge on your own machine, read on.

### Requirements

Python 3.7.2

### Instructions

#### Download

1. [Download a release](https://github.com/urbit/bridge/releases/latest)
2. Unzip it (`bridge-$version.zip`)
3. Open up your command line interface (Terminal on MacOS, Command Prompt on Windows)
4. `cd` into the `bridge-$version` directory

#### Verify checksums

Optionally, to validate your downloaded file's integrity, compare the lines in checksum.txt to SHA-256 hashes of the `bridge-$version` directory's contents.

- On MacOS: `shasum -a 256 -c checksums.txt .`
- On Linux: `sha256sum -c checksums.txt .`
- On Windows: Go into the `build` directory and verify files individually with `CertUtil -hashFile [file_name] SHA256`

#### Run Bridge

1. `cd` into the `bridge-$version` directory
2. Run `python3 -m http.server 5000 --bind 127.0.0.1`
3. Navigate to http://127.0.0.1:5000 using a web browser to access Bridge (we recommend using Firefox or Chrome)

#### Ledger support

If you plan to authenticate with a [Ledger](https://www.ledger.com/), Bridge must be serving over HTTPS on localhost. This requires self-signed certificates. To do this:

1. Install [mkcert](https://github.com/FiloSottile/mkcert)
2. Install a local certificate authority via `mkcert -install`
3. From the `bridge-$version` directory, run `mkcert localhost` to generate a certificate valid for localhost. This will produce two files: `localhost.pem`, the local certificate, and `localhost-key.pem`, its corresponding private key
4. Run `python bridge-https.py`
5. Navigate to https://localhost:4443 in a web browser to access Bridge

## Bridge without internet access

A proper "offline mode" for the latest iteration of Bridge is still being worked on. In the mean time, if you need to use Bridge on an airgapped machine, use [Bridge v1.4.1](https://github.com/urbit/bridge/releases/tag/v1.4.1).

## Development

See [development.md](DEVELOPMENT.md).


## Configurable Roller Endpoint

By default, Bridge uses Tlon's L2 Roller, but can also be configured to use your own.

For example:

```sh
VITE_ROLLER_HOST=my-personal-roller.net npm run pilot-mainnet
```

The following are configurable, and will otherwise fallback to the defaults in `constants`:
- `VITE_ROLLER_HOST` - host
- `VITE_ROLLER_PORT` - port
- `VITE_ROLLER_TRANSPORT_TYPE` - transport type (e.g., `http` or `https`)
