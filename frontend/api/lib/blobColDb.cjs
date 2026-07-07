/**
 * Mongo-compatible store — one Vercel Blob JSON file per document (no whole-col races).
 */
const { put, list, del } = require("@vercel/blob");
const { blobPutOptions, isBlobConfigured } = require("./blobEnv.cjs");

const BLOB_DOC_PREFIX = "rp-doc/";
const LEGACY_COL_PREFIX = "rp-col/";
const migratedCols = new Set();

function blobColEnabled() {
  return isBlobConfigured();
}

function docPathname(col, id) {
  return `${BLOB_DOC_PREFIX}${col}/${encodeURIComponent(String(id))}.json`;
}

function metaPathname(col) {
  return `${BLOB_DOC_PREFIX}_meta/migrated-${col}.json`;
}

async function fetchJsonUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function listColBlobs(col) {
  const prefix = `${BLOB_DOC_PREFIX}${col}/`;
  const out = [];
  let cursor;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const page = await list({
      prefix,
      limit: 1000,
      cursor,
      ...blobPutOptions(),
    });
    out.push(...(page.blobs || []));
    if (!page.hasMore || !page.cursor) break;
    cursor = page.cursor;
  }
  return out;
}

async function loadDoc(col, id) {
  if (!id) return null;
  const pathname = docPathname(col, id);
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1, ...blobPutOptions() });
    const hit = blobs.find((b) => b.pathname === pathname) || blobs[0];
    if (!hit?.url) return null;
    const data = await fetchJsonUrl(hit.url);
    return data && typeof data === "object" ? data : null;
  } catch (err) {
    console.warn("[blobColDb] loadDoc failed", col, id, err?.message);
    return null;
  }
}

async function saveDoc(col, doc) {
  const withId = doc?.id ? doc : (doc?._id != null ? { ...doc, id: String(doc._id) } : null);
  if (!withId?.id) {
    const err = new Error("blobColDb: doc.id required");
    err.status = 500;
    throw err;
  }
  const body = JSON.stringify(withId);
  await put(docPathname(col, withId.id), body, {
    ...blobPutOptions(),
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function deleteDoc(col, id) {
  if (!id) return;
  try {
    await del(docPathname(col, id), blobPutOptions());
  } catch {
    /* already gone */
  }
}

async function loadLegacyCol(name) {
  const pathname = `${LEGACY_COL_PREFIX}${name}.json`;
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1, ...blobPutOptions() });
    const hit = blobs.find((b) => b.pathname === pathname) || blobs[0];
    if (!hit?.url) return [];
    const data = await fetchJsonUrl(hit.url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function ensureColMigrated(name) {
  if (migratedCols.has(name)) return;
  const marker = metaPathname(name);
  try {
    const { blobs } = await list({ prefix: marker, limit: 1, ...blobPutOptions() });
    if (blobs.length) {
      migratedCols.add(name);
      return;
    }
  } catch {
    /* continue migration */
  }
  const legacy = await loadLegacyCol(name);
  for (const doc of legacy) {
    if (doc?.id) {
      // eslint-disable-next-line no-await-in-loop
      await saveDoc(name, doc);
    }
  }
  await put(marker, JSON.stringify({ migrated_at: new Date().toISOString(), count: legacy.length }), {
    ...blobPutOptions(),
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  migratedCols.add(name);
  if (legacy.length) {
    console.log(`[blobColDb] migrated legacy ${name}: ${legacy.length} docs`);
  }
}

async function loadAllDocs(name) {
  await ensureColMigrated(name);
  const blobs = await listColBlobs(name);
  const docs = [];
  for (const b of blobs) {
    if (!b.url) continue;
    // eslint-disable-next-line no-await-in-loop
    const raw = await fetchJsonUrl(b.url);
    if (!raw || typeof raw !== "object") continue;
    const doc = raw.id ? raw : (raw._id != null ? { ...raw, id: String(raw._id) } : null);
    if (doc?.id) docs.push(doc);
  }
  return docs;
}

function matchValue(docVal, cond) {
  if (cond == null) return docVal == null;
  if (typeof cond !== "object" || Array.isArray(cond)) return docVal === cond;

  return Object.entries(cond).every(([op, val]) => {
    switch (op) {
      case "$gte": return docVal >= val;
      case "$gt": return docVal > val;
      case "$lte": return docVal <= val;
      case "$lt": return docVal < val;
      case "$eq": return docVal === val;
      case "$ne":
        if (Array.isArray(val) && Array.isArray(docVal)) {
          if (val.length === 0) return docVal.length > 0;
          return JSON.stringify(docVal) !== JSON.stringify(val);
        }
        return docVal !== val;
      case "$exists": {
        const has = docVal != null && docVal !== "";
        return val ? has : !has;
      }
      case "$in": return val.includes(docVal);
      case "$nin": return !val.includes(docVal);
      case "$regex": {
        const re = new RegExp(val, cond.$options || "");
        return re.test(String(docVal || ""));
      }
      case "$type": {
        if (val === "string") return typeof docVal === "string";
        if (val === "number") return typeof docVal === "number";
        if (val === "array") return Array.isArray(docVal);
        if (val === "null") return docVal == null;
        if (val === "bool" || val === "boolean") return typeof docVal === "boolean";
        if (val === "object") return docVal != null && typeof docVal === "object" && !Array.isArray(docVal);
        return typeof docVal === val;
      }
      case "$size": {
        const len = Array.isArray(docVal) ? docVal.length : 0;
        return len === val;
      }
      case "$not": return !matchValue(docVal, val);
      default: return false;
    }
  });
}

function matchDoc(doc, filter) {
  if (!filter || !Object.keys(filter).length) return true;
  return Object.entries(filter).every(([k, v]) => {
    if (k === "$or") return Array.isArray(v) && v.some((f) => matchDoc(doc, f));
    if (k === "$and") return Array.isArray(v) && v.every((f) => matchDoc(doc, f));
    if (k.startsWith("$")) return true;
    return matchValue(doc[k], v);
  });
}

function applyProjection(doc, projection) {
  if (!projection) return { ...doc };
  const out = {};
  const omit = projection._id === 0;
  for (const [k, v] of Object.entries(doc)) {
    if (k === "_id" && omit) continue;
    if (projection[k] === 0) continue;
    out[k] = v;
  }
  if (!omit && doc._id != null) out._id = doc._id;
  return out;
}

function applyUpdate(doc, update, { isInsert = false } = {}) {
  let next = { ...(doc || {}) };
  if (isInsert && update.$setOnInsert) {
    next = { ...update.$setOnInsert, ...next };
  }
  if (update.$set) Object.assign(next, update.$set);
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      next[k] = (Number(next[k]) || 0) + Number(v);
    }
  }
  return next;
}

function runAggregate(name, rows, pipeline) {
  let data = [...rows];
  for (const stage of pipeline) {
    if (stage.$match) data = data.filter((d) => matchDoc(d, stage.$match));
    else if (stage.$group) {
      const groups = new Map();
      for (const d of data) {
        let key = stage.$group._id;
        if (key === null) key = "__all__";
        else if (typeof key === "string" && key.startsWith("$")) {
          key = d[key.slice(1)] ?? null;
        }
        const gk = JSON.stringify(key);
        if (!groups.has(gk)) groups.set(gk, { _id: key === "__all__" ? null : key, items: [] });
        groups.get(gk).items.push(d);
      }
      data = [];
      for (const [, g] of groups) {
        const row = { _id: g._id };
        for (const [outKey, expr] of Object.entries(stage.$group)) {
          if (outKey === "_id") continue;
          if (expr?.$sum != null) {
            if (typeof expr.$sum === "string" && expr.$sum.startsWith("$")) {
              const f = expr.$sum.slice(1);
              row[outKey] = g.items.reduce((s, it) => s + (Number(it[f]) || 0), 0);
            } else {
              row[outKey] = g.items.length * (Number(expr.$sum) || 0);
            }
          } else if (expr?.$push) {
            row[outKey] = g.items.map((it) => {
              if (typeof expr.$push === "object") {
                const o = {};
                for (const [pk, pv] of Object.entries(expr.$push)) {
                  o[pk] = typeof pv === "string" && pv.startsWith("$") ? it[pv.slice(1)] : pv;
                }
                return o;
              }
              return it;
            });
          }
        }
        data.push(row);
      }
    } else if (stage.$count) {
      data = [{ n: data.length }];
    } else if (stage.$sort) {
      const [[field, dir]] = Object.entries(stage.$sort);
      data.sort((a, b) => (a[field] > b[field] ? 1 : -1) * (dir === -1 ? -1 : 1));
    } else if (stage.$limit) {
      data = data.slice(0, stage.$limit);
    }
  }
  return data;
}

function resolveFilterId(filter) {
  if (filter?.id && typeof filter.id === "string") return filter.id;
  if (filter?.id?.$in?.length === 1) return filter.id.$in[0];
  return null;
}

function createCollection(name) {
  return {
    async countDocuments(filter = {}) {
      const rows = await loadAllDocs(name);
      return rows.filter((d) => matchDoc(d, filter)).length;
    },

    async distinct(field, filter = {}) {
      const rows = await loadAllDocs(name);
      const set = new Set();
      for (const d of rows) {
        if (matchDoc(d, filter) && d[field] != null) set.add(d[field]);
      }
      return [...set];
    },

    async findOne(filter, opts = {}) {
      const directId = resolveFilterId(filter);
      if (directId && Object.keys(filter).length <= 2) {
        const doc = await loadDoc(name, directId);
        if (doc && matchDoc(doc, filter)) return applyProjection(doc, opts.projection);
      }
      const rows = await loadAllDocs(name);
      const doc = rows.find((d) => matchDoc(d, filter));
      if (!doc) return null;
      return applyProjection(doc, opts.projection);
    },

    find(filter = {}, opts = {}) {
      const state = { filter, opts, sort: null, limitN: null, projection: opts.projection || null };
      const api = {
        sort(spec) {
          state.sort = spec;
          return api;
        },
        limit(n) {
          state.limitN = n;
          return api;
        },
        project(spec) {
          state.projection = spec;
          return api;
        },
        async toArray() {
          let rows = (await loadAllDocs(name)).filter((d) => matchDoc(d, state.filter));
          if (state.sort) {
            const [[field, dir]] = Object.entries(state.sort);
            rows.sort((a, b) => {
              const av = a[field];
              const bv = b[field];
              if (av === bv) return 0;
              return (av > bv ? 1 : -1) * (dir === -1 ? -1 : 1);
            });
          }
          if (state.limitN != null) rows = rows.slice(0, state.limitN);
          const proj = state.projection || state.opts.projection;
          return rows.map((d) => applyProjection(d, proj));
        },
      };
      return api;
    },

    async insertOne(doc) {
      if (!doc?.id) {
        const err = new Error("blobColDb insert: id required");
        err.status = 500;
        throw err;
      }
      const existing = await loadDoc(name, doc.id);
      if (existing) {
        if (name === "purchases" && doc.stripe_session_id && existing.stripe_session_id === doc.stripe_session_id) {
          const err = new Error("duplicate");
          err.code = 11000;
          throw err;
        }
        if (name === "users" && doc.email && existing.email === doc.email) {
          const err = new Error("duplicate email");
          err.code = 11000;
          throw err;
        }
        const err = new Error("duplicate id");
        err.code = 11000;
        throw err;
      }
      if (name === "users" && doc.email) {
        const rows = await loadAllDocs(name);
        if (rows.some((r) => r.email === doc.email)) {
          const err = new Error("duplicate email");
          err.code = 11000;
          throw err;
        }
      }
      await saveDoc(name, doc);
    },

    async updateOne(filter, update, opts = {}) {
      const directId = resolveFilterId(filter) || filter?.id;
      let doc = directId ? await loadDoc(name, directId) : null;
      if (doc && !matchDoc(doc, filter)) doc = null;

      if (!doc) {
        const rows = await loadAllDocs(name);
        doc = rows.find((d) => matchDoc(d, filter)) || null;
      }

      if (!doc) {
        if (opts.upsert) {
          let merged = { ...filter };
          if (update.$setOnInsert) merged = { ...update.$setOnInsert, ...merged };
          merged = applyUpdate(merged, update, { isInsert: true });
          if (!merged.id && filter.id) merged.id = filter.id;
          await saveDoc(name, merged);
          return { matchedCount: 1, modifiedCount: 1, upsertedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0 };
      }

      const next = applyUpdate(doc, update);
      await saveDoc(name, next);
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async findOneAndUpdate(filter, update, opts = {}) {
      const directId = resolveFilterId(filter) || filter?.id;
      let doc = directId ? await loadDoc(name, directId) : null;
      if (doc && !matchDoc(doc, filter)) doc = null;
      if (!doc) {
        const rows = await loadAllDocs(name);
        doc = rows.find((d) => matchDoc(d, filter)) || null;
      }
      if (!doc) return null;
      const before = { ...doc };
      const next = applyUpdate(doc, update);
      await saveDoc(name, next);
      const ret = opts.returnDocument === "after" ? next : before;
      return applyProjection(ret, opts.projection);
    },

    async deleteOne(filter = {}) {
      const directId = resolveFilterId(filter) || filter?.id;
      if (directId) {
        const doc = await loadDoc(name, directId);
        if (doc && matchDoc(doc, filter)) {
          await deleteDoc(name, directId);
          return { deletedCount: 1, acknowledged: true };
        }
      }
      const rows = await loadAllDocs(name);
      const victim = rows.find((d) => matchDoc(d, filter));
      if (!victim?.id) return { deletedCount: 0, acknowledged: true };
      await deleteDoc(name, victim.id);
      return { deletedCount: 1, acknowledged: true };
    },

    async deleteMany(filter = {}) {
      const rows = await loadAllDocs(name);
      const victims = rows.filter((d) => matchDoc(d, filter));
      for (const v of victims) {
        // eslint-disable-next-line no-await-in-loop
        if (v.id) await deleteDoc(name, v.id);
      }
      return { deletedCount: victims.length, acknowledged: true };
    },

    aggregate(pipeline) {
      return {
        async toArray() {
          const rows = await loadAllDocs(name);
          return runAggregate(name, rows, pipeline);
        },
      };
    },
  };
}

function createBlobColDb() {
  return {
    collection: (name) => createCollection(name),
  };
}

async function pingBlobColDb() {
  if (!blobColEnabled()) return { ok: false, reason: "blob_not_configured" };
  try {
    const id = `ping_${Date.now()}`;
    const col = "_health_probe";
    await saveDoc(col, { id, ts: Date.now() });
    const back = await loadDoc(col, id);
    const ok = back?.id === id;
    return { ok, reason: ok ? "ok" : "read_mismatch" };
  } catch (err) {
    return { ok: false, reason: err?.message || "blob_error" };
  }
}

module.exports = { blobColEnabled, createBlobColDb, pingBlobColDb };
