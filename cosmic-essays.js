// ============================================================
// COSMIC SELF — CALCULATION HELPERS + ESSAY GENERATORS
// ============================================================
// All deterministic math (Life Path, Sun Sign, Chinese Zodiac,
// Moon Phase, Personal Year) plus the four content generators
// (Life Essay, Year Essay, Reading List, SMS).
//
// All content text comes from cosmic-content.js — edit there.
// All routes live in server.js — edit there.
// ============================================================

const {
  LIFE_PATH_DATA,
  SUN_SIGN_DATA,
  CHINESE_ZODIAC_DATA,
  CHINESE_ELEMENT_DATA,
  PERSONAL_YEAR_DATA,
  ELEMENT_INTERACTIONS,
  getElementInteraction
} = require('./cosmic-content');

// ============================================================
// CALCULATION HELPERS
// ============================================================

function reduceToDigit(num) {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = String(num).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
  }
  return num;
}

function calculateLifePath(birthDate) {
  if (!birthDate) return null;
  const parts = birthDate.split('-');
  if (parts.length !== 3) return null;

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  const yearSum = reduceToDigit(year.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0));
  const monthSum = reduceToDigit(parseInt(month));
  const daySum = reduceToDigit(parseInt(day));

  return reduceToDigit(yearSum + monthSum + daySum);
}

function getSunSign(birthDate) {
  if (!birthDate) return null;
  const parts = birthDate.split('-');
  if (parts.length !== 3) return null;

  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';

  return 'Capricorn';
}

function getChineseZodiac(birthDate) {
  if (!birthDate) return null;
  const year = parseInt(birthDate.split('-')[0]);
  const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const index = (year - 1900) % 12;
  return animals[index >= 0 ? index : index + 12];
}

function getChineseElement(birthDate) {
  if (!birthDate) return 'Unknown';
  const year = parseInt(birthDate.split('-')[0]);
  const elements = ['Metal', 'Metal', 'Water', 'Water', 'Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth'];
  const index = (year - 1900) % 10;
  return elements[index >= 0 ? index : index + 10];
}

function getMoonPhase() {
  const synodicMonth = 29.53058867;
  const knownNewMoon = new Date('2024-01-11').getTime();
  const now = new Date().getTime();
  const diff = now - knownNewMoon;
  const days = diff / (1000 * 60 * 60 * 24);
  const phase = ((days % synodicMonth) + synodicMonth) % synodicMonth;

  if (phase < 1.85) return { name: 'New Moon', energy: 'beginnings', icon: '🌑' };
  if (phase < 7.38) return { name: 'Waxing Crescent', energy: 'intention', icon: '🌒' };
  if (phase < 9.23) return { name: 'First Quarter', energy: 'action', icon: '🌓' };
  if (phase < 14.77) return { name: 'Waxing Gibbous', energy: 'refinement', icon: '🌔' };
  if (phase < 16.61) return { name: 'Full Moon', energy: 'illumination', icon: '🌕' };
  if (phase < 22.15) return { name: 'Waning Gibbous', energy: 'gratitude', icon: '🌖' };
  if (phase < 24.00) return { name: 'Last Quarter', energy: 'release', icon: '🌗' };
  return { name: 'Waning Crescent', energy: 'surrender', icon: '🌘' };
}

function getPersonalYear(birthDate) {
  if (!birthDate) return 1;
  const currentYear = new Date().getFullYear();
  const parts = birthDate.split('-');
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  const yearSum = reduceToDigit(String(currentYear).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0));
  const monthSum = reduceToDigit(month);
  const daySum = reduceToDigit(day);

  return reduceToDigit(yearSum + monthSum + daySum);
}

// ============================================================
// ESSAY GENERATORS
// ============================================================

function generateLifeEssay(user) {
  const lp = LIFE_PATH_DATA[user.life_path] || LIFE_PATH_DATA[1];
  const ss = SUN_SIGN_DATA[user.sun_sign] || SUN_SIGN_DATA['Aries'];
  const cz = CHINESE_ZODIAC_DATA[user.chinese_zodiac] || CHINESE_ZODIAC_DATA['Rat'];
  const chineseElement = getChineseElement(user.birth_date);
  const ce = CHINESE_ELEMENT_DATA[chineseElement] || CHINESE_ELEMENT_DATA['Earth'];
  const personalYear = getPersonalYear(user.birth_date);
  const py = PERSONAL_YEAR_DATA[personalYear] || PERSONAL_YEAR_DATA[1];
  const synthesis = getElementInteraction(ss.element, chineseElement);

  const birthDate = user.birth_date ? new Date(user.birth_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'your birth date';
  const name = user.name || 'Cosmic Traveler';
  const nameUpper = name.toUpperCase();
  const lpNum = user.life_path || 'Unknown';
  const sunName = user.sun_sign || 'Unknown';
  const animalName = user.chinese_zodiac || 'Unknown';

  return `
═══════════════════════════════════════════════════════════════
                    THE COSMIC BLUEPRINT OF
                        ${nameUpper}
═══════════════════════════════════════════════════════════════

                         ✧ Introduction ✧

You entered this world on ${birthDate}. This essay reads your cosmic signature through three independent traditions — Western astrology, Pythagorean numerology, and Chinese zodiac — and then synthesizes them into one coherent reading of who you are designed to be.

These frameworks have been used for thousands of years, not because the stars dictate your fate, but because patterns of personality and time genuinely repeat, and these systems are sophisticated maps of those repetitions. Treat them as lenses, not commands. Use what resonates. Discard what doesn't.


═══════════════════════════════════════════════════════════════
                ✧ YOUR NUMEROLOGICAL CORE ✧
                  Life Path ${lpNum} — ${lp.essence}
═══════════════════════════════════════════════════════════════

${lp.archetypeStory}

You are: ${lp.traits}.

Your purpose: ${lp.purpose}.

Your gifts: ${lp.gifts}.

Your challenges: ${lp.challenges}.

                    ✧ The Shadow ✧

${lp.shadow}

                    ✧ How You Work ✧

${lp.careerThemes}

                    ✧ How You Love ✧

${lp.relationshipStyle}

                    ✧ Daily Practice ✧

${lp.dailyPractice}

                    ✧ Your Mantra ✧

"${lp.mantra}"


═══════════════════════════════════════════════════════════════
                ✧ YOUR SOLAR IDENTITY ✧
                  ${sunName} — ${ss.modality} ${ss.element}, ruled by ${ss.ruler}
═══════════════════════════════════════════════════════════════

${ss.archetypeStory}

You are: ${ss.traits}.

Your approach: ${ss.approach}

                    ✧ The Shadow ✧

${ss.shadow}.

                    ✧ Astrological Signature ✧

  Element:    ${ss.element}
  Modality:   ${ss.modality}
  Ruler:      ${ss.ruler}
  Season:     ${ss.season}
  Body:       ${ss.bodyAreas}
  Colors:     ${ss.colors}


═══════════════════════════════════════════════════════════════
                ✧ YOUR EASTERN WISDOM ✧
                  ${chineseElement} ${animalName} — ${cz.yinYang}
═══════════════════════════════════════════════════════════════

You were born in the Year of the ${chineseElement} ${animalName}. In the Chinese 60-year stem-branch cycle, the year-element layered onto your animal sign creates a specific archetype — one of only sixty combinations available across an entire sixty-year period.

                    ✧ Your Animal ✧

${cz.archetypeStory}

You are: ${cz.traits}.
Your strengths: ${cz.strengths}.
Most compatible: ${cz.compatible}.
Your sign's hours of native energy: ${cz.hours}.
Your animal's fixed element: ${cz.fixedElement}.

                    ✧ The Shadow ✧

${cz.shadow}

                    ✧ Your Year-Element: ${chineseElement} ✧

${ce.archetypeStory}

The ${chineseElement} element carries: ${ce.traits}.
Its gifts: ${ce.gifts}.
Its shadow: ${ce.shadow}.

In the five-element cycle, ${chineseElement} generates ${ce.generatesElement} and controls ${ce.controlsElement}. This means ${chineseElement} energy in you naturally produces ${ce.generatesElement.toLowerCase()}-quality output, and naturally regulates ${ce.controlsElement.toLowerCase()}-quality forces.


═══════════════════════════════════════════════════════════════
                ✧ THE SYNTHESIS ✧
              ${ss.element} (Western) × ${chineseElement} (Chinese)
═══════════════════════════════════════════════════════════════

This is where the three systems weave together into something distinctive to you. It is the answer to "what makes a ${chineseElement} ${animalName} ${sunName} different from a Water ${animalName} ${sunName} or a ${chineseElement} ${animalName} Capricorn?"

${synthesis}


═══════════════════════════════════════════════════════════════
                ✧ YOUR UNIQUE COMBINATION ✧
═══════════════════════════════════════════════════════════════

You are simultaneously:

  • Life Path ${lpNum} — ${lp.essence}
  • ${sunName} Sun — ${ss.element} energy, ${ss.modality} modality
  • ${chineseElement} ${animalName} — ${cz.yinYang} polarity, fixed element ${cz.fixedElement}

The mathematical specifics: 12 Life Paths × 12 Sun Signs × 12 Chinese Animals × 5 Chinese Elements = 8,640 distinct primary cosmic signatures available in this framework. Yours is one of them. You'd have to read several thousand other people's essays before finding one that matched yours across all four axes.

This combination has never existed before in exactly this form, and will never exist again in exactly this form. The Chinese 60-year cycle won't bring back your year-element-animal combination until sixty years from your birth — by which time the Western astrological precession will have slightly shifted, the numerology will be calculating against a different year, and the world meeting that person will be different from the world meeting you.

You are a unique experiment of consciousness, running on real and ancient code.


═══════════════════════════════════════════════════════════════
                ✧ YOUR CURRENT CYCLE ✧
                  Personal Year ${personalYear} — ${py.theme}
═══════════════════════════════════════════════════════════════

You are currently moving through Personal Year ${personalYear}: a year of ${py.theme.toLowerCase()}.

${py.focus}

                    ✧ The Opportunity ✧

${py.opportunity}

                    ✧ The Caution ✧

${py.caution}

                    ✧ The Practice ✧

${py.practice}


═══════════════════════════════════════════════════════════════
                ✧ LIVING THE BLUEPRINT ✧
═══════════════════════════════════════════════════════════════

Your blueprint is not a cage. It is a map of the natural shape of your energy.

Your Life Path ${lpNum} will always seek to ${lp.purpose}.
Your ${sunName} Sun will always engage the world through ${ss.element.toLowerCase()}-element movement.
Your ${chineseElement} ${animalName} will always carry ${cz.strengths.split(',')[0].trim()} as a native gift.

The question is never whether these energies will move through you. They will. The question is whether you will express them consciously — choosing how, when, and toward what — or unconsciously, in patterns you didn't author.

The frameworks above are tools for consciousness. Use them to see the patterns in yourself with more clarity, and to make choices that are more aligned with what you are designed to do.


═══════════════════════════════════════════════════════════════
                ✧ A NOTE ON SOURCES & LIMITS ✧
═══════════════════════════════════════════════════════════════

This essay draws on:
  • Pythagorean numerology (Pythagoras, ~500 BCE)
  • Tropical Western astrology (Hellenistic foundation, modern refinement)
  • Chinese stem-branch zodiac (Han dynasty refinement of older systems)
  • Chinese five-element theory / Wu Xing (Zhou dynasty)

These are public traditions, not Cosmic Self inventions. Each has been refined by thousands of practitioners across millennia. The calculations themselves are deterministic — you can verify any of them against any reputable astrology resource (Cafe Astrology, Astrodienst, the Wilhelm/Baynes I Ching).

This essay is offered for self-reflection and as entertainment. It is not medical, legal, financial, or psychological advice. The choices you make are yours. The frameworks above are lenses; they are useful only insofar as you find them useful.


═══════════════════════════════════════════════════════════════
                         ✧ ✧ ✧
              Generated with intention by Cosmic Self
              An All Walks of Life Production
═══════════════════════════════════════════════════════════════
`.trim();
}

function generateYearEssay(user, year) {
  const lp = LIFE_PATH_DATA[user.life_path] || LIFE_PATH_DATA[1];
  const ss = SUN_SIGN_DATA[user.sun_sign] || SUN_SIGN_DATA['Aries'];
  const chineseElement = getChineseElement(user.birth_date);
  const ce = CHINESE_ELEMENT_DATA[chineseElement] || CHINESE_ELEMENT_DATA['Earth'];
  const personalYear = getPersonalYear(user.birth_date);
  const py = PERSONAL_YEAR_DATA[personalYear] || PERSONAL_YEAR_DATA[1];
  const moonPhase = getMoonPhase();
  const name = user.name || 'Cosmic Traveler';
  const nameUpper = name.toUpperCase();
  const lpNum = user.life_path || 'Unknown';
  const sunName = user.sun_sign || 'Unknown';

  const quarterGuidance = personalYear <= 3
    ? 'initiation and the planting of seeds. Take action on the themes that matter most before momentum solidifies elsewhere'
    : personalYear <= 6
    ? 'building on what came before. The ground from late last year is the foundation you keep developing'
    : 'reflection and preparation. The year asks for clarity about what is completing';

  const elementBeat = ss.element === 'Fire'
    ? 'Expect surges of vitality and inspiration; protect against burnout.'
    : ss.element === 'Earth'
    ? 'Expect steady progress; protect against rigidity.'
    : ss.element === 'Air'
    ? 'Expect mental activity and connection; protect against scattering.'
    : 'Expect emotional depth and intuitive surges; protect against overwhelm.';

  return `
═══════════════════════════════════════════════════════════════
                    ${year} COSMIC FORECAST FOR
                        ${nameUpper}
═══════════════════════════════════════════════════════════════

                ✧ Your Personal Year: ${personalYear} ✧
                  ${py.theme}

In numerology, the Personal Year is calculated by reducing your birth month + birth day + current calendar year. Your Personal Year for ${year} is ${personalYear}, and that number defines the dominant energy of these twelve months.

${py.focus}

                    ✧ The Opportunity ✧

${py.opportunity}

                    ✧ The Caution ✧

${py.caution}

                    ✧ The Practice ✧

${py.practice}


═══════════════════════════════════════════════════════════════
                ✧ HOW THIS YEAR MEETS YOU ✧
═══════════════════════════════════════════════════════════════

You walk this Personal Year as Life Path ${lpNum} — ${lp.essence}. Your natural orientation toward being ${lp.traits.split(',').slice(0, 2).join(',').trim()} now meets the ${py.theme.toLowerCase()} energy of ${year}.

For a ${lp.essence}, Personal Year ${personalYear} specifically asks: how do you bring your gift of ${lp.gifts.split(',')[0].trim()} into a year that is fundamentally about ${py.theme.toLowerCase()}? The two patterns sometimes align effortlessly and sometimes create useful friction.

Your ${sunName} Sun colors the year with ${ss.element} energy. ${elementBeat}

Your Chinese ${chineseElement} element brings additional flavor: ${ce.essence.toLowerCase()}. The ${chineseElement} signature wants to express itself through this Personal Year by drawing on ${ce.gifts.split(',')[0].trim()}.


═══════════════════════════════════════════════════════════════
                ✧ NAVIGATING ${year} ✧
═══════════════════════════════════════════════════════════════

                    ✧ First Quarter ✧

The opening months of Personal Year ${personalYear} usually emphasize ${quarterGuidance}.

                    ✧ Middle of the Year ✧

The middle of ${year} brings Personal Year ${personalYear} to its fullest expression. The themes of ${py.theme.toLowerCase()} reach their peak — and so do their tests. Whatever you've been avoiding about this year's energy will surface here.

                    ✧ Final Quarter ✧

The last months of ${year} begin the transition into your next Personal Year. Use this time to consolidate the year's lessons rather than starting anything wholly new. The next cycle is closer than you think.


═══════════════════════════════════════════════════════════════
                ✧ CURRENT LUNAR RHYTHM ✧
═══════════════════════════════════════════════════════════════

At the moment this forecast is generated, the moon is in its ${moonPhase.name} phase — a time of ${moonPhase.energy}. The lunar cycle moves every ~29.5 days through eight phases. New moons mark planting; full moons mark revelation; the dark waning quarter marks release. This rhythm offers smaller-scale timing wisdom within the year.


═══════════════════════════════════════════════════════════════
                ✧ CLOSING GUIDANCE ✧
═══════════════════════════════════════════════════════════════

${year} is Personal Year ${personalYear} for you — a year of ${py.theme.toLowerCase()}. Your Life Path ${lpNum} gives you the tools of ${lp.gifts}. Your ${sunName} nature brings ${ss.element} energy to the work. Your ${chineseElement} signature provides ${ce.gifts.split(',')[0].trim()}.

May this year bring you deeper into alignment with the patterns you were designed to walk.


═══════════════════════════════════════════════════════════════
                         ✧ ✧ ✧
              Generated with intention by Cosmic Self
              An All Walks of Life Production
═══════════════════════════════════════════════════════════════
`.trim();
}

function generateReadingList(user) {
  const lp = LIFE_PATH_DATA[user.life_path] || LIFE_PATH_DATA[1];
  const ss = SUN_SIGN_DATA[user.sun_sign] || SUN_SIGN_DATA['Aries'];
  const cz = CHINESE_ZODIAC_DATA[user.chinese_zodiac] || CHINESE_ZODIAC_DATA['Rat'];
  const chineseElement = getChineseElement(user.birth_date);
  const ce = CHINESE_ELEMENT_DATA[chineseElement] || CHINESE_ELEMENT_DATA['Earth'];
  const name = user.name || 'Cosmic Traveler';
  const nameUpper = name.toUpperCase();
  const lpNum = user.life_path || 'Unknown';
  const sunName = user.sun_sign || 'Unknown';
  const animalName = user.chinese_zodiac || 'Unknown';

  const lifePathBooks = {
    1: ['"The War of Art" — Steven Pressfield (overcoming the resistance of being first)', '"Man\'s Search for Meaning" — Viktor Frankl (the dignity of self-authored purpose)'],
    2: ['"The Dance of Intimacy" — Harriet Lerner (boundaried connection)', '"Nonviolent Communication" — Marshall Rosenberg (the language of attuned needs)'],
    3: ['"Big Magic" — Elizabeth Gilbert (the discipline of creative living)', '"The Artist\'s Way" — Julia Cameron (unblocking expression)'],
    4: ['"Atomic Habits" — James Clear (the architecture of compound progress)', '"Deep Work" — Cal Newport (the discipline of focus)'],
    5: ['"The Alchemist" — Paulo Coelho (the journey of becoming)', '"Vagabonding" — Rolf Potts (long-term travel as practice)'],
    6: ['"All About Love" — bell hooks (love as ethical practice)', '"Boundaries" — Henry Cloud (caring without losing self)'],
    7: ['"The Power of Now" — Eckhart Tolle (presence as the contemplative\'s gift)', '"Siddhartha" — Hermann Hesse (the seeker\'s journey to the river)'],
    8: ['"Principles" — Ray Dalio (the disciplined manifestation of vision at scale)', '"The Score Takes Care of Itself" — Bill Walsh (leadership through standards)'],
    9: ['"A New Earth" — Eckhart Tolle (releasing the egoic self)', '"The Prophet" — Kahlil Gibran (wisdom for the universal heart)'],
    11: ['"The Seat of the Soul" — Gary Zukav (intuition as spiritual instrument)', '"Many Lives, Many Masters" — Brian Weiss (consciousness beyond one lifetime)'],
    22: ['"Good to Great" — Jim Collins (what makes institutions last)', '"Mastery" — Robert Greene (the patience required by large work)'],
    33: ['"The Book of Joy" — Dalai Lama & Desmond Tutu (joy as practice, not circumstance)', '"Letters to a Young Poet" — Rainer Maria Rilke (the contemplative voice as teacher)']
  };

  const elementBooks = {
    Fire: '"Start with Why" — Simon Sinek (the kindling of vision into movement)',
    Earth: '"Essentialism" — Greg McKeown (the discipline of less but better)',
    Air: '"Thinking, Fast and Slow" — Daniel Kahneman (understanding the architecture of mind)',
    Water: '"The Language of Emotions" — Karla McLaren (navigating emotional depths with skill)'
  };

  const animalBooks = {
    Rat: '"The 7 Habits of Highly Effective People" — Stephen Covey (sustained intelligence over short cleverness)',
    Ox: '"The Slight Edge" — Jeff Olson (compound effort, the Ox\'s gift)',
    Tiger: '"Extreme Ownership" — Jocko Willink & Leif Babin (leadership as accountability)',
    Rabbit: '"The Tao of Pooh" — Benjamin Hoff (gentle wisdom, refined living)',
    Dragon: '"Awaken the Giant Within" — Tony Robbins (large-presence energy directed deliberately)',
    Snake: '"The Untethered Soul" — Michael Singer (the inner observer)',
    Horse: '"The Wisdom of Insecurity" — Alan Watts (freedom and presence as practice)',
    Goat: '"Big Magic" — Elizabeth Gilbert (the creative goat\'s gentle persistence)',
    Monkey: '"Range" — David Epstein (why generalists triumph in a specialized world)',
    Rooster: '"The Score Takes Care of Itself" — Bill Walsh (precision and standards as foundation)',
    Dog: '"The Four Agreements" — Don Miguel Ruiz (loyal living, ethical practice)',
    Pig: '"The Subtle Art of Not Giving a F*ck" — Mark Manson (joy without self-erasure)'
  };

  const chineseElementBooks = {
    Wood: '"The War of Art" — Steven Pressfield (breaking ground, the Wood element\'s task)',
    Fire: '"The Power of Now" — Eckhart Tolle (channeling intensity into presence)',
    Earth: '"The Power of Habit" — Charles Duhigg (the structural gift of Earth)',
    Metal: '"Show Your Work" — Austin Kleon (refined output, generously shared)',
    Water: '"Letters to a Young Poet" — Rainer Maria Rilke (the contemplative\'s depth)'
  };

  const books = lifePathBooks[user.life_path] || lifePathBooks[1];
  const elementBook = elementBooks[ss.element] || elementBooks['Fire'];
  const animalBook = animalBooks[user.chinese_zodiac] || animalBooks['Rat'];
  const chineseElementBook = chineseElementBooks[chineseElement] || chineseElementBooks['Earth'];

  return `
═══════════════════════════════════════════════════════════════
                    PERSONALIZED READING LIST FOR
                        ${nameUpper}
═══════════════════════════════════════════════════════════════

Cosmic Self has selected these books based on the four primary axes of your cosmic signature: your Life Path, your Sun Sign element, your Chinese animal, and your Chinese year-element. Each represents a different doorway into the patterns you embody.


                ✧ For Your Life Path ${lpNum} ✧
                  ${lp.essence}

  1. ${books[0]}

  2. ${books[1]}

These books resonate with your ${lp.traits.split(',').slice(0, 2).join(',').trim()} nature and your purpose: ${lp.purpose}.


                ✧ For Your ${ss.element} Sun Element ✧
                  (${sunName})

${elementBook}

Why: your Sun's ${ss.element} element is how your core energy moves through the world. This book speaks to that movement.


                ✧ For Your Chinese Animal: ${animalName} ✧

${animalBook}

Why: your animal carries the gift of ${cz.strengths.split(',')[0].trim()}. This book speaks directly to that gift.


                ✧ For Your Chinese Year-Element: ${chineseElement} ✧

${chineseElementBook}

Why: your year-element is ${ce.essence.toLowerCase()}. This book honors that quality.


                ✧ Universal Recommendations ✧

  • "The Power of Myth" — Joseph Campbell (the archetypal patterns underneath all traditions)
  • "The Astrology of Fate" — Liz Greene (deep psychological astrology, the Western tradition's contemplative wing)
  • "The I Ching: The Classic of Changes" — Wilhelm/Baynes translation (the foundational Chinese wisdom text, the source from which much of Chinese astrology grew)


                ✧ How To Use This List ✧

Start with the book that calls to you most strongly — your intuition knows what you need now. Let each book be a meditation, a conversation between the author's wisdom and your own cosmic blueprint. The patterns above are doorways; the books are companions for the walk.


═══════════════════════════════════════════════════════════════
                         ✧ ✧ ✧
              Curated with intention by Cosmic Self
              An All Walks of Life Production
═══════════════════════════════════════════════════════════════
`.trim();
}

function generatePersonalizedSMS(user) {
  const moonPhase = getMoonPhase();

  const lifePathMessages = {
    1: "Lead with courage today",
    2: "Trust your intuition deeply",
    3: "Express your creativity now",
    4: "Build something meaningful",
    5: "Embrace today's changes",
    6: "Nurture what you love",
    7: "Seek the deeper truth",
    8: "Step into your power",
    9: "Release what's complete",
    11: "Channel your vision now",
    22: "Build your legacy today",
    33: "Teach through love today"
  };

  const moonMessages = {
    'New Moon': "Plant seeds of intention",
    'Waxing Crescent': "Nurture what you've started",
    'First Quarter': "Push through resistance",
    'Waxing Gibbous': "Refine and adjust",
    'Full Moon': "Receive what's revealed",
    'Waning Gibbous': "Share your wisdom",
    'Last Quarter': "Release what's heavy",
    'Waning Crescent': "Rest and surrender"
  };

  const pathMsg = lifePathMessages[user.life_path] || lifePathMessages[1];
  const moonMsg = moonMessages[moonPhase.name] || "Honor the cosmic rhythm";

  return `${moonPhase.icon} ${user.name || 'Cosmic traveler'}, the ${moonPhase.name} whispers: ${moonMsg}. As Life Path ${user.life_path || 'Unknown'}, ${pathMsg.toLowerCase()}. ✧ Cosmic Self`;
}

function getCurrentCosmicWeather() {
  const moonPhase = getMoonPhase();
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  let currentSunSign = 'Capricorn';
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) currentSunSign = 'Aries';
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) currentSunSign = 'Taurus';
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) currentSunSign = 'Gemini';
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) currentSunSign = 'Cancer';
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) currentSunSign = 'Leo';
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) currentSunSign = 'Virgo';
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) currentSunSign = 'Libra';
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) currentSunSign = 'Scorpio';
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) currentSunSign = 'Sagittarius';
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) currentSunSign = 'Capricorn';
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) currentSunSign = 'Aquarius';
  else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) currentSunSign = 'Pisces';

  return {
    moonPhase,
    sunSign: currentSunSign,
    guidance: `The ${moonPhase.name} invites ${moonPhase.energy}. The Sun in ${currentSunSign} colors the day. Honor both rhythms.`
  };
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  // calculation helpers
  calculateLifePath,
  getSunSign,
  getChineseZodiac,
  getChineseElement,
  getMoonPhase,
  getPersonalYear,
  // essay generators
  generateLifeEssay,
  generateYearEssay,
  generateReadingList,
  generatePersonalizedSMS,
  getCurrentCosmicWeather
};
