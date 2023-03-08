const { readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");
    const approvalFile = "sc_approval.py";
    const clearStateFile = "sc_clearstate.py";

    await deployer.deployApp(
        master,
        {
            appName: "TestNet Demo",
            metaType: types.MetaType.FILE,
            approvalProgramFilename: approvalFile,
            clearProgramFilename: clearStateFile,
            localInts: 0,
            localBytes: 0,
            globalInts: 1,
            globalBytes: 0,
            appArgs: [],
        },
        { totalFee: 1000 }
    );

    // get app info
    const app = deployer.getApp("TestNet Demo");
    console.log(app);
    const appAddress = app.applicationAccount;

    let globalState = await readAppGlobalState(deployer, master.addr, app.appID);
    console.log(globalState);

    // testnet explorer url
    console.log("TestNet Explorer URL: ", `https://testnet.algoexplorer.io/application/${app.appID}`);
}

module.exports = { default: run };
