/* MASH fortune-teller content.
   Pick a category, fill in three blanks, and the ancient MASH
   count (Logic.mashEliminate) chooses your fortune lines from these
   banks. Lines use {a} {b} {c} for the three blanks, and the Home
   category has a special {x} line settled from Mansion/Apartment/
   Shack/House — the letters of MASH itself. */

export interface FortuneBlank {
  key: 'a' | 'b' | 'c';
  label: string;
  def: string;
}

export interface FortuneCategory {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  blanks: FortuneBlank[];
  openers: string[];
  mains: string[];
  twists: string[];
  closings: string[];
  special?: { label: string; options: string[]; line: string };
}

export const FORTUNE_CATEGORIES: FortuneCategory[] = [
  {
    id: 'love',
    name: 'Love',
    icon: '❤️',
    tagline: 'Matters of the heart',
    blanks: [
      { key: 'a', label: 'Someone special (a name)', def: 'Alex' },
      { key: 'b', label: 'A color', def: 'red' },
      { key: 'c', label: 'A number from 1 to 99', def: '7' }
    ],
    openers: [
      'The roses in the spirit garden bloom early this year…',
      'I see two paths crossing beneath a kind moon…',
      'The candles flicker — someone thinks of you often…',
      'An old song is about to carry a new meaning for you…',
      'The mists part over a familiar smile…',
      'Venus stirs her cup and smiles in your direction…'
    ],
    mains: [
      'Before {c} moons have passed, {a} will look at you the way you have been hoping to be seen.',
      'Love finds you wearing {b} — wear it when it matters most, for {a} will notice.',
      '{a} carries a question they have almost asked you {c} times. Soon, they will ask it.',
      'A meeting tied to the number {c} brings {a} closer than you expect.',
      'When you least expect it, {a} will say the thing you have rehearsed in your heart.',
      'The color {b} is your signal: when it appears near {a}, do not hesitate.',
      'Within {c} weeks, a small kindness from {a} will mean far more than it seems.',
      'Someone from your past and {a} stand at the same crossroads — choose with your heart, not your fear.'
    ],
    twists: [
      'But beware: a jealous eye watches from the edge of the garden.',
      'Keep one secret a little longer — timing is everything in love.',
      "An old flame's ember still glows; step carefully around it.",
      'Say less than you feel at first, and let them lean in.',
      'A friend means well but gives poor counsel in this — trust yourself.',
      'Do not chase what turns away twice; what is yours will turn back.'
    ],
    closings: [
      'The spirits seal this with a red thread. 🔴',
      'Blow out a candle and make the wish — it is already moving toward you.',
      'Your lucky sign in love: a song you both know.',
      'The last card is The Lovers — the reading is complete.',
      "Love's tide turns for you soon. Be ready.",
      'Keep a small thing of theirs close, and luck follows.'
    ]
  },
  {
    id: 'work',
    name: 'Work',
    icon: '💼',
    tagline: 'Fame, grind & glory',
    blanks: [
      { key: 'a', label: 'Your dream job', def: 'singer' },
      { key: 'b', label: 'A city', def: 'Atlanta' },
      { key: 'c', label: 'A number from 1 to 99', def: '3' }
    ],
    openers: [
      'I see doors — some closed, one quietly unlocking…',
      'The wheel of work turns faster for you now…',
      'A name spoken in a room you are not in lifts you…',
      'The spirits see late nights becoming early victories…',
      'Mercury speeds his steps toward your house of work…',
      'An old effort of yours is about to be noticed at last…'
    ],
    mains: [
      'The path to becoming a {a} opens in {b} — watch for the sign within {c} months.',
      'Someone in {b} holds a key to your future as a {a}.',
      'Your work as a {a} will be tested {c} times before it shines — and it shines.',
      'Within {c} seasons, the title of {a} fits you like it was tailored.',
      'A door in {b} you thought was closed is only latched. Push it.',
      'The number {c} follows your career: the {c}th try is the one that lands.',
      'News about {a} work arrives from the direction of {b} — answer it quickly.',
      'You will outgrow your current work the way a {a} outgrows small stages.'
    ],
    twists: [
      'Guard your ideas — speak of them only once they are built.',
      'A shortcut offered soon costs double later. Take the long road once.',
      'Not every smiling colleague is a friend of your rise.',
      'Rest is part of the work; a tired hand drops the prize.',
      'Sign nothing in haste near the end of the month.',
      'An old skill you abandoned returns as your secret advantage.'
    ],
    closings: [
      'The spirits mark your palm with a star of industry. ⭐',
      'Your lucky day for bold moves: the day you stop waiting for permission.',
      'Keep a coin in your work shoe — old magic, still good.',
      'The reading ends with keys, not locks. Go take them.',
      'Fame is slow, then sudden. Be dressed for the sudden.',
      'Work the plan — the spirits are doing their half.'
    ]
  },
  {
    id: 'money',
    name: 'Money',
    icon: '💰',
    tagline: 'Riches, risk & reward',
    blanks: [
      { key: 'a', label: 'Something you dream of owning', def: 'a house' },
      { key: 'b', label: 'A number from 1 to 99', def: '11' },
      { key: 'c', label: 'A lucky object', def: 'a gold chain' }
    ],
    openers: [
      'Coins in the spirit bowl are ringing…',
      'I see a green light over your purse…',
      'The river of money bends toward your bank…',
      'An envelope, a message, a small surprise of value…',
      'Gold dust gathers where you have been patient…',
      'Fortuna spins her wheel — and slows it near your name…'
    ],
    mains: [
      'The {a} you dream of comes within reach sooner than the doubters think.',
      'The number {b} is stitched into your money story — let it guide your timing.',
      'Keep your {c} close on the day the offer comes; it carries your luck.',
      'Money owed to your spirit returns through an unexpected door — watch near day {b}.',
      'A small risk with the number {b} in it favors you; a large one does not.',
      'Your {c} knows where the money sleeps. Follow the quiet lead.',
      'Before {b} months turn, an old effort pays you twice.',
      "The road to {a} is paved with one hard 'no' you must say — say it."
    ],
    twists: [
      'A friend will ask for a loan dressed as an opportunity. Lend love, not money.',
      'Easy money knocks twice and brings trouble the second time.',
      'Hide a little from yourself each week — future-you sends thanks.',
      'Do not sign on the day you are angriest or happiest.',
      'What looks like a loss this season is a seed, not a grave.',
      'Beware the shiny bargain priced just under your number.'
    ],
    closings: [
      'The spirits pour a little gold dust on your path. ✨',
      'Keep the first coin of any windfall; spend the rest wiser.',
      'The reading closes with an open vault. Step up.',
      'Wealth whispers before it shouts. Listen early.',
      'Fortuna nods. Move while she is nodding.',
      'Your money luck rides with you now — trust the pattern.'
    ]
  },
  {
    id: 'kids',
    name: 'Kids',
    icon: '👶',
    tagline: 'Little feet, big futures',
    blanks: [
      { key: 'a', label: 'A name you love', def: 'Journey' },
      { key: 'b', label: 'A number from 1 to 9', def: '3' },
      { key: 'c', label: 'A place', def: 'the beach' }
    ],
    openers: [
      'Tiny bells ring in the spirit nursery…',
      'I see small footprints crossing your path…',
      'The family tree in the mist is growing a new branch…',
      "Laughter — I hear children's laughter ahead of you…",
      'A cradle rocks in a warm, bright room…',
      'The moon counts small blessings over your house…'
    ],
    mains: [
      "The name {a} is written in the family's future book — keep it close.",
      'The spirits count {b} little lights around your table in the years to come.',
      "At {c}, a child's question will change how you see everything.",
      'A child connected to the name {a} carries a gift the family has waited for.',
      'The number {b} echoes in birthdays and celebrations yet to come.',
      'You will teach a child something at {c} that they will one day teach their own child.',
      '{a} — say the name aloud; the spirits repeat it with a smile.',
      'Small feet will run toward {c}, and toward you, in that joyful order.'
    ],
    twists: [
      'Patience: little gardens grow on their own clocks, not yours.',
      "An elder's advice about the children sounds old and is gold.",
      'Keep the stories — the children will ask for them twice.',
      'Guard the quiet years; they fill the memories being made.',
      'A small worry about a child fades — what remains is pride.',
      'Let them fall small now so they stand tall later.'
    ],
    closings: [
      'The nursery spirits tie a ribbon for each blessing. 🎀',
      "Your family's song gains a new verse soon.",
      'Keep a light on — little travelers are coming home to you.',
      'The reading ends in giggles. A good sign.',
      'Bless the cradle; bless the road ahead.',
      'Small hands, big legacy — the line continues strong.'
    ]
  },
  {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    tagline: 'Where your heart will live',
    blanks: [
      { key: 'a', label: 'A city', def: 'Savannah' },
      { key: 'b', label: 'A pet or animal', def: 'a dog' },
      { key: 'c', label: 'A number from 1 to 99', def: '4' }
    ],
    special: {
      label: 'The great MASH count decides your dwelling',
      options: ['Mansion', 'Apartment', 'Shack', 'House'],
      line: 'And the great MASH count has spoken: you will live in a {x}.'
    },
    openers: [
      'I see a key turning in a door not yet yours…',
      'Smoke rises from a chimney in the mist — a home calls you…',
      'Four walls appear in the vision… no — the walls are still choosing…',
      'The spirits walk a street lined with lit windows…',
      'A threshold waits, swept clean, for your feet…',
      'Somewhere, a room is being painted your color…'
    ],
    mains: [
      'In {a}, a home with {c} welcoming windows waits for your name on its door.',
      'A {b} will rule the halls of your home and be thoroughly spoiled about it.',
      'Your home in {a} becomes the place everyone gathers — cook big.',
      'The number {c} marks your address in spirit: watch for it in {a}.',
      'A {b} asleep by your door means the house has accepted you.',
      'You will plant something at the home in {a} that outlives the mortgage.'
    ],
    twists: [
      'Fix the small leak before it teaches you an expensive lesson.',
      'A neighbor becomes family; a family member becomes a neighbor. Both good.',
      'Do not rush the first house that flatters you — the right one waits one street over.',
      'Keep one room uncluttered for your own peace.',
      'The home you want wants a braver offer.',
      'Old keys in a drawer will matter once more.'
    ],
    closings: [
      'The spirits hang a wreath on your future door. 🌿',
      'Home is coming — keep the porch light of your heart on.',
      'Bless the threshold; cross it boldly.',
      'The reading ends with an open door, not a locked one.',
      'Your address in destiny is being written now.',
      'May your roof be strong and your table long.'
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    tagline: 'Roads you are meant to walk',
    blanks: [
      { key: 'a', label: 'Your dream destination', def: 'Jamaica' },
      { key: 'b', label: 'Who you would bring', def: 'my best friend' },
      { key: 'c', label: 'A number from 1 to 99', def: '2' }
    ],
    openers: [
      'The compass in the spirit bowl spins — then points…',
      'I see a road unrolling like a ribbon…',
      'Wings, wheels or waves — movement is written on you…',
      'A map with one corner folded waits on your table…',
      'The wind changes direction in your favor…',
      'Suitcases drift in the mist, already half packed…'
    ],
    mains: [
      '{a} is not just a dream — the path to it opens within {c} seasons.',
      'You and {b} will stand in {a} and laugh about how long it took.',
      'The journey to {a} teaches you the thing you actually went for.',
      'Book nothing in haste: the {c}th option is the golden one.',
      '{b} carries the map on this trip — let them lead once.',
      'A stranger met on the road to {a} becomes a chapter, not a footnote.',
      'The number {c} marks your gate, your seat, your sign — follow it.',
      'You will return from {a} with more than you packed.'
    ],
    twists: [
      'Pack light on pride; plans will bend once and improve.',
      'The delay that angers you is the spirits rerouting you around trouble.',
      'Keep copies of your papers in two places.',
      'Do not tell everyone the date — move in quiet, arrive in glory.',
      'A cheaper ticket hides a longer story; choose the story once.',
      'Say yes to the side trip. That IS the trip.'
    ],
    closings: [
      'The spirits stamp your passport in gold. ✨',
      'Your road is blessed; walk it hungry for wonder.',
      'The reading ends with an open horizon.',
      'May your seat be by the window of every journey.',
      'Travel far — home will keep your light on.',
      'The compass settles. It points at your courage.'
    ]
  },
  {
    id: 'luck',
    name: 'Luck',
    icon: '🍀',
    tagline: "Fortune's favorite signals",
    blanks: [
      { key: 'a', label: 'A lucky object', def: 'a lucky hat' },
      { key: 'b', label: 'A color', def: 'green' },
      { key: 'c', label: 'A number from 1 to 99', def: '21' }
    ],
    openers: [
      'The four-leaf spirits are restless tonight…',
      'I see a shimmer following your left shoulder…',
      'Lady Luck shuffles her deck and fans it toward you…',
      'A coin spins in the mist and lands on its edge — rare luck…',
      'The rainbow in the vision bends lower than usual…',
      'Something small and shiny is trying to find you…'
    ],
    mains: [
      'Your {a} is more than a habit — it is a magnet. Carry it on bold days.',
      'The color {b} is your flag this season; fortune salutes it.',
      'When the number {c} appears twice in one day, act — do not overthink.',
      'Luck visits you wearing {b} and carrying news.',
      'The {c}th door you knock on opens inward, easily.',
      'Your {a} will be in your hand when the lucky moment strikes.',
      'A chance you almost skipped — the one tied to {c} — is the golden one.',
      'Wear {b} when you need the room to lean your way.'
    ],
    twists: [
      'Luck hates a braggart — win quietly, celebrate later.',
      'Do not lend your luck out twice in one week.',
      'The unlucky day teaches the shortcut luck uses later.',
      'If it feels forced, it is not luck; it is a trap in costume.',
      'Share a little of every win and the well refills.',
      'Sleep on the big decision; luck speaks clearer at dawn.'
    ],
    closings: [
      'The spirits press a four-leaf seal on this reading. 🍀',
      'Your tide is turning — be at the shore.',
      'Keep the charm; keep the courage.',
      'The reading ends with dice at rest — on your numbers.',
      'Luck has your address now.',
      'Fortune favors you. Return the favor by moving.'
    ]
  }
];
