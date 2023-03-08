const { executeTransaction, convert } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");
    const acc1 = deployer.accountsByName.get("acc1");

    // record initial Algos
    const acc1Initial = await deployer.algodClient.accountInformation(acc1.addr).do();

    // get app info
    const app = deployer.getApp("Demo Stateful App");

    // send 1 Algos to acc1 via app call by master
    const appCallArgs = [convert.stringToBytes("SendAlgos"), convert.uint64ToBigEndian(1e6)];
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: app.appID,
        payFlags: { totalFee: 1000 },
        appArgs: appCallArgs,
        accounts: [acc1.addr]
    });

    // Algos after
    const acc1After = await deployer.algodClient.accountInformation(acc1.addr).do();
    console.log("acc1 initial Algos:", acc1Initial.amount);
    console.log("acc1 after Algos:", acc1After.amount);
    console.log("Algos sent:", acc1After.amount - acc1Initial.amount);
}

module.exports = { default: run };
