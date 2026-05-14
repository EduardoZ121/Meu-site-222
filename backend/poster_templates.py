"""50 Poster templates organized in 6 categories.

Each template has:
- placeholders → fields the user fills in the editor
- prompt → instruction with {placeholder} slots that gets formatted
- aspect → preferred output aspect ratio

Each generated poster is wrapped in POSTER_DIRECTOR (universal art-direction)
so the chosen model (Grok / Flux 2 / GPT Image 1) renders professional
print-quality output with legible typography.
"""

# ------------------------------------------------------------------
# Universal art-direction prefix injected before every template prompt.
# Crucial because Grok / Flux render typography unevenly without
# explicit instructions about quality, hierarchy and finish.
# ------------------------------------------------------------------
POSTER_DIRECTOR = (
    "Professional design poster, 8K resolution, magazine print quality, "
    "perfectly legible typography rendered as crisp vector-like text, "
    "strong typographic hierarchy with clear primary/secondary/tertiary text levels, "
    "balanced composition with intentional negative space, "
    "premium graphic design, art-directed by a senior creative director. "
)

# ------------------------------------------------------------------
# Mood UI choices → expanded visual descriptors that actually steer
# the model. A user picking "Cinematográfico" should get cinematic
# grading, not just the word "cinematic" appended.
# ------------------------------------------------------------------
MOOD_EXPANSIONS = {
    "Cinematográfico": "Cinematic teal-and-orange color grading, anamorphic shallow depth of field, dramatic backlit subject, atmospheric haze, film grain, 2.39:1 widescreen feel.",
    "Neon":             "Saturated neon magenta and electric cyan, glossy reflections, dark mirror floor, dramatic rim light, cyberpunk aesthetic, halated glow on type.",
    "Minimal":          "Minimalist Swiss-grid design, ample negative space, single accent color, refined sans-serif type, no ornaments, gallery-quality restraint.",
    "Vintage":          "Vintage analog feel — soft halation, mild paper bleed, off-set CMYK misregistration, faded sun-warmed palette, retro 70s typography.",
    "Bold":             "Bold high-contrast layout, oversized condensed display type, primary-color blocks, strong diagonal composition, attention-grabbing.",
    "Luxury":           "Luxury editorial aesthetic — embossed gold foil accents, deep matte black, refined didone serif, monogram-level restraint, Hermès / Chanel level taste.",
    "Editorial":        "Editorial magazine layout — modular grid, mixed serif headline + sans body, considered hierarchy, Vogue / The New Yorker quality.",
    "Brutalist":        "Brutalist graphic design — raw typographic stacks, exposed grid, harsh contrast, oversized helvetica, off-balance composition, 90s anti-design.",
    "Pastel":           "Pastel palette of dusty rose, butter, lavender and seafoam, soft diffuse light, fine rounded sans-serif, dreamy and gentle.",
    "Y2K":              "Y2K aesthetic — chrome 3D type, candy color gradients, lens flares, bubbly forms, early-2000s tech-glam revival.",
    "Mono":             "Strict monochrome palette in a single hue, photographic duotone treatment, refined museum-poster feel.",
    "Sun-warm":         "Sun-warmed palette of amber, terracotta and ochre, golden-hour light, gentle film grain, optimistic mood.",
}


POSTER_TEMPLATES = [
    # ===== MUSIC (10) =====
    {"id": "music_concert", "category": "music", "label": "Concert Tour Poster",
     "placeholders": ["artist_name", "tour_name", "dates", "venue"],
     "prompt": "Cinematic concert tour poster for the artist {artist_name}. "
               "Place the tour name '{tour_name}' as a large bold display title in the upper third, rendered in tall condensed serif. "
               "Tour dates '{dates}' as a horizontal date strip in the lower third with vertical separators between dates. "
               "Venue '{venue}' set in small caps at the very bottom. "
               "Hero artist silhouette dramatically backlit on a stage, anamorphic lens flare, smoke haze. "
               "Inspired by Saul Bass and modern Live Nation tour artwork. Vertical 4:5."},

    {"id": "music_album", "category": "music", "label": "Album Cover",
     "placeholders": ["album_name", "artist_name"],
     "prompt": "Editorial square album cover for the record '{album_name}' by {artist_name}. "
               "Centered hero subject treated photographically (12'' vinyl quality), with album title typeset in oversized custom display lettering across the lower third. "
               "Artist name in small caps above the title. "
               "Refined gallery-quality print finish, subtle paper grain, Pitchfork / 4AD / XL Recordings aesthetic. Square 1:1."},

    {"id": "music_festival", "category": "music", "label": "Festival Lineup",
     "placeholders": ["festival_name", "headliners", "dates"],
     "prompt": "Music festival lineup poster for {festival_name}. "
               "Festival logotype in massive curved display type spanning the top half, with the {dates} prominent below. "
               "Headliner block listing '{headliners}' in alphabetical or hierarchical type-stack — biggest names at the top in bold sans, smaller names below. "
               "Sun-warmed gradient background (Coachella / Primavera Sound feel), warped retro typography, festival ticket bottom strip. Vertical 4:5."},

    {"id": "music_dj", "category": "music", "label": "DJ Night",
     "placeholders": ["dj_name", "club", "date"],
     "prompt": "Electronic club night flyer for DJ {dj_name}. "
               "Massive DJ name in brutalist condensed display lettering, slightly off-grid, vertical orientation. "
               "Venue '{club}' and date '{date}' stacked as info block in monospace at the bottom. "
               "Dark background with sharp magenta and electric blue neon accents, distorted CRT scanlines, halated glow on the type. Vertical 9:16."},

    {"id": "music_jazz", "category": "music", "label": "Jazz Evening",
     "placeholders": ["title", "performer", "venue", "date"],
     "prompt": "Vintage jazz evening poster. "
               "Title '{title}' in elegant 1950s art-deco script as the top hero element. "
               "Performer '{performer}' featured below in classic period serif. "
               "Venue '{venue}' and date '{date}' as a footer line in small caps. "
               "Warm sepia and cream palette, Blue Note Records / Reid Miles inspired layout, hand-drawn musician illustration silhouette, slight paper texture. Vertical 4:5."},

    {"id": "music_classical", "category": "music", "label": "Symphony Night",
     "placeholders": ["orchestra", "piece", "conductor", "date"],
     "prompt": "Symphony night concert poster. "
               "Orchestra name '{orchestra}' centered in large didone serif at the top. "
               "Piece '{piece}' as the main title in italic letterpress style. "
               "Conductor '{conductor}' and date '{date}' below in small caps with subtle gold rule. "
               "Marble paper background, refined cream and deep burgundy, classical luxury, Royal Opera House quality. Vertical 4:5."},

    {"id": "music_indie", "category": "music", "label": "Indie Show",
     "placeholders": ["band", "venue", "date"],
     "prompt": "DIY indie show poster for the band {band} performing at {venue} on {date}. "
               "Band name screen-printed in oversized hand-drawn lettering. "
               "Venue and date as a stamped info block at the bottom. "
               "Two-color risograph printing (cherry red + cobalt blue) with intentional misregistration, lo-fi charm, photocopy texture, late-70s punk poster vibe. Vertical 4:5."},

    {"id": "music_hiphop", "category": "music", "label": "Hip-hop Drop",
     "placeholders": ["artist", "release_title", "date"],
     "prompt": "Hip-hop release poster. "
               "Artist {artist} headlining with the release title '{release_title}' in massive chrome 3D Y2K display type. "
               "Drop date '{date}' as a small mono badge in the corner. "
               "Urban concrete texture, glossy chrome highlights, lens flares, early-2000s tech-glam aesthetic (Cash Money / Roc-A-Fella era). Vertical 4:5."},

    {"id": "music_acoustic", "category": "music", "label": "Acoustic Set",
     "placeholders": ["performer", "venue", "date"],
     "prompt": "Intimate acoustic evening poster. "
               "Performer '{performer}' as the only hero element, in delicate handwritten italic script. "
               "Venue '{venue}' on {date} as a small footer. "
               "Warm candle-lit photograph background, blurred bokeh, single-bulb glow, deeply intimate folk-venue mood. Vertical 4:5."},

    {"id": "music_release", "category": "music", "label": "Single Release",
     "placeholders": ["single", "artist", "release_date"],
     "prompt": "New single release announcement poster. "
               "Single name '{single}' as a single massive contemporary display word across the canvas. "
               "Artist '{artist}' in small caps above, release date '{release_date}' as a sticker-style badge. "
               "Abstract liquid gradient background, modern pop-music aesthetic, Spotify Canvas quality. Square 1:1."},

    # ===== EVENTS (10) =====
    {"id": "event_wedding", "category": "events", "label": "Wedding Invite",
     "placeholders": ["couple_names", "date", "venue"],
     "prompt": "Editorial wedding invitation card. "
               "Couple names '{couple_names}' centered in delicate copperplate calligraphy as the hero. "
               "Date '{date}' below as small caps with hairline rule. "
               "Venue '{venue}' as the bottom footer in italic serif. "
               "Botanical line illustration framing, warm cream and dusty rose palette, deboss feel on premium cotton paper. Vertical 4:5."},

    {"id": "event_birthday", "category": "events", "label": "Birthday Party",
     "placeholders": ["name", "age", "date", "venue"],
     "prompt": "Playful birthday party poster. "
               "Hero text '{name} turns {age}' typeset in big bouncy display font. "
               "Date '{date}' and venue '{venue}' below in a fun handwritten secondary tier. "
               "Confetti and balloon graphics, warm celebratory palette, hand-cut paper texture. Vertical 4:5."},

    {"id": "event_corporate", "category": "events", "label": "Corporate Event",
     "placeholders": ["company", "event_name", "date", "venue"],
     "prompt": "Minimal corporate event poster. "
               "Company '{company}' lockup at top right. "
               "Event name '{event_name}' as the dominant centered title in clean sans-serif. "
               "Date '{date}' and venue '{venue}' as a thin info line below. "
               "Premium typography grid, monochrome (deep navy) with single accent (gold or teal), Apple-keynote refinement. Vertical 4:5."},

    {"id": "event_workshop", "category": "events", "label": "Workshop",
     "placeholders": ["workshop_title", "instructor", "date"],
     "prompt": "Workshop announcement poster. "
               "Workshop title '{workshop_title}' as a clear hero headline in mixed serif + sans pairing. "
               "Instructor '{instructor}' credited below in italic. "
               "Date '{date}' as a circular date-stamp graphic. "
               "Refined editorial magazine layout, clean grid, soft earth tones. Vertical 4:5."},

    {"id": "event_art_show", "category": "events", "label": "Art Exhibition",
     "placeholders": ["artist", "exhibition_title", "dates", "gallery"],
     "prompt": "Museum-quality gallery exhibition poster. "
               "Artist name '{artist}' as the primary headline in oversized didone or condensed grotesk. "
               "Exhibition title '{exhibition_title}' as italic subtitle. "
               "Run dates '{dates}' and gallery '{gallery}' as small caps footer with hairline. "
               "Inspired by Tate / MoMA / Centre Pompidou poster archives. Vertical 4:5."},

    {"id": "event_film_screening", "category": "events", "label": "Film Screening",
     "placeholders": ["film", "date", "venue"],
     "prompt": "Film screening poster, classic cinema treatment. "
               "Film title '{film}' rendered in dramatic film-credit title typography across the center. "
               "Screening date '{date}' at venue '{venue}' as a marquee bottom strip. "
               "Cinematic still-frame backdrop with cinematic letterboxing, A24 / Criterion Collection feel. Vertical 4:5."},

    {"id": "event_charity", "category": "events", "label": "Charity Gala",
     "placeholders": ["organization", "event_name", "date"],
     "prompt": "Charity gala poster, black-tie aesthetic. "
               "Organization '{organization}' lockup at the top in monogrammed gold serif. "
               "Event name '{event_name}' as the central hero in refined italic. "
               "Date '{date}' as elegant footer in small caps. "
               "Deep aubergine background, gold foil accents, embossed feel, formal Vogue gala invitation. Vertical 4:5."},

    {"id": "event_conference", "category": "events", "label": "Conference",
     "placeholders": ["conference_name", "speakers", "dates"],
     "prompt": "Tech conference poster. "
               "Conference name '{conference_name}' as a modular geometric logotype across the top. "
               "Speaker block listing '{speakers}' in a clear typographic stack. "
               "Dates '{dates}' as a horizontal info strip at the bottom. "
               "Modern Apple / Stripe Sessions / Figma Config aesthetic, premium typography, abstract geometric background. Vertical 4:5."},

    {"id": "event_meetup", "category": "events", "label": "Community Meetup",
     "placeholders": ["topic", "date", "location"],
     "prompt": "Friendly community meetup announcement. "
               "Topic '{topic}' as a clear, approachable headline in rounded humanist sans. "
               "Date '{date}' and location '{location}' below as a info strip. "
               "Warm welcoming palette (terracotta + butter), simple line-icon flourishes. Vertical 4:5."},

    {"id": "event_grand_opening", "category": "events", "label": "Grand Opening",
     "placeholders": ["business_name", "date", "address"],
     "prompt": "Grand opening announcement poster for {business_name}. "
               "Business name as the hero in elegant gold-on-deep-color script. "
               "Opening date '{date}' as a ribbon graphic. "
               "Address '{address}' as small caps footer. "
               "Celebratory but classy — confetti accents, refined typography, Wes Anderson palette feel. Vertical 4:5."},

    # ===== BEFORE/AFTER (8) =====
    {"id": "ba_renovation", "category": "before_after", "label": "Home Renovation",
     "placeholders": ["title", "tag_before", "tag_after"],
     "prompt": "Editorial before/after split-screen poster. "
               "Title '{title}' as a unifying centered headline across the divider. "
               "Left half tagged '{tag_before}' as small caps stamp. "
               "Right half tagged '{tag_after}' as bold sans label. "
               "Architectural Digest magazine-spread quality, clean serif body type, refined palette. Wide 16:9."},

    {"id": "ba_fitness", "category": "before_after", "label": "Fitness Journey",
     "placeholders": ["title", "duration"],
     "prompt": "Fitness transformation poster. "
               "Title '{title}' as a powerful motivational headline in bold condensed sans, oversized. "
               "Duration '{duration}' as a circular timestamp badge. "
               "Vertical side-by-side composition with thin gold divider rule, gym/atelier mood, athletic apparel campaign aesthetic. Vertical 9:16."},

    {"id": "ba_makeup", "category": "before_after", "label": "Makeup Look",
     "placeholders": ["title", "stylist"],
     "prompt": "Beauty editorial before/after poster. "
               "Title '{title}' in fashion-magazine display serif at top. "
               "Stylist credit '{stylist}' as small italic credit line. "
               "Split-portrait beauty composition, soft Vogue Beauty light, glowing skin tones. Square 1:1."},

    {"id": "ba_hair", "category": "before_after", "label": "Hair Restyle",
     "placeholders": ["title", "salon"],
     "prompt": "Hair restyle showcase poster, before/after split. "
               "Title '{title}' in glossy fashion typography. "
               "Salon '{salon}' as a chic logotype footer. "
               "Refined neutrals, beauty-campaign lighting, hair-detail close-up, Sassoon / Bumble & Bumble vibe. Square 1:1."},

    {"id": "ba_car", "category": "before_after", "label": "Car Restoration",
     "placeholders": ["model", "year"],
     "prompt": "Car restoration before/after poster. "
               "Vehicle '{model}' ({year}) as a centered hero, before/after split with diagonal divider. "
               "Bold racing-stripe display typography, garage backdrop, Petersen Automotive magazine aesthetic, dramatic side lighting. Wide 16:9."},

    {"id": "ba_garden", "category": "before_after", "label": "Garden Makeover",
     "placeholders": ["title"],
     "prompt": "Garden makeover before/after editorial. "
               "Title '{title}' in elegant botanical serif. "
               "Natural daylight, soft pastoral palette, House & Garden magazine layout. Wide 16:9."},

    {"id": "ba_room", "category": "before_after", "label": "Room Reveal",
     "placeholders": ["room", "designer"],
     "prompt": "Interior room reveal before/after. "
               "Room label '{room}' as the hero title. "
               "Designer credit 'designed by {designer}' as small italic line. "
               "Architectural Digest style typography, refined palette, magazine-grade interior photography. Wide 16:9."},

    {"id": "ba_food", "category": "before_after", "label": "Recipe Transformation",
     "placeholders": ["dish", "chef"],
     "prompt": "Food before/after editorial — raw ingredients on the left, finished plated '{dish}' on the right. "
               "Title 'by {chef}' as a chef-byline credit. "
               "Bon Appétit food-magazine typography, overhead flat-lay composition, natural window light. Square 1:1."},

    # ===== EDITORIAL (8) =====
    {"id": "ed_magazine_cover", "category": "editorial", "label": "Magazine Cover",
     "placeholders": ["magazine_name", "issue", "headline"],
     "prompt": "Magazine cover design. "
               "Masthead '{magazine_name}' as the dominant top-of-cover wordmark. "
               "Issue label '{issue}' as a small superscript. "
               "Headline '{headline}' as a sub-headline overlapping the hero portrait. "
               "Full-bleed editorial portrait, professional grid, Vogue / Wallpaper* / The Gentlewoman quality. Vertical 4:5."},

    {"id": "ed_feature", "category": "editorial", "label": "Feature Page",
     "placeholders": ["headline", "deck"],
     "prompt": "Magazine feature opening spread. "
               "Headline '{headline}' as a massive refined serif drop-line spanning the top. "
               "Deck '{deck}' as the italic subhead below. "
               "Generous whitespace, single editorial hero image flush right, Wallpaper* / The New Yorker layout. Wide 16:9."},

    {"id": "ed_quote_card", "category": "editorial", "label": "Quote Card",
     "placeholders": ["quote", "author"],
     "prompt": "Editorial pull-quote card. "
               "Quote '{quote}' as the centered hero in italic serif with oversized opening quotation mark. "
               "Author attribution '— {author}' below as small caps. "
               "Soft minimalist background, gallery-quality restraint. Square 1:1."},

    {"id": "ed_news", "category": "editorial", "label": "News Banner",
     "placeholders": ["headline", "publication"],
     "prompt": "News banner cover. "
               "Headline '{headline}' as authoritative bold serif headline taking the upper two-thirds. "
               "Publication '{publication}' as the masthead lockup. "
               "NYT / Guardian / FT visual language, refined photo treatment. Wide 16:9."},

    {"id": "ed_film_review", "category": "editorial", "label": "Film Review",
     "placeholders": ["film", "rating"],
     "prompt": "Film review editorial layout. "
               "Film title '{film}' in classic critic typography. "
               "Rating '{rating}/5' rendered as star icons or numeric pull-quote. "
               "Soft cinematic poster collage backdrop, Sight & Sound / Cahiers du Cinéma feel. Vertical 4:5."},

    {"id": "ed_book", "category": "editorial", "label": "Book Cover",
     "placeholders": ["book_title", "author"],
     "prompt": "Editorial book cover design. "
               "Title '{book_title}' in modernist publishing-house display type, hand-set feel. "
               "Author '{author}' below in italic. "
               "Penguin Modern Classics / Picador / Granta aesthetic, slight cloth texture. Vertical 4:5."},

    {"id": "ed_essay", "category": "editorial", "label": "Essay Title",
     "placeholders": ["title", "subhead"],
     "prompt": "Essay title page. "
               "Title '{title}' centered in refined didone serif. "
               "Subhead '{subhead}' below in italic. "
               "Expansive whitespace, philosophical mood, Cabinet / n+1 magazine essay opener. Vertical 4:5."},

    {"id": "ed_obituary", "category": "editorial", "label": "Tribute Card",
     "placeholders": ["name", "years"],
     "prompt": "Tribute card. "
               "Name '{name}' centered in classical serif, dignified and sober. "
               "Years '({years})' below as small caps. "
               "Strict monochrome design, fine hairline border, NYT obituary page aesthetic. Square 1:1."},

    # ===== PROMO (8) =====
    {"id": "promo_sale", "category": "promo", "label": "Sale Announcement",
     "placeholders": ["brand", "discount", "deadline"],
     "prompt": "Retail sale poster. "
               "Discount '{discount} OFF' as the dominant centered hero in oversized bold display type. "
               "Brand '{brand}' lockup at top. "
               "Deadline '{deadline}' as a sticker-style stamp. "
               "On-brand color blocks, modern e-commerce poster, ASOS / Zara campaign feel. Vertical 9:16."},

    {"id": "promo_launch", "category": "promo", "label": "Product Launch",
     "placeholders": ["product", "tagline", "launch_date"],
     "prompt": "Product launch poster. "
               "Product '{product}' as the centered hero with premium product photography. "
               "Tagline '{tagline}' as a refined italic subtitle. "
               "Launch date '{launch_date}' as a discreet badge. "
               "Apple keynote-style cleanliness, refined typography, single accent color. Vertical 4:5."},

    {"id": "promo_app", "category": "promo", "label": "App Promo",
     "placeholders": ["app_name", "tagline"],
     "prompt": "App promo poster. "
               "App name '{app_name}' as the hero, paired with an iconographic device mockup. "
               "Tagline '{tagline}' as a friendly secondary line. "
               "Vibrant gradient background, mobile-first product visual, Linear / Notion / Arc Browser launch aesthetic. Vertical 9:16."},

    {"id": "promo_restaurant", "category": "promo", "label": "Restaurant Menu",
     "placeholders": ["restaurant", "dish", "price"],
     "prompt": "Restaurant feature poster. "
               "Restaurant '{restaurant}' as elegant logotype at top. "
               "Featured dish '{dish}' as the hero food photograph. "
               "Price '{price}' as a small caps line. "
               "Bon Appétit / Eater editorial styling, natural light food photography. Vertical 4:5."},

    {"id": "promo_fashion", "category": "promo", "label": "Fashion Campaign",
     "placeholders": ["brand", "collection", "season"],
     "prompt": "High-fashion campaign poster. "
               "Brand '{brand}' lockup in luxury serif at top. "
               "Collection '{collection}' as the centered editorial hero title. "
               "Season '{season}' as a small caps caption. "
               "Helmut Newton / Steven Meisel / Mario Sorrenti campaign aesthetic, dramatic lighting, fashion model centered. Vertical 4:5."},

    {"id": "promo_realestate", "category": "promo", "label": "Real Estate",
     "placeholders": ["address", "price", "agent"],
     "prompt": "Premium real-estate listing poster. "
               "Address '{address}' as a refined serif headline. "
               "Price '{price}' as a discreet line. "
               "Agent '{agent}' as a small footer credit. "
               "Sotheby's / Christie's International Realty aesthetic, hero architectural photo, warm interior light. Vertical 4:5."},

    {"id": "promo_service", "category": "promo", "label": "Service Offer",
     "placeholders": ["business", "service", "offer"],
     "prompt": "Service offer poster. "
               "Business '{business}' lockup at top. "
               "Service '{service}' as the centered hero headline. "
               "Offer '{offer}' as a callout badge. "
               "Friendly modern small-business design, clean sans typography. Vertical 4:5."},

    {"id": "promo_event_ticket", "category": "promo", "label": "Event Ticket",
     "placeholders": ["event", "date", "seat"],
     "prompt": "Stylized event-ticket design. "
               "Event '{event}' as the hero title in heritage ticket serif. "
               "Date '{date}' on the left tear-off stub. "
               "Seat '{seat}' on the right stub. "
               "Vintage perforated ticket aesthetic, refined typography, Royal Albert Hall ticket feel. Wide 16:9."},

    # ===== SOCIAL MEDIA (6) =====
    {"id": "sm_story", "category": "social_media", "label": "Instagram Story",
     "placeholders": ["headline", "subtext", "cta"],
     "prompt": "Instagram Story poster. "
               "Headline '{headline}' as oversized centered bold display type taking the upper half. "
               "Subtext '{subtext}' as a italic mid-tier line. "
               "Call-to-action '{cta}' as a tappable button graphic at the bottom. "
               "Vibrant gradient background, mobile-first vertical layout, scroll-stopping. Vertical 9:16."},

    {"id": "sm_feed", "category": "social_media", "label": "Feed Post",
     "placeholders": ["headline", "caption", "brand"],
     "prompt": "Instagram feed post. "
               "Headline '{headline}' as the dominant centered hero in clean modern sans. "
               "Caption '{caption}' as a small body line below. "
               "Brand '{brand}' lockup at corner. "
               "Premium editorial layout, scroll-stopping, in the design language of @apartmentf15 / @studio.bruch. Square 1:1."},

    {"id": "sm_quote", "category": "social_media", "label": "Quote Post",
     "placeholders": ["quote", "author", "brand"],
     "prompt": "Social-media pull-quote post. "
               "Quote '{quote}' as the italic-serif hero with an oversized opening quotation mark. "
               "Author '— {author}' below in small caps. "
               "Brand '{brand}' as a footer logotype. "
               "Elegant gradient background, gallery restraint, premium aesthetic. Square 1:1."},

    {"id": "sm_announcement", "category": "social_media", "label": "Announcement",
     "placeholders": ["headline", "date", "details"],
     "prompt": "Social-media announcement post. "
               "Headline '{headline}' as the dominant celebratory hero in bold display type. "
               "Date '{date}' as a stamp graphic. "
               "Details '{details}' as a small caps body line. "
               "Confetti accents, attention-grabbing palette. Square 1:1."},

    {"id": "sm_reel_cover", "category": "social_media", "label": "Reel Cover",
     "placeholders": ["title", "hook", "episode"],
     "prompt": "Reel / TikTok cover thumbnail. "
               "Title '{title}' as a punchy big top-line. "
               "Hook '{hook}' as the centered curiosity-driving headline. "
               "Episode '{episode}' as a small numbered badge. "
               "Eye-catching typography, vivid colors, designed to stop the scroll, modern creator aesthetic. Vertical 9:16."},

    {"id": "sm_carousel_cover", "category": "social_media", "label": "Carousel Cover",
     "placeholders": ["title", "subtitle", "swipe_text"],
     "prompt": "Instagram carousel cover slide. "
               "Title '{title}' as the bold hero. "
               "Subtitle '{subtitle}' as a refined secondary line. "
               "Swipe-text '{swipe_text} →' as a small invitation footer. "
               "Editorial premium design with clear visual hierarchy, swipeable storytelling feel. Square 1:1."},
]


def get_poster(template_id: str):
    """Returns the template dict or None."""
    for p in POSTER_TEMPLATES:
        if p["id"] == template_id:
            return p
    return None
