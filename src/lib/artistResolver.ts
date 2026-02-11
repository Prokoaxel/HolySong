const KNOWN_ARTISTS = [
  'Marcos Brunet',
  'Marco Barrientos',
  'BJ Putnam',
  'Jovenes Haedo',
  'Art Aguilera',
  'Miel San Marcos',
  'Marcos Witt',
  'Christine D\'Clario',
  'Barak',
  'Rojo',
  'Majo y Dan',
  'Coalo Zamorano',
  'Ibi',
  'Toma Tu Lugar',
  'Un Corazon',
  'Redimi2',
  'Alex Campos',
  'Danilo Montero',
  'Evan Craft',
  'Jesus Adrian Romero',
  'Aline Barros',
  'Hillsong Worship',
  'Hillsong United',
  'Elevation Worship',
  'Bethel Music',
  'Gateway Worship',
  'Planetshakers',
  'Kari Jobe',
  'Brandon Lake',
  'Jesus Culture',
  'Adoracion La IBI',
  'Fermin Garcia',
  'Jaime Murrell',
  'Michael Bunster',
  'Omar Rodriguez Music',
  'TOMATULUGAR',
  'UPPERROOM',
  'Vida Nueva Music',
  'John Newton',
  'Carl Boberg',
  'Martin Luther',
  'Traditional',
]

const ARTIST_ALIASES: Record<string, string> = {
  'mercos vrunet': 'Marcos Brunet',
  'marcos vrunet': 'Marcos Brunet',
  'marcos brumet': 'Marcos Brunet',
  'marcos brunett': 'Marcos Brunet',
  'marco brunet': 'Marcos Brunet',
  'art gillera': 'Art Aguilera',
  'art aguilrra': 'Art Aguilera',
  'arto aguilera': 'Art Aguilera',
  'miel sanmarcos': 'Miel San Marcos',
  'majo dan': 'Majo y Dan',
  'majo ydan': 'Majo y Dan',
  'coalo samorano': 'Coalo Zamorano',
  'coalo zamoramo': 'Coalo Zamorano',
  'coalo': 'Coalo Zamorano',
  'ibi worship': 'Ibi',
  'ibi music': 'Ibi',
  'toma tu lugar worship': 'Toma Tu Lugar',
  'tomatugar': 'Toma Tu Lugar',
  'jesus adrian romero': 'Jesus Adrian Romero',
  'jesus adriano romero': 'Jesus Adrian Romero',
  'jesus adrian romeri': 'Jesus Adrian Romero',
  'christine dclario': 'Christine D\'Clario',
  'christine declario': 'Christine D\'Clario',
  'un corazon': 'Un Corazon',
  'hillsong united': 'Hillsong United',
  'hillsong worship': 'Hillsong Worship',
  'elevation': 'Elevation Worship',
  'bethel': 'Bethel Music',
  'gateway': 'Gateway Worship',
  'planet shakers': 'Planetshakers',
  'hillsong en espanol': 'Hillsong Worship',
  'marco barriento': 'Marco Barrientos',
  'bj pputman': 'BJ Putnam',
  'bj putman': 'BJ Putnam',
  'evan craf': 'Evan Craft',
  'jovenes de haedo': 'Jovenes Haedo',
  'jovenes haedo': 'Jovenes Haedo',
  'adoracion la ibi': 'Adoracion La IBI',
  'fermin garcia': 'Fermin Garcia',
  'jaime murrel': 'Jaime Murrell',
  'michael bunster p': 'Michael Bunster',
  'omar rodriguez music': 'Omar Rodriguez Music',
  'tomatolugar': 'TOMATULUGAR',
  'tomatulugar': 'TOMATULUGAR',
  'upper room': 'UPPERROOM',
  'vida nueva music': 'Vida Nueva Music',
}

const PRESET_ARTIST_IMAGES: Record<string, string> = {
  'Marcos Brunet': 'https://cdn-images.dzcdn.net/images/artist/07cf97750fd43e0a98ba461d360e56bc/250x250-000000-80-0-0.jpg',
  'Marco Barrientos': 'https://cdn-images.dzcdn.net/images/artist/388c43f8fc24b06deffc85f9a64ced20/250x250-000000-80-0-0.jpg',
  'BJ Putnam': 'https://cdn-images.dzcdn.net/images/artist/c2387c8e2ffdbba6510324307b71cbc8/250x250-000000-80-0-0.jpg',
  'Jovenes Haedo': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiDLms4-VOikGtc4H5vixUv2kugevwJS7Hag&s',
  'Art Aguilera': 'https://cdn-images.dzcdn.net/images/artist/1f2d001c6746026a1ec8b8b8cf0b01fe/250x250-000000-80-0-0.jpg',
  'Miel San Marcos': 'https://cdn-images.dzcdn.net/images/artist/0263d5df41a4cca3409e807144dd11f3/250x250-000000-80-0-0.jpg',
  'Marcos Witt': 'https://cdn-images.dzcdn.net/images/artist/474a9f9b7b7325f5690c398ddab36c9c/250x250-000000-80-0-0.jpg',
  'Christine D\'Clario': 'https://cdn-images.dzcdn.net/images/artist/05b4dad5c940fefd8ea2f17e3e1c18eb/250x250-000000-80-0-0.jpg',
  'Barak': 'https://cdn-images.dzcdn.net/images/artist/345af6aff509a3e05625aaa35ad091d0/250x250-000000-80-0-0.jpg',
  'Rojo': 'https://cdn-images.dzcdn.net/images/artist/30f0578578f6af005bbc2c072959e6ec/250x250-000000-80-0-0.jpg',
  'Majo y Dan': 'https://cdn-images.dzcdn.net/images/artist/4b2fcde4c32527d82ae725f913d333b1/250x250-000000-80-0-0.jpg',
  'Coalo Zamorano': 'https://cdn-images.dzcdn.net/images/artist/2f7fe48711ee3a16dcffabd19f9c9c6a/250x250-000000-80-0-0.jpg',
  'Ibi': 'https://cdn-images.dzcdn.net/images/artist/0694d2c18a753c7cea61a148159afeb5/250x250-000000-80-0-0.jpg',
  'Toma Tu Lugar': 'https://cdn-images.dzcdn.net/images/artist/5da36b28915a452033cb97ac33c050de/250x250-000000-80-0-0.jpg',
  'Un Corazon': 'https://cdn-images.dzcdn.net/images/artist/31add829574547edffea89111511d8a4/250x250-000000-80-0-0.jpg',
  'Redimi2': 'https://cdn-images.dzcdn.net/images/artist/40c8685eef37b38d89487af34e700bfc/250x250-000000-80-0-0.jpg',
  'Alex Campos': 'https://cdn-images.dzcdn.net/images/artist/2a73b0aa344e96de91a5207ca15ea276/250x250-000000-80-0-0.jpg',
  'Danilo Montero': 'https://cdn-images.dzcdn.net/images/artist/13ec7b0cde8164f3ae49e5dbf6ae147b/250x250-000000-80-0-0.jpg',
  'Evan Craft': 'https://cdn-images.dzcdn.net/images/artist/457f7633bd5d61496b962393fb72a040/250x250-000000-80-0-0.jpg',
  'Jesus Adrian Romero': 'https://cdn-images.dzcdn.net/images/artist/ad97dff3232f57a9e10bd19520b5698d/250x250-000000-80-0-0.jpg',
  'Aline Barros': 'https://cdn-images.dzcdn.net/images/artist/a7f53fd4313c03ef3496515288befd2f/250x250-000000-80-0-0.jpg',
  'Elevation Worship': 'https://cdn-images.dzcdn.net/images/artist/01b253231de2ba0c70a5dbd1816d50d3/250x250-000000-80-0-0.jpg',
  'Hillsong Worship': 'https://cdn-images.dzcdn.net/images/artist/e9d6a7afb9046143103a9973bd6291a1/250x250-000000-80-0-0.jpg',
  'Hillsong United': 'https://cdn-images.dzcdn.net/images/artist/2d8a1f44d5947a9b02ea9f9fd31808a3/250x250-000000-80-0-0.jpg',
  'Bethel Music': 'https://cdn-images.dzcdn.net/images/artist/0f7fe6167f047f9b5d280c558ae8a10d/250x250-000000-80-0-0.jpg',
  'Gateway Worship': 'https://cdn-images.dzcdn.net/images/artist/a4c73e148e8d47220b8df3bab1f05962/250x250-000000-80-0-0.jpg',
  'Planetshakers': 'https://cdn-images.dzcdn.net/images/artist/801ddd33e057b8fb8847d2f56972d635/250x250-000000-80-0-0.jpg',
  'Jesus Culture': 'https://cdn-images.dzcdn.net/images/artist/ee8ff0c7ab89c44918bfa16466f2845e/250x250-000000-80-0-0.jpg',
  'Kari Jobe': 'https://cdn-images.dzcdn.net/images/artist/eabfe9d7bf7261340fd4b5c567d9a629/250x250-000000-80-0-0.jpg',
  'Brandon Lake': 'https://cdn-images.dzcdn.net/images/artist/338bd957e1dd1955cbfccbf9d1580edd/250x250-000000-80-0-0.jpg',
  'Adoracion La IBI': 'https://cdn-images.dzcdn.net/images/artist/32541fe806add28dbcdc8d782fb81669/250x250-000000-80-0-0.jpg',
  'Fermin Garcia': 'https://cdn-images.dzcdn.net/images/artist/a06cd01e5dbf736c859fc2964d5e17e2/250x250-000000-80-0-0.jpg',
  'Jaime Murrell': 'https://cdn-images.dzcdn.net/images/artist/f6def4ad2fc75ed2239dcabf94817b28/250x250-000000-80-0-0.jpg',
  'Michael Bunster': 'https://cdn-images.dzcdn.net/images/artist/28ca1243aa3c2607b857fe8d1b70adf4/250x250-000000-80-0-0.jpg',
  'Omar Rodriguez Music': 'https://cdn-images.dzcdn.net/images/artist/42ee5138be91c9f7182b0fe6e6f70844/250x250-000000-80-0-0.jpg',
  'TOMATULUGAR': 'https://cdn-images.dzcdn.net/images/artist/5da36b28915a452033cb97ac33c050de/250x250-000000-80-0-0.jpg',
  'UPPERROOM': 'https://cdn-images.dzcdn.net/images/artist/c2f48a217e52da96f284e4095cd75404/250x250-000000-80-0-0.jpg',
  'Vida Nueva Music': 'https://cdn-images.dzcdn.net/images/artist/728b707f8032f6efcf3fed3c84c73330/250x250-000000-80-0-0.jpg',
}

const IMAGE_CACHE_KEY = 'holysong.artistImages.v1'
const imageMemoryCache = new Map<string, string | null>()
const pendingFetches = new Map<string, Promise<string | null>>()

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const extractPrimaryArtist = (value: string): string => {
  const raw = value.trim()
  if (!raw) return ''

  const cleaned = raw
    // "feat ...", "ft ...", "featuring ..."
    .replace(/\b(feat|ft|featuring)\b\.?.*$/i, '')
    // parentesis con invitados
    .replace(/\(([^)]*feat[^)]*)\)/gi, '')
    .trim()

  if (!cleaned) return raw

  const firstByComma = cleaned.split(',')[0]?.trim()
  if (firstByComma) return firstByComma

  const firstByAnd = cleaned.split(/\s+(&|and|con)\s+/i)[0]?.trim()
  return firstByAnd || cleaned
}

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const next = new Array(b.length + 1).fill(0)

  for (let i = 1; i <= a.length; i++) {
    next[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      next[j] = Math.min(
        prev[j] + 1,
        next[j - 1] + 1,
        prev[j - 1] + cost,
      )
    }
    for (let j = 0; j <= b.length; j++) prev[j] = next[j]
  }

  return prev[b.length]
}

export const canonicalizeArtistName = (input: string): { name: string; corrected: boolean } => {
  const raw = extractPrimaryArtist(input)
  if (!raw) return { name: '', corrected: false }

  const normalized = normalize(raw)
  if (!normalized) return { name: '', corrected: false }

  const aliasMatch = ARTIST_ALIASES[normalized]
  if (aliasMatch) {
    return { name: aliasMatch, corrected: aliasMatch !== raw }
  }

  let bestName = ''
  let bestScore = -1
  for (const artist of KNOWN_ARTISTS) {
    const nArtist = normalize(artist)
    const dist = levenshtein(normalized, nArtist)
    const score = 1 - dist / Math.max(normalized.length, nArtist.length)
    if (score > bestScore) {
      bestScore = score
      bestName = artist
    }
  }

  // Acepta correccion automatica solo si la similitud es suficientemente alta.
  if (bestScore >= 0.72) {
    return { name: bestName, corrected: bestName !== raw }
  }

  const cleaned = toTitleCase(raw)
  return { name: cleaned, corrected: cleaned !== raw }
}

const readLocalImageCache = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const writeLocalImageCache = (cache: Record<string, string>) => {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // noop
  }
}

export const resolveArtistImageUrl = async (input: string): Promise<string | null> => {
  const { name } = canonicalizeArtistName(input)
  if (!name) return null

  if (PRESET_ARTIST_IMAGES[name]) {
    return PRESET_ARTIST_IMAGES[name]
  }

  if (imageMemoryCache.has(name)) {
    return imageMemoryCache.get(name) ?? null
  }

  if (pendingFetches.has(name)) {
    return pendingFetches.get(name) as Promise<string | null>
  }

  const local = readLocalImageCache()
  if (local[name]) {
    imageMemoryCache.set(name, local[name])
    return local[name]
  }

  const req = (async () => {
    try {
      const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}`
      const res = await fetch(url)
      if (!res.ok) return null

      const payload = await res.json()
      const items = Array.isArray(payload?.data) ? payload.data : []
      if (items.length === 0) return null

      const normalizedTarget = normalize(name)
      const exact = items.find((it: any) => normalize(String(it?.name || '')) === normalizedTarget)
      const picked = exact ?? items[0]
      const image = picked?.picture_medium || picked?.picture_small || picked?.picture_big || null
      if (!image || typeof image !== 'string') return null

      imageMemoryCache.set(name, image)
      const merged = { ...local, [name]: image }
      writeLocalImageCache(merged)
      return image
    } catch {
      return null
    } finally {
      pendingFetches.delete(name)
    }
  })()

  pendingFetches.set(name, req)
  return req
}
