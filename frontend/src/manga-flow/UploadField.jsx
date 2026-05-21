export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function UploadField({ label, hint, onFile }) {
  return (
    <div className="mf-upload">
      {label && <p className="text-[0.8rem] text-[#c4b5fd] mb-1">{label}</p>}
      <label>
        ⬆️ Arraste ou clique para upload
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f || f.size > 5 * 1024 * 1024) return;
            const url = await readImageFile(f);
            onFile?.({ url, file: f });
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-[0.65rem] text-[#5a5a5e] mt-1">
        {hint || "PNG/JPG · Máx 5MB · Fundo transparente preferido"}
      </p>
    </div>
  );
}
