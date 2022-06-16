# ovpn-nyr-ctl
Proof-of-concept web server to control OpenVPN users (using [Nyr/openvpn-install](https://github.com/Nyr/openvpn-install)).

## Installation

```
npm install --save-dev ovpn-nyr-ctl
```

## Usage

```
node server.js
```


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

`NAME_PREFIX`
`KEY_STORAGE_FOLDER`
`KEY_STORAGE_URL`



