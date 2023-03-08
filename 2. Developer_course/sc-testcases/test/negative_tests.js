const { Runtime, AccountStore } = require("@algo-builder/runtime");
const { assert } = require("chai");
const algosdk = require("algosdk");
const commonfn = require("./common/commonfn");

const approvalFile = "game_approval.py";
const clearStateFile = "game_clearstate.py";
const monsterHealth = 5;

// Errors
const RUNTIME_ERR1009 = 'RUNTIME_ERR1009: TEAL runtime encountered err opcode'; // rejected by logic

describe("Stateful Smart Contract Negative Tests", function () {
    let master;
    let player;
    let player2;
    let runtime;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(100e6); //100 Algos
        player = new AccountStore(10e6); //10 Algos
        player2 = new AccountStore(10e6); //10 Algos
        runtime = new Runtime([master, player, player2]);
    });

    const initContract = () => {
        return commonfn.initGameContract(
            runtime, 
            master.account, 
            monsterHealth, 
            approvalFile, 
            clearStateFile,
        );
    };

    const getGlobal = (appID, key) => runtime.getGlobalState(appID, key);

    it("Initialize monster with < 5 Health fails", () => {
        assert.throws(() => {
            commonfn.initGameContract(
                runtime, 
                master.account, 
                1, //1 health
                approvalFile, 
                clearStateFile
            );
        }, RUNTIME_ERR1009)
    });

    it("Double opt in fails", () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // do opt in again
        const errMsg = `${player.address} is already opted in to app ${appID}`;
        assert.throws(() => { commonfn.optIn(runtime, player.account, appID) }, errMsg);
    });

    it("Attacking a monster with 0 health fails" , () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // do attack 3 times
        for (let i = 0; i < 3; i++) {
            commonfn.attack(runtime, player.account, appID);
        }

        // attack again fails
        assert.throws(() => { commonfn.attack(runtime, player.account, appID) }, RUNTIME_ERR1009);
    });

    it("Reward player when monster is alive" , () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // do attack 3 times
        commonfn.attack(runtime, player.account, appID);

        // reward player fails
        const mvp = algosdk.encodeAddress(Buffer.from(getGlobal(appID, "Mvp"), "base64"));
        assert.throws(() => { commonfn.rewardPlayer(runtime, master.account, mvp, appID) }, RUNTIME_ERR1009);
    });

    it("Reward player fails when address is accounts is different from global state" , () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // attack
        commonfn.attack(runtime, player.account, appID);

        // reward the wrong player
        assert.throws(() => { commonfn.rewardPlayer(runtime, master.account, player2.address, appID) }, RUNTIME_ERR1009);
    });

    it("Reward player fails when called by non-creator" , () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // do attack 3 times
        for (let i = 0; i < 3; i++) {
            commonfn.attack(runtime, player.account, appID);
        }

        // reward player called by wrong account
        const mvp = algosdk.encodeAddress(Buffer.from(getGlobal(appID, "Mvp"), "base64"));
        assert.throws(() => { commonfn.rewardPlayer(runtime, player2.account, mvp, appID) }, RUNTIME_ERR1009);
    });
});
