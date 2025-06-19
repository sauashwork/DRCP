// test-socket-client.js
const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to backend via Socket.IO");
});

socket.on("resources_updated", (data) => {
  console.log("Resource updated event received:", data);
});

socket.on("social_media_updated", (data) => {
  console.log("Social media updated event received:", data);
});