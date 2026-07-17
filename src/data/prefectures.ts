/**
 * prefectures.ts — the 47 prefectures of Japan, grouped by region, with approximate
 * center coordinates (used to recenter the map when filtering by prefecture and to
 * validate the `prefecture` field in the content schema).
 *
 * Coordinates are approximate regional centers — good enough for map framing, not
 * survey-grade. `slug` is the stable key used in URLs and frontmatter.
 */

export const REGIONS = [
  // Japan's eight regions
  "Hokkaido",
  "Tohoku",
  "Kanto",
  "Chubu",
  "Kansai",
  "Chugoku",
  "Shikoku",
  "Kyushu",
  // Thailand's regions (provinces live in the same list — see `country` below)
  "Northern Thailand",
  "Northeastern Thailand",
  "Central Thailand",
  "Eastern Thailand",
  "Southern Thailand",
  // USA's regions (states live in the same list — see `country` below)
  "Northeast US",
  "Midwest US",
  "South US",
  "West US",
] as const;
export type Region = (typeof REGIONS)[number];

export interface Prefecture {
  slug: string;
  name: string; // English
  nameJa: string; // local script (日本語 for Japan, ไทย for Thailand, postal abbr. for the USA)
  region: Region;
  lat: number;
  lng: number;
  /** Which country this region belongs to. Omitted = "japan" (the original dataset). */
  country?: import("./vocab").Country;
}

export const PREFECTURES: Prefecture[] = [
  { slug: "hokkaido", name: "Hokkaido", nameJa: "北海道", region: "Hokkaido", lat: 43.2203, lng: 142.8635 },

  { slug: "aomori", name: "Aomori", nameJa: "青森県", region: "Tohoku", lat: 40.7656, lng: 140.7406 },
  { slug: "iwate", name: "Iwate", nameJa: "岩手県", region: "Tohoku", lat: 39.5, lng: 141.5 },
  { slug: "miyagi", name: "Miyagi", nameJa: "宮城県", region: "Tohoku", lat: 38.4, lng: 140.95 },
  { slug: "akita", name: "Akita", nameJa: "秋田県", region: "Tohoku", lat: 39.75, lng: 140.4 },
  { slug: "yamagata", name: "Yamagata", nameJa: "山形県", region: "Tohoku", lat: 38.45, lng: 140.18 },
  { slug: "fukushima", name: "Fukushima", nameJa: "福島県", region: "Tohoku", lat: 37.5, lng: 140.2 },

  { slug: "ibaraki", name: "Ibaraki", nameJa: "茨城県", region: "Kanto", lat: 36.3, lng: 140.45 },
  { slug: "tochigi", name: "Tochigi", nameJa: "栃木県", region: "Kanto", lat: 36.7, lng: 139.85 },
  { slug: "gunma", name: "Gunma", nameJa: "群馬県", region: "Kanto", lat: 36.5, lng: 138.95 },
  { slug: "saitama", name: "Saitama", nameJa: "埼玉県", region: "Kanto", lat: 36.0, lng: 139.4 },
  { slug: "chiba", name: "Chiba", nameJa: "千葉県", region: "Kanto", lat: 35.5, lng: 140.25 },
  { slug: "tokyo", name: "Tokyo", nameJa: "東京都", region: "Kanto", lat: 35.6895, lng: 139.6917 },
  { slug: "kanagawa", name: "Kanagawa", nameJa: "神奈川県", region: "Kanto", lat: 35.4, lng: 139.4 },

  { slug: "niigata", name: "Niigata", nameJa: "新潟県", region: "Chubu", lat: 37.5, lng: 138.9 },
  { slug: "toyama", name: "Toyama", nameJa: "富山県", region: "Chubu", lat: 36.6, lng: 137.2 },
  { slug: "ishikawa", name: "Ishikawa", nameJa: "石川県", region: "Chubu", lat: 36.8, lng: 136.8 },
  { slug: "fukui", name: "Fukui", nameJa: "福井県", region: "Chubu", lat: 35.95, lng: 136.2 },
  { slug: "yamanashi", name: "Yamanashi", nameJa: "山梨県", region: "Chubu", lat: 35.6, lng: 138.6 },
  { slug: "nagano", name: "Nagano", nameJa: "長野県", region: "Chubu", lat: 36.2, lng: 138.0 },
  { slug: "gifu", name: "Gifu", nameJa: "岐阜県", region: "Chubu", lat: 35.8, lng: 137.0 },
  { slug: "shizuoka", name: "Shizuoka", nameJa: "静岡県", region: "Chubu", lat: 34.9, lng: 138.4 },
  { slug: "aichi", name: "Aichi", nameJa: "愛知県", region: "Chubu", lat: 35.1, lng: 137.1 },

  { slug: "mie", name: "Mie", nameJa: "三重県", region: "Kansai", lat: 34.5, lng: 136.5 },
  { slug: "shiga", name: "Shiga", nameJa: "滋賀県", region: "Kansai", lat: 35.2, lng: 136.1 },
  { slug: "kyoto", name: "Kyoto", nameJa: "京都府", region: "Kansai", lat: 35.0116, lng: 135.7681 },
  { slug: "osaka", name: "Osaka", nameJa: "大阪府", region: "Kansai", lat: 34.6937, lng: 135.5023 },
  { slug: "hyogo", name: "Hyogo", nameJa: "兵庫県", region: "Kansai", lat: 35.0, lng: 134.9 },
  { slug: "nara", name: "Nara", nameJa: "奈良県", region: "Kansai", lat: 34.4, lng: 135.85 },
  { slug: "wakayama", name: "Wakayama", nameJa: "和歌山県", region: "Kansai", lat: 33.9, lng: 135.5 },

  { slug: "tottori", name: "Tottori", nameJa: "鳥取県", region: "Chugoku", lat: 35.45, lng: 134.0 },
  { slug: "shimane", name: "Shimane", nameJa: "島根県", region: "Chugoku", lat: 35.1, lng: 132.7 },
  { slug: "okayama", name: "Okayama", nameJa: "岡山県", region: "Chugoku", lat: 34.8, lng: 133.8 },
  { slug: "hiroshima", name: "Hiroshima", nameJa: "広島県", region: "Chugoku", lat: 34.5, lng: 132.8 },
  { slug: "yamaguchi", name: "Yamaguchi", nameJa: "山口県", region: "Chugoku", lat: 34.2, lng: 131.5 },

  { slug: "tokushima", name: "Tokushima", nameJa: "徳島県", region: "Shikoku", lat: 33.95, lng: 134.3 },
  { slug: "kagawa", name: "Kagawa", nameJa: "香川県", region: "Shikoku", lat: 34.25, lng: 134.0 },
  { slug: "ehime", name: "Ehime", nameJa: "愛媛県", region: "Shikoku", lat: 33.7, lng: 132.9 },
  { slug: "kochi", name: "Kochi", nameJa: "高知県", region: "Shikoku", lat: 33.4, lng: 133.4 },

  { slug: "fukuoka", name: "Fukuoka", nameJa: "福岡県", region: "Kyushu", lat: 33.6, lng: 130.5 },
  { slug: "saga", name: "Saga", nameJa: "佐賀県", region: "Kyushu", lat: 33.3, lng: 130.1 },
  { slug: "nagasaki", name: "Nagasaki", nameJa: "長崎県", region: "Kyushu", lat: 32.9, lng: 129.9 },
  { slug: "kumamoto", name: "Kumamoto", nameJa: "熊本県", region: "Kyushu", lat: 32.6, lng: 130.8 },
  { slug: "oita", name: "Oita", nameJa: "大分県", region: "Kyushu", lat: 33.2, lng: 131.4 },
  { slug: "miyazaki", name: "Miyazaki", nameJa: "宮崎県", region: "Kyushu", lat: 32.0, lng: 131.3 },
  { slug: "kagoshima", name: "Kagoshima", nameJa: "鹿児島県", region: "Kyushu", lat: 31.6, lng: 130.55 },
  { slug: "okinawa", name: "Okinawa", nameJa: "沖縄県", region: "Kyushu", lat: 26.2124, lng: 127.6809 },

  // ---- Thailand (provinces; added as the atlas expands beyond Japan) ----
  { slug: "bangkok", name: "Bangkok", nameJa: "กรุงเทพมหานคร", region: "Central Thailand", lat: 13.7563, lng: 100.5018, country: "thailand" },
  { slug: "ayutthaya", name: "Ayutthaya", nameJa: "พระนครศรีอยุธยา", region: "Central Thailand", lat: 14.35, lng: 100.57, country: "thailand" },
  { slug: "kanchanaburi", name: "Kanchanaburi", nameJa: "กาญจนบุรี", region: "Central Thailand", lat: 14.3, lng: 99.0, country: "thailand" },
  { slug: "samut-songkhram", name: "Samut Songkhram", nameJa: "สมุทรสงคราม", region: "Central Thailand", lat: 13.41, lng: 100.0, country: "thailand" },
  { slug: "samut-prakan", name: "Samut Prakan", nameJa: "สมุทรปราการ", region: "Central Thailand", lat: 13.6, lng: 100.6, country: "thailand" },
  { slug: "nakhon-pathom", name: "Nakhon Pathom", nameJa: "นครปฐม", region: "Central Thailand", lat: 13.82, lng: 100.06, country: "thailand" },
  { slug: "prachuap-khiri-khan", name: "Prachuap Khiri Khan", nameJa: "ประจวบคีรีขันธ์", region: "Central Thailand", lat: 11.8, lng: 99.8, country: "thailand" },
  { slug: "lopburi", name: "Lopburi", nameJa: "ลพบุรี", region: "Central Thailand", lat: 14.7995, lng: 100.6534, country: "thailand" },
  { slug: "ratchaburi", name: "Ratchaburi", nameJa: "ราชบุรี", region: "Central Thailand", lat: 13.5283, lng: 99.8134, country: "thailand" },
  { slug: "chiang-mai", name: "Chiang Mai", nameJa: "เชียงใหม่", region: "Northern Thailand", lat: 18.79, lng: 98.98, country: "thailand" },
  { slug: "chiang-rai", name: "Chiang Rai", nameJa: "เชียงราย", region: "Northern Thailand", lat: 19.9, lng: 99.83, country: "thailand" },
  { slug: "mae-hong-son", name: "Mae Hong Son", nameJa: "แม่ฮ่องสอน", region: "Northern Thailand", lat: 19.3013, lng: 97.9685, country: "thailand" },
  { slug: "udon-thani", name: "Udon Thani", nameJa: "อุดรธานี", region: "Northeastern Thailand", lat: 17.4, lng: 102.8, country: "thailand" },
  { slug: "nong-khai", name: "Nong Khai", nameJa: "หนองคาย", region: "Northeastern Thailand", lat: 17.8783, lng: 102.742, country: "thailand" },
  { slug: "buriram", name: "Buriram", nameJa: "บุรีรัมย์", region: "Northeastern Thailand", lat: 14.993, lng: 103.1029, country: "thailand" },
  { slug: "chonburi", name: "Chonburi", nameJa: "ชลบุรี", region: "Eastern Thailand", lat: 13.1, lng: 101.0, country: "thailand" },
  { slug: "trat", name: "Trat", nameJa: "ตราด", region: "Eastern Thailand", lat: 12.2428, lng: 102.5177, country: "thailand" },
  { slug: "krabi", name: "Krabi", nameJa: "กระบี่", region: "Southern Thailand", lat: 8.1, lng: 98.9, country: "thailand" },
  { slug: "phuket", name: "Phuket", nameJa: "ภูเก็ต", region: "Southern Thailand", lat: 7.95, lng: 98.35, country: "thailand" },

  // ---- USA (states; added as the atlas expands beyond Asia) ----
  { slug: "california", name: "California", nameJa: "CA", region: "West US", lat: 36.7783, lng: -119.4179, country: "usa" },
  { slug: "nevada", name: "Nevada", nameJa: "NV", region: "West US", lat: 38.8026, lng: -116.4194, country: "usa" },
  { slug: "hawaii", name: "Hawaii", nameJa: "HI", region: "West US", lat: 19.8968, lng: -155.5828, country: "usa" },
  { slug: "washington", name: "Washington", nameJa: "WA", region: "West US", lat: 47.7511, lng: -120.7401, country: "usa" },
  { slug: "colorado", name: "Colorado", nameJa: "CO", region: "West US", lat: 39.5501, lng: -105.7821, country: "usa" },
  { slug: "new-mexico", name: "New Mexico", nameJa: "NM", region: "West US", lat: 34.5199, lng: -105.8701, country: "usa" },
  { slug: "texas", name: "Texas", nameJa: "TX", region: "South US", lat: 31.9686, lng: -99.9018, country: "usa" },
  { slug: "florida", name: "Florida", nameJa: "FL", region: "South US", lat: 27.6648, lng: -81.5158, country: "usa" },
  { slug: "maryland", name: "Maryland", nameJa: "MD", region: "South US", lat: 39.0458, lng: -76.6413, country: "usa" },
  { slug: "nebraska", name: "Nebraska", nameJa: "NE", region: "Midwest US", lat: 41.4925, lng: -99.9018, country: "usa" },
  { slug: "south-dakota", name: "South Dakota", nameJa: "SD", region: "Midwest US", lat: 44.3668, lng: -100.3364, country: "usa" },
  { slug: "wisconsin", name: "Wisconsin", nameJa: "WI", region: "Midwest US", lat: 43.7844, lng: -88.7879, country: "usa" },
  { slug: "new-jersey", name: "New Jersey", nameJa: "NJ", region: "Northeast US", lat: 40.0583, lng: -74.4057, country: "usa" },
  { slug: "new-york", name: "New York", nameJa: "NY", region: "Northeast US", lat: 42.1657, lng: -74.9481, country: "usa" },
];

export const PREFECTURE_SLUGS = PREFECTURES.map((p) => p.slug) as [string, ...string[]];

const BY_SLUG = new Map(PREFECTURES.map((p) => [p.slug, p]));
export function getPrefecture(slug: string): Prefecture | undefined {
  return BY_SLUG.get(slug);
}

/** Group prefectures by region for browse pages. */
export function prefecturesByRegion(): Record<Region, Prefecture[]> {
  const out = Object.fromEntries(REGIONS.map((r) => [r, [] as Prefecture[]])) as Record<
    Region,
    Prefecture[]
  >;
  for (const p of PREFECTURES) out[p.region].push(p);
  return out;
}

/** Country a prefecture/province belongs to (the original 47 are Japan's). */
export function prefectureCountry(p: Prefecture): import("./vocab").Country {
  return p.country ?? "japan";
}

/** Geographic center of Japan, used as the default map view. */
export const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529, zoom: 5 };
