const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");

    /**
     * Create Application
     * 
     * Global Ints
     * 1. Health
     * 2. MaxDamage
     * Global Bytes
     * 1. Mvp
     * Local Ints
     * 1. Damage
     */
    const appName = "gameApp";
    const monsterHealth = 5;
    const appArgs = [convert.uint64ToBigEndian(monsterHealth)];
    await deployer.deployApp(
        master,
        {
            approvalProgramFilename: "game_approval.py",
            clearProgramFilename: "game_clearstate.py",
            metaType: types.MetaType.FILE,
            appName,
            localInts: 1,
            localBytes: 0,
            globalInts: 2,
            globalBytes: 1,
            appArgs
        },
        { totalFee: 1000 }
    )

    // get app info
    const gameApp = deployer.getApp(appName);
    console.log(gameApp);
    const gameAppAddress = gameApp.applicationAccount;
    console.log("app account address:", gameAppAddress);

    let globalState = await readAppGlobalState(deployer, master.addr, gameApp.appID);
    console.log(globalState);

    // fund account with 20 algos
    await deployer.executeTx({
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: gameAppAddress,
        amountMicroAlgos: 2e7, //20 algos
        payFlags: { totalFee: 1000 },
    });

    // get app account balance
    let appAccount = await deployer.algodClient.accountInformation(gameAppAddress).do();
    console.log(appAccount);
}

module.exports = { default: run };