
const url = process.env.COSMIC_CLOUD_URL || "https://osmic-cloud-engine.fly.dev";

const payload = {
  birth_date: "1980-06-24",
  birth_time: "15:20", 
  birth_location: {
    lat: 53.5511,
    lon: 9.9937
  },
  iana_time_zone: "Europe/Berlin"
};

console.log("Sending payload to:", `${url}/compute`);
console.log(payload);

async function test() {
  try {
    const res = await fetch(`${url}/compute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        console.error("HTTP Error:", res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log("\n----- FULL ENGINE RESPONSE -----");
    console.log(JSON.stringify(data, null, 2));
    
    console.log("\n----- BAZI SECTION -----");
    if (data.bazi) {
        console.log(data.bazi);
    } else {
        console.log("❌ Missing 'bazi' key in response!");
    }

  } catch (err) {
    console.error("❌ NETWORK ERROR:", err);
  }
}

test();
