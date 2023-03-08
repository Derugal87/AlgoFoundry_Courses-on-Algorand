const { convert } = require("@algo-builder/algob");
const { Runtime, AccountStore } = require("@algo-builder/runtime");
const { types } = require("@algo-builder/web");
const { assert } = require("chai");
const algosdk = require("algosdk");
const commonfn = require("./common/commonfn");

const approvalFile = "game_approval.py";
const clearStateFile = "game_clearstate.py";
const monsterHealth = 5;

describe("Stateful Smart Contract Positive Tests", function () {
    // write your code here
    let master;
    let player;
    let runtime;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(100e6); //100 Algos
        player = new AccountStore(10e6); //10 Algos
        runtime = new Runtime([master, player]);
    });

    const initContract = () => {
        return commonfn.initGameContract(
            runtime, 
            master.account, 
            monsterHealth, 
            approvalFile, 
            clearStateFile
        );
    };

    const getGlobal = (appID, key) => runtime.getGlobalState(appID, key);

    it("Deploys game contract successfully", () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // verify app created
        assert.isDefined(appID);
        assert.equal(getGlobal(appID, "Health"), monsterHealth); // integer check
        assert.equal(getGlobal(appID, "MaxDamage"), 0);

        // verify app funded
        const appAccount = runtime.getAccount(appInfo.applicationAccount);
        assert.equal(appAccount.amount, 2e7);
    });

    it("Account opts in successfully", () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // sync account
        player = runtime.getAccount(player.address);

        // verify damage counter
        assert.equal(player.getLocalState(appID, "Damage"), 0);
    });

    it("Attacks monster successfully", () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // sync account
        player = runtime.getAccount(player.address);

        // do attack
        commonfn.attack(runtime, player.account, appID);

        // sync account
        player = runtime.getAccount(player.address);

        // verify damage counter
        const damage = 2;
        assert.equal(player.getLocalState(appID, "Damage"), damage);

        // verify global state
        assert.equal(getGlobal(appID, "Health"), monsterHealth - damage); // integer check
        assert.equal(getGlobal(appID, "MaxDamage"), 2);

        // verify mvp
        const mvp = algosdk.encodeAddress(Buffer.from(getGlobal(appID, "Mvp"), "base64"));
        assert.equal(mvp, player.address);
    });

    it("Reward player successfully", () => {
        const appInfo = initContract();
        const appID = appInfo.appID;

        // do opt in
        commonfn.optIn(runtime, player.account, appID);

        // sync account
        player = runtime.getAccount(player.address);

        // do attack 3 times
        for (let i = 0; i < 3; i++) {
            commonfn.attack(runtime, player.account, appID);
        }

        // reward player
        const mvp = algosdk.encodeAddress(Buffer.from(getGlobal(appID, "Mvp"), "base64"));
        commonfn.rewardPlayer(runtime, master.account, mvp, appID);

        // sync account
        player = runtime.getAccount(player.address);

        // verify player receives algos (initial balance - (optIn + 3 attacks) + reward)
        const playerAlgos = 10e6 - (1000 * 4) + 1e6;
        assert.equal(player.amount, playerAlgos);
    });
});
