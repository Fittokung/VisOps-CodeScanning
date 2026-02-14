
const amqp = require('amqplib');

const url = "amqp://localhost:5672"; 
const urlWithAuth = "amqp://guest:guest@localhost:5672";

(async () => {
  console.log("Testing connection to:", url);
  try {
    const conn = await amqp.connect(url);
    console.log("✅ Success connecting to " + url);
    await conn.close();
  } catch (e) {
    console.error("❌ Failed connecting to " + url, e.message);
  }

  console.log("Testing connection to:", urlWithAuth);
  try {
    const conn = await amqp.connect(urlWithAuth);
    console.log("✅ Success connecting to " + urlWithAuth);
    await conn.close();
  } catch (e) {
    console.error("❌ Failed connecting to " + urlWithAuth, e.message);
  }
})();
