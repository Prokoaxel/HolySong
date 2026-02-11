export type WorshipSetSong = {
  title: string
  author: string
  composer?: string
  tone?: string
}

// Lista base solicitada para importacion masiva (titulos + artistas/compositores).
export const WORSHIP_SET_SONGS: WorshipSetSong[] = [
  { title: 'Santo por siempre', author: 'Adoracion La IBI' },
  { title: 'Libre Soy', author: 'Barak, Alex Campos' },
  { title: 'Glorioso (feat. Lucia Parker)', author: 'BJ Putnam, Lucia Parker' },
  { title: 'Cosas Poderosas', author: 'Coalo Zamorano' },
  { title: 'Cosas poderosas/Vida mia', author: 'Coalo Zamorano' },
  { title: 'Has Aumentado', author: 'Danilo Montero' },
  { title: 'Digo Amen', author: 'Evan Craft, Cxmmxns' },
  { title: 'Por Lo Que Has Hecho', author: 'Evan Craft, Chisco' },
  { title: 'Toda la Casa de Israel - En Vivo', author: 'Fermin Garcia' },
  { title: 'Es Tiempo', author: 'Hillsong en Espanol' },
  { title: 'Oh Moradora De Sion', author: 'Jaime Murrell' },
  { title: 'Fiel', author: 'Majo y Dan' },
  { title: 'Te Deseo', author: 'Majo y Dan' },
  { title: 'No yo, sino Cristo', author: 'Majo y Dan' },
  { title: 'A El Sea la Gloria', author: 'Marco Barrientos' },
  { title: 'Amanece', author: 'Marco Barrientos' },
  { title: 'Rey de Reyes', author: 'Marco Barrientos' },
  { title: 'Al Que Esta Sentado en el Trono', author: 'Marco Barrientos' },
  { title: 'Eres Rey de los Cielos', author: 'Marco Barrientos' },
  { title: 'Mi plenitud', author: 'Marcos Brunet, Abbie Gamboa' },
  { title: 'Toma Tu Lugar', author: 'Marcos Brunet, Toma Tu Lugar' },
  { title: 'Cristo es mi Senor', author: 'Marcos Witt' },
  { title: 'Al Que Esta En El Trono / Santo', author: 'Michael Bunster P., Puertas Eternas' },
  { title: 'Bendice Alma Mia', author: 'Omar Rodriguez Music, Alejandra G' },
  { title: 'Hasta Que Ya No Respire Mas', author: 'Rojo' },
  { title: 'Habita entre nosotros', author: 'TOMATULUGAR, Marcos Brunet, Danilo Montero' },
  { title: 'Toda lengua y toda nacion', author: 'TOMATULUGAR, Jan Earle, Marcos Brunet' },
  { title: 'Santo - Live', author: 'UPPERROOM, TOMATULUGAR' },
  { title: 'Ven Descansa - Live', author: 'UPPERROOM, TOMATULUGAR' },
  { title: 'No te cambio por nada', author: 'VIDA NUEVA MUSIC' },
]
