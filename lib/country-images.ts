export const COUNTRY_IMAGES: Record<string, string> = {
  China:
    "https://eu-images.contentstack.com/v3/assets/blte218090c2a6fb1e2/blt948871d04c6ce037/6255d273643f9b4941542a21/china-alte-architektur-t-470436943.jpg?auto=webp&width=1440&quality=75",
  "Saudi Arabia": "https://www.oracle.com/a/pr/img/rc24-saudi.jpg",
  UAE: "https://cepa.org/wp-content/uploads/2023/03/2015-05-22T120000Z_1778115619_GF10000103727_RTRMADP_3_UAE-MARINA-scaled.jpg",
  "United Arab Emirates":
    "https://cepa.org/wp-content/uploads/2023/03/2015-05-22T120000Z_1778115619_GF10000103727_RTRMADP_3_UAE-MARINA-scaled.jpg",
  Malaysia: "https://moderndiplomacy.eu/wp-content/uploads/2018/09/malaysia-digital-economy.jpg",
  Poland: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAjymlz1A4PnR9lfR0SDbEvvd8n5c6phniWA&s",
  Austria:
    "https://heritagehotelsofeurope.com/wp-content/uploads/2020/06/hallstatt-village-austria-TX59P3L-1-scaled.jpg",
  Finland:
    "https://i.natgeofe.com/k/2847c949-6de3-4d11-998a-d3ce12d9edb0/finland-cityscape.jpg?wp=1&w=1084.125&h=721.875",
  Norway: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZD74TqXPx9bxEvLaAnMuapWqoFO2bQG5cyg&s",
  Denmark:
    "https://ik.imgkit.net/3vlqs5axxjf/MM-TP/https://cdn.travelpulse.com/images/99999999-9999-9999-9999-999999999999/285d6f26-ce5f-36ec-c49d-0cc4eb97bd23/source.jpg?tr=w-1200%2Cfo-auto",
  Spain: "https://cms-images.oliverstravels.com/app/uploads/2023/10/04080649/Barcelona.jpg",
  Ireland: "https://i.natgeofe.com/n/058d192a-637e-47ac-a184-0e82c264a15a/NationalGeographic_1607903.jpg",
  Singapore:
    "https://www.aljazeera.com/wp-content/uploads/2024/02/AP22047458269205-1708918925.jpg?resize=770%2C513&quality=80",
  "South Korea":
    "https://hips.hearstapps.com/hmg-prod/images/south-korea-travel-guide-from-seoul-to-busan-to-jeonju-with-intrepid-6627b232b51b3.jpg?crop=0.8888888888888888xw:1xh;center,top&resize=1200:*",
  Japan: "https://www.fvw.de/news/media/28/Overtourism-Japan-271110.jpeg",
  "New Zealand": "https://www.thrillophilia.com/blog/wp-content/uploads/2024/03/New-Zealand-Cities.jpg",
  Australia: "https://acko-cms.ackoassets.com/Things_To_Do_In_Australia_247bc1629f.png",
  Switzerland:
    "https://www.alphatrad.com/sites/alphatrad.com/files/images/articles/what-are-the-languages-spoken-in-switzerland.jpg",
  Sweden: "https://adventures.com/media/18366/stockholm-christmas-market-sweden-old-town.jpg",
  Netherlands: "https://thepienews.com/wp-content/uploads/2025/10/iStock-netherlands-960x506.jpg",
  France: "https://dynamic-media.tacdn.com/media/photo-o/30/42/46/65/caption.jpg?w=2400&h=-1&s=1",
  Germany: "https://assets.weforum.org/article/image/QAAFBg6LUUWydJec7NJGO4cvBrUgy1LxTgfwVL7Q_r0.jpg",
  Canada: "https://brighttax.com/wp-content/uploads/2025/06/life-in-canada.jpg",
  Italy:
    "https://placebrandobserver.com/wp-content/uploads/Italy-economic-performance-sustainability-country-brand-strength-reputation.jpg",
  Turkey: "https://smileytrips.com/uploads/blog/1702363260_turle.jpeg",
  "United States of America": "https://abdsirketrehberi.com/wp-content/uploads/2024/12/usa-850x425.jpg",
  USA: "https://abdsirketrehberi.com/wp-content/uploads/2024/12/usa-850x425.jpg",
  "United States": "https://abdsirketrehberi.com/wp-content/uploads/2024/12/usa-850x425.jpg",
  "United Kingdom":
    "https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRJn0bK_RKKssE24Tfrp3Qm_WQ1aQK8IXqnMOsp8af8ilcHv3Lp_irWVOEGbdqJGJyWLc9hKi1A6Q5YUvGIuE83JVA&s=19",
  UK: "https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRJn0bK_RKKssE24Tfrp3Qm_WQ1aQK8IXqnMOsp8af8ilcHv3Lp_irWVOEGbdqJGJyWLc9hKi1A6Q5YUvGIuE83JVA&s=19",
}

// List of all valid countries we support
export const VALID_COUNTRIES = [
  "China",
  "Saudi Arabia",
  "UAE",
  "Malaysia",
  "Poland",
  "Austria",
  "Finland",
  "Norway",
  "Denmark",
  "Spain",
  "Ireland",
  "Singapore",
  "South Korea",
  "Japan",
  "New Zealand",
  "Australia",
  "Switzerland",
  "Sweden",
  "Netherlands",
  "France",
  "Germany",
  "Canada",
  "Italy",
  "Turkey",
  "United States of America",
  "United Kingdom",
]

export function getCountryImage(countryName: string): string | null {
  // Direct match
  if (COUNTRY_IMAGES[countryName]) {
    return COUNTRY_IMAGES[countryName]
  }

  // Try common variations
  const variations: Record<string, string> = {
    "United States": "United States of America",
    USA: "United States of America",
    US: "United States of America",
    UK: "United Kingdom",
    Britain: "United Kingdom",
    "Great Britain": "United Kingdom",
    England: "United Kingdom",
    "United Arab Emirates": "UAE",
    Korea: "South Korea",
    "Republic of Korea": "South Korea",
  }

  if (variations[countryName] && COUNTRY_IMAGES[variations[countryName]]) {
    return COUNTRY_IMAGES[variations[countryName]]
  }

  // Case-insensitive search
  const lowerName = countryName.toLowerCase()
  for (const [key, value] of Object.entries(COUNTRY_IMAGES)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }

  return null
}

export function normalizeCountryName(name: string): string {
  const normalizations: Record<string, string> = {
    "United States": "United States of America",
    USA: "United States of America",
    US: "United States of America",
    UK: "United Kingdom",
    Britain: "United Kingdom",
    "Great Britain": "United Kingdom",
    England: "United Kingdom",
    "United Arab Emirates": "UAE",
    Korea: "South Korea",
    "Republic of Korea": "South Korea",
  }

  return normalizations[name] || name
}
