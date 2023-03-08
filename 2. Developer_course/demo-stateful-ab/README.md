# Stateful Smart Contract with Algo Builder
Sample stateful smart contract to demostrate some of the commonly used functions

1. Sending inner transactions with Smart Contract
2. Submitting application call transactions with the different arrays (application, accounts)
3. Reading global / local state with Algo Builder or SDK

## Setup instructions

### Install packages
```
yarn install
```

### Update environment variables
1. Copy `.env.example` to `.env`.
2. Update Algorand Sandbox credentials in `.env` file.
3. Run `source .env`

### Deploy the contract
```
yarn run algob deploy
```

### Update global state
```
yarn run algob run scripts/actions/update_global_state.js
```

### Update local state
```
yarn run algob run scripts/actions/update_local_state.js
```

### Inner transaction to send Algos from contract to receiver
```
yarn run algob run scripts/actions/send_algos.js
```
