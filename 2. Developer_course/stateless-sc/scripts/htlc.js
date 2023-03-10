const { prepareParameters } = require("./actions/common");

async function run(runtimeEnv, deployer) {
    // get required info
    const { acc1, scTemplateParams } = prepareParameters(deployer);

    // for simplicity sake, acc1 can retrieve funds after 50 rounds
    const algodClient = deployer.algodClient;
    const chainStatus = await algodClient.status().do();
    const timeoutBlockcount = chainStatus['last-round'] + 50;
    scTemplateParams.timeout = timeoutBlockcount;

    // fund the escrow contract with 10 Algos so it becomes a contract account
    await deployer.fundLsigByFile(
        "htlc.py",
        { funder: acc1, fundingMicroAlgo: 1e7 }, 
        { fee: 1000 }, 
        scTemplateParams
    );

    // Add checkpoints
    await deployer.addCheckpointKV('User Checkpoint', 'Fund escrow account');
    await deployer.addCheckpointKV('timeout', timeoutBlockcount);
}

module.exports = { default: run };
