<template>
    <div id="receiveasset" class="mb-5">
        <h3>Receive ACS Coins from creator</h3>
        <div
            v-if="this.acsTxId !== ''"
            class="alert alert-success"
            role="alert"
        >
            Txn Ref:
            <a :href="explorerURL" target="_blank">{{ this.acsTxId }}</a>
        </div>
        <form
            v-if="this.receiver !== ''"
            action="#"
            @submit.prevent="handleReceiveTokens"
        >
            <div class="mb-3">
                <label for="amount_acs" class="form-label"
                    >asset to receive</label
                >
                <input
                    type="number"
                    class="form-control"
                    id="amount_acs"
                    v-model="amount_acs"
                />
            </div>
            <button type="submit" class="btn btn-primary">Receive</button>
        </form>
        <div class="mt-5">
            <h3>Receive NFT</h3>
            <nft-comp
                v-for="nft in nfts" :key="nft.assetIndex"
                :nft="nft"
                @receiveNFT="handleReceiveNFT"
                @returnNFT="handleReturnNFT"
            />
        </div>
    </div>
</template>

<script>
import asa from "../asa.js";
import acsCoinConfig from "../artifacts/0-deploy-assets.js.cp.yaml"; //asc coin
import nftConfig from "../artifacts/1-deploy-nft.js.cp.yaml"; //nft
import axios from "axios";

export default {
    props: {
        connection: String,
        network: String,
        receiver: String,
    },
    data() {
        return {
            acsTxId: this.acsTxId,
            amount_acs: 1,
            explorerURL: "",
            acsCoin: acsCoinConfig.default.asa.acsCoinASA,
            nfts: [],
            creator: process.env.VUE_APP_CREATOR_ADDR,
        };
    },
    methods: {
        async updateTxn(txId) {
            this.acsTxId = txId;
            this.setExplorerURL(txId);
        },
        async handleReceiveTokens() {
            const assetId = this.acsCoin.assetIndex;

            const hasOptedIn = await this.doAssetOptIn(this.receiver, assetId);
            if (hasOptedIn) {
                await this.doAssetTransfer(
                    this.creator,
                    this.receiver,
                    assetId,
                    this.amount_acs
                );
            }
        },
        async handleReceiveNFT(thisNFT) {
            const hasOptedIn = await this.doAssetOptIn(this.receiver, thisNFT.assetIndex);
            if (hasOptedIn) {
                await this.doAssetTransfer(
                    this.creator,
                    this.receiver,
                    thisNFT.assetIndex,
                    1
                );
            }
            
        },
        async handleReturnNFT(thisNFT) {
            await this.doAssetTransfer(
                this.receiver,
                this.creator,
                thisNFT.assetIndex,
                1
            );
        },
        async doAssetOptIn(receiver, assetId) {
            // clear notification
            this.acsTxId = "";

            // do asset opt in if receiver hasn't opted in to receive asset
            const receiverInfo = await asa.getAccountInfo(
                receiver,
                this.network
            );
            const optedInAsset = receiverInfo.assets.find((asset) => {
                return asset["asset-id"] === assetId;
            });

            let optedIn = false;
            if (optedInAsset === undefined) {
                const optInResponse = await asa.assetOptIn(
                    receiver,
                    assetId,
                    this.network
                );
                if (optInResponse && optInResponse.txId !== undefined) {
                    optedIn = true;
                }
            } else {
                optedIn = true;
            }

            if (!optedIn) {
                console.error("Receiver hasn't opted in to receive the asset.");
            }

            return optedIn;
        },
        async doAssetTransfer(sender, receiver, assetId, amount) {
            // clear notification
            this.acsTxId = "";

            const response = await asa.transferAsset(
                sender,
                receiver,
                assetId,
                amount,
                this.network
            );

            if (response !== undefined) {
                this.acsTxId = response.txId;
                this.setExplorerURL(response.txId);
            }
        },
        setExplorerURL(txId) {
            switch (this.network) {
                case "TestNet":
                    this.explorerURL =
                        "https://testnet.algoexplorer.io/tx/" + txId;
                    break;
                default:
                    this.explorerURL =
                        "http://localhost:8980/v2/transactions/" +
                        txId +
                        "?pretty";
                    break;
            }
        },
        async setNFTData() {
            const nftData = nftConfig.default.asa;

            this.nfts = await Promise.all(nftData.map( async (nft) => {
                // get json metadata file
                const url = nft[1].assetDef.url.replace(
                    "ipfs://",
                    "https://ipfs.io/ipfs/"
                );

                const response = await axios.get(url);
                const jsonMetadata = response.data;

                // get image url
                const imgUrl = jsonMetadata.image.replace(
                    "ipfs://",
                    "https://gateway.pinata.cloud/ipfs/"
                );

                // check metadata
                const validHash = asa.checkMetadataHash(
                    nft[1].assetDef.metadataHash,
                    nft[1].assetDef.url
                );
                
                return {
                    name: nft[0],
                    ...nft[1].assetDef,
                    assetIndex: nft[1].assetIndex,
                    creator: nft[1].creator,
                    txId: nft[1].txId,
                    jsonMetadata,
                    imgUrl,
                    validHash
                }
            }));
        },
    },
    async mounted() {
        await this.setNFTData();
    },
};
</script>
