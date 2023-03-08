import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
import MyAlgoConnect from "@randlabs/myalgo-connect";

// Contains a list of methods to send transactions via different wallet connectors

const sendAlgoSignerTransaction = async (txn, algodClient) => {

    // algorand.encoding.msgpackToBase64(): receives a binary object (as a Uint8Array) and returns the corresponding base64 encoded string,
    // algorand.encoding.base64ToMsgpack(): receives a base64 encoded string and returns the corresponding binary object (as a Uint8Array),
    // algorand.encoding.stringToByteArray(): receives a plain unencoded string and returns the corresponding binary object (as a Uint8Array),
    // algorand.encoding.byteArrayToString(): receives a binary object (as a Uint8Array) and returns the corresponding plain unencoded string,


    //connect to AlgoSigner
    const algorand = window.algorand;
    //await algorand.enable();

    //check for the AlgoSigner API to be available in the browser context
    if (typeof algorand !== 'undefined') {
        try {
            // Get the binary and base64 encode it
            let binaryTxn = txn.toByte();
            let base64Txn = algorand.encoding.msgpackToBase64(binaryTxn);

            let signedTxns = await algorand.signTxns([
                {
                    txn: base64Txn,
                },
            ]);

            // Get the base64 encoded signed transaction and convert it to binary
            let binarySignedTxn = algorand.encoding.base64ToMsgpack(signedTxns[0]);

            //Send the transaction through the SDK client
            const response = await algodClient.sendRawTransaction(binarySignedTxn).do();
            console.log(response);

            return response;
        } catch (err) {
            console.error(err);
        }
    }
};

const sendWalletConnectTransaction = async (connector, txn, algodClient) => {
    try {
        // Sign transaction
        // txns is an array of algosdk.Transaction like below
        // i.e txns = [txn, ...someotherTxns], but we've only built one transaction in our case
        const txns = [txn];
        const txnsToSign = txns.map((txn) => {
            const encodedTxn = Buffer.from(
                algosdk.encodeUnsignedTransaction(txn)
            ).toString("base64");

            return {
                txn: encodedTxn,
                message: "Description of transaction being signed",
                // Note: if the transaction does not need to be signed (because it's part of an atomic group
                // that will be signed by another party), specify an empty singers array like so:
                // signers: [],
            };
        });

        const requestParams = [txnsToSign];

        const request = formatJsonRpcRequest("algo_signTxn", requestParams);
        const result = await connector.sendCustomRequest(request);
        const decodedResult = result.map((element) => {
            return element
                ? new Uint8Array(Buffer.from(element, "base64"))
                : null;
        });

        const response = await algodClient
            .sendRawTransaction(decodedResult)
            .do();
        console.log(response);

        return response;
    } catch (err) {
        console.error(err);
    }
};

const sendMyAlgoTransaction = async (txn, algodClient) => {
    try {
        const myAlgoWallet = new MyAlgoConnect();

        const signedTxn = await myAlgoWallet.signTransaction(txn.toByte());
        const response = await algodClient
            .sendRawTransaction(signedTxn.blob)
            .do();
        console.log(response);

        return response;
    } catch (err) {
        console.error(err);
    }
};

export default {
    sendWalletConnectTransaction,
    sendMyAlgoTransaction,
    sendAlgoSignerTransaction
};
