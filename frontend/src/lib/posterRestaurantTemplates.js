/**
 * Novos templates de restaurante / comida (prompts do utilizador).
 * IDs prefixados com food_ para routing de referência de prato.
 */

import { POSTER_REFERENCE_FOOD } from "./identityPrompts";

const LOGO_SLOT =
  "LOGO (optional): If a second small brand logo image is provided, place it discreetly in the "
  + "top-left logo area at modest size (roughly 8–12% of poster width). Preserve logo colors and shape; "
  + "do not enlarge or dominate the layout.";

function foodPrompt(body) {
  return `${POSTER_REFERENCE_FOOD}\n\n${LOGO_SLOT}\n\n${body}`;
}

const MENU_ITEM_FIELDS = [
  "ITEM_NAME_1", "PRICE_1",
  "ITEM_NAME_2", "PRICE_2",
  "ITEM_NAME_3", "PRICE_3",
];

/** @type {import('./posterPrompt').PosterTemplate[]} */
export const RESTAURANT_POSTER_TEMPLATES = [
  {
    id: "food_healthy_food_promotion",
    source_id: "healthy_food_promotion",
    category: "food",
    label: "HEALTHY FOOD PROMOTION",
    subtag: "Menu",
    menuTemplate: true,
    aspect: "2:3",
    placeholders: [
      "BUSINESS_NAME",
      "BUSINESS_TAGLINE",
      "DISCOUNT_PERCENTAGE",
      "POLICY_TEXT",
      "FOOD_DESCRIPTION",
      "MAIN_TITLE",
      ...MENU_ITEM_FIELDS,
      "PHONE_NUMBER",
      "EMAIL_ADDRESS",
      "WEBSITE",
      "ADDRESS",
    ],
    optional: [
      "BUSINESS_TAGLINE",
      "POLICY_TEXT",
      "FOOD_DESCRIPTION",
      "EMAIL_ADDRESS",
      "WEBSITE",
      "ADDRESS",
      ...MENU_ITEM_FIELDS,
    ],
    prompt: foodPrompt(`Bright and fresh vertical restaurant advertisement poster in 2:3 format, modern healthy food branding, clean light gray textured background with vibrant green curved graphic elements framing the composition.

Main composition:
Large featured dish positioned on the upper-left area inside a clean ceramic plate, professionally photographed from a slightly elevated angle.

Around the composition:
Fresh vegetables and healthy ingredients scattered decoratively around the top and right side of the layout, creating a natural organic atmosphere.

Top-left corner:
Restaurant logo area with:
"{{BUSINESS_NAME}}"
"{{BUSINESS_TAGLINE}}"

Center-right:
Large circular promotional badge:
"{{DISCOUNT_PERCENTAGE}}"

Middle section:

Left column title:
"OUR POLICY"

Paragraph placeholder:
"{{POLICY_TEXT}}"

Center column title:
"OUR FOOD"

Paragraph placeholder:
"{{FOOD_DESCRIPTION}}"

Right side:
Large handwritten typography:
"{{MAIN_TITLE}}"

Bottom showcase section:

Three circular product preview images using the same reference dish in consistent circular frames.

Card 1:
"{{ITEM_NAME_1}}"
Price:
"{{PRICE_1}}"

Card 2:
"{{ITEM_NAME_2}}"
Price:
"{{PRICE_2}}"

Card 3:
"{{ITEM_NAME_3}}"
Price:
"{{PRICE_3}}"

Footer section:

Phone:
"{{PHONE_NUMBER}}"

Email:
"{{EMAIL_ADDRESS}}"

Website:
"{{WEBSITE}}"

Address:
"{{ADDRESS}}"

Visual style:
Clean healthy restaurant branding, organic lifestyle advertising, modern food marketing, minimalist commercial design, fresh atmosphere, soft natural daylight, realistic shadows, photorealistic food photography, professional restaurant flyer, ultra detailed, sharp focus, premium print design.`),
  },
  {
    id: "food_menu_promotion",
    source_id: "menu_promotion",
    category: "food",
    label: "MENU PROMOTION",
    subtag: "Menu",
    menuTemplate: true,
    aspect: "2:3",
    placeholders: [
      "BUSINESS_NAME",
      "MAIN_TITLE",
      ...MENU_ITEM_FIELDS,
      "PHONE",
      "WEBSITE",
      "EMAIL",
      "ADDRESS",
    ],
    optional: ["EMAIL", "WEBSITE", "ADDRESS", ...MENU_ITEM_FIELDS],
    prompt: foodPrompt(`Professional restaurant menu flyer in vertical 2:3 format, clean commercial food advertising design, modern menu board layout, soft premium lighting, elegant food marketing composition.

The menu design, food descriptions, menu sections, promotional wording, and visual presentation should naturally adapt to the food shown in the reference image.

Background:
Soft light green upper section transitioning into a warm wooden tabletop surface covering the lower half of the layout.

Top-left:
Restaurant logo placeholder:
"{{BUSINESS_NAME}}"

Top-right:
Social media icons:
Instagram, Facebook, TikTok.

Main headline:
Large stylish typography:

"{{MAIN_TITLE}}"

Below headline:
Short promotional description automatically adapted to the food category shown in the reference image.

Upper-right feature section:
Large circular or partially cropped plate containing the food from the reference image.

Middle menu section:

Three featured menu items displayed in circular frames based on the same food category.

Menu Item 1:
"{{ITEM_NAME_1}}"
Price:
"{{PRICE_1}}"

Menu Item 2:
"{{ITEM_NAME_2}}"
Price:
"{{PRICE_2}}"

Menu Item 3:
"{{ITEM_NAME_3}}"
Price:
"{{PRICE_3}}"

Descriptions:
Generate realistic restaurant-style menu descriptions appropriate for the food shown in the reference image.

Decorative elements:
Food-related ingredients, herbs, garnishes, vegetables, spices, fruits, toppings, or complementary elements matching the food category shown in the reference image.

Footer:
Phone:
"{{PHONE}}"

Website:
"{{WEBSITE}}"

Email:
"{{EMAIL}}"

Address:
"{{ADDRESS}}"

Style:
Professional restaurant menu design, commercial food marketing, modern menu board aesthetic, realistic food photography, clean typography hierarchy, premium restaurant branding, ultra detailed, realistic textures, soft shadows, print-ready flyer design.`),
  },
  {
    id: "food_special_menu_promotion",
    source_id: "special_menu_promotion",
    category: "food",
    label: "SPECIAL MENU PROMOTION",
    subtag: "Promo",
    menuTemplate: false,
    aspect: "1:1",
    placeholders: [
      "BUSINESS_NAME",
      "MAIN_TITLE",
      "SUBTITLE",
      "DISCOUNT",
      "CTA_TEXT",
      "DELIVERY_TEXT",
      "PHONE_NUMBER",
    ],
    optional: ["SUBTITLE", "DELIVERY_TEXT"],
    prompt: foodPrompt(`Professional restaurant promotional poster in square format, modern commercial food advertising design, clean white background with large flowing organic green shapes creating a premium and fresh visual identity.

Main composition:

Large featured dish positioned in the center of the design on a clean white plate.

Background:

Minimal white surface with large modern green abstract curved shapes wrapping around the composition.

Soft shadows beneath the plate for realistic depth.

Top-left:

Restaurant logo placeholder:

"{{BUSINESS_NAME}}"

Main headline:

Large premium typography:

"{{MAIN_TITLE}}"

Secondary headline:

"{{SUBTITLE}}"

Promotional badge:

Circular discount badge on the left side:

"{{DISCOUNT}}"

Bottom-right:

Large call-to-action button:

"{{CTA_TEXT}}"

Below CTA:

Small promotional banner:

"{{DELIVERY_TEXT}}"

Bottom-left:

Contact section:

Phone:
"{{PHONE_NUMBER}}"

Food intelligence:

Generate descriptions and promotional language appropriate to the food shown in the reference image.

Visual style:

Modern restaurant branding, premium social media advertising, clean composition, minimal design, commercial food photography, realistic food textures, professional marketing poster, vibrant colors, soft natural lighting, print-ready quality, ultra detailed, sharp focus.`),
  },
  {
    id: "food_healthy_lifestyle_promotion",
    source_id: "healthy_lifestyle_promotion",
    category: "food",
    label: "HEALTHY LIFESTYLE PROMOTION",
    subtag: "Wellness",
    menuTemplate: false,
    aspect: "4:5",
    placeholders: [
      "BACKGROUND_WORD",
      "MAIN_HEADLINE",
      "CTA_TEXT",
      "PHONE_NUMBER",
      "WEBSITE",
      "EMAIL",
    ],
    optional: ["EMAIL", "WEBSITE"],
    prompt: foodPrompt(`Professional healthy food promotional poster in vertical 4:5 format, premium wellness branding, modern minimalist advertising design, dark green background with elegant contrast and clean composition.

Main composition:

Large food bowl or plate positioned in the center of the design, partially overlapping layered rounded rectangular panels.

Background:

Deep premium green background with oversized typography extending across the lower portion of the composition.

Large abstract word integrated into the background:

"{{BACKGROUND_WORD}}"

Upper section:

Large rounded white information panel.

Main headline:

"{{MAIN_HEADLINE}}"

Subheadline:

Automatically generated according to the food category shown in the reference image.

Call-to-action button:

"{{CTA_TEXT}}"

Small supporting paragraph:

Generate a short promotional description appropriate for the food shown in the reference image.

Bottom section:

Social media icons:
Instagram
Facebook
TikTok
YouTube

Contact area:

Phone:
"{{PHONE_NUMBER}}"

Website:
"{{WEBSITE}}"

Email:
"{{EMAIL}}"

Visual style:

Premium wellness branding, modern restaurant marketing, luxury healthy food advertising, clean typography hierarchy, realistic food photography, soft shadows, minimal design, social media ready composition, vibrant colors, ultra detailed, photorealistic, commercial quality.`),
  },
  {
    id: "food_healthy_eating_campaign",
    source_id: "healthy_eating_campaign",
    category: "food",
    label: "HEALTHY EATING CAMPAIGN",
    subtag: "Nutrition",
    menuTemplate: false,
    aspect: "4:5",
    placeholders: [
      "BUSINESS_NAME",
      "MAIN_HEADLINE",
      "BADGE_TEXT",
      "CTA_TEXT",
      "PHONE_NUMBER",
      "WEBSITE",
    ],
    optional: ["WEBSITE"],
    prompt: foodPrompt(`Professional healthy food marketing poster in vertical format, modern wellness advertising design, soft light green background with clean minimalist composition, premium nutrition branding aesthetic.

Main composition:

Large plate positioned in the lower center portion of the design.

Background:

Soft light green wellness-inspired background with subtle gradients and clean negative space.

Decorative elements:

Minimal stars, sparkles, nutrition-inspired icons, subtle modern graphic accents.

Top section:

Logo area:

"{{BUSINESS_NAME}}"

Main headline:

Large bold typography:

"{{MAIN_HEADLINE}}"

Subheadline:

Automatically generated according to the food category shown in the reference image.

Promotional badge:

Small circular badge:

"{{BADGE_TEXT}}"

Food description overlay:

Generate a short promotional description based on the food shown in the reference image.

Call-to-action button:

"{{CTA_TEXT}}"

Bottom section:

Phone:
"{{PHONE_NUMBER}}"

Website:
"{{WEBSITE}}"

Social media:
Instagram
Facebook
TikTok

Style:

Premium nutrition marketing, modern wellness branding, commercial food photography, realistic textures, clean layout, social media advertising, minimal design, vibrant colors, realistic shadows, professional promotional poster, ultra detailed, photorealistic.`),
  },
  {
    id: "food_comfort_food_promotion",
    source_id: "comfort_food_promotion",
    category: "food",
    label: "COMFORT FOOD PROMOTION",
    subtag: "Bold",
    menuTemplate: false,
    aspect: "4:5",
    placeholders: [
      "MAIN_HEADLINE",
      "PHONE_NUMBER",
      "WEBSITE",
    ],
    optional: ["WEBSITE"],
    prompt: foodPrompt(`Professional restaurant promotional poster in vertical format, bold commercial food advertising design, vibrant orange background with modern minimalist composition and oversized typography integrated into the layout.

Main composition:

Large plate positioned in the upper center portion of the design.

Background:

Bright orange premium advertising background.

Large oversized typography partially hidden behind the plate for depth and modern branding effect.

Floating promotional tags around the dish:

Generate food-specific benefits based on the uploaded food.

Main headline section:

Large bold typography:

"{{MAIN_HEADLINE}}"

Supporting text:

Generate a short marketing sentence appropriate for the uploaded food.

Bottom information section:

Phone:
"{{PHONE_NUMBER}}"

Website:
"{{WEBSITE}}"

Social media:
Instagram
Facebook
TikTok
YouTube

Food intelligence:

The entire poster should adapt automatically to the food shown in the reference image.

Style:

Modern restaurant branding, food delivery marketing, commercial food photography, premium social media advertising, realistic textures, strong visual hierarchy, vibrant colors, realistic shadows, professional promotional design, photorealistic, ultra detailed.`),
  },
  {
    id: "food_featured_food_promotion",
    source_id: "featured_food_promotion",
    category: "food",
    label: "FEATURED FOOD PROMOTION",
    subtag: "Premium",
    menuTemplate: false,
    aspect: "1:1",
    placeholders: [
      "BUSINESS_NAME",
      "MAIN_TITLE",
      "ESTABLISHED_TEXT",
      "PROMOTIONAL_TEXT",
      "SPECIAL_OFFER",
      "DELIVERY_INFO",
      "WEBSITE",
    ],
    optional: ["ESTABLISHED_TEXT", "DELIVERY_INFO"],
    prompt: foodPrompt(`Professional restaurant promotional poster in square format, premium fast-food advertising design, luxury black background with subtle dark texture, strong orange and red accent colors, bold commercial food marketing aesthetic.

Main composition:

Large featured food item positioned in the center-right portion of the design.

Professional commercial food photography with dramatic lighting and realistic shadows.

Background:

Premium black textured background with subtle depth and dark food-related patterns.

Top section:

Business logo placeholder:

"{{BUSINESS_NAME}}"

Main headline:

Large bold typography:

"{{MAIN_TITLE}}"

Secondary headline:

"{{ESTABLISHED_TEXT}}"

Promotional text:

"{{PROMOTIONAL_TEXT}}"

Left side ingredient/features section:

Title:

"FEATURES"

Automatically generate food-specific highlights according to the uploaded food.

Promotional offer badge:

Large brush-stroke style banner:

"{{SPECIAL_OFFER}}"

Bottom-right:

Delivery banner:

"{{DELIVERY_INFO}}"

Bottom-left:

Social media icons:
Instagram
Facebook
TikTok
WhatsApp

Website:
"{{WEBSITE}}"

Visual style:

Premium restaurant branding, modern fast-food advertising, dramatic food photography, strong visual hierarchy, bold typography, realistic food textures, high contrast lighting, commercial social media marketing, professional print-ready poster, ultra detailed, photorealistic.`),
  },
];

export const POSTER_MENU_PLACEHOLDER_KEYS = new Set([
  ...MENU_ITEM_FIELDS,
]);

export function isPosterMenuTemplate(template) {
  return Boolean(template?.menuTemplate);
}

export function splitPosterPlaceholders(template) {
  const all = template?.placeholders || [];
  if (!isPosterMenuTemplate(template)) {
    return { menu: [], details: all };
  }
  const menu = all.filter((p) => POSTER_MENU_PLACEHOLDER_KEYS.has(p));
  const details = all.filter((p) => !POSTER_MENU_PLACEHOLDER_KEYS.has(p));
  return { menu, details };
}
