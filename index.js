
let client = null;
let pubsubEndpointUrl = null;
let token = null;
let connectionId = null;
let reconnectionToken = null;
let ackId = 0;
let retryConnection = 0;


const messageEventsHandler = new Map([
    [
        "system", 
        (message) => {
            connectionId = message.connectionId;
            reconnectionToken = message.reconnectionToken;
            console.log(`${connectionId} ${token}`)
        }],
    [
        "message",
        (message) => {
            console.log(message);
        }

    ]
])

const init = async () => {
    const pubsubConnection = await (await fetch('http://localhost:8080/client', {
        method: 'POST'
    })).json();

    const pubsubUrl = new URL(pubsubConnection.url);

    pubsubEndpointUrl = `wss://${pubsubUrl.hostname}${pubsubUrl.pathname}`
    token = pubsubConnection.token;
    console.log(pubsubConnection);

    await initReliableClient();
}

const initReliableClient = async () => {
    if (reconnectionToken === null) {
        client = new WebSocket(`${pubsubEndpointUrl}?access_token=${token}`, 'json.reliable.webpubsub.azure.v1');
        retryConnection = 3;
    }
    else {
        if(retryConnection == 0){
            connectionId = null;
            reconnectionToken = null;
            init();
        }
        else {
            retryConnection--;
            client = new WebSocket(`${pubsubEndpointUrl}?awps_connection_id=${connectionId}&awps_reconnection_token=${reconnectionToken}`, 'json.reliable.webpubsub.azure.v1')
        }
    }

    client.onerror = (event) => {
        console.log(`error detected : ${ event.reason }`);
    }

    client.onmessage = (message) => {
        const messageData = JSON.parse(message.data);
        messageEventsHandler.get(messageData.type)(messageData);
    }

    client.onclose = (event) => {
        console.log(`close : ${ event.reason }`);
        setTimeout(initReliableClient, 5000);
    }

    client.onopen = async () => {
        console.log('Open');

        client.send(JSON.stringify({
            "type": "joinGroup",
            "group": "idf"
        }));

        // setInterval(async (client) => { await sendMessageToGroup(client) }, 1000);
    }
}

const sendMessageToGroup = async (client) => {
    console.log('sending message');

    client.send(JSON.stringify( {   "type": "sendToGroup",
    "group": "group1",
    "dataType" : "text",
    "data": "text data",
    "ackId": ackId }));

    ackId++;
}


// setTimeout(() => {
//     console.log('close');
//     client.close()
// }, 10000)

init();
