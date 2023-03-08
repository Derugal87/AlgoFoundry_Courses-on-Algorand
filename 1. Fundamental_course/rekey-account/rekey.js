require('dotenv').config();
const algosdk = require("algosdk");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

// Creator
const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);
console.log("My account Creator address: %s", creator.addr);

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
    tx.txId +
    " confirmed in round " +
    confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

(async () => {
  // Account A
  let myAccountA = algosdk.generateAccount();
  console.log("My account A address: %s", myAccountA.addr);

  // Account B
  let myAccountB = algosdk.generateAccount();
  console.log("My account B address: %s", myAccountB.addr);

  // Account C
  let myAccountC = algosdk.generateAccount();
  console.log("My account C address: %s", myAccountC.addr);


const sendAlgos = async (sender, receiver, amount) => {
  // get suggested params for transactions
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

  // Fund all accounts
  await sendAlgos(creator, myAccountA, 1000000);
  await sendAlgos(creator, myAccountB, 1000000);
  await sendAlgos(creator, myAccountC, 1000000);

  // Create multisig account
  let mparams = {
    version: 1,
    threshold: 1,
    addrs: [
      myAccountB.addr,
      myAccountC.addr,
    ],
  };

  let multsigaddr = algosdk.multisigAddress(mparams);
  console.log("Multisig Address: " + multsigaddr);

  // Rekey account A to Multisig address
  let params = await algodClient.getTransactionParams().do();

  let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: myAccountA.addr,
    to: myAccountA.addr,
    amount: 0,
    suggestedParams: params,
    rekeyTo: multsigaddr,
  });

  let signedTxn = txn.signTxn(myAccountA.sk);
  await submitToNetwork(signedTxn);

  // Send Algos from A to B
  console.log("Sending Algos from A to B...");
  let payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: myAccountA.addr,
    to: myAccountB.addr,
    amount: 10000,
    suggestedParams: params,
  });

  // Txn signed by B or C
  let msSignedTxn = algosdk.signMultisigTransaction(payTxn, mparams, myAccountB.sk);
  await submitToNetwork(msSignedTxn.blob);

  console.log("Account A balance: ", (await algodClient.accountInformation(myAccountA.addr).do()).amount);
  console.log("Account B balance: ", (await algodClient.accountInformation(myAccountB.addr).do()).amount);
})();