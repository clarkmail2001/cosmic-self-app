// ============================================================
// COSMIC SELF — CONTENT LIBRARY
// ============================================================
// Philosophy: practical wisdom, not mystical dependency.
// Frameworks for self-reflection. "Consider this lens" — not
// "the stars decree."
//
// All content drawn from public traditions:
//   - Pythagorean numerology
//   - Tropical Western astrology
//   - Chinese lunar zodiac (60-year stem-branch cycle)
//   - Chinese five-element (Wu Xing) generation/control cycles
//
// Edit any block here. The essay generators in server.js
// will pick up changes on the next deploy. No re-deploy of
// logic needed — only content.
// ============================================================

// ============================================================
// LIFE PATH DATA — 12 archetypes (1-9 + master numbers 11/22/33)
// ============================================================
const LIFE_PATH_DATA = {
  1: {
    essence: "The Pioneer",
    traits: "independent, ambitious, innovative, courageous, self-reliant",
    purpose: "to develop individuality and lead by example through original action",
    challenges: "overcoming self-doubt, avoiding arrogance, learning to receive help",
    gifts: "natural leadership, original thinking, willingness to be first",
    mantra: "I create the path by walking it.",
    dailyPractice: "Each morning, name one thing you will initiate today that no one else is doing. Start it before any input from others.",
    careerThemes: "Founder, entrepreneur, first-of-its-kind specialist, leadership roles where you set direction. You wither in environments that require constant consensus.",
    relationshipStyle: "You love through inspiration — your presence pulls partners toward a bigger version of themselves. The growth edge: being vulnerable enough to be pulled in return.",
    shadow: "When the 1 wobbles, it splits into arrogant solo-flight (refusing all help) or paralyzed self-doubt (afraid to begin). Both are flights from the gift, which is acting on your own conviction without external permission.",
    archetypeStory: "You carry the energy of the first traveler — the one who steps off the known map into uncharted ground. Every culture has this figure: the founder, the explorer, the inventor. Your soul chose to be early."
  },
  2: {
    essence: "The Peacemaker",
    traits: "diplomatic, intuitive, cooperative, perceptive, gentle",
    purpose: "to bring harmony and partnership where there was discord",
    challenges: "setting boundaries, trusting your judgment, claiming your needs",
    gifts: "deep empathy, mediation, reading rooms others can't read",
    mantra: "My sensitivity is a strength, not a wound.",
    dailyPractice: "End each day naming one thing you wanted but didn't ask for. Tomorrow, ask.",
    careerThemes: "Mediator, diplomat, therapist, partner in a duo, support roles where collaboration is the whole point. You thrive when you have a counterpart, not when you're alone.",
    relationshipStyle: "You love through attunement — sensing what your partner needs before they say it. The growth edge: voicing your own needs with the same clarity you bring to theirs.",
    shadow: "When the 2 wobbles, it becomes either codependent (losing self to keep peace) or passive-resentful (giving and quietly tallying the cost). Both come from the same fear: that asking for what you need will rupture the relationship.",
    archetypeStory: "You carry the energy of the harmonizer — the one who can hold the space between two opposing forces and find the third option both can live with. Every council, every marriage, every collaboration needs this archetype to survive."
  },
  3: {
    essence: "The Communicator",
    traits: "creative, expressive, optimistic, social, playful",
    purpose: "to inspire others through creative self-expression",
    challenges: "channeling scattered energy, choosing depth over surface",
    gifts: "artistic ability, infectious joy, the gift of language",
    mantra: "My voice was given to be used, not saved.",
    dailyPractice: "Make one thing each day — a sentence, a sketch, a melody — and share it with one person.",
    careerThemes: "Writer, performer, designer, teacher, public-facing creative. Anything that uses voice or symbol. You shrink in environments that punish play.",
    relationshipStyle: "You love through delight — bringing color and laughter into your partner's world. The growth edge: staying present when the high fades and the maintenance work begins.",
    shadow: "When the 3 wobbles, it scatters across too many projects, never finishing, or hides behind charm to avoid real intimacy. The shadow is using brightness to dodge depth.",
    archetypeStory: "You carry the energy of the bard — the one who turns experience into story and gives the tribe back a version of itself it can see. Without the 3, nothing gets remembered."
  },
  4: {
    essence: "The Builder",
    traits: "practical, disciplined, loyal, methodical, grounded",
    purpose: "to create lasting foundations and bring order to chaos",
    challenges: "avoiding rigidity, embracing necessary change",
    gifts: "reliability, organization, the patience for slow work",
    mantra: "I build what lasts longer than I do.",
    dailyPractice: "Each day complete one small piece of a long project. The compound effect is your superpower.",
    careerThemes: "Engineer, craftsperson, operator, systems builder — anyone whose work is judged by what's still standing in five years. You bring the form to other people's vision.",
    relationshipStyle: "You love through reliability — being the person your partner can count on absolutely. The growth edge: bringing equal attention to play and spontaneity, not just duty.",
    shadow: "When the 4 wobbles, it becomes either rigid (refusing all change) or worn-down (martyring itself to obligation). Both come from confusing structure with worth — the belief that you're only valuable when you're useful.",
    archetypeStory: "You carry the energy of the foundation-builder — the one whose name is forgotten but whose work holds up the building everyone else gets to live in. Civilizations rest on 4s."
  },
  5: {
    essence: "The Freedom Seeker",
    traits: "adventurous, versatile, curious, magnetic, restless",
    purpose: "to experience life fully and teach others about freedom",
    challenges: "avoiding excess, developing commitment without losing freedom",
    gifts: "adaptability, magnetism, the ability to thrive in change",
    mantra: "Freedom is what I create, not what I escape to.",
    dailyPractice: "Try one small new thing daily — a route, a food, a conversation. Track the pattern of which ones light you up.",
    careerThemes: "Sales, travel, journalism, change management, multi-hyphenate roles. You burn out in any role that's the same on day 200 as day 1.",
    relationshipStyle: "You love through expansion — opening your partner's world. The growth edge: choosing depth in one direction over breadth in twelve, when the moment asks for it.",
    shadow: "When the 5 wobbles, it becomes either chronic escape (running from every commitment) or substance-driven (chasing intensity to feel alive). The shadow is mistaking novelty for freedom.",
    archetypeStory: "You carry the energy of the wandering teacher — the one who returns from far places with knowledge the tribe didn't know it needed. The 5 keeps the tribe permeable."
  },
  6: {
    essence: "The Nurturer",
    traits: "responsible, caring, protective, warm, beauty-loving",
    purpose: "to serve family and community through love and beauty",
    challenges: "avoiding martyrdom, setting healthy limits",
    gifts: "unconditional love, healing presence, eye for harmony",
    mantra: "I love best when I am also loved.",
    dailyPractice: "Each day do one thing purely for yourself, not because someone else benefits.",
    careerThemes: "Counselor, healer, parent (paid or unpaid), designer, anyone whose work creates beauty or care for others. You're at your best surrounded by people who let themselves be helped.",
    relationshipStyle: "You love through devotion — making your partner's life materially and emotionally better. The growth edge: receiving the same level of care you give.",
    shadow: "When the 6 wobbles, it becomes either martyred (giving until empty, secretly resentful) or controlling (helping in ways that smother). Both come from making your worth conditional on being needed.",
    archetypeStory: "You carry the energy of the keeper of the hearth — the one who tends the fire that warms everyone else. Without the 6, communities don't cohere; they just share space."
  },
  7: {
    essence: "The Seeker",
    traits: "analytical, introspective, spiritual, observant, private",
    purpose: "to seek truth beneath surfaces and share wisdom with the world",
    challenges: "avoiding isolation, trusting intuition alongside intellect",
    gifts: "profound insight, research ability, depth of thought",
    mantra: "What I find in solitude becomes a gift when I return.",
    dailyPractice: "Spend at least 20 minutes alone with a question that has no quick answer. Don't research it — sit with it.",
    careerThemes: "Researcher, analyst, writer, contemplative or scientific roles. You produce your best work in long uninterrupted depth. You wilt in performative environments.",
    relationshipStyle: "You love through understanding — seeing your partner more deeply than they see themselves. The growth edge: letting them into your inner world, not just observing them from yours.",
    shadow: "When the 7 wobbles, it becomes either withdrawn (using solitude as armor) or cynically intellectual (using analysis to avoid feeling). The shadow is mistaking distance for clarity.",
    archetypeStory: "You carry the energy of the contemplative — the one who leaves the village to climb the mountain and returns with what the village needs to hear. Every spiritual tradition has this figure."
  },
  8: {
    essence: "The Powerhouse",
    traits: "ambitious, authoritative, efficient, results-oriented, capable",
    purpose: "to achieve material mastery and use power wisely",
    challenges: "balancing material with spiritual, avoiding measuring worth by output",
    gifts: "business acumen, manifestation, executive function",
    mantra: "Money is energy. I move it where it does good.",
    dailyPractice: "Each day make one decision that prioritizes long-term return over short-term comfort, and notice what you traded.",
    careerThemes: "Executive, founder, finance, real estate, operator at scale. You belong in roles where the stakes are real and your judgment is the deciding factor.",
    relationshipStyle: "You love through provision — building the life and circumstances that protect what you love. The growth edge: receiving softness without first earning it.",
    shadow: "When the 8 wobbles, it becomes either workaholic (chasing one more achievement to feel enough) or controlling (using money or power as proxy for love). The shadow is letting the scoreboard become the self.",
    archetypeStory: "You carry the energy of the steward of resources — the one trusted with the tribe's stored wealth and the responsibility of growing and distributing it. Every empire needs 8s; every empire is also their warning."
  },
  9: {
    essence: "The Humanitarian",
    traits: "compassionate, generous, idealistic, artistic, global-minded",
    purpose: "to serve humanity and bring cycles to completion",
    challenges: "letting go of the past, accepting endings without bitterness",
    gifts: "universal love, artistic talent, broad perspective",
    mantra: "What I release makes room for what is coming.",
    dailyPractice: "Each evening name one thing you can let go of from the day — a grievance, a regret, a tightness — and consciously release it before sleep.",
    careerThemes: "Nonprofit, arts, global work, healing professions, end-of-cycle roles (closing a company down, archiving, hospice). You bring grace to endings.",
    relationshipStyle: "You love through forgiveness — holding partners in their largest possible self, even past their failings. The growth edge: not romanticizing pain or staying past the natural end.",
    shadow: "When the 9 wobbles, it becomes either bitter (couldn't release a betrayal and now carries it as identity) or martyred (helping the world while neglecting the immediate). The shadow is using global compassion to skip the local.",
    archetypeStory: "You carry the energy of the elder who has lived nine cycles already — the one who can see how the story ends from the second act. The 9 closes what needs closing so the next 1 can begin."
  },
  11: {
    essence: "The Intuitive Illuminator",
    traits: "visionary, inspirational, sensitive, electric, charismatic",
    purpose: "to channel higher wisdom and inspire awakening in others",
    challenges: "grounding visions in form, managing high sensitivity",
    gifts: "psychic perception, inspirational presence, glimpses of the bigger picture",
    mantra: "I trust what I sense before I have words for it.",
    dailyPractice: "Each morning, write down one impression or hunch before checking news, messages, or social feeds. Track which ones come true.",
    careerThemes: "Teacher, healer, channeled creative, visionary founder. You belong in work that uses your intuition as primary instrument — and falls apart in environments that require ignoring it.",
    relationshipStyle: "You love through resonance — sensing your partner's inner weather like your own. The growth edge: protecting your nervous system so the merging doesn't destabilize you.",
    shadow: "When the 11 wobbles, it becomes either anxious (overwhelmed by signal it can't filter) or grandiose (mistaking the intensity of intuitions for the rightness of them). The shadow is having an antenna without a tuner.",
    archetypeStory: "You carry the energy of the seer — the one whose dreams the village couldn't dismiss because too many of them came true. The 11 lives between worlds and pays a sensitivity tax for the privilege."
  },
  22: {
    essence: "The Master Builder",
    traits: "visionary, practical, powerful, patient, large-scale",
    purpose: "to turn dreams into structures that serve humanity",
    challenges: "enormous pressure, patience with slow materialization, not crushing under the size of the calling",
    gifts: "manifesting at scale, practical idealism, holding vision and form together",
    mantra: "What I build is bigger than me, and that's the point.",
    dailyPractice: "Each week define one concrete brick you laid for the larger structure, no matter how small. The architecture lives in the bricks.",
    careerThemes: "Founder of institutions, large-scale organizer, infrastructure-builder. Roles where the vision is for a lifetime, not a quarter. The 22 burns out in short-cycle environments.",
    relationshipStyle: "You love through inclusion in the building — bringing your partner into the larger project as co-architect. The growth edge: making the partnership itself one of the things you build.",
    shadow: "When the 22 wobbles, it becomes either crushed (the vision is too big and paralysis sets in) or domineering (sweeping aside everyone in the rush to manifest). Both misread the size of the calling as a verdict on personal worth.",
    archetypeStory: "You carry the energy of the cathedral-builder — the one whose plans take generations to complete and whose finished work outlasts every name on the original blueprint. The 22 builds for the unborn."
  },
  33: {
    essence: "The Master Teacher",
    traits: "selfless, nurturing, wise, healing, devoted",
    purpose: "to uplift humanity through unconditional love and embodied wisdom",
    challenges: "self-sacrifice, maintaining boundaries while loving widely",
    gifts: "profound healing, spiritual leadership, the capacity to model what's possible",
    mantra: "I serve from fullness, not from depletion.",
    dailyPractice: "Each morning fill your own cup first — practice, food, sun, silence. Refuse to give until you have.",
    careerThemes: "Teacher in the broadest sense — anyone whose presence transforms others. Spiritual leader, master craftsperson with apprentices, healer of the healers. The 33 is rare and the role rarer.",
    relationshipStyle: "You love through embodiment — your partner is changed by being near you. The growth edge: receiving the love returned without immediately turning it back outward.",
    shadow: "When the 33 wobbles, it becomes either depleted (giving past empty until it collapses) or self-righteous (mistaking spiritual development for moral authority over others). The shadow is forgetting that you, too, need care.",
    archetypeStory: "You carry the energy of the bodhisattva — the one who could have left but chose to stay until everyone else is across. The 33 is rare on purpose. The role is real; so is the cost."
  }
};

// ============================================================
// SUN SIGN DATA — 12 tropical zodiac signs
// ============================================================
const SUN_SIGN_DATA = {
  Aries: {
    element: "Fire",
    modality: "Cardinal",
    ruler: "Mars",
    season: "Spring start (Northern Hemisphere)",
    bodyAreas: "head, face, brain, blood",
    colors: "red, scarlet, deep orange",
    traits: "bold, direct, competitive, pioneering, courageous",
    shadow: "impatience, aggression, self-centeredness",
    approach: "Engage life by going first. You learn by doing, not by planning.",
    archetypeStory: "Aries is the spark — the impulse that breaks the silence between the dream and the doing. In the wheel of the year, this is the moment new growth pushes through frozen ground. Your job is to be the breaking-through."
  },
  Taurus: {
    element: "Earth",
    modality: "Fixed",
    ruler: "Venus",
    season: "Mid-spring (Northern Hemisphere)",
    bodyAreas: "throat, neck, vocal cords",
    colors: "forest green, soft pink, copper",
    traits: "reliable, patient, sensual, grounded, persistent",
    shadow: "stubbornness, possessiveness, resistance to change",
    approach: "Engage life through the senses. You move at the pace of growing things, and your slowness is wisdom, not delay.",
    archetypeStory: "Taurus is the body settling into the body — the moment after the Aries spark when growth becomes form. You bring the world the gift of slowness, the discipline of staying put long enough for something to root."
  },
  Gemini: {
    element: "Air",
    modality: "Mutable",
    ruler: "Mercury",
    season: "Late spring (Northern Hemisphere)",
    bodyAreas: "lungs, arms, hands, nervous system",
    colors: "yellow, silver, bright pastels",
    traits: "adaptable, clever, curious, articulate, playful",
    shadow: "inconsistency, superficiality, restlessness",
    approach: "Engage life by gathering and connecting. You think in conversation; meaning comes through relating ideas, not isolating them.",
    archetypeStory: "Gemini is the twin — the recognition that any single perspective is half of something. You are the patron of bridges, of translations, of the moment one mind becomes briefly intelligible to another."
  },
  Cancer: {
    element: "Water",
    modality: "Cardinal",
    ruler: "Moon",
    season: "Summer start (Northern Hemisphere)",
    bodyAreas: "chest, stomach, breasts, digestion",
    colors: "silver, sea blue, pearl white",
    traits: "intuitive, protective, nurturing, sensitive, memory-keeping",
    shadow: "moodiness, clinginess, over-attachment to past",
    approach: "Engage life through feeling. You navigate by emotional tide, and your sense of safety is the compass others borrow when they're lost.",
    archetypeStory: "Cancer is the home, the shell, the chosen circle. You hold the inside, the warm and small thing kept safe from the storm. Every tribe needs someone who remembers what we came from."
  },
  Leo: {
    element: "Fire",
    modality: "Fixed",
    ruler: "Sun",
    season: "High summer (Northern Hemisphere)",
    bodyAreas: "heart, spine, upper back",
    colors: "gold, orange, royal purple",
    traits: "confident, generous, dramatic, warm, magnetic",
    shadow: "pride, attention-seeking, vulnerability avoided as weakness",
    approach: "Engage life as the central performer of your own story. You are not arrogant for being seen — you are playing the role you came here for.",
    archetypeStory: "Leo is the sovereign — the one whose presence orders the room. You are the noon sun, the moment of fullest light, and your gift is reminding others that being radiantly themselves is permitted."
  },
  Virgo: {
    element: "Earth",
    modality: "Mutable",
    ruler: "Mercury (some traditions: Chiron)",
    season: "Late summer (Northern Hemisphere)",
    bodyAreas: "digestive system, intestines, spleen",
    colors: "navy, gray, soft earth tones",
    traits: "analytical, helpful, precise, observant, devoted",
    shadow: "criticism, perfectionism, anxiety about disorder",
    approach: "Engage life through refinement. You see the gap between what is and what could be, and your service is closing that gap one detail at a time.",
    archetypeStory: "Virgo is the harvest — the moment of separating grain from chaff. You are the priest of the sorting process, the keeper of standards, the discipline that turns abundance into nourishment."
  },
  Libra: {
    element: "Air",
    modality: "Cardinal",
    ruler: "Venus",
    season: "Fall start (Northern Hemisphere)",
    bodyAreas: "kidneys, lower back, lumbar",
    colors: "soft blue, rose, ivory",
    traits: "diplomatic, graceful, fair, aesthetic, partnership-oriented",
    shadow: "indecision, people-pleasing, conflict-avoidance",
    approach: "Engage life through relationship. You think best with a counterpart, and your understanding of justice comes from holding both sides of every scale.",
    archetypeStory: "Libra is the scales — the equinox moment when day and night are equal. You are the patron of balance, the one who refuses to let any party speak unchallenged. The cost is the difficulty of choosing."
  },
  Scorpio: {
    element: "Water",
    modality: "Fixed",
    ruler: "Mars (traditional) / Pluto (modern)",
    season: "Mid-fall (Northern Hemisphere)",
    bodyAreas: "reproductive organs, pelvis, elimination",
    colors: "black, oxblood, deep maroon",
    traits: "passionate, determined, intuitive, magnetic, transformative",
    shadow: "jealousy, secrecy, control, the wound that won't heal",
    approach: "Engage life by going to the bottom. You don't trust anything you haven't seen at its worst. Your intensity is not melodrama — it's the refusal to live on the surface.",
    archetypeStory: "Scorpio is the descent and the return — the seed buried in dark earth, the death that is also a beginning. You are the patron of all transformations that require something to be released first. Nothing comes back the same after Scorpio touches it."
  },
  Sagittarius: {
    element: "Fire",
    modality: "Mutable",
    ruler: "Jupiter",
    season: "Late fall (Northern Hemisphere)",
    bodyAreas: "hips, thighs, liver",
    colors: "deep purple, turquoise, mustard",
    traits: "optimistic, adventurous, honest, philosophical, expansive",
    shadow: "tactlessness, restlessness, over-promising",
    approach: "Engage life through expansion. You are made bigger by every horizon you cross. Your honesty isn't tactless — it's the price you pay for the freedom you require.",
    archetypeStory: "Sagittarius is the arrow loosed at the horizon — the seeker of what's beyond. You are the patron of long journeys, of foreign teachers, of meaning that requires leaving home to find."
  },
  Capricorn: {
    element: "Earth",
    modality: "Cardinal",
    ruler: "Saturn",
    season: "Winter start (Northern Hemisphere)",
    bodyAreas: "knees, joints, bones, skin",
    colors: "black, deep brown, charcoal, dark green",
    traits: "responsible, disciplined, ambitious, structured, patient",
    shadow: "pessimism, coldness, taking on too much, joyless duty",
    approach: "Engage life by climbing. You measure progress in years and decades, not days. Your patience is a form of love for what you are building.",
    archetypeStory: "Capricorn is the mountain goat at the peak — the one who got there by step-by-step refusal to give up. You are the patron of legacy, of slow-built reputations, of the long view that outlasts every fad."
  },
  Aquarius: {
    element: "Air",
    modality: "Fixed",
    ruler: "Saturn (traditional) / Uranus (modern)",
    season: "Mid-winter (Northern Hemisphere)",
    bodyAreas: "ankles, circulatory system, lower legs",
    colors: "electric blue, silver, neon",
    traits: "progressive, original, independent, group-oriented, future-facing",
    shadow: "detachment, contrarianism, rebellion as identity",
    approach: "Engage life as an outsider with a stake. You see the systems others can't see because they're inside them. Your loneliness is the price of your perspective.",
    archetypeStory: "Aquarius is the water-bearer — the one who carries the future into the present. You are the patron of inventors, of movements, of the strange ideas that turn out to have been correct fifty years early."
  },
  Pisces: {
    element: "Water",
    modality: "Mutable",
    ruler: "Jupiter (traditional) / Neptune (modern)",
    season: "Winter end (Northern Hemisphere)",
    bodyAreas: "feet, immune system, lymphatic system",
    colors: "sea green, indigo, lavender",
    traits: "compassionate, artistic, intuitive, dreamy, dissolving",
    shadow: "escapism, victimhood, blurry boundaries, self-medication",
    approach: "Engage life through dissolution. You don't have edges where others have them, and your gift is feeling what the rest of us protect ourselves from. Choose your inputs carefully.",
    archetypeStory: "Pisces is the ocean before it parts into rivers — the unity that precedes form. You are the patron of mystics, artists, healers, and anyone who works in the place where the line between self and world has gone porous."
  }
};

// ============================================================
// CHINESE ZODIAC — 12 animals (60-year stem-branch cycle)
// ============================================================
const CHINESE_ZODIAC_DATA = {
  Rat: {
    yinYang: "Yang",
    fixedElement: "Water",
    hours: "11pm–1am",
    traits: "quick-witted, resourceful, adaptable, observant, ambitious",
    strengths: "adaptability, charm, ability to read social situations",
    compatible: "Dragon, Monkey, Ox",
    shadow: "cunning that crosses into manipulation, accumulation without purpose, restlessness disguised as ambition",
    archetypeStory: "First to arrive in the great race by riding on Ox's back and leaping off at the finish — the Rat archetype is intelligence that finds the unsuspected route. You succeed by seeing angles others don't."
  },
  Ox: {
    yinYang: "Yin",
    fixedElement: "Earth",
    hours: "1am–3am",
    traits: "diligent, dependable, methodical, patient, strong-willed",
    strengths: "patience, reliability, capacity for sustained effort",
    compatible: "Rat, Snake, Rooster",
    shadow: "stubborn refusal to adapt, harshness toward those who move differently, work as escape from feeling",
    archetypeStory: "The Ox carried the Rat across the river and was second — your archetype is reliable strength that others use as the foundation for their own arrivals. Your gift is being trustworthy when it matters."
  },
  Tiger: {
    yinYang: "Yang",
    fixedElement: "Wood",
    hours: "3am–5am",
    traits: "brave, competitive, charismatic, independent, fierce",
    strengths: "courage, leadership, willingness to risk",
    compatible: "Dragon, Horse, Pig",
    shadow: "rebellion as default, attacking what could have been an ally, exhaustion from being always-on",
    archetypeStory: "The Tiger archetype is the protector who must learn when not to fight. You are made for confronting power that needs confronting — and worn down by confronting power that doesn't."
  },
  Rabbit: {
    yinYang: "Yin",
    fixedElement: "Wood",
    hours: "5am–7am",
    traits: "gentle, elegant, perceptive, kind, refined",
    strengths: "diplomacy, intuition, eye for beauty",
    compatible: "Goat, Monkey, Dog, Pig",
    shadow: "avoidance as default, hiding from what's hard, prettiness used as a shield",
    archetypeStory: "The Rabbit archetype is the elegant escape artist who survives by softness, not by force. Your gift is moving through hostile environments untouched. Your edge is learning when retreat costs more than confrontation."
  },
  Dragon: {
    yinYang: "Yang",
    fixedElement: "Earth",
    hours: "7am–9am",
    traits: "confident, intelligent, charismatic, passionate, magnetic",
    strengths: "charisma, ambition, vision",
    compatible: "Rooster, Rat, Monkey",
    shadow: "ego that demands the room, intolerance for ordinary, dramatic responses to ordinary friction",
    archetypeStory: "The Dragon is the only mythical animal in the cycle — your archetype is the larger-than-life presence others organize themselves around. The cost is the loneliness of always being centerpiece."
  },
  Snake: {
    yinYang: "Yin",
    fixedElement: "Fire",
    hours: "9am–11am",
    traits: "enigmatic, wise, intuitive, philosophical, observant",
    strengths: "intuition, elegance, depth perception",
    compatible: "Dragon, Rooster",
    shadow: "keeping too much hidden, sensing manipulation everywhere because you're capable of it, isolation as armor",
    archetypeStory: "The Snake archetype is the contemplative who knows when to strike — your gift is the patience to wait until the right moment, and the precision of action when it comes. Your edge is trusting anyone enough to be known."
  },
  Horse: {
    yinYang: "Yang",
    fixedElement: "Fire",
    hours: "11am–1pm",
    traits: "animated, energetic, warm, freedom-loving, sociable",
    strengths: "freedom, warmth, ability to lift the energy of a room",
    compatible: "Tiger, Goat, Rabbit",
    shadow: "scattered energy, fleeing intimacy by staying mobile, charm used to avoid depth",
    archetypeStory: "The Horse archetype is movement as identity — your gift is the kinetic joy you bring wherever you go. Your edge is learning that some of what you want lives in the stillness you usually run from."
  },
  Goat: {
    yinYang: "Yin",
    fixedElement: "Earth",
    hours: "1pm–3pm",
    traits: "calm, gentle, creative, tender-hearted, artistic",
    strengths: "creativity, kindness, peaceful presence",
    compatible: "Rabbit, Horse, Pig",
    shadow: "passivity disguised as gentleness, allowing the world to act upon you, indecisiveness",
    archetypeStory: "The Goat archetype is the gentle creator — your gift is making beauty without aggression, harmony without forcing. Your edge is claiming what you want before someone else does."
  },
  Monkey: {
    yinYang: "Yang",
    fixedElement: "Metal",
    hours: "3pm–5pm",
    traits: "sharp, curious, inventive, playful, clever",
    strengths: "cleverness, innovation, problem-solving",
    compatible: "Ox, Dragon, Rabbit",
    shadow: "trickster cruelty, using cleverness to dodge accountability, restlessness mistaken for vitality",
    archetypeStory: "The Monkey archetype is the trickster-inventor — your gift is the lateral leap that solves what couldn't be solved straight on. Your edge is using cleverness in service of something larger than your own amusement."
  },
  Rooster: {
    yinYang: "Yin",
    fixedElement: "Metal",
    hours: "5pm–7pm",
    traits: "observant, hardworking, courageous, talented, precise",
    strengths: "honesty, confidence, eye for what's not working",
    compatible: "Ox, Snake",
    shadow: "pride that becomes vanity, criticism that wounds, performance of competence over actual competence",
    archetypeStory: "The Rooster archetype is the herald who calls the dawn — your gift is announcing what others haven't yet seen. Your edge is being right with grace, not with the satisfaction of having been right first."
  },
  Dog: {
    yinYang: "Yang",
    fixedElement: "Earth",
    hours: "7pm–9pm",
    traits: "loyal, honest, just, brave, sincere",
    strengths: "faithfulness, justice, willingness to defend",
    compatible: "Rabbit",
    shadow: "cynicism after betrayal, anxiety vibrating under the loyalty, harsh judgment of broken loyalty",
    archetypeStory: "The Dog archetype is the loyal protector with a strong sense of right — your gift is being the one who shows up when others don't. Your edge is letting people make mistakes without it being personal."
  },
  Pig: {
    yinYang: "Yin",
    fixedElement: "Water",
    hours: "9pm–11pm",
    traits: "compassionate, generous, sincere, easy-going, abundance-loving",
    strengths: "sincerity, tolerance, capacity for enjoyment",
    compatible: "Tiger, Rabbit, Goat",
    shadow: "over-indulgence, naivety, allowing too much to be taken",
    archetypeStory: "The Pig is the last to arrive in the great race because he stopped to eat — your archetype is the embrace of life's pleasures, the refusal to apologize for enjoying. Your edge is knowing when generosity becomes self-erasure."
  }
};

// ============================================================
// CHINESE ELEMENT DATA — 5 elements (Wu Xing)
// ============================================================
// The five-element system has TWO cycles:
//   Generating (sheng): Wood → Fire → Earth → Metal → Water → Wood
//   Controlling (ke):   Wood → Earth, Earth → Water, Water → Fire,
//                       Fire → Metal, Metal → Wood
// Your birth-year element is calculated from the last digit
// of the year (60-year cycle with 10-year element rotation).
// ============================================================
const CHINESE_ELEMENT_DATA = {
  Wood: {
    essence: "Growth, expansion, vitality, springtime",
    traits: "rising energy, flexible strength, creative drive, the will to become",
    gifts: "vision for what could be, capacity to take root and grow, leadership through example",
    shadow: "anger when blocked, overreach, breaking instead of bending",
    season: "spring",
    generatesElement: "Fire",
    controlsElement: "Earth",
    archetypeStory: "Wood is the new shoot pushing through hard ground. Whatever you express through this element is your urgency to grow, your insistence that life keeps becoming. Wood years and Wood people are made for new beginnings."
  },
  Fire: {
    essence: "Heat, illumination, expression, peak summer",
    traits: "passionate, expressive, joyful, magnetic, communicative",
    gifts: "warmth that gathers others, vision in motion, the ability to lift a room",
    shadow: "burnout, manic-depressive swings, consuming what feeds you",
    season: "summer",
    generatesElement: "Earth",
    controlsElement: "Metal",
    archetypeStory: "Fire is the noon sun and the celebration that goes late. What you express through this element is your aliveness, your refusal to be dim. Fire years and Fire people are made for connection and expression."
  },
  Earth: {
    essence: "Stability, nourishment, center, late summer/transition",
    traits: "grounded, supportive, patient, fair, integrating",
    gifts: "the capacity to hold space, to nourish without depleting, to be the center others orbit",
    shadow: "stagnation, worry, over-thinking, smothering care",
    season: "late summer / transitions between seasons",
    generatesElement: "Metal",
    controlsElement: "Water",
    archetypeStory: "Earth is the harvest field, the body, the home. What you express through this element is your gift for holding everyone steady. Earth years and Earth people are made for nourishing the long middle of things."
  },
  Metal: {
    essence: "Refinement, structure, clarity, autumn",
    traits: "precise, disciplined, just, clear, distilled",
    gifts: "the capacity to refine and clarify, to cut what doesn't serve, to set standards that elevate",
    shadow: "coldness, judgment, perfectionism, isolation through standard-setting",
    season: "autumn",
    generatesElement: "Water",
    controlsElement: "Wood",
    archetypeStory: "Metal is the harvest blade, the bell, the coin. What you express through this element is your discernment, your insistence on quality. Metal years and Metal people are made for clarification and refinement."
  },
  Water: {
    essence: "Depth, wisdom, flow, winter",
    traits: "deep, intuitive, persistent, adaptive, mysterious",
    gifts: "the capacity to go deep, to flow around obstacles, to carry meaning across long distances",
    shadow: "withdrawal, fear, paralysis, drowning in the depth",
    season: "winter",
    generatesElement: "Wood",
    controlsElement: "Fire",
    archetypeStory: "Water is the river, the womb, the night sky. What you express through this element is your depth, your patience, your knowledge of how to go around what can't be moved. Water years and Water people are made for the long slow work of carrying what matters across time."
  }
};

// ============================================================
// PERSONAL YEAR DATA — where you are in your 9-year cycle
// ============================================================
const PERSONAL_YEAR_DATA = {
  1: {
    theme: "New Beginnings",
    focus: "Plant seeds, start fresh projects, assert independence.",
    opportunity: "Anything you start this year carries the seed-quality of the next 9 years. Choose what you plant deliberately.",
    caution: "Don't mistake the energy of beginning for the energy of obligation. The seeds you plant under pressure will grow under pressure for nine years.",
    practice: "Each Sunday, name what you started that week. Each Sunday in December, you'll see whether you planted the right things."
  },
  2: {
    theme: "Partnership & Patience",
    focus: "Relationships matter. Cooperate, be patient, attend to details.",
    opportunity: "Relationships will surface as the central teacher this year. Pay attention to who shows up and what they're reflecting back.",
    caution: "Don't push. Year 2 punishes force. Patience that feels like loss is often the right move.",
    practice: "Each week, name one thing you waited on instead of forcing. Track which ones rewarded the wait."
  },
  3: {
    theme: "Creative Expression",
    focus: "Express yourself creatively. Social opportunities abound.",
    opportunity: "This is the year your voice is meant to be heard. Public expression now is more powerful than at any other point in the cycle.",
    caution: "Don't scatter across too many channels. Year 3 magic comes from one true voice deeply expressed, not many voices spread thin.",
    practice: "Pick one creative form and commit to weekly public sharing of it. The discipline IS the year's gift."
  },
  4: {
    theme: "Building Foundations",
    focus: "Hard work required. Build structures for your future.",
    opportunity: "Anything you build this year — physical, structural, professional, relational — has unusual durability. The bones you put in now last.",
    caution: "Don't expect quick payoff. Year 4 work pays in Year 5, 6, 7. The patience cost is real.",
    practice: "Each month complete one foundational piece. By December you'll see the shape of what you've built."
  },
  5: {
    theme: "Change & Freedom",
    focus: "Expect the unexpected. Embrace flexibility and adventure.",
    opportunity: "Unexpected opportunities appear this year. The plans you locked in during Year 4 will be tested by Year 5's flexibility demand.",
    caution: "Don't burn down what you built in Year 4 just because Year 5 wants movement. Some change is essential; some is escape.",
    practice: "Each month, deliberately do one thing outside your established pattern. Let the cycle teach you which changes were the real ones."
  },
  6: {
    theme: "Love & Responsibility",
    focus: "Family and relationships demand attention. Create harmony.",
    opportunity: "Home, family, and committed relationships ask for your full attention this year. The reward is deeper bonds and a more aesthetic life.",
    caution: "Don't sacrifice yourself in service of others. Year 6 distinguishes love from caretaking.",
    practice: "Each week, name one boundary you held and one you let go of. Find the rhythm of giving that doesn't deplete."
  },
  7: {
    theme: "Inner Journey",
    focus: "Reflect, study, develop spiritually. Trust your intuition.",
    opportunity: "Spiritual and intellectual depth is available this year that isn't accessible in other years. Take the time.",
    caution: "Don't isolate completely. Year 7 inner work needs to surface eventually.",
    practice: "Each day, 20 minutes of stillness — meditation, journaling, walking alone. The depth is in the consistency."
  },
  8: {
    theme: "Power & Achievement",
    focus: "Material success possible. Step into your authority.",
    opportunity: "Material success and recognition are unusually available this year. Step into authority.",
    caution: "Don't let the scoreboard become the self. Year 8 power has a way of consuming the person wielding it.",
    practice: "Each month, name one way you used your growing authority to make others bigger, not smaller."
  },
  9: {
    theme: "Completion & Release",
    focus: "Let go of what no longer serves. Prepare for new cycle.",
    opportunity: "This is the year for endings. What no longer serves can be released cleanly. The next 9-year cycle waits behind it.",
    caution: "Don't force endings prematurely. Year 9 is about letting things complete naturally, not about cutting them off.",
    practice: "Each month, name one thing you released. Don't grieve them as losses; they made room for what comes."
  },
  11: {
    theme: "Spiritual Awakening",
    focus: "Heightened intuition. Balance practical with visionary.",
    opportunity: "Intuition is unusually sharp this year. Spiritual insights and breakthroughs are available.",
    caution: "Don't ungrounded yourself. Year 11 intensity needs body, routine, and practical anchoring.",
    practice: "Each morning, write down one intuitive hit before checking any input. Track accuracy."
  },
  22: {
    theme: "Master Building",
    focus: "Large-scale achievement potential. Think big, work methodically.",
    opportunity: "Large-scale building is unusually achievable this year. Think big and work methodically.",
    caution: "The pressure is real. Don't break under the size of the calling.",
    practice: "Each week, name one concrete brick laid for the larger structure. Bricks add up to cathedrals."
  },
  33: {
    theme: "Master Teaching",
    focus: "Compassion and wisdom uplift many. Lead through love.",
    opportunity: "Your capacity to elevate others is at peak. Teaching, mentoring, modeling are unusually impactful.",
    caution: "Don't deplete yourself in service. Year 33 demands you serve from fullness, not from sacrifice.",
    practice: "Each morning, fill yourself first — practice, food, sun, silence. Give from the overflow only."
  }
};

// ============================================================
// ELEMENT INTERACTIONS — Western × Chinese (20 combinations)
// ============================================================
// THIS is the synthesis layer. Western element (Fire/Earth/Air/Water)
// crossed with Chinese element (Wood/Fire/Earth/Metal/Water).
// Each block is the interpretive content that makes a Metal Snake
// Aries feel different from a Water Snake Aries.
//
// Lookup key format: `${WesternElement}-${ChineseElement}`
// ============================================================
const ELEMENT_INTERACTIONS = {
  "Fire-Wood": "Fire on Wood is the natural ally combination — Wood feeds Fire in the Chinese five-element cycle, and your Western Fire archetypes (Aries, Leo, Sagittarius) carry flammability inherently. When this combination runs well, you are pure ignition: the new vision (Wood) catches the spark (Fire) and becomes a movement. You don't just want change; you become its visible flame. The risk is burning the very Wood that feeds you — exhausting the conditions that allow your aliveness — by demanding too much output too fast. Practice: build slowly enough that the fuel keeps coming. Watch for the signs that your fire is consuming the source — overcommitment, sleepless weeks, the people around you backing away.",

  "Fire-Fire": "Two Fires together is the most volatile combination on this map. Western Fire (Aries, Leo, Sagittarius) crossed with Chinese Fire intensifies everything: the warmth, the expression, the magnetism, but also the burnout, the consumption, the heat that scorches. You are designed to be a beacon — but a beacon needs structure, a tower around it, or it just becomes a fire on the ground. Practice: deliberately build cool periods. Plan your downtime the way others plan their work. The world will take all the fire you give and ask for more; you alone are responsible for refusing.",

  "Fire-Earth": "Fire on Earth is the warming influence — the sun on the field. Western Fire (Aries, Leo, Sagittarius) crossed with Chinese Earth grounds the volatility of fire into something that nourishes rather than consumes. Your archetypal expression: the leader who builds something lasting, the performer with a stable home base, the visionary who actually delivers. Your gift is being warm without being chaotic. The risk is fire smothering itself in too much grounded comfort — losing the spark to maintenance and ease. Practice: keep a designated growth edge always active. Earth without fire becomes mud.",

  "Fire-Metal": "Fire on Metal is the forge combination — heat applied to structure transforms it. Western Fire (Aries, Leo, Sagittarius) crossed with Chinese Metal is the leader who refines as they go, the artist with rigorous standards, the founder who insists on quality. There's a productive tension here: fire wants to express, metal wants to refine. When this combination runs well, you produce work of intensity AND precision — rare. The risk: fire melting metal, your standards dissolving under the heat of your impatience. Practice: separate the creating from the editing. Light the fire to make, then walk away to let metal set.",

  "Fire-Water": "Fire and Water are the steam combination — opposites that transform each other. Western Fire (Aries, Leo, Sagittarius) crossed with Chinese Water creates a person of intense action AND deep emotion, expressive in the world AND privately mysterious. Your archetypal expression: the leader who has a profoundly inner life nobody sees, the performer who returns home to silence. The risk is mutual extinguishing — water putting out fire, fire boiling away water. Practice: schedule the alternation. Public expression days, then private depth days, deliberately. The combination only works in rhythm, not simultaneously.",

  "Earth-Wood": "Earth and Wood is the tension combination — wood breaks up earth in the five-element cycle. Western Earth (Taurus, Virgo, Capricorn) crossed with Chinese Wood creates a person who is grounded AND insistently growing — a slow but unstoppable builder. Your archetypal expression: the patient founder, the long-haul artist, the institution-builder. The internal tension between staying-put (Earth) and pushing-out (Wood) is the engine that makes your work last. The risk: earth resisting wood's growth until wood breaks rather than bends — staying in conditions you've outgrown until forced out. Practice: notice when you're holding tight to a form because it's familiar, not because it's right.",

  "Earth-Fire": "Earth and Fire is the warming combination — fire warms earth into life. Western Earth (Taurus, Virgo, Capricorn) crossed with Chinese Fire creates a person of grounded warmth — practical AND vital, structured AND expressive. Your archetypal expression: the teacher with charisma, the steady leader who lights up the room, the craftsperson with passion. Your gift is being trustworthy AND alive — rarer than you think. The risk: earth smothering fire under too much pragmatism. Practice: protect the irrational, joyful, creative parts of your day from optimization. Earth must let fire be fire.",

  "Earth-Earth": "Earth on Earth is the doubling — depth of stability that approaches geological time. Western Earth (Taurus, Virgo, Capricorn) crossed with Chinese Earth produces a person of profound groundedness — the rock, the foundation, the one nothing rattles. Your archetypal expression: the master builder, the patriarch/matriarch, the institution itself. The gift is unshakability. The risk is petrification: becoming so set you can no longer respond to change. Practice: deliberately disrupt your routines. Travel, change a room, learn something useless. Earth that doesn't move loses its ability to support life.",

  "Earth-Metal": "Earth and Metal is the productive combination — earth produces ore. Western Earth (Taurus, Virgo, Capricorn) crossed with Chinese Metal creates a person of disciplined groundedness — precise AND patient, refining AND lasting. Your archetypal expression: the craftsperson, the surgeon, the master of a specific demanding skill. Your gift is the ability to do detailed work that holds up over decades. The risk: metal's standards making earth's progress too slow — paralysis through perfectionism. Practice: ship the imperfect work, then refine. Metal and earth together can wait forever for the ideal moment.",

  "Earth-Water": "Earth and Water is the nourishment combination — water needs earth's containment, earth needs water's life. Western Earth (Taurus, Virgo, Capricorn) crossed with Chinese Water creates a person of grounded depth — practical AND emotionally fluent, structured AND wise. Your archetypal expression: the healing presence, the steady-handed therapist, the elder who has felt everything and still shows up. The gift is being both safe and deep. The risk: earth damming water into stagnation, or water dissolving earth into mud. Practice: maintain flow. Don't let the steadiness become rigidity, and don't let the depth become a swamp.",

  "Air-Wood": "Air and Wood is the dispersion combination — wind carries seeds. Western Air (Gemini, Libra, Aquarius) crossed with Chinese Wood creates a person who spreads new ideas widely — the journalist, the connector, the catalyst-of-movements. Your archetypal expression: thinkers whose work shifts how others see, communicators of growth-edge ideas, networkers who plant possibility everywhere they go. The gift is making the new accessible. The risk: scattering wood's vitality across too many fields, never letting any single planting take root. Practice: commit deliberately to one growth project per season and let the others go uncultivated.",

  "Air-Fire": "Air and Fire is the amplification combination — wind feeds flame. Western Air (Gemini, Libra, Aquarius) crossed with Chinese Fire creates a person whose ideas catch fire and travel — the natural movement-builder, the viral communicator, the visionary speaker. Your archetypal expression: the public intellectual, the celebrity teacher, the one whose conversation sparks fires in others' lives. The gift is contagious vision. The risk: air-fed fire burns through everything — you exhaust audiences, relationships, yourself. Practice: build in silence between expression. Air also needs to be still sometimes.",

  "Air-Earth": "Air and Earth is the friction combination — they don't naturally mix. Western Air (Gemini, Libra, Aquarius) crossed with Chinese Earth creates a person whose abstract thinking must constantly negotiate with practical reality. Your archetypal expression: the theorist who also implements, the philosopher of business, the dreamer with spreadsheets. The internal challenge is real — you can feel split between the conceptual and the material. The gift, when integrated, is rare: ideas that actually ship. Practice: design rituals that move your air-thoughts into earth-action. Whiteboard then build. Don't let either side dominate.",

  "Air-Metal": "Air and Metal is the precision combination — refined thought, articulated principle. Western Air (Gemini, Libra, Aquarius) crossed with Chinese Metal creates a person of clear thinking and high standards — the editor, the critic, the philosopher with bite. Your archetypal expression: people who clarify what others muddle, set standards that elevate fields, refine language until it cuts. The gift is precision in thought and speech. The risk: cold intellect, judgment that wounds, the lonely tower of the one who sees too clearly. Practice: warmth deliberately. Let your thinking be in service of connection, not separation.",

  "Air-Water": "Air and Water is the dissolving combination — mist, evaporation, atmosphere itself. Western Air (Gemini, Libra, Aquarius) crossed with Chinese Water creates a person whose mind and emotions blend at the edges — the poet, the dreamer, the mystic with words. Your archetypal expression: the one who can articulate the inarticulate, give language to what's beneath language. The gift is making meaning from feeling. The risk: dissolving completely — losing the structural form that makes communication possible at all. Practice: anchor yourself in body and routine. Air-water needs ground to be useful.",

  "Water-Wood": "Water and Wood is the deep generation combination — water feeds wood in the five-element cycle. Western Water (Cancer, Scorpio, Pisces) crossed with Chinese Wood creates a person whose emotional depth feeds visible growth — the artist whose work changes others, the healer whose presence lets people emerge, the activist driven by felt experience. Your archetypal expression: emotional intelligence as the engine of real-world creation. The gift is being moved by something true and translating it into form. The risk: water flooding wood — emotional intensity overwhelming the practical work. Practice: contain the depth so it can be channeled.",

  "Water-Fire": "Water and Fire is the transformation combination — steam, evaporation, the meeting of opposites. Western Water (Cancer, Scorpio, Pisces) crossed with Chinese Fire creates a person of intense inner life made visible — the artist of the unspeakable, the leader who has been broken open, the performer whose performance is about something real. Your archetypal expression: depth made expressive. The gift is intensity with meaning. The risk: mutual destruction — fire boiling away water, water putting out fire. Practice: alternate. Public expression days, then deep private days, deliberately.",

  "Water-Earth": "Water and Earth is the nourishment combination — earth contains water, water feeds earth. Western Water (Cancer, Scorpio, Pisces) crossed with Chinese Earth creates a person of grounded depth — emotionally fluent AND practically stable. Your archetypal expression: the healing therapist, the elder, the trusted confidant. The gift is being both safe and deep — rare. The risk: stagnation. Without flow, water becomes a swamp. Practice: deliberately let your depths move. Tell the truth out loud. Earth holds water; it shouldn't bury it.",

  "Water-Metal": "Water and Metal is the clarification combination — metal condenses water in the five-element cycle. Western Water (Cancer, Scorpio, Pisces) crossed with Chinese Metal creates a person whose emotional depth is held in disciplined form — the introspective philosopher, the rigorous mystic, the analytical empath. Your archetypal expression: depth that has been refined into wisdom. The gift is precision applied to inner experience. The risk: metal cutting water — over-analysis killing emotional truth. Practice: feel first, name second. Metal serves water best when it follows.",

  "Water-Water": "Water on Water is the doubling — depth upon depth. Western Water (Cancer, Scorpio, Pisces) crossed with Chinese Water produces a person of profound emotional and intuitive range — the empath at full intensity, the mystic, the seer. Your archetypal expression: the holder of the deepest currents in any room. The gift is access to layers others can't reach. The risk: drowning. Boundary-less water is dangerous to its possessor. Practice: build deliberate land. Routines, structure, regular contact with the practical. Water needs banks or it becomes a flood."
};

// ============================================================
// HELPER: Get the element interaction for a given combination
// ============================================================
function getElementInteraction(westernElement, chineseElement) {
  const key = `${westernElement}-${chineseElement}`;
  return ELEMENT_INTERACTIONS[key] ||
    `Your Western ${westernElement} element interacts with your Chinese ${chineseElement} element in ways that draw on both traditions — refer to your Sun Sign and Chinese Element sections for guidance on each independently.`;
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  LIFE_PATH_DATA,
  SUN_SIGN_DATA,
  CHINESE_ZODIAC_DATA,
  CHINESE_ELEMENT_DATA,
  PERSONAL_YEAR_DATA,
  ELEMENT_INTERACTIONS,
  getElementInteraction
};
