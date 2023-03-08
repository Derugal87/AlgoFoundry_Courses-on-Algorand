const algosdk = require("algosdk");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);



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


const sendAlgo = async (from, to, amount) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makePaymentTxnWithSuggestedParams(
    from.addr,
    to.addr,
    amount,
    undefined,
    undefined,
    suggestedParams
  );

  // sign the transaction
  const signedTxn = txn.signTxn(from.sk);

  await submitToNetwork(signedTxn);
}

const createAsset = async (maker) => {
  const total = 1;
  const decimal = 0;
  const assetName = "newNFT";
  const unitName = "NNFT";
  const url = "ipfs://cid";
  const metadata = undefined;
  const defaultFrozen = false;

  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: maker.addr,
    total,
    decimal,
    assetName,
    unitName,
    url,
    metadata,
    defaultFrozen,
    
    manager: maker.addr,
    reserve: undefined,
    freeze: undefined,
    clawback: undefined,

    suggestedParams,
  });

  const signedTxn = txn.signTxn(maker.sk);
  return await submitToNetwork(signedTxn);
}

 const submiAtomicTransfer = async(creator, buyer, artist, assetID, amount) => {

    const suggestedParams = await algodClient.getTransactionParams().do();


    // 1. Buyer account pays 1 Algo to the creator.
    console.log("Buyer account pays 1 Algo to the creator");
    let txn1 = algosdk.makePaymentTxnWithSuggestedParams(
      buyer.addr,
      creator.addr,
      amount,
      undefined,
      undefined,
      suggestedParams
    );

    // 2. Buyer opts into the asset. 
    console.log("Buyer account Opt In the asset...");
    let txn2 = algosdk.makeAssetTransferTxnWithSuggestedParams(
      buyer.addr,
      buyer.addr,
      undefined,
      undefined,
      0,
      undefined,
      assetID,
      suggestedParams
    );
    
    // 3. Creator sends the NFT to the buyer.
    console.log("Transferring NFT from creator to buyer...");
    let txn3 = algosdk.makeAssetTransferTxnWithSuggestedParams(
      creator.addr,
      buyer.addr,
      undefined,
      undefined,
      1,
      undefined,
      assetID,
      suggestedParams
    );
    
    // 4. Creator sends 10% of the payment to the artist's account.
    console.log("Creator sends 10% of the payment to the artist's account");
    let txn4 = algosdk.makePaymentTxnWithSuggestedParams(
      creator.addr,
      artist.addr,
      Math.round(amount * 0.1),
      undefined,
      undefined,
      suggestedParams
    );

    // Store all transactions
    let txns = [txn1, txn2, txn3, txn4];

    // Group all transactions
    let txgroup = algosdk.assignGroupID(txns);

    // Sign each transaction in the group
    let signedTx1 = txn1.signTxn(buyer.sk);
    let signedTx2 = txn2.signTxn(buyer.sk);
    let signedTx3 = txn3.signTxn(creator.sk);
    let signedTx4 = txn4.signTxn(creator.sk);

    // Combine the signed transactions
    let signed = [];
    signed.push(signedTx1);
    signed.push(signedTx2);
    signed.push(signedTx3);
    signed.push(signedTx4);

    // Submit txGroup
    return await submitToNetwork(signed);
  }

(async () => {

  // Accounts
  const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);
  const buyer = algosdk.generateAccount();
  const artist = algosdk.generateAccount();
  
  const amount = 1e6;

  // Fund buyer account
  console.log("Funding account ...");
  await sendAlgo(creator, buyer, 1e7).catch(console.error);
  await sendAlgo(creator, artist, 1e7).catch(console.error);

  // create asset
  const res = await createAsset(creator).catch(console.error);
  const assetID = res["asset-index"];
  console.log(`NFT created. NFT asset ID is ${assetID}`);

  // Create atomic transaction
  console.log("Create atomic transaction ... ");
  await submiAtomicTransfer(creator, buyer, artist, assetID, amount).catch(console.error);

  // Check results
  console.log("Creator address: ", (await algodClient.accountInformation(creator.addr).do()));
  console.log("Buyer address: ", (await algodClient.accountInformation(buyer.addr).do()));
  console.log("Artist address: ", (await algodClient.accountInformation(artist.addr).do()));
})();
