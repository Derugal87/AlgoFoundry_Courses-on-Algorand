const { executeTransaction, convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const helper = require('./actions/helper.js');
const algosdk = require("algosdk");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");
    
    // deploy app
    const approvalFile = "ab_approval.py";
    const clearStateFile = "ab_clearstate.py";

    /**
     * Create Application
     * 
     * Global Ints
     * 1. GlobalText
     * Global Bytes
     * 1. GlobalInteger
     * Local Ints
     * 1. LocalInteger
     * Local Bytes
     * 1. LocalText
     */
    const deployAppArgs = [convert.stringToBytes("Hello"), convert.uint64ToBigEndian(5)];
    await deployer.deployApp(
        master,
        {
            appName: "Demo Stateful App",
            metaType: types.MetaType.FILE,
            approvalProgramFilename: approvalFile,
            clearProgramFilename: clearStateFile,
            localInts: 1,
            localBytes: 1,
            globalInts: 1,
            globalBytes: 1,
            appArgs: deployAppArgs,
        },
        { totalFee: 1000 }
    );

    // get app info
    const app = deployer.getApp("Demo Stateful App");

    // fund contract with some algos to handle inner txn
    await deployer.executeTx({
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: app.applicationAccount,
        amountMicroAlgos: 2e7, //20 algos
        payFlags: { totalFee: 1000 },
    });

    // READ GLOBAL STATE

    // using helper function from AB
    const globalState = await readAppGlobalState(deployer, master.addr, app.appID);
    console.log(globalState);

    // without AB
    const globalState2 = await helper.readGlobalStateWithoutAlgoBuilder(deployer.algodClient, app.appID);
    console.log(globalState2);
}

module.exports = { default: run };
