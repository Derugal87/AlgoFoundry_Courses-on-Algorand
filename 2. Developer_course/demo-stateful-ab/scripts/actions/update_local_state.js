const { executeTransaction, convert, readAppLocalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const helper = require('./helper.js');

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");
    const acc1 = deployer.accountsByName.get("acc1");

    // get app info
    const app = deployer.getApp("Demo Stateful App");

    // receiver opt into the contract
    const appLocalState = await helper.readLocalStateWithoutAlgoBuilder(deployer.algodClient, acc1.addr, app.appID);
    if (appLocalState === undefined) {
        await deployer.optInAccountToApp(acc1, app.appID, { totalFee: 1000 }, {});
    }

    // read initial local state
    console.log(await readAppLocalState(deployer, acc1.addr, app.appID));
    console.log(await helper.readLocalStateWithoutAlgoBuilder(deployer.algodClient, acc1.addr, app.appID));

    // update local state
    const appCallArgs = [convert.stringToBytes("UpdateLocal")];
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: acc1,
        appID: app.appID,
        payFlags: { totalFee: 1000 },
        appArgs: appCallArgs,
    });

    // read local state after
    console.log(await helper.readLocalStateWithoutAlgoBuilder(deployer.algodClient, acc1.addr, app.appID));
}

module.exports = { default: run };
