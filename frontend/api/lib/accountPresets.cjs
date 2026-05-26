/** Créditos/idioma reservados para um email antes do primeiro login Google. */

function emailVariants(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const out = new Set([normalized]);
  if (normalized.includes("@gamil.com")) out.add(normalized.replace("@gamil.com", "@gmail.com"));
  if (normalized.includes("@gmail.com")) out.add(normalized.replace("@gmail.com", "@gamil.com"));
  return [...out];
}

async function findAccountPreset(db, email) {
  const variants = emailVariants(email);
  if (!variants.length) return null;
  return db.collection("account_presets").findOne({ email: { $in: variants } });
}

async function upsertAccountPreset(db, email, { credits, lang, note }) {
  const normalized = String(email || "").trim().toLowerCase();
  const doc = {
    email: normalized,
    email_variants: emailVariants(email),
    updated_at: new Date().toISOString(),
  };
  if (Number.isFinite(credits) && credits >= 0) doc.credits = Math.floor(credits);
  if (lang) doc.lang = String(lang).slice(0, 2);
  if (note) doc.note = String(note).slice(0, 200);
  await db.collection("account_presets").updateOne(
    { email: normalized },
    { $set: doc },
    { upsert: true },
  );
  return doc;
}

async function consumeAccountPreset(db, email) {
  const preset = await findAccountPreset(db, email);
  if (!preset) return null;
  await db.collection("account_presets").deleteMany({
    email: { $in: preset.email_variants || emailVariants(email) },
  });
  return preset;
}

module.exports = {
  emailVariants,
  findAccountPreset,
  upsertAccountPreset,
  consumeAccountPreset,
};
