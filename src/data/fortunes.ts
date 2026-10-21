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
  seconds?: string[];
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


/* --- Expansion banks: merged into the categories below (500+ lines total) --- */
interface FortuneExtra {
  openers: string[];
  mains: string[];
  twists: string[];
  closings: string[];
  seconds: string[];
}

const FORTUNE_EXTRA: Record<string, FortuneExtra> = {
  love: {
    openers: [
      'Two cups sit on the spirit table — one is already yours…',
      'A letter never sent still hums with feeling in the mist…',
      'The mirror fogs, and a face you love appears…',
      'Rose petals on the path: someone has been here, thinking of you…',
      'The teacup shows a heart split by a road — roads end, hearts wait…',
      'A ring of light circles one name in the book of hearts…'
    ],
    mains: [
      'A song in {b} light — no, a moment: when the music slows, {a} will be closest.',
      '{a} dreams of you more than they admit; the dreams are winning.',
      'You will hear your name in a crowd and turn to find {a} already looking.',
      'The distance between you and {a} is measured in courage, not miles — {c} steps of it, no more.',
      'Someone whose name hums like {a} will test your heart; the real one stays.',
      'A gift colored {b}, given or received, changes the weather between you and {a}.',
      'On a day marked by {c}, say the honest thing to {a}. It lands softer than you fear.',
      '{a} keeps a small proof of you — a message, a memory, a moment — and looks at it often.',
      'Love will not knock politely; it will arrive like {c} bells at once, and you will know it is {a}.',
      'The next time you wear {b}, love is already in the room before you enter it.',
      'An unfinished conversation with {a} finishes itself beautifully within {c} weeks.',
      'Your heart has been practicing a speech; {a} is about to give it an audience.'
    ],
    twists: [
      'An exhale of the past returns once — greet it politely and let it pass.',
      'Jealousy dressed as advice will visit; serve it no tea.',
      'Do not read old messages at midnight; the spirits forbid it this season.',
      'A misunderstanding about money sits inside a love matter — separate them gently.',
      'Your heart is not confused; it is early. There is a difference.',
      'Someone is showing you who they are in lowercase — believe the small print.'
    ],
    closings: [
      'The thread between two hearts tightens, kindly.',
      'Keep your heart unlocked but your standards locked in.',
      'A red candle burns for this reading — let it burn down in peace.',
      'Love owes you one beautiful surprise, and it is en route.',
      'The reading closes with two chairs and one sunset.',
      'Say their name to the moon once; then let the moon work.',
      'The spirits return your heart polished, not broken.'
    ],
    seconds: [
      'I also see laughter — yours and theirs, in a kitchen, late.',
      'There is a photograph coming that you will keep for years.',
      'Someone will cook for you like it is a love language. It is.',
      'A short trip together writes a long chapter.',
      'I see dancing — possibly in a living room, certainly unplanned.',
      'A pet will approve of them before you do. Trust the pet.'
    ]
  },
  work: {
    openers: [
      'A ladder leans against a bright window in the mist…',
      'The spirit ledger opens to a page with your name underlined…',
      'Tools laid out in a row: your season of building begins…',
      'A stage, a desk, a road — all three hum with your name…',
      'The gears of the great machine slow to let you aboard…',
      'Ink dries on a contract that has not been offered yet…'
    ],
    mains: [
      'A mentor in {b} mistakes you for a beginner exactly once.',
      'Your {a} ambitions need one witness in {b}; find them and everything accelerates.',
      'The project you start within {c} weeks outruns the one you have been polishing all year.',
      'Someone will try to hire your hands when they should be hiring your mind, {a}-minded one.',
      'A small portfolio of proof beats {c} promises — gather the proof.',
      'The offer that comes from {b} looks plain and is anything but.',
      'Your {c}th application, pitch or attempt is the doorway — count courageously.',
      'A title is being embroidered slowly: one day it reads {a}, and no one is surprised but you.',
      'Work in {b} calls, but the training happens where you are — bloom in both places.',
      'The meeting you dread about {a} work ends with your name in the minutes, favorably.',
      'Within {c} paydays, a raise of money or of freedom arrives — both are raises.',
      'You will teach the thing you are still learning, and that is how you master it.'
    ],
    twists: [
      'A rival copies your style and proves only that the original is you.',
      'The group chat is not the meeting; do business in the right room.',
      'Your calendar is leaking energy into other people\'s priorities.',
      'Beware the unpaid "quick favor" that eats a week.',
      'Documentation is a spell: write it and the credit cannot wander.',
      'The promotion path has a toll: one skill you keep postponing.'
    ],
    closings: [
      'Your name is being spelled correctly in important rooms now.',
      'Build the thing; the applause department works later shifts.',
      'The spirits file your fortune under "rising".',
      'Keep the receipts — of money and of effort.',
      'Your work will introduce you before you enter rooms.',
      'Sign your work like an artist, whatever the work is.',
      'The reading ends; the résumé of your spirit glows.'
    ],
    seconds: [
      'I also see a tool, device or instrument becoming your signature.',
      'A collaboration with an unlikely person doubles your reach.',
      'There is a conference room, a call, a stage — your voice carries in it.',
      'I see a certificate, badge or key arriving with your name spelled right.',
      'A side project quietly becomes the main road.',
      'Someone senior is watching your consistency, not your sparks.'
    ]
  },
  money: {
    openers: [
      'The spirit abacus rattles — numbers are rearranging for you…',
      'A purse in the mist sits heavier than it looks…',
      'The river forks: one stream glittering, one stream gold…',
      'I see a receipt you kept becoming a prophecy…',
      'The vault in the vision is not locked — it is waiting for its code…',
      'Seeds and coins share a bowl in the spirit garden…'
    ],
    mains: [
      'The money for {a} assembles itself from {b} small sources, not one big one.',
      'Your {c} attracts a discount, refund or forgotten credit — check the corners.',
      'An investment of time in your {c} pays better than money spent elsewhere.',
      'Before the number {b} appears on a clock, a bill shrinks or vanishes.',
      'The {a} becomes yours through patience, not credit — the spirits underline patience twice.',
      'A stranger\'s careless tip about money is, for once, worth {b} times its weight.',
      'You will find money in the story of your {c} — a resale, a reward, a rediscovery.',
      'The budget you write near day {b} becomes a map you actually follow.',
      'Someone underestimates what your {c} is worth. Let the market correct them.',
      'A subscription to joy, not things, fills the {a} fund fastest.',
      'Your next windfall smells like {b} small coins before it sounds like one big note.',
      'Sell the thing you keep dusting; its money wants a new assignment.'
    ],
    twists: [
      'A "limited time" offer is limited mostly in honesty.',
      'Do not co-sign what you cannot carry alone.',
      'Gambling dressed as "investing in vibes" is still gambling.',
      'The friend who never has their wallet will test your boundaries once more.',
      'Check the fine print on the shiny thing — the print is where it hides.',
      'Your money leaks through kindness without invoices; invoice anyway, kindly.'
    ],
    closings: [
      'The bowl of coins settles, fuller than it started.',
      'Spend like your future self is watching — they are, approvingly.',
      'May your accounts surprise you pleasantly, in writing.',
      'The spirits advise: one vault for safety, one seed for growing.',
      'Your wealth chapter is titled "And Then It Compounded".',
      'Keep the lucky coin; spend the lucky courage.',
      'Gold follows gratitude — the ledger of the spirits is open.'
    ],
    seconds: [
      'I also see a wallet, purse or account changing color or owner — favorably.',
      'There is a refund with your name on it, traveling slowly.',
      'A skill you consider a hobby is priced like a profession somewhere.',
      'I see coins in an odd place: a coat, a car, a forgotten app.',
      'A bill negotiation ends with the other side apologizing.',
      'Someone will pay you for the story, not just the thing.'
    ]
  },
  kids: {
    openers: [
      'A paper boat sails across the spirit bowl…',
      'Crayon marks appear on the wall of the vision — joyful ones…',
      'The nursery window glows though no lamp is lit…',
      'I hear a small voice practicing a big word…',
      'The family quilt gains a bright new square…',
      'A school bell rings somewhere in your future, fondly…'
    ],
    mains: [
      'A child will ask about {a} and the answer becomes a family legend.',
      'The number {b} appears at a birthday table sooner than you think.',
      'At {c}, you will witness a small talent become an unmistakable gift.',
      'The child tied to the name {a} will make a whole room kinder.',
      'You will be someone\'s favorite grown-up — the evidence mounts around {b} celebrations.',
      'A trip to {c} with little ones becomes the story told at every gathering.',
      '{a} — the name echoes again, this time in a classroom or a team roster.',
      'Within {b} years, small hands will be helping you, clumsily and perfectly.',
      'A child in your orbit dreams loudly; your job is to guard the volume.',
      'The lessons you teach at {c} return to you as comfort decades later.',
      'A photograph at {c} with the children becomes the family\'s most guarded treasure.',
      'The spirits count {b} again — it is a blessed number in your family line.'
    ],
    twists: [
      'Screen-time battles hide a simpler hunger: your undivided hour.',
      'An old wives\' tale about the children is half right — keep the kind half.',
      'Do not compare the garden\'s flowers while they are still seeds.',
      'A small lie told to protect feelings will need a gentle retelling later.',
      'The children are listening hardest when you think they are not.',
      'Save your strictest voice; its rarity is its power.'
    ],
    closings: [
      'The nursery lamp in the vision burns steady and warm.',
      'May your house echo with the good kind of noise.',
      'The spirits tuck the children\'s futures in with a blessing.',
      'Your line is loved forward — that is the whole prophecy.',
      'Keep the height marks on the doorframe; they are scripture.',
      'Small blessings compound like interest. The account is open.',
      'The reading ends with a bedtime story that comes true.'
    ],
    seconds: [
      'I also see a bicycle, instrument or book becoming a childhood emblem.',
      'There is a recital, game or fair where your pride will embarrass you happily.',
      'A teacher\'s note home will be the good kind — frame-worthy.',
      'I see matching outfits, possibly against everyone\'s will.',
      'A lost tooth, coin or treasure launches a family tradition.',
      'Someone small will name a pet after someone great.'
    ]
  },
  home: {
    openers: [
      'Chimney smoke curls into a question mark in the mist…',
      'A floor plan draws itself on the spirit table…',
      'I see curtains breathing in a patient house…',
      'The road home in the vision is shorter than the road you fear…',
      'A garden gate stands open, vines holding it kindly…',
      'Keys — many keys — and one fits your hand exactly…'
    ],
    mains: [
      'The home in {a} finds you through a {b}, a listing, or a lucky wrong turn.',
      'A room painted near {c} becomes the happiest square footage you own.',
      'Your {b} will claim a sunny corner and, with it, final say in the house.',
      'In {a}, an older home with young energy chooses you back.',
      'The number {c} turns up in the address, the price, or the day you sign.',
      'A neighbor in {a} arrives with food and becomes chosen family.',
      'You will host a gathering in {a} that people describe for years.',
      'The {b} in your home senses the right visitor before the doorbell does.',
      'Repairs near {c} reveal something hidden and valuable in the walls or the story.',
      'A porch, balcony or stoop in {a} becomes your thinking throne.',
      'The lease, deed or key with {c} in its numbers is the blessed one.',
      'Your home teaches you a recipe, a repair, and a peace you did not have.'
    ],
    twists: [
      'Inspect the roof of any promise made about a house.',
      'A family heirloom wants displaying, not storing.',
      'The loudest room in the house needs the softest chair.',
      'Do not let a rushed signature outrun a slow inspection.',
      'One box from the last move is still unopened — open it this season.',
      'The house you mourn leaving returns as a better arrangement.'
    ],
    closings: [
      'May your walls hold laughter longer than arguments.',
      'The spirits sweep your future porch and set out two chairs.',
      'Home follows you because you carry it well.',
      'Bless the mailbox; good news knows the way now.',
      'Your hearth, literal or not, is lit in the vision.',
      'The reading ends with soup on a stove somewhere beloved.',
      'Put down roots or pack them kindly — both are blessed.'
    ],
    seconds: [
      'I also see a renovation of one small corner changing the whole feeling.',
      'There is a housewarming where the gift nobody remembers giving matters most.',
      'A plant in your home will outlive three addresses.',
      'I see a spare key given to exactly the right person.',
      'A photograph wall grows by one important face.',
      'The home hums at night — the good kind of hum.'
    ]
  },
  travel: {
    openers: [
      'A boarding pass flutters in the spirit wind…',
      'The atlas opens itself to a page with warm light…',
      'I see a harbor, headlights, and a horizon — choose one, all are blessed…',
      'A train whistle answers a question you had not asked aloud…',
      'The suitcase in the vision is already by the door…',
      'Footprints cross a map drawn in gold dust…'
    ],
    mains: [
      'The road to {a} shortens the moment you and {b} agree to stop postponing it.',
      'A photograph from {a} becomes your most shown picture — {b} is in it, mid-laugh.',
      'Your {c}th journey is the one that rearranges your priorities pleasantly.',
      'In {a}, a local will tell you the thing guidebooks forgot to print.',
      'The seat, room or route numbered {c} carries extra luck — ask for it by name.',
      '{b} will save the day on this trip with something small they packed.',
      'You will eat the best meal of the year in {a}, somewhere with no sign worth mentioning.',
      'A detour near {a} delivers the view you actually traveled for.',
      'Within {c} months, a ticket with your name and {a} on it simply exists.',
      'The language barrier in {a} dissolves into laughter three times.',
      'Travel with {b} teaches you a patience that upgrades every other relationship.',
      'You will bring home from {a} a habit, not a souvenir — it sticks for life.'
    ],
    twists: [
      'The cheapest flight taxes you in hours; price the hours honestly.',
      'A lost item on the trip is a toll, not a tragedy — pay and proceed.',
      'Do not argue with weather; it has seniority.',
      'Someone will try to sell you the "real" version of what is free.',
      'Your phone will rest more than you planned. Let it.',
      'The museum is closed the day you go; the street outside is the exhibit.'
    ],
    closings: [
      'May your journeys return you richer in every currency.',
      'The spirits fold your map with the good route showing.',
      'Go far, come back kinder — the oldest travel blessing.',
      'Your boarding pass to the future is already printing.',
      'The horizon waves back this time.',
      'Pack the courage first; the rest fits around it.',
      'The reading ends with wind — the traveling kind.'
    ],
    seconds: [
      'I also see a sunrise you will describe for the rest of your life.',
      'There is a market where you haggle brilliantly by accident.',
      'A window seat gives you a thought worth the whole fare.',
      'I see a stamp, sticker or ticket stub you will keep forever.',
      'A stranger\'s dog adopts you for exactly one afternoon.',
      'The group photo from this trip has one photobomber who becomes a friend.'
    ]
  },
  luck: {
    openers: [
      'A horseshoe in the mist hangs open-side up — catching luck…',
      'The dice in the spirit bowl glow faintly at the edges…',
      'I see a rainbow with its feet unusually close…',
      'A black cat crosses the vision and winks — in your family, that is luck…',
      'The wheel of fortune creaks, deciding where to stop…',
      'Pennies appear head-up along the path of this reading…'
    ],
    mains: [
      'Your {a} and the color {b} together form a signal the spirits keep repeating.',
      'Luck knocks on the {c}th day of a month you have not circled yet — circle everything lightly.',
      'A game, draw or raffle touched by {b} tilts kindly toward you.',
      'The number {c} is following you like a friendly dog — feed it a small chance.',
      'Someone will call your {a} silly, then watch it work. Smile privately.',
      'Your luck peaks when {b} is near water, music, or morning light.',
      'Within {c} weeks, a coincidence too precise to be one introduces itself.',
      'Wear {b} to the negotiation, the audition, the first day — it is your banner.',
      'The {c}th time you almost give up is where the streak turns.',
      'A small bet on yourself, made before {c} sunsets, ages extremely well.',
      'Your {a} belongs in your left pocket, hand or side this season — the spirits are specific.',
      'Luck borrows your {b} umbrella and returns it with interest.'
    ],
    twists: [
      'Do not press a winning streak past its smile.',
      'Someone else\'s "lucky system" is a story, not a system.',
      'If the omen requires fear, it is not an omen, it is marketing.',
      'Luck shared at the table returns to the host first.',
      'A broken mirror in a dream means a reflection released, not cursed.',
      'Never chase luck backward — it only travels forward.'
    ],
    closings: [
      'The four-leaf seal presses deeper this time.',
      'May your coincidences always introduce themselves politely.',
      'Keep one pocket of your life unscheduled for luck to land in.',
      'The spirits bet on you at generous odds.',
      'Fortune has your scent now — walk boldly.',
      'Your lucky streak is not a streak; it is a season.',
      'The dice settle in your favor and stay for tea.'
    ],
    seconds: [
      'I also see a found coin, bill or token arriving exactly when morale needs it.',
      'There is a seat, spot or number you always choose — it finally pays you back.',
      'A song will become your luck anthem; you will know it by the goosebumps.',
      'I see a stranger holding a door at the exact right second.',
      'A small risk taken laughing works better than a big one taken grimacing.',
      'Your dreams deal you a number, a color, a name — use one of the three.'
    ]
  }
};

for (const cat of FORTUNE_CATEGORIES) {
  const ex = FORTUNE_EXTRA[cat.id];
  if (ex) {
    cat.openers.push(...ex.openers);
    cat.mains.push(...ex.mains);
    cat.twists.push(...ex.twists);
    cat.closings.push(...ex.closings);
    cat.seconds = ex.seconds;
  }
}

/* --- Astrology layer: the birthday blank feeds these banks --- */
export interface ZodiacInfo {
  sign: string;
  emoji: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  planet: string;
  trait: string;
  from: [number, number]; // month, day the sign starts
}

export const ZODIAC: ZodiacInfo[] = [
  { sign: 'Capricorn', emoji: '♑', element: 'Earth', planet: 'Saturn', trait: 'patient ambition', from: [12, 22] },
  { sign: 'Aquarius', emoji: '♒', element: 'Air', planet: 'Uranus', trait: 'electric originality', from: [1, 20] },
  { sign: 'Pisces', emoji: '♓', element: 'Water', planet: 'Neptune', trait: 'boundless dreams', from: [2, 19] },
  { sign: 'Aries', emoji: '♈', element: 'Fire', planet: 'Mars', trait: 'bold beginnings', from: [3, 21] },
  { sign: 'Taurus', emoji: '♉', element: 'Earth', planet: 'Venus', trait: 'steady abundance', from: [4, 20] },
  { sign: 'Gemini', emoji: '♊', element: 'Air', planet: 'Mercury', trait: 'quicksilver wit', from: [5, 21] },
  { sign: 'Cancer', emoji: '♋', element: 'Water', planet: 'Moon', trait: 'deep intuition', from: [6, 21] },
  { sign: 'Leo', emoji: '♌', element: 'Fire', planet: 'Sun', trait: 'radiant confidence', from: [7, 23] },
  { sign: 'Virgo', emoji: '♍', element: 'Earth', planet: 'Mercury', trait: 'sacred precision', from: [8, 23] },
  { sign: 'Libra', emoji: '♎', element: 'Air', planet: 'Venus', trait: 'graceful balance', from: [9, 23] },
  { sign: 'Scorpio', emoji: '♏', element: 'Water', planet: 'Pluto', trait: 'fierce transformation', from: [10, 23] },
  { sign: 'Sagittarius', emoji: '♐', element: 'Fire', planet: 'Jupiter', trait: 'restless adventure', from: [11, 22] }
];

export function zodiacFor(month: number, day: number): ZodiacInfo {
  // the sign with the latest start date on or before the birthday;
  // early January still belongs to Capricorn (started Dec 22)
  const key = month * 100 + day;
  let best: ZodiacInfo | null = null;
  let bestKey = -1;
  for (const z of ZODIAC) {
    const k = z.from[0] * 100 + z.from[1];
    if (k <= key && k > bestKey) {
      best = z;
      bestKey = k;
    }
  }
  return best ?? ZODIAC[0];
}


/* One fortune line written for each sign (4 each = 48 lines). */
export const SIGN_LINES: Record<string, string[]> = {
  Aries: [
    'Mars sharpens your courage this cycle — strike while the iron of opportunity is hot.',
    'Aries fire burns fastest at dawn: begin the thing before the day begins.',
    'Your ruling planet stirs a rivalry into a rocket — ride it, do not fight it.',
    'The ram charges once and the gate opens; hesitation is your only real enemy.'
  ],
  Taurus: [
    'Venus fattens your garden slowly — what you tend daily will feed you for years.',
    'Earth holds your luck: touch real ground before big decisions.',
    "A stubborn 'no' of yours is actually the gate to a better 'yes'.",
    'Your senses are oracles now — if it smells wrong, it is wrong.'
  ],
  Gemini: [
    'Mercury doubles your tongues — the right conversation is the key turning.',
    "Two roads call you; the twins' secret is you may walk both, lightly.",
    'A message you almost delete carries the seed of the season.',
    'Your curiosity is a compass — follow the question, not the answer.'
  ],
  Cancer: [
    'The Moon tides your fortune — what you protect grows teeth and wings.',
    'Home is your temple this cycle; blessings enter through its door.',
    'An old memory surfaces not to haunt you but to hand you a key.',
    'Your intuition speaks first and quietest — answer it before the noise.'
  ],
  Leo: [
    'The Sun crowns your efforts — step into the light you usually hand to others.',
    'Pride used wisely becomes presence; the room is ready for you.',
    'A generous act of yours returns wearing gold.',
    'Create loudly this season — the audience you fear is already applauding.'
  ],
  Virgo: [
    'Mercury files your chaos into order — one small system changes everything.',
    'The detail everyone missed is the treasure with your name on it.',
    'Your body keeps the ledger; rest is a deposit, not a debt.',
    'Precision is your magic wand — measure twice, cast once.'
  ],
  Libra: [
    'Venus weighs your heart and finds it generous — expect the scales to tip back.',
    'A partnership formed in fairness outlasts one formed in fireworks.',
    'Beauty is not decoration for you; it is information. Trust your taste.',
    'The hard conversation, said kindly, unlocks the whole season.'
  ],
  Scorpio: [
    'Pluto digs where you point — aim at the buried thing you actually want.',
    'Secrets you keep become armor; secrets you release become wings.',
    'An ending you feared is a molt, not a death. New skin, same fire.',
    'Your intensity is a lighthouse — ships you never sent for are steering by it.'
  ],
  Sagittarius: [
    'Jupiter widens every road you bless with your attention.',
    "The archer's luck lives far from home — say yes to the distant invitation.",
    'Your honesty lands like an arrow: aim it at problems, not people.',
    'A teacher appears disguised as a stranger with a strange story.'
  ],
  Capricorn: [
    'Saturn pays compound interest on patience — your slow work is compounding.',
    'The mountain respects the climber who packs light and plans long.',
    "An elder's unfinished ambition has your name penciled beside it.",
    'Build the boring foundation; glory is a house that needs one.'
  ],
  Aquarius: [
    'Uranus sends lightning ideas — catch them in writing before they ground out.',
    'Your strangest thought this season is the blueprint, not the joke.',
    'The circle you gather becomes the current that carries you.',
    'Break one rule that was only ever a habit wearing a crown.'
  ],
  Pisces: [
    'Neptune dissolves a boundary that was drowning a gift of yours.',
    'Your dreams are doing reconnaissance — write down what they report.',
    'Compassion is your tide: it goes out and returns carrying treasure.',
    'Music unlocks the door that logic keeps knocking on.'
  ]
};

/* Generic star lines, filled with the seeker's sign, planet, element, trait. */
export const ASTRO_LINES: string[] = [
  'Born under {sign}, your {element} spirit carries the gift of {trait} — lean on it now.',
  '{planet} watches your house this cycle and nods at your boldest plan.',
  'The stars planted {trait} in your {sign} heart for exactly this season.',
  'When {planet} stirs, {sign} souls should listen twice before speaking once.',
  'Your {element} nature is your compass: trust where it pulls.',
  'The constellation of {sign} brightens — a path lit only for those born beneath it.',
  '{planet} owes you a favor from a hard year past; it comes due soon.',
  'As a {sign}, your luck rises when you honor your {trait} instead of hiding it.',
  'The moon borrows light from {planet} tonight and spends it on you.',
  'The zodiac wheel pauses at {sign} — the spirits are paying attention.',
  '{element} signs dream in omens; yours last night was instructions, not nonsense.',
  'A fellow {element} soul carries a message meant for you.',
  '{planet} cannot touch what {sign} built honestly — and you built honestly.',
  'Your birthday stars form a pattern of {trait}; the reading confirms it twice.',
  'The house of {sign} is lit this season — walk in like you own it, star-child.',
  'Ancient star-charts mark {sign} with a small gold star this cycle. It means: proceed.'
];

/* Cosmic weather lines (12). */
export const MOON_LINES: string[] = [
  'The moon wears her growing robe — plant intentions, not doubts.',
  'A waxing moon blesses beginnings made in the next seven nights.',
  'The moon hides half her face: keep half your plan hidden too.',
  'Full-moon energy crowds the sky — feelings run high and true.',
  'The waning moon sweeps out old luck to make room for better.',
  'A thin crescent tonight: small magic, precisely aimed.',
  'The moon rides high and silver — a good night for brave wishes.',
  'Clouds veil the moon in the vision: not a no, only a not-yet.',
  'The moon pours her light on water — feelings are facts tonight.',
  'Two moons shimmer in the mist: one real, one a promise.',
  'The dark of the moon favors secrets kept and seeds planted.',
  'Moonlight falls on a crossroads: both roads bless you, differently.'
];
