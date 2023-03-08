const { convert } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

const initGameContract = (runtime, creatorAccount, health, approvalProgramFilename, clearProgramFilename) => {
    const appName = "gameApp";
    
    // deploy contract
    runtime.deployApp(
        creatorAccount,
        {
            approvalProgramFilename,
            clearProgramFilename,
            metaType: types.MetaType.FILE,
            appName,
            localInts: 1,
            localBytes: 0,
            globalInts: 2,
            globalBytes: 1,
            appArgs: [convert.uint64ToBigEndian(health)]
        },
        { totalFee: 1000 }, //pay flags
    );

    const appInfo = runtime.getAppByName(appName);
    const appAddress = appInfo.applicationAccount;

    // fund the contract
    runtime.executeTx([{
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: creatorAccount, //use the account object
        toAccountAddr: appAddress, //app address
        amountMicroAlgos: 2e7, //20 algos
        payFlags: { totalFee: 1000 }
    }]);

    return appInfo;
};

const optIn = (runtime, account, appID) => {
    runtime.executeTx([{
        type: types.TransactionType.OptInToApp,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        appID: appID,
        payFlags: { totalFee: 1000 },
    }]);
};

const attack = (runtime, account, appID) => {
    const attackAppArgs = ["Attack"].map(convert.stringToBytes);
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        appID: appID,
        payFlags: { totalFee: 1000 },
        appArgs: attackAppArgs,
    }]);
};

const rewardPlayer = (runtime, sender, mvp_address, appID) => {
    const rewardAppArgs = ["Reward"].map(convert.stringToBytes);
    return runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: sender,
        appID: appID,
        payFlags: { totalFee: 1000 },
        appArgs: rewardAppArgs,
        accounts: [mvp_address],
    }]);
};

module.exports = {
    initGameContract,
    optIn,
    attack,
    rewardPlayer
}