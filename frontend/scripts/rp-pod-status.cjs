require("dotenv").config({ path: ".env.local" });
const key = process.env.RUNPOD_API_KEY;
const podId = process.argv[2] || "fxfgo0456227e1";

async function gql(query, variables) {
  const r = await fetch("https://api.runpod.io/graphql?api_key=" + key, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = t; }
  return { status: r.status, d };
}

(async () => {
  const q = `query Pod($id: String!) {
    pod(input: { podId: $id }) {
      id
      name
      desiredStatus
      lastStatusChange
      imageName
      runtime { uptimeInSeconds ports { ip isIpPublic privatePort publicPort type } }
    }
  }`;
  const res = await gql(q, { id: podId });
  console.log("status", res.status);
  console.log(JSON.stringify(res.d, null, 2).slice(0, 1500));
})().catch((e) => console.error("ERR", e.message));
