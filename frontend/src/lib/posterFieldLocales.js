/** Poster form field labels — pt, en, es, fr. */

const FIELD_LABELS = {
  headline: {
    pt: "Manchete / título",
    en: "Headline",
    es: "Titular",
    fr: "Titre principal",
  },
  subtitle: {
    pt: "Subtítulo",
    en: "Subtitle",
    es: "Subtítulo",
    fr: "Sous-titre",
  },
  tagline: {
    pt: "Slogan",
    en: "Tagline",
    es: "Eslogan",
    fr: "Slogan",
  },
  badge_1: { pt: "Destaque 1", en: "Highlight 1", es: "Destacado 1", fr: "Accroche 1" },
  badge_2: { pt: "Destaque 2", en: "Highlight 2", es: "Destacado 2", fr: "Accroche 2" },
  badge_3: { pt: "Destaque 3", en: "Highlight 3", es: "Destacado 3", fr: "Accroche 3" },
  badge_4: { pt: "Destaque 4", en: "Highlight 4", es: "Destacado 4", fr: "Accroche 4" },
  feature_1: { pt: "Benefício 1", en: "Feature 1", es: "Beneficio 1", fr: "Atout 1" },
  feature_2: { pt: "Benefício 2", en: "Feature 2", es: "Beneficio 2", fr: "Atout 2" },
  feature_3: { pt: "Benefício 3", en: "Feature 3", es: "Beneficio 3", fr: "Atout 3" },
  cta: { pt: "Chamada à ação", en: "Call to action", es: "Llamada a la acción", fr: "Appel à l'action" },
  contact: { pt: "Contacto / WhatsApp", en: "Contact / WhatsApp", es: "Contacto / WhatsApp", fr: "Contact / WhatsApp" },
  positions: { pt: "Cargos / vagas", en: "Roles / job list", es: "Puestos / vacantes", fr: "Postes / offres" },
  contact_email: { pt: "Email de contacto", en: "Contact email", es: "Email de contacto", fr: "E-mail de contact" },
  extra_text: { pt: "Texto extra (opcional)", en: "Extra text (optional)", es: "Texto extra (opcional)", fr: "Texte supplémentaire (optionnel)" },
  artist_name: { pt: "Nome do artista", en: "Artist name", es: "Nombre del artista", fr: "Nom de l'artiste" },
  tour_name: { pt: "Nome da tour", en: "Tour name", es: "Nombre de la gira", fr: "Nom de la tournée" },
  album_name: { pt: "Nome do álbum", en: "Album name", es: "Nombre del álbum", fr: "Nom de l'album" },
  event_name: { pt: "Nome do evento", en: "Event name", es: "Nombre del evento", fr: "Nom de l'événement" },
  event_date: { pt: "Data do evento", en: "Event date", es: "Fecha del evento", fr: "Date de l'événement" },
  venue: { pt: "Local / venue", en: "Venue", es: "Lugar", fr: "Lieu" },
  city: { pt: "Cidade / país", en: "City / country", es: "Ciudad / país", fr: "Ville / pays" },
  date: { pt: "Data", en: "Date", es: "Fecha", fr: "Date" },
  date_range: { pt: "Período", en: "Date range", es: "Periodo", fr: "Période" },
  dates: { pt: "Datas e horários", en: "Dates and times", es: "Fechas y horarios", fr: "Dates et horaires" },
  brand_name: { pt: "Marca", en: "Brand", es: "Marca", fr: "Marque" },
  product: { pt: "Produto", en: "Product", es: "Producto", fr: "Produit" },
  campaign: { pt: "Campanha", en: "Campaign", es: "Campaña", fr: "Campagne" },
  title: { pt: "Título", en: "Title", es: "Título", fr: "Titre" },
  topic: { pt: "Tema", en: "Topic", es: "Tema", fr: "Thème" },
  category: { pt: "Categoria", en: "Category", es: "Categoría", fr: "Catégorie" },
  additional_text: { pt: "Texto adicional", en: "Additional text", es: "Texto adicional", fr: "Texte supplémentaire" },
  before_label: { pt: "Texto «antes»", en: "Before label", es: "Texto «antes»", fr: "Texte « avant »" },
  after_label: { pt: "Texto «depois»", en: "After label", es: "Texto «después»", fr: "Texte « après »" },
  caption: { pt: "Legenda", en: "Caption", es: "Leyenda", fr: "Légende" },
  brand: { pt: "Marca", en: "Brand", es: "Marca", fr: "Marque" },
  subtext: { pt: "Subtexto", en: "Subtext", es: "Subtexto", fr: "Sous-texte" },
  details: { pt: "Detalhes", en: "Details", es: "Detalles", fr: "Détails" },
  quote: { pt: "Citação", en: "Quote", es: "Cita", fr: "Citation" },
  author: { pt: "Autor", en: "Author", es: "Autor", fr: "Auteur" },
  hook: { pt: "Gancho", en: "Hook", es: "Gancho", fr: "Accroche" },
  episode: { pt: "Episódio", en: "Episode", es: "Episodio", fr: "Épisode" },
  swipe_text: { pt: "Texto do swipe", en: "Swipe text", es: "Texto del swipe", fr: "Texte du swipe" },
  headliners: { pt: "Artistas principais", en: "Headliners", es: "Cabezas de cartel", fr: "Têtes d'affiche" },
  lineup: { pt: "Line-up", en: "Line-up", es: "Line-up", fr: "Line-up" },
  ticket_price: { pt: "Preço do bilhete", en: "Ticket price", es: "Precio de entrada", fr: "Prix du billet" },
  release_date: { pt: "Data de lançamento", en: "Release date", es: "Fecha de lanzamiento", fr: "Date de sortie" },
  release_title: { pt: "Título do lançamento", en: "Release title", es: "Título del lanzamiento", fr: "Titre de la sortie" },
  single: { pt: "Single", en: "Single", es: "Sencillo", fr: "Single" },
  band: { pt: "Banda", en: "Band", es: "Banda", fr: "Groupe" },
  performer: { pt: "Performer", en: "Performer", es: "Artista", fr: "Artiste" },
  conductor: { pt: "Maestro", en: "Conductor", es: "Director", fr: "Chef d'orchestre" },
  piece: { pt: "Obra", en: "Piece", es: "Obra", fr: "Œuvre" },
  orchestra: { pt: "Orquestra", en: "Orchestra", es: "Orquesta", fr: "Orchestre" },
  dj_name: { pt: "DJ", en: "DJ", es: "DJ", fr: "DJ" },
  club: { pt: "Clube", en: "Club", es: "Club", fr: "Club" },
  festival_name: { pt: "Nome do festival", en: "Festival name", es: "Nombre del festival", fr: "Nom du festival" },
  couple_names: { pt: "Nomes do casal", en: "Couple names", es: "Nombres de la pareja", fr: "Noms du couple" },
  age: { pt: "Idade", en: "Age", es: "Edad", fr: "Âge" },
  company: { pt: "Empresa", en: "Company", es: "Empresa", fr: "Entreprise" },
  workshop_title: { pt: "Workshop", en: "Workshop", es: "Taller", fr: "Atelier" },
  instructor: { pt: "Instrutor", en: "Instructor", es: "Instructor", fr: "Formateur" },
  exhibition_title: { pt: "Exposição", en: "Exhibition", es: "Exposición", fr: "Exposition" },
  gallery: { pt: "Galeria", en: "Gallery", es: "Galería", fr: "Galerie" },
  film: { pt: "Filme", en: "Film", es: "Película", fr: "Film" },
  organization: { pt: "Organização", en: "Organization", es: "Organización", fr: "Organisation" },
  conference_name: { pt: "Conferência", en: "Conference", es: "Conferencia", fr: "Conférence" },
  speakers: { pt: "Oradores", en: "Speakers", es: "Ponentes", fr: "Intervenants" },
  location: { pt: "Localização", en: "Location", es: "Ubicación", fr: "Emplacement" },
  business_name: { pt: "Negócio", en: "Business", es: "Negocio", fr: "Entreprise" },
  address: { pt: "Morada", en: "Address", es: "Dirección", fr: "Adresse" },
  agent: { pt: "Agente", en: "Agent", es: "Agente", fr: "Agent" },
  service: { pt: "Serviço", en: "Service", es: "Servicio", fr: "Service" },
  offer: { pt: "Oferta", en: "Offer", es: "Oferta", fr: "Offre" },
  event: { pt: "Evento", en: "Event", es: "Evento", fr: "Événement" },
  seat: { pt: "Lugar", en: "Seat", es: "Asiento", fr: "Place" },
  tag_before: { pt: "Etiqueta «antes»", en: "Before tag", es: "Etiqueta «antes»", fr: "Étiquette « avant »" },
  tag_after: { pt: "Etiqueta «depois»", en: "After tag", es: "Etiqueta «después»", fr: "Étiquette « après »" },
  duration: { pt: "Duração", en: "Duration", es: "Duración", fr: "Durée" },
  stylist: { pt: "Estilista", en: "Stylist", es: "Estilista", fr: "Styliste" },
  salon: { pt: "Salão", en: "Salon", es: "Salón", fr: "Salon" },
  model: { pt: "Modelo", en: "Model", es: "Modelo", fr: "Mannequin" },
  year: { pt: "Ano", en: "Year", es: "Año", fr: "Année" },
  room: { pt: "Divisão", en: "Room", es: "Sala", fr: "Salle" },
  designer: { pt: "Designer", en: "Designer", es: "Diseñador", fr: "Designer" },
  dish: { pt: "Prato", en: "Dish", es: "Plato", fr: "Plat" },
  chef: { pt: "Chef", en: "Chef", es: "Chef", fr: "Chef" },
  magazine_name: { pt: "Revista", en: "Magazine", es: "Revista", fr: "Magazine" },
  issue: { pt: "Edição", en: "Issue", es: "Número", fr: "Numéro" },
  deck: { pt: "Subtítulo editorial", en: "Deck", es: "Entradilla", fr: "Chapeau" },
  publication: { pt: "Publicação", en: "Publication", es: "Publicación", fr: "Publication" },
  rating: { pt: "Avaliação", en: "Rating", es: "Valoración", fr: "Note" },
  book_title: { pt: "Título do livro", en: "Book title", es: "Título del libro", fr: "Titre du livre" },
  subhead: { pt: "Subtítulo", en: "Subhead", es: "Subtítulo", fr: "Sous-titre" },
  name: { pt: "Nome", en: "Name", es: "Nombre", fr: "Nom" },
  years: { pt: "Anos", en: "Years", es: "Años", fr: "Années" },
  discount: { pt: "Desconto", en: "Discount", es: "Descuento", fr: "Réduction" },
  deadline: { pt: "Prazo", en: "Deadline", es: "Plazo", fr: "Date limite" },
  launch_date: { pt: "Lançamento", en: "Launch", es: "Lanzamiento", fr: "Lancement" },
  app_name: { pt: "Aplicação", en: "App", es: "App", fr: "Application" },
  restaurant: { pt: "Restaurante", en: "Restaurant", es: "Restaurante", fr: "Restaurant" },
  price: { pt: "Preço", en: "Price", es: "Precio", fr: "Prix" },
  collection: { pt: "Coleção", en: "Collection", es: "Colección", fr: "Collection" },
  season: { pt: "Época", en: "Season", es: "Temporada", fr: "Saison" },
  artist: { pt: "Artista", en: "Artist", es: "Artista", fr: "Artiste" },
  BUSINESS_NAME: { pt: "Nome do negócio", en: "Business name", es: "Nombre del negocio", fr: "Nom du commerce" },
  BUSINESS_TAGLINE: { pt: "Slogan", en: "Tagline", es: "Eslogan", fr: "Slogan" },
  DISCOUNT_PERCENTAGE: { pt: "Desconto", en: "Discount", es: "Descuento", fr: "Réduction" },
  POLICY_TEXT: { pt: "Política", en: "Policy text", es: "Política", fr: "Politique" },
  FOOD_DESCRIPTION: { pt: "Descrição da comida", en: "Food description", es: "Descripción", fr: "Description" },
  MAIN_TITLE: { pt: "Título principal", en: "Main title", es: "Título principal", fr: "Titre principal" },
  MAIN_HEADLINE: { pt: "Manchete", en: "Main headline", es: "Titular", fr: "Titre" },
  ITEM_NAME_1: { pt: "Item 1", en: "Item 1", es: "Plato 1", fr: "Article 1" },
  ITEM_NAME_2: { pt: "Item 2", en: "Item 2", es: "Plato 2", fr: "Article 2" },
  ITEM_NAME_3: { pt: "Item 3", en: "Item 3", es: "Plato 3", fr: "Article 3" },
  PRICE_1: { pt: "Preço 1", en: "Price 1", es: "Precio 1", fr: "Prix 1" },
  PRICE_2: { pt: "Preço 2", en: "Price 2", es: "Precio 2", fr: "Prix 2" },
  PRICE_3: { pt: "Preço 3", en: "Price 3", es: "Precio 3", fr: "Prix 3" },
  PHONE_NUMBER: { pt: "Telefone", en: "Phone", es: "Teléfono", fr: "Téléphone" },
  PHONE: { pt: "Telefone", en: "Phone", es: "Teléfono", fr: "Téléphone" },
  EMAIL_ADDRESS: { pt: "Email", en: "Email", es: "Email", fr: "E-mail" },
  EMAIL: { pt: "Email", en: "Email", es: "Email", fr: "E-mail" },
  WEBSITE: { pt: "Website", en: "Website", es: "Web", fr: "Site web" },
  ADDRESS: { pt: "Morada", en: "Address", es: "Dirección", fr: "Adresse" },
  SUBTITLE: { pt: "Subtítulo", en: "Subtitle", es: "Subtítulo", fr: "Sous-titre" },
  DISCOUNT: { pt: "Promo", en: "Discount", es: "Descuento", fr: "Promo" },
  CTA_TEXT: { pt: "Botão (CTA)", en: "CTA text", es: "CTA", fr: "CTA" },
  DELIVERY_TEXT: { pt: "Entrega", en: "Delivery", es: "Entrega", fr: "Livraison" },
  BACKGROUND_WORD: { pt: "Palavra de fundo", en: "Background word", es: "Palabra fondo", fr: "Mot fond" },
  BADGE_TEXT: { pt: "Selo", en: "Badge", es: "Badge", fr: "Badge" },
  ESTABLISHED_TEXT: { pt: "Desde / tradição", en: "Established", es: "Desde", fr: "Depuis" },
  PROMOTIONAL_TEXT: { pt: "Texto promo", en: "Promo line", es: "Promo", fr: "Promo" },
  SPECIAL_OFFER: { pt: "Oferta", en: "Special offer", es: "Oferta", fr: "Offre" },
  DELIVERY_INFO: { pt: "Info entrega", en: "Delivery info", es: "Entrega", fr: "Livraison" },
};

/** Slot roles by category + field count (index → semantic key). */
const SLOT_BY_CATEGORY_COUNT = {
  food: {
    8: ["headline", "tagline", "badge_1", "badge_2", "badge_3", "badge_4", "cta", "contact"],
    7: ["headline", "tagline", "badge_1", "badge_2", "badge_3", "cta", "contact"],
  },
  fitness: {
    6: ["headline", "tagline", "feature_1", "feature_2", "feature_3", "cta"],
    5: ["headline", "tagline", "feature_1", "feature_2", "cta"],
    4: ["headline", "tagline", "feature_1", "cta"],
  },
  motivational: {
    7: ["headline", "tagline", "feature_1", "feature_2", "feature_3", "cta", "contact"],
    6: ["headline", "tagline", "feature_1", "feature_2", "cta", "contact"],
    5: ["headline", "tagline", "feature_1", "feature_2", "cta"],
    4: ["headline", "tagline", "feature_1", "cta"],
    3: ["headline", "tagline", "cta"],
  },
  music: {
    1: ["headline"],
    2: ["headline", "subtitle"],
    3: ["headline", "subtitle", "tagline"],
    5: ["headline", "subtitle", "tagline", "date", "venue"],
  },
  flyers: {
    1: ["headline"],
    2: ["headline", "subtitle"],
  },
};

function normalizeLang(lang) {
  if (lang === "pt" || lang === "es" || lang === "fr") return lang;
  return "en";
}

function labelFromMap(key, lang) {
  const entry = FIELD_LABELS[key];
  if (!entry) return null;
  return entry[normalizeLang(lang)] || entry.en;
}

function lineLabel(n, lang) {
  const labels = {
    pt: `Campo ${n}`,
    en: `Field ${n}`,
    es: `Campo ${n}`,
    fr: `Champ ${n}`,
  };
  return labels[normalizeLang(lang)] || labels.en;
}

/**
 * @param {string} key — placeholder key (e.g. line_1, headline)
 * @param {string} lang — pt | en | es | fr
 * @param {{ template?: { category?: string, placeholders?: string[] }, fieldIndex?: number }} [ctx]
 */
export function posterFieldLabel(key, lang, ctx = {}) {
  const { template, fieldIndex } = ctx;
  const code = normalizeLang(lang);

  if (template && typeof fieldIndex === "number") {
    const cat = String(template.category || "").toLowerCase();
    const count = template.placeholders?.length ?? 0;
    const slots = SLOT_BY_CATEGORY_COUNT[cat]?.[count];
    const slotKey = slots?.[fieldIndex];
    if (slotKey) {
      const fromSlot = labelFromMap(slotKey, code);
      if (fromSlot) return fromSlot;
    }
  }

  const direct = labelFromMap(key, code);
  if (direct) return direct;

  const lineMatch = String(key).match(/^line_(\d+)$/);
  if (lineMatch) return lineLabel(lineMatch[1], code);

  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const POSTER_CAT_KEYS = {
  music: "post_cat_music",
  food: "post_cat_food",
  fitness: "post_cat_fitness",
  motivational: "post_cat_motivational",
  flyers: "post_cat_flyers",
  flyer: "post_cat_flyers",
  editorial: "post_cat_editorial",
  epic: "post_cat_epic",
  scifi: "post_cat_scifi",
  hero: "post_cat_hero",
  phone: "post_cat_phone",
};
