(async () => {
  const r = await fetch("https://rest.runpod.io/v1/openapi.json");
  const j = await r.json();
  const post = j.paths && j.paths["/pods"] && j.paths["/pods"].post;
  const schema = post && post.requestBody && post.requestBody.content
    && post.requestBody.content["application/json"]
    && post.requestBody.content["application/json"].schema;
  const refKey = "$ref";
  let sch = schema;
  if (schema && schema[refKey]) {
    const name = schema[refKey].split("/").pop();
    sch = j.components.schemas[name];
  }
  if (!sch) { console.log("no schema found"); return; }
  console.log("PROPS:", Object.keys(sch.properties || {}).join(", "));
  console.log("REQUIRED:", (sch.required || []).join(", "));
  const keys = ["dockerStartCmd", "dockerEntrypoint", "networkVolumeId", "volumeMountPath",
    "dataCenterId", "gpuTypeIds", "gpuTypeId", "imageName", "env", "ports",
    "computeType", "cloudType", "containerDiskInGb", "gpuCount", "name", "vcpuCount", "minRAMPerGPU"];
  for (const k of keys) {
    if (sch.properties && sch.properties[k]) {
      console.log("  " + k + " => " + JSON.stringify(sch.properties[k]).slice(0, 200));
    }
  }
})().catch((e) => console.error("ERR", e.message));
