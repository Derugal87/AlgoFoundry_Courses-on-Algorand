const { executeTransaction, convert } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const helper = require('./helper.js');

async function run(runtimeEnv, deployer) {
    const acc1 = deployer.accountsByName.get("acc1");

    // get app info
    const app = deployer.getApp("Demo Stateful App");

    // app call to update global state of the contract
    const appCallArgs = [convert.stringToBytes("UpdateGlobal"), convert.stringToBytes("acc1"), convert.uint64ToBigEndian(10)];
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: acc1,
        appID: app.appID,
        payFlags: { totalFee: 1000 },
        appArgs: appCallArgs,
    });

    // read global state after
    console.log(await helper.readGlobalStateWithoutAlgoBuilder(deployer.algodClient, app.appID));
}

module.exports = { default: run };
