'use strict'

$(document).ready(function(some) {
    //WebSocket connect
    // webSocketConnect();
});

// function webSocketConnect() {
//     const ws = new WebSocket('ws://localhost:3001'); //TODO add to options

//     ws.onopen = () => {
//         ws.send(JSON.stringify({ event: "monitoring", payload: { }}));
//     }

//     ws.onclose = (event) => {
//         if (event.wasClean) {
//             alert(`Connection closed cleanly. Code: ${event.code} Reason: ${event.reason}`);
//         } else {
//             alert(`Lost connection. Code: ${event.code} Reason: ${event.reason}`); // например, "убит" процесс сервера
//         }
//     }

//     ws.onerror = (error) => {
//         alert("WebSocket error: " + error.message);
//         setTimeout(() => {
//             console.log(`Websocket: Connection reconnect`);
//             webSocketConnect();
//         }, 1000 * 10);
//     };

//     ws.onmessage = res => {
//         if (res.data) {
//             const data = JSON.parse(res.data);
//             console.log('data:', data);
//             // onWebSocketMessage(data);
//         }
//     }
// };

// function onWebSocketMessage(monitoringObj) {
    
//     // console.log(`Message from WS: ${monitoringObj}`);
// }
