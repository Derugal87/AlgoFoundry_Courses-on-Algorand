const algosdk = require('algosdk');

const kmdtoken = process.env.KMD_TOKEN;
const kmdserver = process.env.KMD_SERVER;
const kmdport = process.env.KMD_PORT;

const kmdclient = new algosdk.Kmd(kmdtoken, kmdserver, kmdport);

const getWalletHandle = async (wallet_name, wallet_password) => {
    let wallets = (await kmdclient.listWallets()).wallets;
    const wallet = wallets.find(item => {
        return item.name === wallet_name;
    })

    const wallethandle = (await kmdclient.initWalletHandle(wallet.id, wallet_password)).wallet_handle_token;

    return wallethandle;
}

const exportAccount = async (
    wallet_handle,
    wallet_password,
    wallet_account
) => {
    console.log("Exporting account from wallet...");

    let accountKey = await kmdclient.exportKey(
        wallet_handle,
        wallet_password,
        wallet_account
    );
    let mn = await algosdk.secretKeyToMnemonic(accountKey.private_key);
    console.log("Account mnemonic: ", mn);

    return mn;
};

(async () => {
    const walletName = process.env.KMD_WALLET_NAME;
    const walletPassword = process.env.KMD_WALLET_PASSWORD;

    // replace wallet account address from kmd create
    const accountAddress = "RXGESF2OKM35FQT5QDF2KBZYMWTBHXIV6NVRMVBVDYIPYUMROTQ5CH3ZMU";

    const walletHandle = await getWalletHandle(walletName, walletPassword);

    await exportAccount(walletHandle, walletPassword, accountAddress);
})();
