
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://VisScan:VisScan1234@localhost:5432/scandb',
});

(async () => {
  try {
    console.log("Testing Database Connection...");
    await client.connect();
    console.log("✅ Database Connected Successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Database Time:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("❌ Connection Failed:", err.message);
    if (err.message.includes('password authentication failed')) {
      console.log("\n⚠️  POSSIBLE CAUSE: The Database password in the running container does not match 'VisScan1234'.");
      console.log("   If you changed the password in docker-compose.yml AFTER the first run, the database won't update automatically.");
      console.log("   SOLUTION: You may need to delete the volume and restart (WARNING: Data loss).");
    }
    await client.end();
  }
})();
