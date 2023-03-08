# Sample Dapp 
Sample Dapp that deploys and transacts ARC3 NFTs

## Pinning content using Pinata
Use the following methods to pin files/folders to IPFS

- [pinFileToIPFS](https://www.npmjs.com/package/@pinata/sdk#pinFileToIPFS) - Pins a file to IPFS.
- [pinFromFS](https://www.npmjs.com/package/@pinata/sdk#pinFromFS) - Pins a directory to IPFS. 

For `pinFromFS`, windows users might encounter an issue where files are pinned to the wrong directory. Additional sub directories were created (i.e. `ipfs://<content_id>/Users/<usersname>/<repo directory>/assets/nft/<asset filename>`) instead of `ipfs://<content_id>/<asset_filename>`. You might need to tweak the image url accordingly in your JSON metadata.

## Setup instructions

### Install packages
```
yarn install
```

### Update environement variables
1. Copy `.env.example` to `.env`.
2. Update Algorand Sandbox credentials in `.env` file.

### Setup Pinata IPFS
1. Create a free account on [Pinata](https://www.pinata.cloud/)
2. Generate API key via account page.
3. Update `.env` file with the credentials.

### Deploying Assets
1. Run deployment script to create ASA. 
```
yarn run algob deploy
```
2. Copy the checkpoint yaml file generated from (1) from `/artifacts/scripts` to `/src/artifacts` folder.
3. Confirm the imported yaml file name in the import statement.
```
import acsCoinConfig from "../artifacts/0-deploy-assets.js.cp.yaml";
```

### Run the Dapp on localhost
```
yarn serve
```
