/** Plataformas / formatos — aspect ratio Seedance 2.0. */



const FORMATS = [

  {

    id: "tiktok",

    aspectRatio: "9:16",

    labelPt: "TikTok",

    labelEn: "TikTok",

  },

  {

    id: "reels",

    aspectRatio: "9:16",

    labelPt: "Instagram Reels",

    labelEn: "Instagram Reels",

  },

  {

    id: "instagram_stories",

    aspectRatio: "9:16",

    labelPt: "Instagram Stories",

    labelEn: "Instagram Stories",

  },

  {

    id: "shorts",

    aspectRatio: "9:16",

    labelPt: "YouTube Shorts",

    labelEn: "YouTube Shorts",

  },

  {

    id: "snapchat",

    aspectRatio: "9:16",

    labelPt: "Snapchat",

    labelEn: "Snapchat",

  },

  {

    id: "facebook_reels",

    aspectRatio: "9:16",

    labelPt: "Facebook Reels",

    labelEn: "Facebook Reels",

  },

  {

    id: "instagram_feed",

    aspectRatio: "1:1",

    labelPt: "Instagram feed",

    labelEn: "Instagram feed",

  },

  {

    id: "linkedin",

    aspectRatio: "1:1",

    labelPt: "LinkedIn",

    labelEn: "LinkedIn",

  },

  {

    id: "instagram_portrait",

    aspectRatio: "3:4",

    labelPt: "Instagram / Facebook retrato",

    labelEn: "Instagram / Facebook portrait",

  },

  {

    id: "youtube",

    aspectRatio: "16:9",

    labelPt: "YouTube",

    labelEn: "YouTube",

  },

  {

    id: "twitter",

    aspectRatio: "16:9",

    labelPt: "X (Twitter)",

    labelEn: "X (Twitter)",

  },

];



const DEFAULT_FORMAT_ID = "tiktok";



function listMarketingVideoFormats(lang = "pt") {

  const l = String(lang || "pt").slice(0, 2).toLowerCase();

  return FORMATS.map((f) => ({

    id: f.id,

    aspectRatio: f.aspectRatio,

    label: l === "en" ? f.labelEn : f.labelPt,

  }));

}



function resolveMarketingVideoAspectRatio(formatId, fallback = "9:16") {

  const id = String(formatId || DEFAULT_FORMAT_ID).trim();

  const hit = FORMATS.find((f) => f.id === id);

  return hit?.aspectRatio || fallback;

}



module.exports = {

  FORMATS,

  DEFAULT_FORMAT_ID,

  listMarketingVideoFormats,

  resolveMarketingVideoAspectRatio,

};

