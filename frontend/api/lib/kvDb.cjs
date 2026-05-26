const { Redis } = require("@upstash/redis");

const COL_PREFIX = "rp:col:";

function kvEnabled() {
  return Boolean(
    process.env.KV_REST_API_URL
    && process.env.KV_REST_API_TOKEN,
  );
}

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return redis;
}

async function loadCol(name) {
  const data = await getRedis().get(`${COL_PREFIX}${name}`);
  if (!data) return [];
  return Array.isArray(data) ? data : [];
}

async function saveCol(name, rows) {
  await getRedis().set(`${COL_PREFIX}${name}`, rows);
}

function matchValue(docVal, cond) {
  if (cond == null) return docVal == null;
  if (typeof cond !== "object" || Array.isArray(cond)) return docVal === cond;
  if (cond.$gte != null) return docVal >= cond.$gte;
  if (cond.$lt != null) return docVal < cond.$lt;
  if (cond.$ne != null) return docVal !== cond.$ne;
  if (cond.$exists != null) {
    const has = docVal != null && docVal !== "";
    return cond.$exists ? has : !has;
  }
  if (cond.$in != null) return cond.$in.includes(docVal);
  if (cond.$nin != null) return !cond.$nin.includes(docVal);
  if (cond.$regex != null) {
    const re = new RegExp(cond.$regex, cond.$options || "");
    return re.test(String(docVal || ""));
  }
  return docVal === cond;
}

function matchDoc(doc, filter) {
  if (!filter || !Object.keys(filter).length) return true;
  if (filter.$or) return filter.$or.some((f) => matchDoc(doc, f));
  if (filter.$and) return filter.$and.every((f) => matchDoc(doc, f));
  return Object.entries(filter).every(([k, v]) => {
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

function applyUpdate(doc, update) {
  const next = { ...doc };
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
            const field = typeof expr.$sum === "string" ? expr.$sum.replace(/^\$ifNull\(\[\s*"\$([^"]+)"\s*,\s*0\s*\]\)$/, "$1") : null;
            if (field && expr.$sum?.$ifNull) {
              const inner = expr.$sum.$ifNull[0].replace(/^\$/, "");
              row[outKey === "total" ? "total" : outKey] = g.items.reduce(
                (s, it) => s + (Number(it[inner]) || 0),
                0,
              );
            } else if (typeof expr.$sum === "string" && expr.$sum.startsWith("$")) {
              const f = expr.$sum.slice(1);
              row[outKey] = g.items.reduce((s, it) => s + (Number(it[f]) || 0), 0);
            } else {
              row[outKey] = g.items.length * (Number(expr.$sum) || 0);
            }
          } else if (expr?.$sum === 1 || expr?.$sum?.$ifNull) {
            row[outKey] = g.items.reduce((s, it) => {
              const inner = expr.$sum?.$ifNull?.[0]?.replace?.(/^\$/, "") || null;
              return s + (inner ? Number(it[inner]) || 0 : 1);
            }, 0);
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
        if (stage.$group.total?.$sum) {
          const f = stage.$group.total.$sum.$ifNull?.[0]?.replace(/^\$/, "")
            || stage.$group.total.$sum.replace?.(/^\$/, "");
          if (f) row.total = g.items.reduce((s, it) => s + (Number(it[f]) || 0), 0);
        }
        data.push(row);
      }
    } else if (stage.$match && stage.$match.count) {
      data = data.filter((d) => d.count >= stage.$match.count.$gte);
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

function createCollection(name) {
  return {
    async countDocuments(filter = {}) {
      const rows = await loadCol(name);
      return rows.filter((d) => matchDoc(d, filter)).length;
    },

    async distinct(field, filter = {}) {
      const rows = await loadCol(name);
      const set = new Set();
      for (const d of rows) {
        if (matchDoc(d, filter) && d[field] != null) set.add(d[field]);
      }
      return [...set];
    },

    async findOne(filter, opts = {}) {
      const rows = await loadCol(name);
      const doc = rows.find((d) => matchDoc(d, filter));
      if (!doc) return null;
      return applyProjection(doc, opts.projection);
    },

    find(filter = {}, opts = {}) {
      const state = { filter, opts, sort: null, limitN: null };
      const api = {
        sort(spec) {
          state.sort = spec;
          return api;
        },
        limit(n) {
          state.limitN = n;
          return api;
        },
        async toArray() {
          let rows = (await loadCol(name)).filter((d) => matchDoc(d, state.filter));
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
          return rows.map((d) => applyProjection(d, state.opts.projection));
        },
      };
      return api;
    },

    async insertOne(doc) {
      const rows = await loadCol(name);
      if (name === "purchases" && doc.stripe_session_id) {
        if (rows.some((r) => r.stripe_session_id === doc.stripe_session_id)) {
          const err = new Error("duplicate");
          err.code = 11000;
          throw err;
        }
      }
      if (name === "users" && doc.email) {
        if (rows.some((r) => r.email === doc.email)) {
          const err = new Error("duplicate email");
          err.code = 11000;
          throw err;
        }
      }
      rows.push(doc);
      await saveCol(name, rows);
    },

    async updateOne(filter, update, opts = {}) {
      const rows = await loadCol(name);
      const idx = rows.findIndex((d) => matchDoc(d, filter));
      if (idx < 0) {
        if (opts.upsert) {
          const base = { ...filter };
          const doc = applyUpdate(base, update);
          rows.push(doc);
          await saveCol(name, rows);
          return { matchedCount: 1, modifiedCount: 1, upsertedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0 };
      }
      rows[idx] = applyUpdate(rows[idx], update);
      await saveCol(name, rows);
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async findOneAndUpdate(filter, update, opts = {}) {
      const rows = await loadCol(name);
      const idx = rows.findIndex((d) => matchDoc(d, filter));
      if (idx < 0) return null;
      rows[idx] = applyUpdate(rows[idx], update);
      await saveCol(name, rows);
      const doc = rows[idx];
      return applyProjection(doc, opts.projection);
    },

    async deleteOne(filter = {}) {
      const rows = await loadCol(name);
      const next = rows.filter((d) => !matchDoc(d, filter));
      const deletedCount = rows.length - next.length;
      if (deletedCount > 0) await saveCol(name, next);
      return { deletedCount, acknowledged: true };
    },

    async deleteMany(filter = {}) {
      const rows = await loadCol(name);
      const next = rows.filter((d) => !matchDoc(d, filter));
      const deletedCount = rows.length - next.length;
      if (deletedCount > 0) await saveCol(name, next);
      return { deletedCount, acknowledged: true };
    },

    aggregate(pipeline) {
      return {
        async toArray() {
          const rows = await loadCol(name);
          return runAggregate(name, rows, pipeline);
        },
      };
    },
  };
}

function createKvDb() {
  return {
    collection: (name) => createCollection(name),
  };
}

module.exports = { kvEnabled, createKvDb };
