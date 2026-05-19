/**
 * Demo mode mock data — used as fallback when API fails in demo mode
 */
export const demoSongs = [
  {
    id: 1,
    title: 'AU CŒUR DE LA LOUANGE',
    author: 'Marc Lahaie',
    ccli: '1234567',
    arrangements: [
      {
        id: 1,
        name: 'Couplet-Refrain',
        key: 'D',
        tempo: 72,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{key:D}
{verse: Introduction}
D A Em7 A
D A Em7 A

{verse: Couplet 1}
D                         A                   Em7                             A
Le chant terminé, le rideau retombe, Je viens simplement
D                         A                   Em7                             A
Porter mon offrande, car j'ai le désir De réjouir ton cœur

{verse: Refrain}
Em7                                     A                                Em7                                     A
J'apporte plus qu'un beau chant, chanter ne suffit pas Pour répondre à ton appel
Em7                                       A                                Em7                                         A
Les apparences sont trompeuses, tu vois bien au dela, O Dieu, tu sondes mon cœur

{verse: Pont}
D                                   A                                 Em7             G              A      D
Je reviens au cœur de la louange, Tout est centré sur toi, centré sur toi Jésus.
`
      }
    ]
  },
  {
    id: 2,
    title: 'ABRITE-MOI',
    author: 'Tom Breuker',
    ccli: '2345678',
    arrangements: [
      {
        id: 2,
        name: 'Accords en G',
        key: 'G',
        tempo: 68,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Intro}
C2 Em7 G/D D
C2 Em7 G/D D

{verse: Couplet 1}
G D/F# Em C A/C# D
Abrite-moi sous tes ailes,
G/B C Am D
Couvre-moi par ta main puissante.

{verse: Refrain}
G G/B C D G
Même si les océans se déchaînent,
G G/B C D Em
Je les traverserai avec Toi.
Em C D Em
Père, Tu domines les tempêtes,
G/B C D C2
Je suis tranquille car Tu es là.

{verse: Couplet 2}
G D/F# Em C A/C# D
En Jésus seul je me confie,
G/B C Am D
Il me donne force, calme et puissance.
`
      }
    ]
  },
  {
    id: 3,
    title: 'OCEAN',
    author: 'Hillsong',
    ccli: '3456789',
    arrangements: [
      {
        id: 3,
        name: 'Version française',
        key: 'Bm',
        tempo: 74,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Intro}
Bm A D A G

{verse: Couplet 1}
Bm A D A G
Oui, Tu m'appelles par-delà des eaux
Dans l'inconnue, aucun appui
Bm A D A G
Et Tu te révèles dans ce mystère.
Dans l'abîme, ma foi demeure,

{verse: Refrain}
Et j'invoquerai Ton Saint Nom
Portant mes yeux vers l'horizon dans la tempête.
Tes bras abriteront mon âme
Je t'appartiens, et Tu es mien.

{verse: Pont}
Bm G
Saint-Esprit repousse les limites de ma foi
Apprends-moi à marcher sur l'eau
Peu importe où Tu m'appelles
Bm G
Conduis-moi plus loin que je n'oserai m'avancer
Et ma foi sera fortifiée dans la présence de mon Sauveur.
`
      }
    ]
  },
  {
    id: 4,
    title: 'NOUS ADORONS ADONAÏ',
    author: 'Inconnue',
    ccli: '',
    arrangements: [
      {
        id: 4,
        name: 'Accords en Em',
        key: 'Em',
        tempo: 80,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Key: Em}
{verse: Couplet 1}
Em Am
Nous adorons Adonaï,
D D/F# G Bsus4 B7
Nous adorons Él-Shaddaï.
Em Am
Nous élevons ton grand nom,
Em B7 Em
Nous te louons Seigneur.

{verse: Refrain}
E D Am D
D'un même cœur pour le Seigneur,
G D/F# Em
Le créateur du vrai bonheur.
Am B7 glorieux, mon Em
Tu es roi.
`
      }
    ]
  },
  {
    id: 5,
    title: 'A L\'AGNEAU DE DIEU',
    author: 'Inconnue',
    ccli: '',
    arrangements: [
      {
        id: 5,
        name: 'Acc en F',
        key: 'F',
        tempo: 60,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Couplet 1}
[Dm]Elevé à la [C]droite de Dieu
[Gm]Couronné de [Dm]mille cou[C]ronnes
[F]Tu resplendis comme un [C]soleil radieux
[Gm]Les êtres crient au[Asus4]tour de ton [A]trône

{verse: Refrain}
[Dm]A l'agneau de Dieu soit la [Gm]gloire
A l'agneau de Dieu, la vic[C]toire
[F]A l'agneau de Dieu soit le [C]règne
Pour tous les [Gm]siècles, A[Asus4]men

{verse: Couplet 2}
[Dm]L'esprit Saint et [C]l'épouse fidèle
[Gm]Disent: viens c'est leur [Dm]cœur qui a[C]ppelle
[F]Viens, ô Jésus, toi [C]l'époux bien-aimé
[Gm]Tous tes élus ne [Asus4]cessent de chan[A]ter
`
      }
    ]
  },
  {
    id: 6,
    title: 'QUEL AMOUR INCROYABLE',
    author: 'Matt Redman',
    ccli: '4567890',
    arrangements: [
      {
        id: 6,
        name: 'Version française',
        key: 'C',
        tempo: 76,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Intro}
C G Am F
C G Am F

{verse: Couplet 1}
C                G               Am              F
Quel amour incroyable, quelle grâce inouïe
C                G               Am              F
Le Roi de l'univers, s'abaisse jusqu'à moi
C                G               Am              F
Il porte mes fardeaux, il guérit mes blessures
C                G               Am              F
Son amour éternel ne faillira jamais

{verse: Refrain}
F        G        C        Am
Alléluia, gloire à l'Agneau
F        G        C        Am
Il est vivant, il règne pour toujours
F        G        Am       F
Mon cœur chante sa fidélité
C        G        C
Quel amour incroyable!
`
      }
    ]
  },
  {
    id: 7,
    title: 'JE SUIS A TOI',
    author: 'Jérôme Duss',
    ccli: '5678901',
    arrangements: [
      {
        id: 7,
        name: 'Original',
        key: 'A',
        tempo: 84,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Intro}
A E F#m D
A E F#m D

{verse: Couplet 1}
A                  E
Je suis à Toi, Tu m'as aimé
F#m                D
Avant la fondation du monde
A                  E
Je suis à Toi, Tu m'as sauvé
F#m                D
Par Ta grâce infinie

{verse: Refrain}
D           E           A
Je suis à Toi, pour toujours
F#m         D           E
Rien ne pourra me séparer
D           E           C#m
De Ton amour, de Ta présence
F#m         D           E    A
Je suis à Toi, je suis à Toi
`
      }
    ]
  },
  {
    id: 8,
    title: 'DIEU PUISSANT',
    author: 'Bethel Music',
    ccli: '6789012',
    arrangements: [
      {
        id: 8,
        name: 'Version française',
        key: 'E',
        tempo: 90,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Intro}
E B C#m A
E B C#m A

{verse: Couplet 1}
E                  B
Dieu puissant, Tu es digne
C#m                A
De recevoir toute la gloire
E                  B
Dieu puissant, Tu es saint
C#m                A
Ton nom est élevé au-dessus de tout

{verse: Refrain}
A           B           E
Saint, saint, saint est le Seigneur
C#m         A           B
Dieu tout puissant qui était, qui est
A           B           C#m
Et qui vient, le Roi des rois
F#m         A           B    E
Dieu puissant, nous T'adorons
`
      }
    ]
  },
  {
    id: 9,
    title: 'TA GRACE SUFFIT',
    author: 'Inconnue',
    ccli: '',
    arrangements: [
      {
        id: 9,
        name: 'Accords en D',
        key: 'D',
        tempo: 66,
        time_signature: '3/4',
        capo: 0,
        chord_chart: `{verse: Intro}
D G A D

{verse: Couplet 1}
D                    G
Ta grâce suffit, elle est assez
A                    D
Pour me relever, pour me transformer
D                    G
Ta grâce suffit, elle est assez
A                    D
Pour me pardonner, pour me libérer

{verse: Refrain}
G           A           D
Ta grâce suffit, Ta grâce suffit
Bm          G           A
Rien ne peut effacer Ton amour
G           A           D
Ta grâce suffit, Ta grâce suffit
Bm          G           A    D
Elle coule comme un fleuve éternel
`
      }
    ]
  },
  {
    id: 10,
    title: 'GLORIEUX EST TON NOM',
    author: 'Inconnue',
    ccli: '',
    arrangements: [
      {
        id: 10,
        name: 'Original',
        key: 'G',
        tempo: 78,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Intro}
G C D Em
G C D Em

{verse: Couplet 1}
G                    C
Des montagnes aux océans
D                    Em
Toute la création proclame
G                    C
Ta grandeur, Ta majesté
D                    Em
Glorieux est Ton nom, Seigneur

{verse: Refrain}
C           D           G
Glorieux est Ton nom
Em          C           D
Sur toute la terre
C           D           G
Glorieux est Ton nom
Em          C           D    G
Nous célébrons Ta gloire
`
      }
    ]
  },
  {
    id: 11,
    title: 'JESUS SEUL',
    author: 'Inconnue',
    ccli: '',
    arrangements: [
      {
        id: 11,
        name: 'Version acoustique',
        key: 'C',
        tempo: 70,
        time_signature: '4/4',
        capo: 2,
        chord_chart: `{verse: Intro}
C Am F G

{verse: Couplet 1}
C                 Am
Jésus seul, c'est assez
F                 G
Jésus seul, c'est tout ce qu'il me faut
C                 Am
Jésus seul, c'est assez
F                 G
Rien d'autre ne peut combler mon cœur

{verse: Refrain}
F        G        C        Am
Jésus seul, Jésus seul
F        G        C
Tu es tout ce dont j'ai besoin
F        G        Am       F
Jésus seul, Jésus seul
C        G        C
Pour l'éternité
`
      }
    ]
  },
  {
    id: 12,
    title: 'MA CONFIANCE EST EN TOI',
    author: 'Inconnue',
    ccli: '',
    arrangements: [
      {
        id: 12,
        name: 'Original',
        key: 'F',
        tempo: 82,
        time_signature: '4/4',
        capo: 0,
        chord_chart: `{verse: Intro}
F C Dm Bb

{verse: Couplet 1}
F                  C
Quand les montagnes tremblent
Dm                 Bb
Quand les océans rugissent
F                  C
Ma confiance est en Toi
Dm                 Bb
Tu es mon refuge, ma forteresse

{verse: Refrain}
Bb         C         F
Ma confiance est en Toi, Seigneur
Dm         Bb        C
Tu ne m'abandonnes jamais
Bb         C         F
Ma confiance est en Toi, Seigneur
Dm         Bb        C    F
Tu es fidèle, toujours fidèle
`
      }
    ]
  }
]

export const demoMembers = [
  { id: 1, email: 'pasteur@eglise.fr', first_name: 'Jean', last_name: 'Dupont', role: 'admin', member_type: 'staff', phone: '+33 6 12 34 56 78', notes: 'Pasteur principal', created_at: '2024-01-15T10:00:00Z' },
  { id: 2, email: 'marie@eglise.fr', first_name: 'Marie', last_name: 'Laurent', role: 'music_director', member_type: 'regular', phone: '+33 6 23 45 67 89', notes: 'Directrice musicale', created_at: '2024-02-01T10:00:00Z' },
  { id: 3, email: 'pierre@eglise.fr', first_name: 'Pierre', last_name: 'Martin', role: 'scheduler', member_type: 'regular', phone: '+33 6 34 56 78 90', notes: 'Responsable planning', created_at: '2024-02-15T10:00:00Z' },
  { id: 4, email: 'sophie@eglise.fr', first_name: 'Sophie', last_name: 'Bernard', role: 'editor', member_type: 'regular', phone: '+33 6 45 67 89 01', notes: 'Équipe louange - chant', created_at: '2024-03-01T10:00:00Z' },
  { id: 5, email: 'lucas@eglise.fr', first_name: 'Lucas', last_name: 'Petit', role: 'volunteer', member_type: 'regular', phone: '+33 6 56 78 90 12', notes: 'Guitariste', created_at: '2024-03-15T10:00:00Z' },
  { id: 6, email: 'emma@eglise.fr', first_name: 'Emma', last_name: 'Roux', role: 'volunteer', member_type: 'regular', phone: '+33 6 67 89 01 23', notes: 'Claviériste', created_at: '2024-04-01T10:00:00Z' },
  { id: 7, email: 'thomas@eglise.fr', first_name: 'Thomas', last_name: 'Moreau', role: 'volunteer', member_type: 'regular', phone: '+33 6 78 90 12 34', notes: 'Batteur', created_at: '2024-04-15T10:00:00Z' },
  { id: 8, email: 'julie@eglise.fr', first_name: 'Julie', last_name: 'Simon', role: 'volunteer', member_type: 'regular', phone: '+33 6 89 01 23 45', notes: 'Chant - soprano', created_at: '2024-05-01T10:00:00Z' },
  { id: 9, email: 'nicolas@eglise.fr', first_name: 'Nicolas', last_name: 'Michel', role: 'volunteer', member_type: 'regular', phone: '+33 6 90 12 34 56', notes: 'Bassiste', created_at: '2024-05-15T10:00:00Z' },
  { id: 10, email: 'claire@eglise.fr', first_name: 'Claire', last_name: 'Leroy', role: 'volunteer', member_type: 'regular', phone: '+33 6 01 23 45 67', notes: 'Accueil', created_at: '2024-06-01T10:00:00Z' },
  { id: 11, email: 'antoine@eglise.fr', first_name: 'Antoine', last_name: 'Garcia', role: 'volunteer', member_type: 'regular', phone: '+33 6 11 22 33 44', notes: 'Sonorisation', created_at: '2024-06-15T10:00:00Z' },
  { id: 12, email: 'lea@eglise.fr', first_name: 'Léa', last_name: 'Thomas', role: 'volunteer', member_type: 'regular', phone: '+33 6 22 33 44 55', notes: 'Équipe enfants', created_at: '2024-07-01T10:00:00Z' },
  { id: 13, email: 'maxime@eglise.fr', first_name: 'Maxime', last_name: 'Robert', role: 'viewer', member_type: 'visitor', phone: '', notes: 'Visiteur régulier', created_at: '2024-07-15T10:00:00Z' },
  { id: 14, email: 'camille@eglise.fr', first_name: 'Camille', last_name: 'Richard', role: 'volunteer', member_type: 'regular', phone: '+33 6 33 44 55 66', notes: 'Lumières / vidéo', created_at: '2024-08-01T10:00:00Z' },
  { id: 15, email: 'david@eglise.fr', first_name: 'David', last_name: 'Durand', role: 'volunteer', member_type: 'regular', phone: '+33 6 44 55 66 77', notes: 'Guitariste acoustique', created_at: '2024-08-15T10:00:00Z' },
]

export const demoTeams = [
  { id: 1, name: 'Louange', description: 'Équipe de worship et musique', created_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Technique', description: 'Son, lumières, vidéo', created_at: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'Accueil', description: 'Équipe d\'accueil et café', created_at: '2024-01-01T00:00:00Z' },
  { id: 4, name: 'Enfants', description: 'École du dimanche et garderie', created_at: '2024-01-01T00:00:00Z' },
  { id: 5, name: 'Intercession', description: 'Équipe de prière', created_at: '2024-01-01T00:00:00Z' },
]

export const demoTeamMembers = [
  { team_id: 1, member_id: 2, position: 'Directrice musicale' },
  { team_id: 1, member_id: 4, position: 'Chant' },
  { team_id: 1, member_id: 5, position: 'Guitare' },
  { team_id: 1, member_id: 6, position: 'Claviers' },
  { team_id: 1, member_id: 7, position: 'Batterie' },
  { team_id: 1, member_id: 8, position: 'Chant' },
  { team_id: 1, member_id: 9, position: 'Basse' },
  { team_id: 1, member_id: 15, position: 'Guitare acoustique' },
  { team_id: 2, member_id: 11, position: 'Sonorisation' },
  { team_id: 2, member_id: 14, position: 'Lumières / Vidéo' },
  { team_id: 3, member_id: 10, position: 'Accueil principal' },
  { team_id: 3, member_id: 13, position: 'Café' },
  { team_id: 4, member_id: 12, position: 'Responsable enfants' },
  { team_id: 5, member_id: 1, position: 'Leader' },
  { team_id: 5, member_id: 3, position: 'Membre' },
]

export const demoPlans = [
  {
    id: 1001,
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    theme: 'Culte du dimanche',
    service_type_id: 1,
    notes: 'Culte principal avec sainte cène',
    items: [
      { id: 1, type: 'song', title: 'GLORIEUX EST TON NOM', song_id: 10, arrangement_id: 10, position: 1, transposed_key: 'G', tempo: 78 },
      { id: 2, type: 'song', title: 'QUEL AMOUR INCROYABLE', song_id: 6, arrangement_id: 6, position: 2, transposed_key: 'C', tempo: 76 },
      { id: 3, type: 'song', title: 'OCEAN', song_id: 3, arrangement_id: 3, position: 3, transposed_key: 'Bm', tempo: 74 },
      { id: 4, type: 'announcement', title: 'Annonces', position: 4 },
      { id: 5, type: 'song', title: 'JESUS SEUL', song_id: 11, arrangement_id: 11, position: 5, transposed_key: 'C', tempo: 70 },
      { id: 6, type: 'sermon', title: 'La grâce qui transforme', position: 6 },
      { id: 7, type: 'song', title: 'TA GRACE SUFFIT', song_id: 9, arrangement_id: 9, position: 7, transposed_key: 'D', tempo: 66 },
    ]
  },
  {
    id: 1002,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '10:00',
    theme: 'Culte du dimanche — Louange',
    service_type_id: 1,
    notes: '',
    items: [
      { id: 8, type: 'song', title: 'DIEU PUISSANT', song_id: 8, arrangement_id: 8, position: 1, transposed_key: 'E', tempo: 90 },
      { id: 9, type: 'song', title: 'NOUS ADORONS ADONAÏ', song_id: 4, arrangement_id: 4, position: 2, transposed_key: 'Em', tempo: 80 },
      { id: 10, type: 'song', title: 'MA CONFIANCE EST EN TOI', song_id: 12, arrangement_id: 12, position: 3, transposed_key: 'F', tempo: 82 },
      { id: 11, type: 'sermon', title: 'La confiance en Dieu', position: 4 },
      { id: 12, type: 'song', title: 'ABRITE-MOI', song_id: 2, arrangement_id: 2, position: 5, transposed_key: 'G', tempo: 68 },
    ]
  },
  {
    id: 1003,
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '18:30',
    theme: 'Soirée de prière',
    service_type_id: 2,
    notes: 'Soirée spéciale d\'intercession',
    items: [
      { id: 13, type: 'song', title: 'AU CŒUR DE LA LOUANGE', song_id: 1, arrangement_id: 1, position: 1, transposed_key: 'D', tempo: 72 },
      { id: 14, type: 'song', title: 'JE SUIS A TOI', song_id: 7, arrangement_id: 7, position: 2, transposed_key: 'A', tempo: 84 },
      { id: 15, type: 'announcement', title: 'Temps de prière', position: 3 },
      { id: 16, type: 'song', title: 'A L\'AGNEAU DE DIEU', song_id: 5, arrangement_id: 5, position: 4, transposed_key: 'F', tempo: 60 },
    ]
  },
  {
    id: 1004,
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '10:00',
    theme: 'Culte du dimanche — Famille',
    service_type_id: 1,
    notes: 'Culte spécial famille avec école du dimanche',
    items: [
      { id: 17, type: 'song', title: 'GLORIEUX EST TON NOM', song_id: 10, arrangement_id: 10, position: 1, transposed_key: 'G', tempo: 78 },
      { id: 18, type: 'song', title: 'QUEL AMOUR INCROYABLE', song_id: 6, arrangement_id: 6, position: 2, transposed_key: 'C', tempo: 76 },
      { id: 19, type: 'sermon', title: 'La famille selon Dieu', position: 3 },
      { id: 20, type: 'song', title: 'JESUS SEUL', song_id: 11, arrangement_id: 11, position: 4, transposed_key: 'C', tempo: 70 },
    ]
  },
  {
    id: 1005,
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '10:00',
    theme: 'Culte du dimanche',
    service_type_id: 1,
    notes: '',
    items: [
      { id: 21, type: 'song', title: 'DIEU PUISSANT', song_id: 8, arrangement_id: 8, position: 1, transposed_key: 'E', tempo: 90 },
      { id: 22, type: 'song', title: 'OCEAN', song_id: 3, arrangement_id: 3, position: 2, transposed_key: 'Bm', tempo: 74 },
      { id: 23, type: 'sermon', title: 'Marcher sur les eaux', position: 3 },
      { id: 24, type: 'song', title: 'MA CONFIANCE EST EN TOI', song_id: 12, arrangement_id: 12, position: 4, transposed_key: 'F', tempo: 82 },
    ]
  }
]

export const demoHouseGroups = [
  {
    id: 1,
    name: 'Groupe Centre-ville',
    leader_id: 1,
    meeting_day: 'Mercredi',
    meeting_time: '19:30',
    location: 'Chez Jean & Marie Dupont',
    description: 'Groupe de maison du centre-ville, étude biblique et partage',
    members: [
      { member_id: 1, role: 'leader' },
      { member_id: 2, role: 'member' },
      { member_id: 4, role: 'member' },
      { member_id: 13, role: 'member' },
    ],
    meetings: [
      { id: 1, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), notes: 'Étude de Romains 8' },
      { id: 2, date: new Date().toISOString().slice(0, 10), notes: 'Partage et prière' },
    ]
  },
  {
    id: 2,
    name: 'Groupe Jeunes Actifs',
    leader_id: 3,
    meeting_day: 'Jeudi',
    meeting_time: '20:00',
    location: 'Salle polyvalente',
    description: 'Groupe pour les 25-40 ans, dynamique et convivial',
    members: [
      { member_id: 3, role: 'leader' },
      { member_id: 5, role: 'member' },
      { member_id: 6, role: 'member' },
      { member_id: 7, role: 'member' },
      { member_id: 8, role: 'member' },
    ],
    meetings: [
      { id: 3, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), notes: 'Étude des Psaumes' },
    ]
  },
  {
    id: 3,
    name: 'Groupe Familles',
    leader_id: 9,
    meeting_day: 'Vendredi',
    meeting_time: '19:00',
    location: 'Chez les Michel',
    description: 'Groupe pour les familles avec enfants',
    members: [
      { member_id: 9, role: 'leader' },
      { member_id: 10, role: 'member' },
      { member_id: 11, role: 'member' },
      { member_id: 12, role: 'member' },
      { member_id: 14, role: 'member' },
      { member_id: 15, role: 'member' },
    ],
    meetings: [
      { id: 4, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), notes: 'Soirée parents-enfants' },
    ]
  }
]

export const demoAnnouncements = [
  { id: 1, type: 'announcement', content: 'Retraite spirituelle le week-end du 15-17 mars. Inscriptions auprès de Marie.', plan_id: null, created_at: '2024-03-01T10:00:00Z' },
  { id: 2, type: 'announcement', content: 'Nouveau cycle d\'étude biblique sur l\'Évangile de Jean commence dimanche prochain.', plan_id: 1001, created_at: '2024-03-05T10:00:00Z' },
  { id: 3, type: 'prayer', content: 'Prions pour la famille de Pierre qui traverse une période difficile.', plan_id: null, created_at: '2024-03-08T10:00:00Z' },
  { id: 4, type: 'prayer', content: 'Merci de prier pour le projet de rénovation de la salle de culte.', plan_id: null, created_at: '2024-03-10T10:00:00Z' },
  { id: 5, type: 'announcement', content: 'Concert de louange spécial le 25 mars à 19h. Toute l\'équipe est invitée!', plan_id: 1003, created_at: '2024-03-12T10:00:00Z' },
]

export const demoPolls = [
  {
    id: 1,
    question: 'Quel jour préférez-vous pour la retraite spirituelle?',
    max_votes: 1,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    options: [
      { id: 1, label: '15-17 mars', votes: 8 },
      { id: 2, label: '22-24 mars', votes: 5 },
      { id: 3, label: '5-7 avril', votes: 3 },
    ]
  },
  {
    id: 2,
    question: 'Souhaitez-vous un temps de worship plus long le dimanche?',
    max_votes: 1,
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    options: [
      { id: 4, label: 'Oui, 45 min', votes: 12 },
      { id: 5, label: 'Non, 30 min c\'est bien', votes: 6 },
      { id: 6, label: 'Ça dépend des semaines', votes: 4 },
    ]
  }
]

export const demoServiceTypes = [
  { id: 1, name: 'Culte du dimanche' },
  { id: 2, name: 'Soirée de prière' },
  { id: 3, name: 'Répétition louange' },
  { id: 4, name: 'Événement spécial' },
]

export const demoPlanTemplates = [
  {
    id: 1,
    name: 'Culte standard',
    description: 'Template pour le culte du dimanche avec 3 chants, annonce et prédication',
    items: [
      { id: 1, type: 'song', title: 'Chant d\'ouverture', position: 1 },
      { id: 2, type: 'song', title: 'Chant de worship', position: 2 },
      { id: 3, type: 'announcement', title: 'Annonces', position: 3 },
      { id: 4, type: 'song', title: 'Chant de réponse', position: 4 },
      { id: 5, type: 'sermon', title: 'Prédication', position: 5 },
    ]
  },
  {
    id: 2,
    name: 'Soirée de prière',
    description: 'Template pour les soirées d\'intercession',
    items: [
      { id: 6, type: 'song', title: 'Chant d\'adoration', position: 1 },
      { id: 7, type: 'song', title: 'Chant de prière', position: 2 },
      { id: 8, type: 'announcement', title: 'Sujets de prière', position: 3 },
      { id: 9, type: 'song', title: 'Chant de clôture', position: 4 },
    ]
  }
]

export const demoEmailTemplates = [
  {
    id: 1,
    name: 'Rappel de service',
    subject: 'Rappel : Service ce {{date}}',
    body: 'Bonjour {{name}},\n\nVoici un rappel pour le service de ce {{date}} à {{time}}.\n\nThème : {{theme}}\n\nMerci de confirmer votre présence.\n\nÀ bientôt!',
  },
  {
    id: 2,
    name: 'Bienvenue nouveau membre',
    subject: 'Bienvenue dans notre église!',
    body: 'Bonjour {{name}},\n\nNous sommes ravis de vous accueillir dans notre communauté!\n\nVoici quelques informations utiles :\n- Culte le dimanche à 10h\n- Groupes de maison en semaine\n- Contact : pasteur@eglise.fr\n\nÀ bientôt!',
  },
]

export const demoStats = {
  members: demoMembers.length,
  activeMembers: demoMembers.filter(m => m.member_type === 'regular').length,
  upcomingPlans: demoPlans.filter(p => new Date(p.date) >= new Date()).length,
  songsWithArrangements: demoSongs.length,
  pendingConfirmations: 5,
  teams: demoTeams.length,
}

export const demoPlan = demoPlans[0]

export function getDemoSong(id: number) {
  return demoSongs.find(s => s.id === id) || demoSongs[0]
}

export function getDemoSongs() {
  return demoSongs
}

export function getDemoMember(id: number) {
  return demoMembers.find(m => m.id === id) || demoMembers[0]
}

export function getDemoMembers() {
  return demoMembers
}

export function getDemoTeam(id: number) {
  return demoTeams.find(t => t.id === id) || demoTeams[0]
}

export function getDemoTeams() {
  return demoTeams
}

export function getDemoPlan(id: number) {
  return demoPlans.find(p => p.id === id) || demoPlans[0]
}

export function getDemoPlans() {
  return demoPlans
}

export function getDemoStats() {
  return demoStats
}
