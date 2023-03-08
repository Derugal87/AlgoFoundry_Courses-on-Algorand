<template>
    <div id="sendalgo-app">
        <h3>Select wallet</h3>
        <div class="d-grid gap-2 mb-5">
            <button @click="connectMyAlgo" class="btn btn-primary">
                MyAlgo
            </button>
            <button
                @click="connectToAlgoSigner('Localhost')"
                class="btn btn-primary"
            >
                AlgoSigner (Localhost)
            </button>
            <button
                @click="connectToAlgoSigner('TestNet')"
                class="btn btn-primary"
            >
                AlgoSigner (TestNet)
            </button>
            <button
                @click="connectToWalletConnect"
                class="btn btn-primary mr-3"
            >
                WalletConnect
            </button>
        </div>
        <div v-if="this.sender !== ''" class="mb-5">
            <h3>Connected</h3>
            <p>
                Connection: <span>{{ this.connection }}</span>
            </p>
            <p>
                Network: <span>{{ this.network }}</span>
            </p>
            <p>
                Account: <span>{{ this.sender }}</span>
            </p>
        </div>
        <send-algo-form
            v-if="this.sender !== ''"
            :connection="this.connection"
            :walletConnector="this.connector"
            :network="this.network"
            :sender="this.sender"
            :receiver="this.receiver"
        />
    </div>
</template>

<script>
import MyAlgoConnect from "@randlabs/myalgo-connect";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

export default {
    data() {
        return {
            connection: "", // myalgo | walletconnect | algosigner
            connector: null, // wallet connector obj
            network: "", // Localhost | TestNet
            sender: "", // connected account
            receiver: "",
        };
    },
    methods: {
        async connectMyAlgo() {
            try {
                // force connection to TestNet
                this.network = "TestNet";

                const myAlgoWallet = new MyAlgoConnect();
                const accounts = await myAlgoWallet.connect();
                this.sender = accounts[0].address;
                this.receiver =
                    "DBKB7I3Y3WS4JP6DPHXNDGD2GTANN6WDSM4VSUZO2KQARIT2PB7MNVKIDM";
                this.connection = "myalgo";
            } catch (err) {
                console.error(err);
            }
        },
        async connectToAlgoSigner(network) {
            this.network = network;
            const algorand = window.algorand;
            if (typeof algorand !== 'undefined') {
                const response = await algorand.enable({
                    ledger: this.network,   
                });
                if (this.network === "Localhost") {
                    // use non-creator address
                    this.sender = response.accounts[1];
                    this.receiver = "";
                } else {
                    this.sender = response.accounts[0];
                    this.receiver = response.accounts[1];
                }
                this.connection = "algosigner";
            }
        },
        async connectToWalletConnect() {
            // force connection to TestNet
            this.network = "TestNet";

            // Create a connector
            this.connector = new WalletConnect({
                bridge: "https://bridge.walletconnect.org", // Required
                qrcodeModal: QRCodeModal,
            });

            // Kill existing session
            if (this.connector.connected) {
                await this.connector.killSession();
            }

            this.connector.createSession();

            // Subscribe to connection events
            this.connector.on("connect", (error, payload) => {
                if (error) {
                    throw error;
                }

                const { accounts } = payload.params[0];
                this.sender = accounts[0];
                this.receiver =
                    "K2VOMCI54VDAEKBFJQNLIRVXXS5CWH6ECNSPVALEGTDZP5AQUJHR72UGPI";
                this.connection = "walletconnect";
            });

            this.connector.on("session_update", (error, payload) => {
                if (error) {
                    throw error;
                }

                const { accounts } = payload.params[0];
                this.sender = accounts[0];
                this.connection = "walletconnect";
            });

            this.connector.on("disconnect", (error, payload) => {
                if (error) {
                    throw error;
                }

                // Delete connector
                console.log(payload);
                this.sender = "";
                this.connection = "";
            });
        },
    },
};
</script>
