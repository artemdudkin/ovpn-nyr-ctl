# ovpn-nyr-ctl
Proof-of-concept web server to control OpenVPN users (using [Nyr/openvpn-install](https://github.com/Nyr/openvpn-install)).

## Installation and usage

1. Download project and copy it to server where OpenVPN runs.
2. `npm i`
3. `node server.js` (or you can use PM2 process manager `pm2 start server.js --name ovpn`)

## API

### GET /get
Returns all openvpn users

### POST /add {name:...}
Add new openvpn user (with prefix added to user name) and move key to `KEY_STORAGE_FOLDER`. Returns key name as url (with `KEY_STORAGE_URL` prefix).

### POST /remove {name:...}
Removes openvpn user (with prefix added to user name, if needed), also removes `*.ovpn` key from `KEY_STORAGE_FOLDER`.

### POST /hide {name:...}
Removes `*.ovpn` key from `KEY_STORAGE_FOLDER`.

### GET /get-prefix
Returns prefix that used to distinguish users added by this program (cannot remove other users)

## Configuration
`SERVER_PORT`
`NAME_PREFIX`
`KEY_STORAGE_FOLDER`
`KEY_STORAGE_URL`



