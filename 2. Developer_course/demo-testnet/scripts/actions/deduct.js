const { executeTransaction, convert, readAppGlobalState, readAppLocalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");
    const acc1 = deployer.accountsByName.get("acc1");

    // get app info
    const app = deployer.getApp("TestNet Demo");
    const appID = app.appID;
    let globalState = await readAppGlobalState(deployer, master.addr, appID);

    // call app to "Deduct"
    const appArgs = ["Deduct"].map(convert.stringToBytes);

    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: acc1,
        appID: appID,
        payFlags: { totalFee: 1000 },
        appArgs: appArgs,
    });

    // get global state
    globalState = await readAppGlobalState(deployer, master.addr, appID);
    console.log(globalState);

    // testnet explorer url
    console.log("TestNet Explorer URL: ", `https://testnet.algoexplorer.io/application/${app.appID}`);
}

module.exports = { default: run };
