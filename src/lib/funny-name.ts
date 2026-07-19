const adjectives = [
  "graceful", "shady", "sneaky", "clumsy", "awkward", "nimble", "clever", "dull",
  "obtuse", "meek", "anemic", "frightened", "timid", "vigilant", "cautious",
  "capable", "adequate", "absentminded", "adventurous", "daring", "indifferent",
  "apologetic", "hideous", "horrid", "dreadful", "ghastly", "revolting", "nasty",
  "cruel", "cheeky", "obnoxious", "disrespectful", "contrary", "ornery", "subtle",
  "optimistic", "courageous", "cowardly", "gullible", "arrogant", "haughty",
  "naive", "curious", "stubborn", "brazen", "modest", "humble", "proud",
  "dishonest", "righteous", "greedy", "wise", "tricky", "loyal", "relaxed",
  "tranquil", "lazy", "rambunctious", "erratic", "fidgety", "lively", "still",
  "famished", "surprised", "startled", "sullen", "terrified", "furious",
  "annoyed", "groggy", "alert", "tense", "cranky", "gloomy", "irritable",
  "lonely", "exhausted", "ecstatic", "cheerful", "delighted", "blithe", "content",
  "carefree", "demanding", "challenging", "effortless", "simple", "fantastic",
  "marvelous", "splendid", "brilliant", "superb", "striking", "stunning",
  "gorgeous", "picturesque", "lovely", "charming", "enchanting", "delicate",
  "pleasant", "monstrous", "immense", "enormous", "massive", "brawny", "bulky",
  "towering", "rotund", "cavernous", "puny", "minute", "diminutive",
  "microscopic", "petite", "slight", "bitter", "frosty", "sweltering",
  "scorching", "blistering", "muggy", "stifling", "oppressive", "cozy", "eternal",
  "ceaseless", "perpetual", "endless", "temporary", "intimidating", "menacing",
  "miserable", "dangerous", "delinquent", "vile", "quarrelsome", "hostile",
  "malicious", "savage", "stern", "somber", "mysterious", "shocking", "infamous",
  "ingenious", "thrifty", "generous", "prudent", "stingy", "spoiled", "anxious",
  "nervous", "impatient", "worried", "excited", "courteous", "compassionate",
  "benevolent", "polite", "amusing", "entertaining", "creative", "precise",
  "eccentric", "decrepit", "ancient", "rotten", "whimsical", "dense", "desolate",
  "disgusting", "dismal", "opulent", "idyllic", "lavish", "edgy", "trendy",
  "peculiar", "rancid", "fetid", "foul", "filthy", "repulsive", "lousy",
  "fluttering", "soaring", "sparkling", "gilded", "verdant", "glowing", "askew",
  "dowdy", "gaunt", "sloppy", "serious", "grave", "intense", "severe", "heavy",
  "solemn", "absurd", "ridiculous", "sluggish", "dawdling", "meandering",
  "scarce", "copious", "muffled", "lulling", "creaky", "shrill", "piercing",
  "slimy", "grimy", "gauzy", "mangy", "swollen", "parched", "crispy", "spiky",
  "slick", "fuzzy", "lumpy", "plush", "wrinkly", "glassy", "snug", "stiff",
];

const animals = [
  "alligator", "ant", "bear", "bee", "bird", "camel", "cat", "cheetah",
  "chicken", "chimpanzee", "cow", "crocodile", "deer", "dog", "dolphin", "duck",
  "eagle", "elephant", "fish", "fly", "fox", "frog", "giraffe", "goat",
  "goldfish", "hamster", "hippopotamus", "horse", "kangaroo", "kitten", "lion",
  "lobster", "monkey", "octopus", "owl", "panda", "pig", "puppy", "rabbit",
  "rat", "scorpion", "seal", "shark", "sheep", "snail", "snake", "spider",
  "squirrel", "tiger", "turtle", "wolf", "zebra",
];

function hashNum(seed: string, max: number, offset = 0): number {
  const h = Bun.hash(seed + ":" + offset);
  const n = Number(BigInt.asIntN(32, h));
  return ((n % max) + max) % max;
}

export function funnyName(version: string = "0.0.0", alliteration = true): string {
  if (!alliteration) {
    const adj = adjectives[hashNum(version, adjectives.length, 0)];
    const ani = animals[hashNum(version, animals.length, 1)];
    return `${adj} ${ani}`;
  }

  const animal = animals[hashNum(version, animals.length)];
  const first = animal.charAt(0);
  const matching = adjectives.filter((a) => a.charAt(0) === first);

  if (matching.length === 0) {
    return funnyName(version, false);
  }

  const adj = matching[hashNum(version, matching.length, 1)];
  return `${adj} ${animal}`;
}