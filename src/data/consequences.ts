// Consequences story packs: every game deals a different storyline with its
// own blanks, its own reveal template, and themed dialogue banks for the
// computer's lines. Bank entries are picked without repeats inside a game.

export interface ConsField {
  k: string;
  label: string;
  who: 'me' | 'other';
  bank?: string;
}

export interface ConsStory {
  id: string;
  title: string;
  icon: string;
  fields: ConsField[];
  template: string[];
}

const ADJECTIVES: string[] = [
  'sparkly', 'grumpy', 'fearless', 'sleepy', 'dramatic', 'polka-dotted',
  'suspiciously cheerful', 'unusually calm', 'wildly overdressed',
  'extremely punctual', 'mysteriously sticky', 'impossibly tall',
  'delightfully confused', 'secretly famous', 'freshly waterproofed',
  'overly confident', 'magnificently awkward', 'eerily quiet', 'bright purple',
  'impossibly polite', 'dangerously curious', 'unusually lucky',
  'chronically late', 'superbly dramatic', 'oddly musical', 'fiercely loyal',
  'wonderfully weird', 'terribly forgetful', 'surprisingly strong',
  'perfectly serious', 'completely unbothered', 'flamboyantly dressed',
  'quietly rebellious', 'hopelessly romantic', 'mildly electrified',
  'elegantly chaotic', 'impossibly cheerful', 'stubbornly optimistic',
  'dramatically underdressed', 'mysteriously well-informed',
  'extremely snack-motivated', 'delightfully old-fashioned',
  'boldly improvising', 'sweetly intimidating', 'perfectly ordinary',
  'wildly unpredictable', 'suspiciously glittery', 'heroically clumsy'
];

const MEN: string[] = [
  'Reginald', 'Big Mike', 'Professor Plum', 'Chad', 'Old Man Jenkins',
  'Captain Bruno', 'Marcus', 'Deandre', 'Tyrone', 'Jamal', 'Mr. Alvarez',
  'Coach Carter', 'Prince Theo', 'Diego', 'Walter', 'Samir', 'Elliot',
  'Grandpa Joe', 'Barry', 'Felix', 'Omar', 'Dexter', 'Leonard', 'Sebastian'
];

const WOMEN: string[] = [
  'Miss Beatrice', 'Big Rita', 'Professor Rose', 'Tanya', 'Old Lady Pearl',
  'Captain Marina', 'Alicia', 'Denise', 'Monica', 'Priya', 'Mrs. Alvarez',
  'Coach Dana', 'Princess Mira', 'Rosa', 'Wanda', 'Amara', 'Evelyn',
  'Grandma Mae', 'Gloria', 'Fiona', 'Nadia', 'Delia', 'Vivian', 'Serena'
];

const PEOPLE: string[] = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Jamie', 'Avery',
  'Quinn', 'Robin', 'Skyler', 'Devin', 'Cameron', 'Jules', 'Remy', 'Sasha',
  'Micah', 'Toni', 'Kai', 'Blair', 'Nico', 'Parker', 'Reese', 'Wren'
];

const PLACES: string[] = [
  'the top of a ferris wheel', 'a neighborhood cookout', 'a tiny elevator',
  'the city library', 'a rooftop garden', 'the middle of a parade',
  'the beach at sunrise', 'an old train station', 'the school auditorium',
  'a farmers market', 'a mountaintop café', 'the back of a tour bus',
  'the community theater', 'a fire station open house',
  'the neighborhood bakery', 'a museum after closing', 'a riverboat deck',
  'the football stadium tunnel', 'the county fair', 'a botanical garden',
  'the airport observation deck', 'a lighthouse balcony',
  'a jazz club basement', 'the science fair', 'a wedding reception',
  'the bowling alley', 'a drive-in theater', 'a treehouse',
  'the skating rink', 'a food-truck festival', 'an art studio',
  'a castle courtyard', 'the radio station booth', "a farmer's porch",
  'the aquarium tunnel', 'a mountain cabin porch',
  'the amusement park carousel', 'a bookshop reading room', 'a dance studio',
  'the observatory', 'the harbor boardwalk', 'a subway platform',
  "the zoo's penguin house", 'the high-school gym', 'the opera-house lobby',
  'a vintage diner', 'a hot-air balloon basket'
];

const OBJECTS: string[] = [
  'a rubber chicken', 'a golden spoon', 'a squeaky red toolbox',
  'a mysterious briefcase', 'an inflatable crown', 'a battery-powered fan',
  'a jar of pickles', 'a purple umbrella', 'an antique compass',
  'a box of mismatched socks', 'a miniature piano', 'a glowing flashlight',
  'a velvet rope', 'an enormous foam finger', 'a silver whistle',
  'a stack of coupons', 'a talking calculator', 'a wind-up robot',
  'a bouquet of broccoli', 'a portable karaoke machine', 'a glitter cannon',
  'a foldable ladder', 'a giant novelty check', 'a basket of lemons',
  'a vintage microphone', 'a snow globe', 'a rainbow kite',
  'a lunchbox full of batteries', 'a ceramic frog', 'a striped scarf',
  'a tiny telescope', 'a bucket of confetti', 'a self-stirring mug',
  'an accordion', 'a map with no labels', 'a suspiciously heavy suitcase'
];

const FOODS: string[] = [
  'triple-layer carrot cake', 'spicy meatballs', 'blueberry pancakes',
  'macaroni and cheese', 'peach cobbler', 'loaded nachos', 'lemon tarts',
  'barbecue ribs', 'mushroom soup', 'strawberry shortcake', 'garlic knots',
  'chicken pot pie', 'chocolate fondue', 'sweet-potato fries', 'shrimp gumbo',
  'cinnamon rolls', 'veggie stir-fry', 'banana pudding', 'corn chowder',
  'honey-glazed salmon', 'baked ziti', 'apple fritters', 'collard greens',
  'cheese grits', 'mango salsa', 'tomato pie', 'funnel cake', 'jambalaya',
  'key-lime pie', 'stuffed peppers', 'oatmeal cookies', 'fried catfish'
];

const ACTIONS: string[] = [
  'challenged everyone to a dance-off', 'announced a surprise talent contest',
  'started handing out name tags', 'pretended this had all been planned',
  'asked for a drumroll', 'opened the wrong door',
  'began speaking in a movie-trailer voice',
  'pulled a confetti cannon from behind the curtain',
  'called for an emergency snack break', 'insisted on a group photograph',
  'started a slow clap', 'revealed a chart with no labels',
  'asked the audience to hum the theme song',
  'turned a mistake into a victory lap', 'declared a brand-new holiday',
  'offered everyone a matching hat',
  'began narrating the moment like a sports final',
  'asked for complete silence, then sneezed',
  'produced a trophy from a grocery bag', 'started an impromptu parade',
  'challenged the nearest person to rock-paper-scissors',
  'gave a speech using only questions', 'pointed dramatically at the ceiling',
  'tried to high-five everyone at once',
  'announced that the real prize was friendship',
  'started teaching everyone a secret handshake',
  'asked who had brought the goat',
  'turned the lights off and back on for effect',
  'claimed the whole thing was a rehearsal',
  'invited everyone to sign the guest book', 'began a conga line',
  'asked for a volunteer and pointed at the same person twice'
];

const SOUNDS: string[] = [
  'somewhere upstairs, a door creaked open by itself',
  'a cold breeze blew out every candle at once',
  'the old piano played three notes with nobody sitting at it',
  "a portrait's eyes seemed to follow everyone in the room",
  'chains rattled behind the library wall',
  'a music box began playing in an empty room',
  'every clock struck thirteen at the same time',
  'a whisper spelled out a name in the dust',
  'the chandelier swayed though the air was perfectly still',
  'footsteps crossed the ceiling from corner to corner',
  'a mirror fogged up and revealed a handprint',
  'thunder answered from inside the basement',
  'a rocking chair started moving on its own',
  'the front door locked with a very polite click',
  'a candle flame turned bright blue',
  'distant laughter echoed from an empty hallway'
];

const TREASURES: string[] = [
  'a chest of gold coins', 'a crown made of seashells',
  'a ruby the size of a potato', 'a map to an even bigger map',
  'a barrel of golden crackers', 'a jeweled teapot',
  'a pirate flag signed by a famous captain',
  'a bottle containing a tiny thunderstorm',
  'a chest of sparkling costume jewelry', 'a golden anchor',
  'a pearl necklace long enough to jump rope with',
  'a silver key shaped like a fish',
  'a spyglass that only shows snack locations',
  'a diamond-studded ship’s wheel', 'a box of enchanted compasses',
  'a treasure chest full of birthday candles',
  'an emerald shaped like a parrot', 'a legendary captain’s recipe book'
];

const YEARS: string[] = [
  '1066', '1492', '1776', '1888', '1925', '1969', '1985', '1999', '2008',
  '2020', '2525', '3001'
];

const PETS: string[] = [
  'a dramatic goldfish named Bubbles', 'a tiny dog named Moose',
  'a three-legged cat named Captain', 'a very round hamster named Meatball',
  'a parrot named Professor Pickles', 'a sleepy turtle named Rocket',
  'a goat named Kevin', 'a rabbit named Princess Carrot',
  'a duck named Sir Quacks', 'a pony named Cupcake', 'a ferret named Noodle',
  'a bearded dragon named Spike', 'a rescue pig named Truffles',
  'a one-eyed cat named Wink', 'a dachshund named Hot Dog',
  'a cockatoo named Elvis', 'a hedgehog named Cactus', 'a sheep named Wooliam'
];

const ENDINGS: string[] = [
  'they won a trophy shaped like a question mark',
  'everyone agreed never to mention the goat again',
  'they opened a tiny café that only served soup',
  'it began raining confetti indoors',
  'they were crowned honorary mayors of the neighborhood',
  'the whole crowd joined a conga line',
  'they had to wear matching hats every Friday',
  'the story made the front page under the headline Pure Chaos',
  'they became unlikely best friends',
  'they got invited back the next week as celebrity judges',
  'everyone demanded an encore',
  'the mayor declared the following Tuesday a half-holiday',
  'they split a giant sandwich and called it even',
  'a commemorative plaque appeared overnight',
  'they started a club with exactly two rules and forgot both',
  'the audience gave them a standing ovation from their chairs',
  'they had to apologize to a very unimpressed cat',
  'their photograph ended up on the community bulletin board',
  'they won free snacks for a year',
  'the event was renamed in their honor for one day',
  'they promised to rehearse before trying it again',
  'everyone left humming the same tune',
  'they became the stars of a local commercial',
  'the room erupted into a friendly dance battle',
  'they were handed the keys to a very small city',
  'they wrote a sequel before dinner',
  'the judges called it unforgettable, mostly because they could not explain it',
  'they earned a lifetime supply of napkins',
  'they had to teach the routine to the whole neighborhood',
  'the crowd demanded a rematch',
  'they opened a museum dedicated to the incident',
  'their names were added to the Wall of Legendary Guests',
  'they finished with a bow and a snack break',
  'everyone agreed it worked better than the original plan',
  'they got a theme song composed on the spot',
  'they were promoted to chief celebration officers',
  'the incident became a beloved local legend',
  'they shared the prize and the last slice of cake',
  'they had to return wearing even brighter outfits',
  'the audience followed them home for an after-party',
  'they formed a team and never lost again',
  'they adopted the stray cat that had supervised everything',
  'they were given matching trophies and opposite instructions',
  'their adventure was turned into a school play',
  'they discovered the real treasure was the snack table',
  'they left through the wrong door to thunderous applause',
  'everyone voted to make it an annual event',
  'they accidentally became the new hosts'
];

const DIALOGUE: string[] = [
  'I have been waiting my whole life for this moment.',
  'That is NOT a real penguin.',
  'Quick — act natural, the queen is watching.',
  'I only came for the free snacks.',
  'You remind me of my first accordion.',
  'This was not in the rehearsal.',
  'I can explain everything, but a snack would help.',
  'Please tell me someone else saw that.',
  'I practiced this in the mirror for weeks.',
  'That was either brilliant or a complete accident.',
  'I demand a rematch and a sandwich.',
  'Nobody move — I think better when everyone is nervous.',
  'I brought a backup plan and three backup snacks.',
  'This is exactly how legends begin.',
  'I have questions, but first I need a chair.',
  'You had me at free cake.',
  'I did not sign up for this, but I am fully committed now.',
  'That sound means either victory or plumbing trouble.',
  'I am not lost; I am taking the scenic route to destiny.',
  'Someone write this down before I forget how impressive I was.',
  'I knew that hat would bring good luck.',
  'This calls for a dramatic entrance.',
  'I have a feeling the goat knows more than it is saying.',
  'Let us never speak of the glitter incident again.',
  'I am giving this moment five stars.',
  'That was my plan all along — mostly.',
  'I need a drumroll, a flashlight, and a responsible adult.',
  'You are officially my favorite plot twist.',
  'I have waited three years for a reason to wear this outfit.',
  'If this goes wrong, I was never here.',
  'I brought confetti for exactly this emergency.',
  'This is either a sign or a warning label.',
  'I cannot believe that actually worked.',
  'I am putting this on my résumé.',
  'Someone owes me a high five and an apology.',
  'I refuse to panic before dessert.',
  'That deserves a trophy, or at least a really good sticker.',
  'I have seen this movie, and I still did not expect that ending.',
  'You call it chaos; I call it choreography.',
  'I am only here because the invitation mentioned cake.',
  'Let the record show I looked great doing it.',
  'I need everyone to pretend that was intentional.',
  'We should form a team and charge admission.',
  'I am not saying it was aliens, but the timing is suspicious.',
  'This is the most fun I have had all week.',
  'I support this decision and would like it in writing.',
  'Quick, somebody take a picture before the confetti settles.',
  'I would like to thank the academy and the snack table.'
];

const DIALOGUE_WORK: string[] = [
  'Your résumé says “excellent with chaos.” Prove it.',
  'I admire your confidence, especially since the printer is on fire.',
  'Can you start yesterday? The calendar is confused too.',
  'Your only weakness listed here is “too much jazz.”',
  'We do not normally interview candidates in a pillow fort.',
  'The job is yours if you can explain the rubber duck budget.',
  'I have one question: why is there glitter in the conference room?',
  'Your references all asked us to tell you “told you so.”',
  'We value teamwork, punctuality, and not feeding the office plant soda.',
  'This interview is now a group project.',
  'Can you operate a stapler under extreme dramatic pressure?',
  'The corner office comes with a window and a mysterious draft.',
  'I see you brought your own applause sign.',
  'We can offer you a salary and a very dramatic desk bell.',
  'Tell me about a time you defeated a spreadsheet.',
  'The last person in this job left only a note that said “good luck.”',
  'We need someone who can stay calm when the Wi-Fi blinks.',
  'Your cover letter rhymed. That took courage.'
];

const DIALOGUE_ALIEN: string[] = [
  'Your Earth greeting needs more jazz hands.',
  'We come in peace, and we brought casserole.',
  'On my planet, this dance wins elections.',
  'Your spaceship smells pleasantly of cinnamon.',
  'We have studied your people through cooking shows.',
  'Take me to your leader, preferably one with snacks.',
  'This small step for me is a giant leap for my dance career.',
  'Our translation device only knows compliments and weather.',
  'Your moon is lovely; we visit every millennium.',
  'We traveled nine galaxies for this exact awkward moment.',
  'Our records say Earth runs on something called “brunch.”',
  'Please accept this glowing rock as a symbol of friendship.',
  'Your species waves at airplanes. We find this adorable.',
  'The mothership approves of your hat.'
];

const DIALOGUE_CHEF: string[] = [
  'The secret ingredient is confidence and far too much nutmeg.',
  'I plated it with drama and a hint of panic.',
  'This dish tastes like a standing ovation.',
  'I have never seen soup do that before.',
  'The presentation is bold; the seasoning is bolder.',
  'You have cooked your way into my heart and my recipe book.',
  'I demand the recipe, the apron, and a moment alone with this pie.',
  'That crunch could be heard three kitchens away.',
  'I seasoned it until my ancestors said “enough.”',
  'This plate belongs in a museum with a snack bar.',
  'I am not crying; the onions are simply supportive.',
  'Your garnish has its own fan club.',
  'The flavors held a meeting and elected you winner.',
  'I would frame this recipe if it were not so delicious.',
  'A little smoke adds mystery. A lot adds a fire drill.',
  'This is the finest thing to happen to Tuesdays.'
];

const DIALOGUE_HERO: string[] = [
  'Fear not — my cape and I have arrived.',
  'Justice delayed is still justice, preferably with theme music.',
  'I saved the city before breakfast and only tripped twice.',
  'My powers include courage, timing, and excellent hair.',
  'Villains never expect the power of a polite warning.',
  'I will defend this neighborhood and its snack supply.',
  'This looks like a job for someone with a dramatic entrance.',
  'I do not need a plan; I have a theme song.',
  'The city can rest easy, right after this victory lap.',
  'Heroes always return lost shopping carts.'
];

const DIALOGUE_VILLAIN: string[] = [
  'At last, someone who appreciates my dramatic lighting.',
  'My evil plan has an intermission and refreshments.',
  'You may have won, but my monologue was magnificent.',
  'I did not expect the hero to bring a marching band.',
  'Curse your timing and your impeccable entrance music.',
  'Every great villain deserves a theme song and a comfy chair.',
  'This is not a defeat; it is a scheduled dramatic pause.',
  'I would have gotten away with it if not for the snack break.',
  'My lair has excellent acoustics for evil laughter.',
  'Even villains need a day off and a good sandwich.'
];

const DIALOGUE_ROYAL: string[] = [
  'By royal decree, let there be cake.',
  'The crown approves of this delightful nonsense.',
  'One does not simply arrive without a dramatic bow.',
  'Your gift shall be placed in the Hall of Extremely Specific Things.',
  'The royal corgis have given their approval.',
  'I declare this the finest Tuesday in kingdom history.',
  'A ball shall be held, and everyone must bring snacks.',
  'Your manners are splendid and your hat is magnificent.',
  'The throne room has never seen such choreography.',
  'Let the trumpets announce that I am mildly impressed.',
  'This kingdom runs on honor, tea, and punctual parades.',
  'I shall knight the chef and the person who brought confetti.'
];

const DIALOGUE_GHOST: string[] = [
  'Boo, but in a supportive way.',
  'I have haunted this house for years and never seen that.',
  'Your flashlight is brave; your pajamas are braver.',
  'I only rattle chains on weekends now.',
  'The attic is mine, but the dance floor is for everyone.',
  'I have waited a century for a decent talent show.',
  'Please stop screaming; I am trying to be mysterious.',
  'I know all the secret passages and most of the snack hiding spots.',
  'That portrait follows people because it enjoys good gossip.',
  'My haunting schedule is booked through Halloween.',
  'Even ghosts appreciate a polite knock.',
  'I died in 1892 and still have better timing than this.'
];

const DIALOGUE_COACH: string[] = [
  'Champions are made when the snack table is empty and hope remains.',
  'I did not draw up that play, but I will absolutely take credit.',
  'Defense wins games; dance breaks win hearts.',
  'We leave everything on the field, including this water bottle.',
  'That was the loudest quiet strategy I have ever seen.',
  'If we win, I am retiring this whistle in a tiny ceremony.',
  'Hydrate, celebrate, and whatever you do, do not drop the trophy.',
  'This team has heart, hustle, and suspiciously good halftime snacks.'
];

const DIALOGUE_SPORTS: string[] = [
  'I trained for this by chasing an ice-cream truck.',
  'The crowd noise sounds like victory and popcorn.',
  'I visualized success and brought extra socks.',
  'That play was 10 percent skill and 90 percent not falling down.',
  'I would like to thank my teammates and my very supportive shoes.',
  'We did not come this far to only come this far.',
  'Somebody check the replay; I looked amazing.',
  'My lucky socks have never let me down.'
];

const DIALOGUE_PIRATE: string[] = [
  'Arrr, that treasure map owes me an apology.',
  'The sea provides, but the snacks are on you.',
  'I have sailed seven seas and never seen a parrot with better timing.',
  'X marks the spot, but the spot keeps moving.',
  'A pirate’s life is 10 percent sailing and 90 percent dramatic pointing.',
  'Lower the anchor and raise the snack flag.',
  'That compass has been improvising for years.',
  'I buried the treasure and the spare treasure, just in case.',
  'Every captain needs a crew, a ship, and a really big hat.',
  'The ocean called; it wants a rematch.'
];

const DIALOGUE_PARROT: string[] = [
  'Polly wants a promotion.',
  'Squawk if you agree with the captain.',
  'I have heard every secret on this ship twice.',
  'The treasure is shiny and so am I.',
  'I did not repeat that; the ocean did.',
  'Give the parrot a cracker and a corner office.',
  'I navigate by stars, snacks, and gossip.',
  'Walk the plank? I would rather walk the red carpet.',
  'The captain’s password is “snacks,” by the way.',
  'I am the real captain now.'
];

const DIALOGUE_SCIENCE: string[] = [
  'The timeline is wobbling like gelatin in an earthquake.',
  'I invented it to fix Tuesdays, not multiply them.',
  'Please do not press the button labeled “definitely not.”',
  'History is fragile, and so is this machine’s cup holder.',
  'We have five minutes before yesterday catches up with us.',
  'My calculations were correct except for the confetti variable.',
  'A tiny change in the past can cause a huge sale on hats.',
  'The future called; it wants its dance moves back.',
  'Science requires patience, goggles, and emergency snacks.',
  'If a dinosaur appears, act natural and offer it directions.',
  'The machine runs on batteries, hope, and one very brave hamster.',
  'We must return before someone invents homework twice.'
];

const DIALOGUE_TALENT: string[] = [
  'I warmed up by singing to a houseplant audience.',
  'The stage lights recognize star power when they see it.',
  'My act has singing, dancing, and one extremely brave kazoo solo.',
  'I have performed for kings, cousins, and very judgmental toddlers.',
  'If I forget the words, I will turn them into a new chorus.',
  'This microphone feels like destiny with batteries.',
  'The judges may cry, but hopefully in the good way.',
  'I brought three encores and no plan to use the first two.',
  'That performance sparkled brighter than the stage lights.',
  'I am giving it a ten and a tiny trophy.',
  'The kazoo solo changed me as a person.',
  'Somebody sign this act before the confetti settles.'
];

const DIALOGUE_PET: string[] = [
  'Finally, a human who understands snack-based negotiation.',
  'I was not lost; I was conducting neighborhood research.',
  'The squirrel started it, and I have witnesses.',
  'I will come home for treats and a dramatic reunion.',
  'My adventure was fabulous, but the couch is calling.',
  'I have inspected every yard and approve of three.',
  'The mail carrier remains my greatest rival.',
  'I demand belly rubs and a small parade.',
  'I followed my nose and found destiny, plus a sandwich.',
  'Home is where the treat jar is.'
];

export const CONS_BANKS: Record<string, string[]> = {
  adjective: ADJECTIVES,
  man: MEN,
  woman: WOMEN,
  person: PEOPLE,
  place: PLACES,
  object: OBJECTS,
  food: FOODS,
  action: ACTIONS,
  sound: SOUNDS,
  treasure: TREASURES,
  year: YEARS,
  pet: PETS,
  ending: ENDINGS,
  dialogue: DIALOGUE,
  dialogueWork: DIALOGUE_WORK,
  dialogueAlien: DIALOGUE_ALIEN,
  dialogueChef: DIALOGUE_CHEF,
  dialogueHero: DIALOGUE_HERO,
  dialogueVillain: DIALOGUE_VILLAIN,
  dialogueRoyal: DIALOGUE_ROYAL,
  dialogueGhost: DIALOGUE_GHOST,
  dialogueCoach: DIALOGUE_COACH,
  dialogueSports: DIALOGUE_SPORTS,
  dialoguePirate: DIALOGUE_PIRATE,
  dialogueParrot: DIALOGUE_PARROT,
  dialogueScience: DIALOGUE_SCIENCE,
  dialogueTalent: DIALOGUE_TALENT,
  dialoguePet: DIALOGUE_PET
};

export const CONS_STORIES: ConsStory[] = [
  {
    id: 'classic',
    title: 'The Classic Meeting',
    icon: '💌',
    fields: [
      { k: 'adj1', label: 'An adjective (e.g. sparkly)', who: 'me', bank: 'adjective' },
      { k: 'man', label: "A man's name", who: 'other', bank: 'man' },
      { k: 'adj2', label: 'Another adjective (e.g. grumpy)', who: 'other', bank: 'adjective' },
      { k: 'woman', label: "A woman's name", who: 'me', bank: 'woman' },
      { k: 'place', label: 'A place (e.g. the top of a ferris wheel)', who: 'me', bank: 'place' },
      { k: 'heSaid', label: 'He said… (a full sentence)', who: 'other', bank: 'dialogue' },
      { k: 'sheSaid', label: 'She said… (a full sentence)', who: 'me', bank: 'dialogue' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} {man} met the {adj2} {woman} at {place}.',
      'He said, “{heSaid}”',
      'She said, “{sheSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'interview',
    title: 'The Job Interview',
    icon: '💼',
    fields: [
      { k: 'adj1', label: 'An adjective for the job hunter', who: 'me', bank: 'adjective' },
      { k: 'candidate', label: "The job hunter's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the boss', who: 'other', bank: 'adjective' },
      { k: 'boss', label: "The boss's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'The workplace', who: 'me', bank: 'place' },
      { k: 'object', label: 'Something the job hunter carried in', who: 'other', bank: 'object' },
      { k: 'bossSaid', label: 'The boss said…', who: 'other', bank: 'dialogueWork' },
      { k: 'candidateSaid', label: 'The job hunter replied…', who: 'me', bank: 'dialogue' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} {candidate} arrived at {place} carrying {object}.',
      'The {adj2} {boss} leaned forward and said, “{bossSaid}”',
      '{candidate} replied, “{candidateSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'space',
    title: 'The Space Mission',
    icon: '🚀',
    fields: [
      { k: 'adj1', label: 'An adjective for the starship captain', who: 'me', bank: 'adjective' },
      { k: 'captain', label: "The captain's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the alien visitor', who: 'other', bank: 'adjective' },
      { k: 'alien', label: "The alien visitor's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'Where the landing happened', who: 'me', bank: 'place' },
      { k: 'object', label: 'A strange object found on board', who: 'other', bank: 'object' },
      { k: 'captainSaid', label: 'The captain said…', who: 'other', bank: 'dialogue' },
      { k: 'alienSaid', label: 'The alien replied…', who: 'me', bank: 'dialogueAlien' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} Captain {captain} landed at {place} and found {object}.',
      'Waiting there was the {adj2} {alien}.',
      'The captain said, “{captainSaid}”',
      'The alien replied, “{alienSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'cooking',
    title: 'The Cooking Show Final',
    icon: '🍳',
    fields: [
      { k: 'adj1', label: 'An adjective for the chef', who: 'me', bank: 'adjective' },
      { k: 'chef', label: "The chef's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the judge', who: 'other', bank: 'adjective' },
      { k: 'judge', label: "The judge's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'The contest setting', who: 'me', bank: 'place' },
      { k: 'dish', label: 'The dish being judged', who: 'other', bank: 'food' },
      { k: 'chefSaid', label: 'The chef said…', who: 'other', bank: 'dialogueChef' },
      { k: 'judgeSaid', label: 'The judge replied…', who: 'me', bank: 'dialogueChef' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'At {place}, the {adj1} chef {chef} presented a plate of {dish}.',
      'The {adj2} judge {judge} took one bite.',
      'The chef said, “{chefSaid}”',
      'The judge replied, “{judgeSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'superhero',
    title: 'The Superhero Mix-Up',
    icon: '🦸',
    fields: [
      { k: 'adj1', label: 'An adjective for the hero', who: 'me', bank: 'adjective' },
      { k: 'hero', label: "The hero's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the villain', who: 'other', bank: 'adjective' },
      { k: 'villain', label: "The villain's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'Where the showdown happened', who: 'me', bank: 'place' },
      { k: 'gadget', label: 'A gadget the hero carried', who: 'other', bank: 'object' },
      { k: 'heroSaid', label: 'The hero said…', who: 'other', bank: 'dialogueHero' },
      { k: 'villainSaid', label: 'The villain replied…', who: 'me', bank: 'dialogueVillain' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} hero {hero} raced to {place} carrying {gadget}.',
      'The {adj2} villain {villain} stepped out of the shadows.',
      'The hero said, “{heroSaid}”',
      'The villain replied, “{villainSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'royal',
    title: 'The Royal Invitation',
    icon: '👑',
    fields: [
      { k: 'adj1', label: 'An adjective for the guest', who: 'me', bank: 'adjective' },
      { k: 'guest', label: "The guest's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the royal host', who: 'other', bank: 'adjective' },
      { k: 'royal', label: "The royal host's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'The palace or grand place', who: 'me', bank: 'place' },
      { k: 'gift', label: 'A gift the guest carried in', who: 'other', bank: 'object' },
      { k: 'royalSaid', label: 'The royal host said…', who: 'other', bank: 'dialogueRoyal' },
      { k: 'guestSaid', label: 'The guest replied…', who: 'me', bank: 'dialogue' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} {guest} arrived at {place} carrying {gift}.',
      'The {adj2} royal host, {royal}, rose from the throne.',
      'The royal host said, “{royalSaid}”',
      '{guest} replied, “{guestSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'haunted',
    title: 'The Haunted House',
    icon: '👻',
    fields: [
      { k: 'adj1', label: 'An adjective for the visitor', who: 'me', bank: 'adjective' },
      { k: 'visitor', label: "The visitor's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the ghost', who: 'other', bank: 'adjective' },
      { k: 'ghost', label: "The ghost's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'The spooky place', who: 'me', bank: 'place' },
      { k: 'sound', label: 'A spooky happening (a short sentence)', who: 'other', bank: 'sound' },
      { k: 'visitorSaid', label: 'The visitor whispered…', who: 'other', bank: 'dialogue' },
      { k: 'ghostSaid', label: 'The ghost replied…', who: 'me', bank: 'dialogueGhost' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} {visitor} entered {place}.',
      'Suddenly, {sound}.',
      'Then the {adj2} ghost {ghost} appeared.',
      '{visitor} whispered, “{visitorSaid}”',
      'The ghost replied, “{ghostSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'championship',
    title: 'The Championship Game',
    icon: '🏆',
    fields: [
      { k: 'adj1', label: 'An adjective for the star player', who: 'me', bank: 'adjective' },
      { k: 'player', label: "The star player's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the coach', who: 'other', bank: 'adjective' },
      { k: 'coach', label: "The coach's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'The stadium or arena', who: 'me', bank: 'place' },
      { k: 'play', label: 'What the player did (e.g. scored from the halfway line)', who: 'other', bank: 'action' },
      { k: 'coachSaid', label: 'The coach shouted…', who: 'other', bank: 'dialogueCoach' },
      { k: 'playerSaid', label: 'The player answered…', who: 'me', bank: 'dialogueSports' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'At {place}, the {adj1} star {player} looked to the {adj2} coach {coach} for a sign.',
      'Then {player} {play}.',
      'Coach {coach} shouted, “{coachSaid}”',
      '{player} answered, “{playerSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'pirate',
    title: 'The Pirate Treasure',
    icon: '🏴‍☠️',
    fields: [
      { k: 'adj1', label: 'An adjective for the pirate', who: 'me', bank: 'adjective' },
      { k: 'pirate', label: "The pirate's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the parrot', who: 'other', bank: 'adjective' },
      { k: 'parrot', label: "The parrot's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'Where the treasure was buried', who: 'me', bank: 'place' },
      { k: 'treasure', label: 'The treasure they dug up', who: 'other', bank: 'treasure' },
      { k: 'pirateSaid', label: 'The pirate said…', who: 'other', bank: 'dialoguePirate' },
      { k: 'parrotSaid', label: 'The parrot squawked…', who: 'me', bank: 'dialogueParrot' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} pirate {pirate} and the {adj2} parrot {parrot} reached {place} and dug up {treasure}.',
      'The pirate said, “{pirateSaid}”',
      'The parrot squawked, “{parrotSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'timetravel',
    title: 'The Time-Travel Trouble',
    icon: '⏰',
    fields: [
      { k: 'adj1', label: 'An adjective for the time traveler', who: 'me', bank: 'adjective' },
      { k: 'traveler', label: "The time traveler's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the scientist', who: 'other', bank: 'adjective' },
      { k: 'scientist', label: "The scientist's name", who: 'me', bank: 'person' },
      { k: 'year', label: 'A year (e.g. 1888)', who: 'me', bank: 'year' },
      { k: 'invention', label: 'An invention the traveler carried', who: 'other', bank: 'object' },
      { k: 'travelerSaid', label: 'The traveler said…', who: 'other', bank: 'dialogue' },
      { k: 'scientistSaid', label: 'The scientist replied…', who: 'me', bank: 'dialogueScience' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} time traveler {traveler} arrived in {year} carrying {invention}.',
      'The {adj2} scientist {scientist} stared at the machine.',
      '{traveler} said, “{travelerSaid}”',
      'The scientist replied, “{scientistSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'talent',
    title: 'The Talent Show',
    icon: '🎤',
    fields: [
      { k: 'adj1', label: 'An adjective for the performer', who: 'me', bank: 'adjective' },
      { k: 'singer', label: "The performer's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the judge', who: 'other', bank: 'adjective' },
      { k: 'judge', label: "The judge's name", who: 'me', bank: 'person' },
      { k: 'place', label: 'The stage or venue', who: 'me', bank: 'place' },
      { k: 'prop', label: 'A prop the performer set down', who: 'other', bank: 'object' },
      { k: 'singerSaid', label: 'The performer said…', who: 'other', bank: 'dialogueTalent' },
      { k: 'judgeSaid', label: 'The judge replied…', who: 'me', bank: 'dialogue' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'On stage at {place}, the {adj1} performer {singer} adjusted the microphone and set down {prop}.',
      'The {adj2} judge {judge} raised an eyebrow.',
      'The performer said, “{singerSaid}”',
      'The judge replied, “{judgeSaid}”',
      'And the consequence was… {ending}.'
    ]
  },
  {
    id: 'pet',
    title: 'The Great Pet Rescue',
    icon: '🐾',
    fields: [
      { k: 'adj1', label: 'An adjective for the rescuer', who: 'me', bank: 'adjective' },
      { k: 'rescuer', label: "The rescuer's name", who: 'other', bank: 'person' },
      { k: 'adj2', label: 'An adjective for the lost pet', who: 'other', bank: 'adjective' },
      { k: 'pet', label: 'The lost pet (animal and name)', who: 'me', bank: 'pet' },
      { k: 'place', label: 'Where the search happened', who: 'me', bank: 'place' },
      { k: 'toy', label: 'Something the rescuer carried', who: 'other', bank: 'object' },
      { k: 'rescuerSaid', label: 'The rescuer said…', who: 'other', bank: 'dialogue' },
      { k: 'petSaid', label: 'The pet seemed to say…', who: 'me', bank: 'dialoguePet' },
      { k: 'ending', label: 'And the consequence was…', who: 'other', bank: 'ending' }
    ],
    template: [
      'The {adj1} rescuer {rescuer} searched {place} carrying {toy}.',
      'At last, they found the {adj2} pet: {pet}.',
      'The rescuer said, “{rescuerSaid}”',
      'The pet seemed to say, “{petSaid}”',
      'And the consequence was… {ending}.'
    ]
  }
];
