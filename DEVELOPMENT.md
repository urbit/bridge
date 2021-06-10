# Development notes

## Install / Build

Clone the repo, and use a simple `npm install`. You can then use a `npm run build` to create an optimised static build (serve it with e.g. [serve](http://npmjs.com/package/serve), or with python as described above).

## General notes

For development, use `npm run pilot` to get going after a `npm install`. This
will boot up a [Ganache](https://github.com/trufflesuite/ganache-cli) node in the background, deploy the Azimuth contracts to
it, and fire up a local webserver. Bridge will be served on `localhost:3000`.

Note that one of our dependencies itself depends on a library called
`handle-thing` which breaks under the Ledger support requirements (see below)
on node 11.1.0, so make sure you're using some other node version.

You can use [nvm](https://github.com/creationix/nvm), for example, and do:

```
$ nvm install 14.17.0
$ nvm use v14.17.0
```

before running `npm run pilot`.

## Useful accounts

The ecliptic owner is the only account that's able to create galaxies, so
it's a good place to get started. On the testnet, it's the address:

```
0x6DEfFb0caFDB11D175F123F6891AA64F01c24F7d
```

You can authenticate as it using the following mnemonic:

```
benefit crew supreme gesture quantum web media hazard theory mercy wing kitten
```

Under that mnemonic, Ganache will also auto-populate the following accounts
with 100 ETH:

```
0x6deffb0cafdb11d175f123f6891aa64f01c24f7d
0xd53208cf45fc9bd7938b200bff8814a26146688f
0x7b2a2d51e4d8fac602e20a5f6907ff9fbd88e1fd
0xf48062ae8bafd6ef19cd6cb89db93a0d0ca6ce26
0xf84a77aeb351c49dfa87e805a659d2daddff7606
0x167e357cf8b845370d0d408f9b389b66185b7b5b
0xcbecf3abc9878f07afc851aead2d8f1c436cc71d
0x0afc0c3f4eeea500871f464ca71eef5e54a9af36
0x6d654ef2489674d21aed428e8a4ad8ca4820f125
0x218f6f87683db546ad47a5dc8b480e5a9b694866
```

To play around with any of these, authenticate using the same mnemonic, but
use a custom HD path of `m/44'/60'/0'/0/1`, `m/44'/60'/0'/0/2`, and so on.

## Initial development state

You can also tweak a couple of things to change your development state
somewhat (say, for example, you want to start on the points list screen, instead
of having to re-authenticate whenever you make a change or refresh the page):

- The `.env.development` file contains environment variables that you can
  provide to the application when it's running in development. You can access
  them via `process.env.REACT_APP_<whatever>`.

- Set `REACT_APP_STUB_LOCAL='true'` in `.env.development` to enabled stubbing of
  certain methods throughout the app.

- The top of the Bridge component in `src/Bridge.js` can be tweaked for setting
  your initial state. You can provide a specific wallet,
  network type, and so on.

- `npm run pilot` will check the `WITH_TEST_STATE` environment variable to setup
  the initial chain state. Possible values are `STAR_RELEASE` or `INVITES`.
  The state setup can be found in `migrations/1_migration.js`

## HTTPS

For development, you can enable HTTPS on localhost without a certificate for
Chrome by pasting the following into the URL bar:

```
chrome://flags/#allow-insecure-localhost
```

In Firefox, you may need to allow connecting to the unsecured local node
websocket. Do this by going to `about:config` and setting the
`network.websocket.allowInsecureFromHTTPS` flag to `true`.

Additionally you need to run with the `HTTPS` environment variable set to
`true`. Note that `npm run pilot` will handle this automatically.

## Releases

To generate a release `bridge-$VERSION.zip` file, use a simple `npm run release`.

This will pack the build directory together with the README, `bridge-https.py`
script, and also generate a set of checksums for the build directory. You can
verify the checksums on e.g. MacOS via `shasum -c checksums.txt`.
