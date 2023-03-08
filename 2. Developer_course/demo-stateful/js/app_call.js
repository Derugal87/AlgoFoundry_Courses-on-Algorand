const algosdk = require("algosdk");
const fs = require("fs");
const path = require("path");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

const getBasicProgramBytes = async (filename) => {
  // Read file for Teal code
  const filePath = path.join(__dirname, "../artifacts/" + filename);
  const data = fs.readFileSync(filePath);

  // use algod to compile the program
  const compiledProgram = await algodClient.compile(data).do();
  return new Uint8Array(Buffer.from(compiledProgram.result, "base64"));
};

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

const readGlobalState = async (appId) => {
  const app = await algodClient.getApplicationByID(appId).do();

  // global state is a key value array
  const globalState = app.params["global-state"];
  const formattedGlobalState = globalState.map((item) => {
    // decode from base64 and utf8
    const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));

    let formattedValue;
    if (item.value.type === 1) {
      formattedValue = item.value.bytes;
    } else {
      formattedValue = item.value.uint;
    }

    return {
      key: formattedKey,
      value: formattedValue,
    };
  });

  console.log(formattedGlobalState);
};

const callApp = async (account, appId, appArgs) => {
  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // call the created application
  const callTxn = algosdk.makeApplicationNoOpTxn(
    account.addr,
    suggestedParams,
    appId,
    appArgs
  );

  const signedCalledTxn = callTxn.signTxn(account.sk);
  const confirmedTxn = await submitToNetwork(signedCalledTxn);

  return confirmedTxn;
};

const deleteApp = async (account, appId) => {
  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // delete application
  const deleteTxn = algosdk.makeApplicationDeleteTxn(
    account.addr,
    suggestedParams,
    appId
  );

  const signedDeleteTxn = deleteTxn.signTxn(account.sk);
  const confirmedTxn = await submitToNetwork(signedDeleteTxn);

  return confirmedTxn;
};

(async () => {
  const sender = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);

  // define application parameters
  const from = sender.addr;
  const onComplete = algosdk.OnApplicationComplete.NoOpOC;
  const approvalProgram = await getBasicProgramBytes("sc_approval.teal");
  const clearProgram = await getBasicProgramBytes("sc_clearstate.teal");
  const numLocalInts = 0;
  const numLocalByteSlices = 0;
  const numGlobalInts = 1; //using global state to store value of "count"
  const numGlobalByteSlices = 0;
  const appArgs = [];

  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // create the application creation transaction
  const createTxn = algosdk.makeApplicationCreateTxn(
    from,
    suggestedParams,
    onComplete,
    approvalProgram,
    clearProgram,
    numLocalInts,
    numLocalByteSlices,
    numGlobalInts,
    numGlobalByteSlices,
    appArgs
  );

  const signedCreateTxn = createTxn.signTxn(sender.sk);
  const confirmedTxn = await submitToNetwork(signedCreateTxn);

  // read global state
  const appId = confirmedTxn["application-index"];
  console.log("App ID:", appId);
  await readGlobalState(appId);

  try {
    // call application to add counter
    let addAppArgs = [];
    addAppArgs.push(new Uint8Array(Buffer.from("Add")));
    await callApp(sender, appId, addAppArgs);

    // read global state
    await readGlobalState(appId);

    // call application to deduct counter
    let deductAppArgs = [];
    deductAppArgs.push(new Uint8Array(Buffer.from("Deduct")));
    await callApp(sender, appId, deductAppArgs);

    // read global state
    await readGlobalState(appId);
  } catch (error) {
    console.log(error.response.text);
  } finally {
    // delete app
    await deleteApp(sender, appId);
  }
})();
