const algosdk = require("algosdk");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

const fundAccount = async (sender, receiver, amount) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makePaymentTxnWithSuggestedParams(
    sender.addr,
    receiver.addr,
    amount,
    undefined,
    undefined,
    suggestedParams
  );

  // sign the transaction
  const signedTxn = txn.signTxn(sender.sk);

  await submitToNetwork(signedTxn);
};

const createAsset = async (maker, clawbackAcc) => {
  const total = 1; // how many of this asset there will be
  const decimals = 0; // units of this asset are whole-integer amounts
  const assetName = "nftASA";
  const unitName = "nft";
  const url = "ipfs://cid";
  const metadata = undefined;
  const defaultFrozen = false; // whether accounts should be frozen by default

  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  // create the asset creation transaction
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: maker.addr,
    total,
    decimals,
    assetName,
    unitName,
    assetURL: url,
    assetMetadataHash: metadata,
    defaultFrozen,

    freeze: undefined,
    manager: undefined,
    clawback: clawbackAcc.addr,
    reserve: undefined,

    suggestedParams,
  });

  // sign the transaction
  const signedTxn = txn.signTxn(maker.sk);

  return await submitToNetwork(signedTxn);
};

// Receiver opts into asset
const assetOptInReceiver = async (receiver, assetId) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    receiver.addr,
    receiver.addr,
    undefined,
    undefined,
    0,
    undefined,
    assetId,
    suggestedParams
  );

  // sign the transaction
  const signedTxn = txn.signTxn(receiver.sk);

  return await submitToNetwork(signedTxn);
};

// send asset
const transferAssetToReceiver = async (receiver, assetId, amount) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    creator.addr,
    receiver.addr,
    undefined,
    undefined,
    amount,
    undefined,
    assetId,
    suggestedParams
  );

  // sign the transaction
  const signedTxn = txn.signTxn(creator.sk);

  return await submitToNetwork(signedTxn);
};

const assetOptInClawback = async (clawbackTo, assetId) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    clawbackTo.addr,
    clawbackTo.addr,
    undefined,
    undefined,
    0,
    undefined,
    assetId,
    suggestedParams
  );

  // sign the transaction
  const signedTxn = txn.signTxn(clawbackTo.sk);

  return await submitToNetwork(signedTxn);
};

const assetClawback = async (creator, clawbackTo, receiver, assetId, amount) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    creator.addr,
    clawbackTo.addr, //asset will be sent to this address
    undefined,
    receiver.addr, // asset will be clawed back from this address
    amount,
    undefined,
    assetId,
    suggestedParams
  );

  // sign the transaction
  const signedTxn = txn.signTxn(creator.sk);

  return await submitToNetwork(signedTxn);
};

(async () => {
  // Accounts
  const receiver = algosdk.generateAccount();
  const clawbackTo = algosdk.generateAccount();

  // Fund accounts
  console.log("Funding account ...");
  await fundAccount(creator, receiver, 1e6);
  await fundAccount(creator, clawbackTo, 1e6);

  // Create asset - creator can perform clawback
  const res = await createAsset(creator, creator);
  const assetId = res["asset-index"];
  console.log(`NFT created. AssetId is ${assetId}`);

  // Opt in receiver account
  console.log("Receiver Opt In the asset...");
  await assetOptInReceiver(receiver, assetId).catch(console.error);

  // Send asset to receiver
  console.log("Transferring new asset from creator to receiver...");
  await transferAssetToReceiver(receiver, assetId, 1).catch(console.error);
  console.log("Asset Transferred");

  // Opt in clawback account
  console.log("Clawback account Opt In the asset...");
  await assetOptInClawback(clawbackTo, assetId).catch(console.error);

  // Perform asset clawback
  console.log("Perform asset clawback...");
  await assetClawback(creator, clawbackTo, receiver, assetId, 1).catch(console.error);
  console.log("Asset is clawed back");

  // Check results
  console.log("Receiver address: ", (await algodClient.accountInformation(receiver.addr).do()).assets);
  console.log("New recipient address: ", (await algodClient.accountInformation(clawbackTo.addr).do()).assets);
})();
