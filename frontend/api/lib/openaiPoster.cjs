/**
 * Geração de pôster sem foto via OpenAI gpt-image-1 (texto mais fiável que Flux).
 */

async function generateOpenAIPosterImage(prompt, size = "1024x1536") {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  if (!key) {
    const err = new Error("OPENAI_API_KEY not configured");
    err.status = 503;
    throw err;
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: String(prompt || "").slice(0, 32000),
      size,
      n: 1,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenAI ${res.status}`);
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    throw err;
  }

  const item = data?.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }
  const err = new Error("OpenAI returned no image");
  err.status = 502;
  throw err;
}

module.exports = { generateOpenAIPosterImage };
