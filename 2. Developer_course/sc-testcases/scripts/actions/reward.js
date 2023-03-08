const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const algosdk = require("algosdk");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");
    const appName = "gameApp";

    // get app info
    let gameApp = deployer.getApp(appName);
    const appID = gameApp.appID;
    const gameAppAddress = gameApp.applicationAccount;
    let globalState = await readAppGlobalState(deployer, master.addr, appID);
    console.log(globalState);

    // amount before
    let appAccount = await deployer.algodClient.accountInformation(gameAppAddress).do();
    const amountBefore = appAccount["amount"];

    // get mvp address
    const mvp = algosdk.encodeAddress(Buffer.from(globalState.get("Mvp"), 'base64'));

    // reward
    const rewardAppArgs = ["Reward"].map(convert.stringToBytes);
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: appID,
        payFlags: { totalFee: 2000 }, // creator will pay for the inner txn fees
        appArgs: rewardAppArgs,
        accounts: [mvp]
    });

    // get app account balance
    appAccount = await deployer.algodClient.accountInformation(gameAppAddress).do();
    console.log("contract amount before: ", amountBefore);
    console.log("contract amount after: ", appAccount["amount"]);
}

module.exports = { default: run };
