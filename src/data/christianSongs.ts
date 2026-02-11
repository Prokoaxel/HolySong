export type StarterSong = {
  title: string
  author: string
  composer: string
  tone: string
  content: string
}

// Pack inicial de himnos/alabanzas para arrancar rapido.
export const CHRISTIAN_STARTER_SONGS: StarterSong[] = [
  {
    title: 'Sublime Gracia',
    author: 'John Newton',
    composer: 'Traditional',
    tone: 'G',
    content:
      '[G]Sublime [C]gracia del [G]Senor\nQue a [Em]un infeliz [D]salvo\nFui [G]ciego mas [C]hoy puedo [G]ver\nPer[D]dido y [G]El me hallo',
  },
  {
    title: 'Cuan Grande Es El',
    author: 'Carl Boberg',
    composer: 'Traditional',
    tone: 'D',
    content:
      '[D]Senor mi Dios al contemplar los [G]cielos\nEl fir[D]mamento y las estrellas [A]mil\nAl oir [D]tu voz en los potentes [G]truenos\nMi cora[D]zon entona: [A]Cuan grande es [D]El',
  },
  {
    title: 'Castillo Fuerte',
    author: 'Martin Luther',
    composer: 'Traditional',
    tone: 'E',
    content:
      '[E]Castillo fuerte es [A]nuestro Dios\nDe[E]fensa y buen [B]escudo\nCon [E]su poder nos [A]librara\nEn [E]todo trance [B]agudo',
  },
  {
    title: 'Al Que Esta Sentado En El Trono',
    author: 'Traditional',
    composer: 'Traditional',
    tone: 'A',
    content:
      '[A]Al que esta sentado en el [E/G#]trono\nY al [F#m7]Cordero [D]sea la alabanza\nLa [A]honra, la [E]gloria y el [F#m7]poder\nPor los [D]siglos de los siglos',
  },
  {
    title: 'Te Exalto',
    author: 'Traditional',
    composer: 'Traditional',
    tone: 'G',
    content:
      '[G]Te exalto, [D/F#]te exalto\n[Em7]Te exalto, [C]oh Senor\n[G]Tu nombre [D/F#]levantare\n[E]Porque [Am7]grande [D]eres [G]Tu',
  },
  {
    title: 'Digno Y Santo',
    author: 'Traditional',
    composer: 'Traditional',
    tone: 'E',
    content:
      '[E]Digno y [B]santo el [C#m7]Cordero\n[E]Inmolado en la [B]cruz\n[E]Nuevo canto [B]levantamos\nAl que [A]en su [B]trono [E]esta',
  },
]
