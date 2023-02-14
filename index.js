
let client = null;
let pubsubEndpointUrl = null;
let token = null;
let connectionId = null;
let reconnectionToken = null;


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

    initReliableClient();
}

const initReliableClient = async () => {
    if (reconnectionToken === null) {
        client = new WebSocket(`${pubsubEndpointUrl}?access_token=${token}`, 'json.reliable.webpubsub.azure.v1');
    }
    else {
        client = new WebSocket(`${pubsubEndpointUrl}?awps_connection_id=${connectionId}&awps_reconnection_token=${reconnectionToken}`, 'json.reliable.webpubsub.azure.v1')
    }

    client.onopen = () => {
        client.send(JSON.stringify({
            "type": "joinGroup",
            "group": "idf"
        }));

        setInterval(async (client) => { await sendMessageToGroup(client) }, 1000);
    }

    client.onerror = (event) => {
        initReliableClient();
    }

    client.onmessage = (message) => {
        const messageData = JSON.parse(message.data);
        messageEventsHandler.get(messageData.type)(messageData);
    }
}

const sendMessageToGroup = async (client) => {
    client
}

init();