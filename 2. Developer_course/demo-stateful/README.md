# Stateful Smart Contract Demo
This repository contains sample codes for a counter application. This application is created using a stateful smart contract.

The application is first deployed to the blockchain. After which we will call the application to increment the counter. The application will then be deleted after.

The application is built and deployed without Algo Builder.

## Setup instructions

### Install packages
```
yarn install
```

### Update environment variables
1. Copy `.env.example` to `.env`.
2. Update Algorand Sandbox credentials in `.env` file.
3. Run `source .env` in the project directory

### Run deployment script
```
node js/app_call.js
```