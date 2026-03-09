
const url = process.env.COSMIC_CLOUD_URL || "https://osmic-cloud-engine.fly.dev";

console.log("Testing connectivity to:", url);

async function test() {
  try {
    const start = Date.now();
    const res = await fetch(`${url}/health`);
    const duration = Date.now() - start;
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Duration: ${duration}ms`);
    
    if (res.ok) {
        const text = await res.text();
        console.log("Response:", text);
        console.log("✅ SUCCESS");
    } else {
        console.error("❌ HTTP ERROR");
    }
  } catch (err) {
    console.error("❌ NETWORK ERROR:", err);
    if (err.cause) console.error("Cause:", err.cause);
  }
}

test();
