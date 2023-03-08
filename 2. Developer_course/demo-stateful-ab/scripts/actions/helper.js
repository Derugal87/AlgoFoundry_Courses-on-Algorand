// https://developer.algorand.org/docs/get-details/dapps/smart-contracts/frontend/apps/#read-state
async function readGlobalStateWithoutAlgoBuilder(client, index){
    const app = await client.getApplicationByID(index).do();
    const globalState = app.params["global-state"];

    const formattedGlobalState = globalState.map(item => {
        // decode from base64 encoded bytes
        const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));

        let formattedValue;
        if (item.value.type === 1) {
            //value is base64 encoded bytes, convert it back to string
            formattedValue = decodeURIComponent(Buffer.from(item.value.bytes, "base64"));
        } else {
            formattedValue = item.value.uint;
        }
        
        return {
            key: formattedKey,
            value: formattedValue
        }
    });

    return formattedGlobalState;
}

async function readLocalStateWithoutAlgoBuilder(client, address, index){
    const acc = await client.accountInformation(address).do();
    const localStates = acc["apps-local-state"];

    const appLocalState = localStates.find(ls => {
        return ls.id === index;
    })
    
    let formattedLocalState;
    if (appLocalState !== undefined) {
        formattedLocalState = appLocalState["key-value"].map(item => {
            // decode from base64 encoded bytes
            const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));
    
            let formattedValue;
            if (item.value.type === 1) {
                //value is base64 encoded bytes, convert it back to string
                formattedValue = decodeURIComponent(Buffer.from(item.value.bytes, "base64"));
            } else {
                formattedValue = item.value.uint;
            }
            
            return {
                key: formattedKey,
                value: formattedValue
            }
        });
    }

    return formattedLocalState;
}

module.exports = { 
    readGlobalStateWithoutAlgoBuilder,
    readLocalStateWithoutAlgoBuilder 
};