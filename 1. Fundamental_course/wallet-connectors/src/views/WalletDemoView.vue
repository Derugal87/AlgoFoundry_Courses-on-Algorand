<template>
    <div id="sendalgo-app">
        <h3>Select wallet</h3>
        <div class="d-grid gap-2 mb-5">
            <button @click="connectToAlgoSigner('Localhost')" class="btn btn-primary">AlgoSigner (Localhost)</button>
            <button @click="connectToAlgoSigner('TestNet')" class="btn btn-primary">AlgoSigner (TestNet)</button>
            <button @click="connectMyAlgo" class="btn btn-primary">MyAlgo</button>
            <button @click="connectToWalletConnect" class="btn btn-primary mr-3">WalletConnect</button>
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
/* eslint-disable */
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
        async connectToAlgoSigner(network) {
            this.network = network;
            const algorand = window.algorand;
            if (typeof algorand !== 'undefined') {
                const response = await algorand.enable({
                    ledger: this.network,
                });
                if (this.network === "Localhost") {
                    // use non-creator address
                    this.sender = process.env.VUE_APP_ACC1_ADDR;
                    this.receiver = process.env.VUE_APP_ACC2_ADDR;
                } else {
                    this.sender = response.accounts[0];
                    this.receiver = response.accounts[1];
                }
                this.connection = "algosigner";
            }
        },
        async connectMyAlgo() {
            this.network = "TestNet";
            const myAlgoWallet = new MyAlgoConnect();
            const accounts = await myAlgoWallet.connect({
                openManager: true
            });
            this.sender = accounts[0].address;
            this.receiver = accounts[1].address;
            this.connection = "myalgo";
        },
        async connectToWalletConnect() {
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

                // Get provided accounts
                const { accounts } = payload.params[0];
                this.sender = accounts[0];
                this.receiver = process.env.VUE_APP_WC_RECEIVER_ADDR;
                this.connection = "walletconnect";
            });
            this.connector.on("session_update", (error, payload) => {
                if (error) {
                    throw error;
                }

                // Get updated accounts
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