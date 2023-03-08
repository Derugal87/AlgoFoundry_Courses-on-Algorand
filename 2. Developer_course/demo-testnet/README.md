# TestNet Deployment Demo
Uses Algo Builder to deploy a sample counter application onto TestNet.

## Setup instructions

### Install packages
```
yarn install
```

### Update environement variables
1. Copy `.env.example` to `.env`.
2. Update Algorand Sandbox credentials in `.env` file.

## TestNet Setup
We will be using a 3rd party API service from Purestake to communicate with TestNet. Please [sign up](https://developer.purestake.io/signup) here.

Once you've signed up an account, please include your API key in the .env file under the variable `ALGOD_TOKEN_TESTNET` like so,
```
export ALGOD_TOKEN_TESTNET='{ "X-API-Key": "YOUR API KEY HERE" }'
```

## Use env file
Run `source .env`

### Deploy the contract to TestNet
```
yarn run algob deploy --network purestake
```

### Add call
```
yarn run algob run scripts/actions/add.js --network purestake
```

### Deduct call
```
yarn run algob run scripts/actions/deduct.js --network purestake
```
