<template>
    <div id="sendalgo-app">
        <h3>Select wallet</h3>
        <div class="d-grid gap-2 mb-5">
            <button @click="connectToAlgoSigner()" class="btn btn-primary">
                AlgoSigner (Sandbox)
            </button>
        </div>
        <div v-if="this.account !== ''" class="mb-5">
            <h3>Connected</h3>
            <p>
                Connection: <span>{{ this.connection }}</span>
            </p>
            <p>
                Network: <span>{{ this.network }}</span>
            </p>
            <p>
                Account: <span>{{ this.account }}</span>
            </p>
        </div>
        <send-asset-form
            v-if="this.connection === 'algosigner'"
            :connection="this.connection"
            :network="this.network"
            :receiver="this.account"
        />
    </div>
</template>

<script>
export default {
    data() {
        return {
            connection: "", // myalgo | walletconnect | algosigner
            connector: null, // wallet connector obj
            network: "", // network name
            account: "", // connected account
        };
    },
    methods: {
        async connectToAlgoSigner() {
            // force connection to sandbox
            this.network = "SandNet";
            const AlgoSigner = window.AlgoSigner;

            if (typeof AlgoSigner !== "undefined") {
                await AlgoSigner.connect();
                const accounts = await AlgoSigner.accounts({
                    ledger: this.network,
                });

                this.account = accounts[1].address;

                this.connection = "algosigner";
            }
        },
    },
};
</script>
