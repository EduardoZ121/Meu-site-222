import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STORAGE_KEYS = {
  profile: "kuteka.market.profile",
  listings: "kuteka.market.listings",
  favorites: "kuteka.market.favorites",
  history: "kuteka.market.history",
};

const accountTypes = [
  "Proprietário Particular",
  "Agente Imobiliário",
  "Empresa Imobiliária",
];

const provinces = {
  Luanda: ["Belas", "Cazenga", "Kilamba Kiaxi", "Talatona", "Viana"],
  Benguela: ["Benguela", "Lobito", "Catumbela"],
  Huíla: ["Lubango", "Chibia", "Humpata"],
  Huambo: ["Huambo", "Caála", "Bailundo"],
};

const bairros = {
  Belas: ["Talatona", "Benfica", "Morro Bento"],
  Cazenga: ["Cazenga", "11 de Novembro", "Hoji-ya-Henda"],
  "Kilamba Kiaxi": ["Golfe", "Palanca", "Nova Vida"],
  Talatona: ["Cidade Financeira", "Camama", "Lar do Patriota"],
  Viana: ["Zango", "Estalagem", "Vila Flor"],
  Benguela: ["Praia Morena", "Compão", "Lobito Velho"],
  Lobito: ["Restinga", "Compão", "Canata"],
  Catumbela: ["Catumbela Centro", "Gama", "Biópio"],
  Lubango: ["Mapunda", "Tchioco", "Nambambe"],
  Chibia: ["Cacula", "Jau", "Quihita"],
  Humpata: ["Humpata Centro", "Neves Bendinha", "Kuvango"],
  Huambo: ["São Pedro", "Calomanda", "Samissassa"],
  "Caála": ["Sede", "Catchiungo", "Katchiungo"],
  Bailundo: ["Bailundo Centro", "Tchikala", "Lunge"],
};

const starterListings = [
  {
    id: "l-1",
    category: "Imóvel",
    operation: "Arrendamento",
    propertyType: "Apartamento",
    title: "T3 moderno no Talatona",
    price: 850000,
    province: "Luanda",
    municipality: "Talatona",
    neighborhood: "Cidade Financeira",
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    ownerName: "Adriano Manuel",
    ownerType: "Proprietário Particular",
    phone: "+244923000111",
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: false,
    trustSeal: "Prata",
    description: "Apartamento com segurança 24h, estacionamento e acesso rápido à via expressa.",
    lat: 0.64,
    lng: 0.74,
    createdAt: "2026-06-01",
  },
  {
    id: "l-2",
    category: "Imóvel",
    operation: "Venda",
    propertyType: "Vivenda",
    title: "Vivenda T4 no Kilamba",
    price: 215000000,
    province: "Luanda",
    municipality: "Kilamba Kiaxi",
    neighborhood: "Nova Vida",
    bedrooms: 4,
    bathrooms: 4,
    area: 280,
    ownerName: "Nova Era Imobiliária",
    ownerType: "Empresa Imobiliária",
    phone: "+244937000222",
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: true,
    trustSeal: "Ouro",
    description: "Empreendimento com documentação em dia e financiamento possível.",
    lat: 0.52,
    lng: 0.66,
    createdAt: "2026-06-10",
  },
  {
    id: "l-3",
    category: "Veículo",
    operation: "Venda",
    title: "Toyota Prado 2019",
    price: 42000000,
    province: "Luanda",
    municipality: "Viana",
    neighborhood: "Zango",
    brand: "Toyota",
    model: "Prado",
    year: 2019,
    mileage: 68000,
    fuel: "Diesel",
    gearbox: "Automática",
    condition: "Semi-novo",
    ownerName: "Stand Kilamba Motors",
    ownerType: "Agente Imobiliário",
    phone: "+244936000333",
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: true,
    trustSeal: "Ouro",
    description: "Veículo em excelente estado, revisão completa e histórico disponível.",
    lat: 0.74,
    lng: 0.49,
    createdAt: "2026-05-28",
  },
];

const emptyListing = {
  category: "Imóvel",
  operation: "Arrendamento",
  propertyType: "Apartamento",
  title: "",
  price: "",
  province: "Luanda",
  municipality: "Talatona",
  neighborhood: "Cidade Financeira",
  bedrooms: "",
  bathrooms: "",
  area: "",
  brand: "",
  model: "",
  year: "",
  mileage: "",
  fuel: "Gasolina",
  gearbox: "Automática",
  condition: "Semi-novo",
  description: "",
};

function parseStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function MarketplaceAngola() {
  const [profile, setProfile] = useState(() =>
    parseStorage(STORAGE_KEYS.profile, {
      name: "",
      email: "",
      phone: "",
      type: accountTypes[0],
      verifiedProfile: false,
      verifiedPhone: false,
      verifiedDocument: false,
    }),
  );
  const [listings, setListings] = useState(() => parseStorage(STORAGE_KEYS.listings, starterListings));
  const [favorites, setFavorites] = useState(() => parseStorage(STORAGE_KEYS.favorites, []));
  const [history, setHistory] = useState(() => parseStorage(STORAGE_KEYS.history, []));
  const [compare, setCompare] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chatByListing, setChatByListing] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [listingForm, setListingForm] = useState(emptyListing);
  const [filters, setFilters] = useState({
    category: "Todos",
    operation: "Todos",
    province: "Todos",
    municipality: "Todos",
    neighborhood: "Todos",
    minPrice: "",
    maxPrice: "",
    brand: "",
    model: "",
    yearMin: "",
    yearMax: "",
    mileageMax: "",
    fuel: "Todos",
    gearbox: "Todos",
    condition: "Todos",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings));
  }, [listings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filters.category !== "Todos" && l.category !== filters.category) return false;
      if (filters.operation !== "Todos" && l.operation !== filters.operation) return false;
      if (filters.province !== "Todos" && l.province !== filters.province) return false;
      if (filters.municipality !== "Todos" && l.municipality !== filters.municipality) return false;
      if (filters.neighborhood !== "Todos" && l.neighborhood !== filters.neighborhood) return false;
      if (filters.minPrice && Number(l.price) < Number(filters.minPrice)) return false;
      if (filters.maxPrice && Number(l.price) > Number(filters.maxPrice)) return false;
      if (l.category === "Veículo") {
        if (filters.brand && !String(l.brand || "").toLowerCase().includes(filters.brand.toLowerCase())) return false;
        if (filters.model && !String(l.model || "").toLowerCase().includes(filters.model.toLowerCase())) return false;
        if (filters.yearMin && Number(l.year || 0) < Number(filters.yearMin)) return false;
        if (filters.yearMax && Number(l.year || 0) > Number(filters.yearMax)) return false;
        if (filters.mileageMax && Number(l.mileage || 0) > Number(filters.mileageMax)) return false;
        if (filters.fuel !== "Todos" && l.fuel !== filters.fuel) return false;
        if (filters.gearbox !== "Todos" && l.gearbox !== filters.gearbox) return false;
        if (filters.condition !== "Todos" && l.condition !== filters.condition) return false;
      }
      return true;
    });
  }, [filters, listings]);

  const avgByZone = useMemo(() => {
    const groups = {};
    listings.forEach((l) => {
      const key = `${l.province} / ${l.municipality} / ${l.neighborhood}`;
      groups[key] = groups[key] || { total: 0, count: 0 };
      groups[key].total += Number(l.price || 0);
      groups[key].count += 1;
    });
    return Object.entries(groups)
      .map(([zone, stats]) => ({ zone, avg: Math.round(stats.total / stats.count), count: stats.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [listings]);

  const selectedMessages = selected ? chatByListing[selected.id] || [] : [];

  function updateListingField(key, value) {
    setListingForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "province") {
        const mun = provinces[value]?.[0] || "";
        next.municipality = mun;
        next.neighborhood = bairros[mun]?.[0] || "";
      }
      if (key === "municipality") {
        next.neighborhood = bairros[value]?.[0] || "";
      }
      return next;
    });
  }

  function submitListing(e) {
    e.preventDefault();
    if (!profile.name || !profile.phone) return;
    const base = {
      id: `l-${Date.now()}`,
      category: listingForm.category,
      operation: listingForm.operation,
      title: listingForm.title,
      price: Number(listingForm.price),
      province: listingForm.province,
      municipality: listingForm.municipality,
      neighborhood: listingForm.neighborhood,
      ownerName: profile.name,
      ownerType: profile.type,
      phone: profile.phone,
      verifiedProfile: profile.verifiedProfile,
      verifiedPhone: profile.verifiedPhone,
      verifiedDocument: profile.verifiedDocument,
      trustSeal: profile.verifiedProfile && profile.verifiedPhone ? (profile.verifiedDocument ? "Ouro" : "Prata") : "Sem selo",
      description: listingForm.description,
      lat: Number((Math.random() * 0.85 + 0.08).toFixed(2)),
      lng: Number((Math.random() * 0.85 + 0.08).toFixed(2)),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const payload =
      listingForm.category === "Imóvel"
        ? {
            ...base,
            propertyType: listingForm.propertyType,
            bedrooms: Number(listingForm.bedrooms || 0),
            bathrooms: Number(listingForm.bathrooms || 0),
            area: Number(listingForm.area || 0),
          }
        : {
            ...base,
            brand: listingForm.brand,
            model: listingForm.model,
            year: Number(listingForm.year || 0),
            mileage: Number(listingForm.mileage || 0),
            fuel: listingForm.fuel,
            gearbox: listingForm.gearbox,
            condition: listingForm.condition,
          };

    setListings((prev) => [payload, ...prev]);
    setListingForm(emptyListing);
  }

  function openListing(listing) {
    setSelected(listing);
    setHistory((prev) => {
      const next = [listing.id, ...prev.filter((id) => id !== listing.id)].slice(0, 20);
      return next;
    });
  }

  function toggleFavorite(id) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function toggleCompare(id) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function sendChat() {
    if (!selected || !chatInput.trim()) return;
    setChatByListing((prev) => ({
      ...prev,
      [selected.id]: [
        ...(prev[selected.id] || []),
        { who: "Comprador", text: chatInput.trim(), at: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) },
      ],
    }));
    setChatInput("");
  }

  const compareItems = compare.map((id) => listings.find((l) => l.id === id)).filter(Boolean);
  const historyItems = history.map((id) => listings.find((l) => l.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-rp-bg text-rp-text" data-testid="marketplace-angola">
      <Navbar />

      <main className="pt-28 pb-16">
        <section className="container-rp mb-10">
          <p className="eyebrow mb-3">Kuteka • Marketplace Angola</p>
          <h1 className="heading-xl mb-4">Compra, venda e arrendamento com confiança e contacto direto.</h1>
          <p className="body-text max-w-3xl">
            Implementação com tipos de utilizador, verificação, anúncios de imóveis e veículos, filtros por localização, chat interno, WhatsApp,
            favoritos, comparação, histórico e painel de monetização.
          </p>
        </section>

        <section className="container-rp grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-rp-surface border border-rp-border p-5 rounded-2xl">
            <h2 className="font-heading text-2xl mb-4">Perfil e verificação</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input className="input-rp" placeholder="Nome" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              <input className="input-rp" placeholder="Email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
              <input className="input-rp" placeholder="Telefone (+244...)" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              <select className="input-rp" value={profile.type} onChange={(e) => setProfile((p) => ({ ...p, type: e.target.value }))}>
                {accountTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <Toggle label="Perfil verificado" checked={profile.verifiedProfile} onToggle={() => setProfile((p) => ({ ...p, verifiedProfile: !p.verifiedProfile }))} />
              <Toggle label="Telefone verificado" checked={profile.verifiedPhone} onToggle={() => setProfile((p) => ({ ...p, verifiedPhone: !p.verifiedPhone }))} />
              <Toggle label="Documento validado (opcional)" checked={profile.verifiedDocument} onToggle={() => setProfile((p) => ({ ...p, verifiedDocument: !p.verifiedDocument }))} />
            </div>
          </div>

          <div className="bg-rp-surface border border-rp-border p-5 rounded-2xl">
            <h3 className="font-heading text-xl mb-3">Selo de confiança</h3>
            <p className="body-text mb-2">{profile.verifiedProfile && profile.verifiedPhone ? (profile.verifiedDocument ? "Ouro" : "Prata") : "Sem selo"}</p>
            <p className="text-rp-mute text-sm">Anúncios com selo recebem mais cliques e contactos.</p>
          </div>
        </section>

        <section className="container-rp bg-rp-surface border border-rp-border p-5 rounded-2xl mb-10">
          <h2 className="font-heading text-2xl mb-4">Publicar anúncio (imóvel ou veículo)</h2>
          <form onSubmit={submitListing} className="grid md:grid-cols-3 gap-4">
            <select className="input-rp" value={listingForm.category} onChange={(e) => updateListingField("category", e.target.value)}>
              <option>Imóvel</option><option>Veículo</option>
            </select>
            <select className="input-rp" value={listingForm.operation} onChange={(e) => updateListingField("operation", e.target.value)}>
              <option>Arrendamento</option><option>Venda</option>
            </select>
            {listingForm.category === "Imóvel" ? (
              <select className="input-rp" value={listingForm.propertyType} onChange={(e) => updateListingField("propertyType", e.target.value)}>
                <option>Apartamento</option><option>Vivenda</option><option>Terreno</option><option>Loja</option>
              </select>
            ) : (
              <input className="input-rp" placeholder="Marca" value={listingForm.brand} onChange={(e) => updateListingField("brand", e.target.value)} />
            )}
            <input className="input-rp md:col-span-2" placeholder="Título" value={listingForm.title} onChange={(e) => updateListingField("title", e.target.value)} required />
            <input className="input-rp" type="number" placeholder="Preço (Kz)" value={listingForm.price} onChange={(e) => updateListingField("price", e.target.value)} required />
            <select className="input-rp" value={listingForm.province} onChange={(e) => updateListingField("province", e.target.value)}>{Object.keys(provinces).map((p) => <option key={p}>{p}</option>)}</select>
            <select className="input-rp" value={listingForm.municipality} onChange={(e) => updateListingField("municipality", e.target.value)}>{(provinces[listingForm.province] || []).map((m) => <option key={m}>{m}</option>)}</select>
            <select className="input-rp" value={listingForm.neighborhood} onChange={(e) => updateListingField("neighborhood", e.target.value)}>{(bairros[listingForm.municipality] || []).map((b) => <option key={b}>{b}</option>)}</select>

            {listingForm.category === "Imóvel" ? (
              <>
                <input className="input-rp" type="number" placeholder="Quartos" value={listingForm.bedrooms} onChange={(e) => updateListingField("bedrooms", e.target.value)} />
                <input className="input-rp" type="number" placeholder="Casas de banho" value={listingForm.bathrooms} onChange={(e) => updateListingField("bathrooms", e.target.value)} />
                <input className="input-rp" type="number" placeholder="Área (m²)" value={listingForm.area} onChange={(e) => updateListingField("area", e.target.value)} />
              </>
            ) : (
              <>
                <input className="input-rp" placeholder="Modelo" value={listingForm.model} onChange={(e) => updateListingField("model", e.target.value)} />
                <input className="input-rp" type="number" placeholder="Ano" value={listingForm.year} onChange={(e) => updateListingField("year", e.target.value)} />
                <input className="input-rp" type="number" placeholder="Quilometragem" value={listingForm.mileage} onChange={(e) => updateListingField("mileage", e.target.value)} />
                <select className="input-rp" value={listingForm.fuel} onChange={(e) => updateListingField("fuel", e.target.value)}><option>Gasolina</option><option>Diesel</option><option>Elétrico</option><option>Híbrido</option></select>
                <select className="input-rp" value={listingForm.gearbox} onChange={(e) => updateListingField("gearbox", e.target.value)}><option>Automática</option><option>Manual</option></select>
                <select className="input-rp" value={listingForm.condition} onChange={(e) => updateListingField("condition", e.target.value)}><option>Semi-novo</option><option>Usado</option><option>Novo</option></select>
              </>
            )}

            <textarea className="input-rp md:col-span-3 min-h-[84px]" placeholder="Descrição" value={listingForm.description} onChange={(e) => updateListingField("description", e.target.value)} />
            <button className="btn-primary md:col-span-3" type="submit">Publicar anúncio</button>
          </form>
        </section>

        <section className="container-rp grid lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1 bg-rp-surface border border-rp-border p-4 rounded-2xl h-fit">
            <h3 className="font-heading text-xl mb-3">Filtros avançados</h3>
            <FilterSelect label="Categoria" value={filters.category} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} options={["Todos", "Imóvel", "Veículo"]} />
            <FilterSelect label="Operação" value={filters.operation} onChange={(v) => setFilters((f) => ({ ...f, operation: v }))} options={["Todos", "Arrendamento", "Venda"]} />
            <FilterSelect label="Província" value={filters.province} onChange={(v) => setFilters((f) => ({ ...f, province: v }))} options={["Todos", ...Object.keys(provinces)]} />
            <FilterSelect label="Município" value={filters.municipality} onChange={(v) => setFilters((f) => ({ ...f, municipality: v }))} options={["Todos", ...new Set(Object.values(provinces).flat())]} />
            <FilterSelect label="Bairro" value={filters.neighborhood} onChange={(v) => setFilters((f) => ({ ...f, neighborhood: v }))} options={["Todos", ...new Set(Object.values(bairros).flat())]} />
            <input className="input-rp mt-2" type="number" placeholder="Preço mínimo" value={filters.minPrice} onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))} />
            <input className="input-rp mt-2" type="number" placeholder="Preço máximo" value={filters.maxPrice} onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} />

            <p className="text-sm text-rp-mute mt-4 mb-2">Filtros de veículos</p>
            <input className="input-rp" placeholder="Marca" value={filters.brand} onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))} />
            <input className="input-rp mt-2" placeholder="Modelo" value={filters.model} onChange={(e) => setFilters((f) => ({ ...f, model: e.target.value }))} />
            <input className="input-rp mt-2" type="number" placeholder="Ano mínimo" value={filters.yearMin} onChange={(e) => setFilters((f) => ({ ...f, yearMin: e.target.value }))} />
            <input className="input-rp mt-2" type="number" placeholder="Ano máximo" value={filters.yearMax} onChange={(e) => setFilters((f) => ({ ...f, yearMax: e.target.value }))} />
            <input className="input-rp mt-2" type="number" placeholder="KM máximo" value={filters.mileageMax} onChange={(e) => setFilters((f) => ({ ...f, mileageMax: e.target.value }))} />
            <FilterSelect label="Combustível" value={filters.fuel} onChange={(v) => setFilters((f) => ({ ...f, fuel: v }))} options={["Todos", "Gasolina", "Diesel", "Elétrico", "Híbrido"]} />
            <FilterSelect label="Caixa" value={filters.gearbox} onChange={(v) => setFilters((f) => ({ ...f, gearbox: v }))} options={["Todos", "Automática", "Manual"]} />
            <FilterSelect label="Estado" value={filters.condition} onChange={(v) => setFilters((f) => ({ ...f, condition: v }))} options={["Todos", "Novo", "Semi-novo", "Usado"]} />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-rp-surface border border-rp-border p-4 rounded-2xl mb-4">
              <h3 className="font-heading text-xl mb-1">Mapa interativo (visualização de zona)</h3>
              <p className="text-rp-mute text-sm mb-3">Clique num ponto para abrir anúncio.</p>
              <div className="relative bg-rp-bg border border-rp-border rounded-xl h-64 overflow-hidden">
                {filtered.map((l) => (
                  <button
                    key={`map-${l.id}`}
                    onClick={() => openListing(l)}
                    title={l.title}
                    className="absolute w-4 h-4 rounded-full bg-rp-lavender border border-white"
                    style={{ left: `${(l.lng || 0.5) * 100}%`, top: `${(l.lat || 0.5) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((l) => (
                <article key={l.id} className="bg-rp-surface border border-rp-border rounded-2xl p-4">
                  <div className="flex justify-between gap-3 mb-2">
                    <p className="text-sm text-rp-mute">{l.category} • {l.operation}</p>
                    <TrustBadge listing={l} />
                  </div>
                  <h4 className="font-heading text-xl mb-1">{l.title}</h4>
                  <p className="text-rp-mute text-sm mb-2">{l.province} / {l.municipality} / {l.neighborhood}</p>
                  <p className="font-heading text-lg mb-2">{formatKz(l.price)}</p>
                  {l.category === "Imóvel" ? (
                    <p className="text-sm text-rp-mute">{l.propertyType} • {l.bedrooms} quartos • {l.bathrooms} WC • {l.area}m²</p>
                  ) : (
                    <p className="text-sm text-rp-mute">{l.brand} {l.model} • {l.year} • {l.mileage} km • {l.fuel} • {l.gearbox}</p>
                  )}
                  <p className="text-sm mt-2 line-clamp-3">{l.description}</p>
                  <p className="text-xs text-rp-mute mt-2">{l.ownerType} • {l.ownerName}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button className="btn-secondary" onClick={() => openListing(l)}>Ver detalhes</button>
                    <button className="btn-secondary" onClick={() => toggleFavorite(l.id)}>{favorites.includes(l.id) ? "Remover favorito" : "Favoritar"}</button>
                    <button className="btn-secondary" onClick={() => toggleCompare(l.id)}>{compare.includes(l.id) ? "Remover comparação" : "Comparar"}</button>
                    <a className="btn-secondary" href={`https://wa.me/${String(l.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
                    <a className="btn-secondary" href={`tel:${l.phone}`}>Ligar</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-rp grid lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-rp-surface border border-rp-border p-5 rounded-2xl">
            <h3 className="font-heading text-2xl mb-3">Comparação de imóveis/veículos</h3>
            {compareItems.length === 0 ? <p className="text-rp-mute">Selecione até 3 anúncios para comparar.</p> : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left border-b border-rp-border"><th className="py-2">Título</th><th>Preço</th><th>Tipo</th><th>Local</th></tr></thead>
                  <tbody>
                    {compareItems.map((c) => (
                      <tr key={`cmp-${c.id}`} className="border-b border-rp-border">
                        <td className="py-2">{c.title}</td>
                        <td>{formatKz(c.price)}</td>
                        <td>{c.category === "Imóvel" ? c.propertyType : `${c.brand} ${c.model}`}</td>
                        <td>{c.neighborhood}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-rp-surface border border-rp-border p-5 rounded-2xl">
            <h3 className="font-heading text-2xl mb-3">Histórico de visualizações</h3>
            {historyItems.length === 0 ? <p className="text-rp-mute">Ainda sem histórico.</p> : (
              <ul className="space-y-2 max-h-64 overflow-auto">
                {historyItems.map((h) => <li key={`h-${h.id}`} className="text-sm border-b border-rp-border pb-2">{h.title} — {h.neighborhood}</li>)}
              </ul>
            )}
          </div>
        </section>

        <section className="container-rp grid lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-rp-surface border border-rp-border p-5 rounded-2xl">
            <h3 className="font-heading text-2xl mb-3">Relatório de preços médios por zona</h3>
            <div className="space-y-2">
              {avgByZone.map((r) => (
                <div key={r.zone} className="flex justify-between text-sm border-b border-rp-border pb-2">
                  <span>{r.zone}</span>
                  <span>{formatKz(r.avg)} ({r.count} anúncios)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-rp-surface border border-rp-border p-5 rounded-2xl">
            <h3 className="font-heading text-2xl mb-3">Monetização sem comissão elevada</h3>
            <ul className="space-y-2 text-sm">
              <li>• Planos Premium para maior destaque</li>
              <li>• Anúncios patrocinados por zona/categoria</li>
              <li>• Destaque na página inicial</li>
              <li>• Conta profissional para agentes e empresas</li>
              <li>• Publicidade de parceiros (bancos, seguros, stand, construtoras)</li>
              <li>• Serviços adicionais: fotografia, vídeo e promoção</li>
            </ul>
          </div>
        </section>

        {selected && (
          <section className="container-rp mb-12">
            <div className="bg-rp-surface border border-rp-border p-5 rounded-2xl">
              <h3 className="font-heading text-2xl mb-2">{selected.title}</h3>
              <p className="text-sm text-rp-mute mb-4">Chat interno com o anunciante</p>
              <div className="bg-rp-bg border border-rp-border rounded-xl p-3 h-48 overflow-auto mb-3">
                {selectedMessages.length === 0 ? (
                  <p className="text-sm text-rp-mute">Inicie uma conversa com o anunciante.</p>
                ) : (
                  selectedMessages.map((m, idx) => (
                    <p key={`${selected.id}-${idx}`} className="text-sm mb-2"><strong>{m.who}</strong> ({m.at}): {m.text}</p>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input className="input-rp flex-1" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Escrever mensagem..." />
                <button className="btn-primary" onClick={sendChat}>Enviar</button>
                <a className="btn-secondary" href={`https://wa.me/${String(selected.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp direto</a>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Toggle({ label, checked, onToggle }) {
  return (
    <button type="button" className={`px-3 py-2 rounded-full border text-sm ${checked ? "bg-rp-lavender/20 border-rp-lavender" : "border-rp-border"}`} onClick={onToggle}>
      {checked ? "✓" : "○"} {label}
    </button>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block mt-2">
      <span className="text-xs text-rp-mute">{label}</span>
      <select className="input-rp mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => <option key={opt}>{opt}</option>)}
      </select>
    </label>
  );
}

function TrustBadge({ listing }) {
  const tone = listing.trustSeal === "Ouro" ? "text-yellow-300" : listing.trustSeal === "Prata" ? "text-slate-300" : "text-rp-mute";
  return <span className={`text-xs font-mono uppercase ${tone}`}>{listing.trustSeal}</span>;
}

function formatKz(value) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(Number(value || 0));
}
