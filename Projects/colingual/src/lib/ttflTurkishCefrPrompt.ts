/**
 * CEFR-Based Turkish Reading Text Generation System
 * (Reading-purpose driven, grammar-constrained, cumulative model)
 * For Teaching Turkish as a Foreign Language (TTFL).
 */

export const TTFL_READING_PURPOSES = [
  'Adjustment',
  'Using information and reference sources',
  'Learning',
  'Having fun / entertainment',
  'Finding the main idea in the text',
  'Accessing specific information in the text',
  'Understanding in detail',
  'Reaching the implicit (inferred) meaning in the text',
] as const

const GRAMMAR_A1 = `
A1 (cumulative base): personal pronouns (ben, sen, o, biz, siz, onlar); personal endings (-Im, -sIn, -, -Iz, -sInIz, -lAr);
demonstratives (bu, şu, o); interrogatives (Kim?, ne?, kaç, kaçıncı); plural (-lAr); interrogative (mI); numerals;
locative (-DA); ordinal numbers; positive/negative/question sentences; present (-yor); dative (-(y)A); ablative (-DAn);
verb+mAk iste-; possessive suffixes; nominal derivational (-CA); accusative (-(y)I); telling time; prepositions
(-A kadar, -DAn önce/sonra, -mAdAn önce, -DIktAn sonra, -DAn beri); past definite (-DI); possessive construction;
relative -ki; comparison (-DAn); supremacy (en).
`.trim()

const GRAMMAR_A2 = `
A2 (add to A1): imperative (-sIn, -(y)In(Iz), -sIn(lAr)); subjunctive (-(y)AyIm, (y)AlIm); derivational (-lI, -sIz, -lIk);
conjunctions (çünkü, bu nedenle/sebeple, bu yüzden); ile (conj/prep); future (-AcAk); simile (gibi, kadar);
(-mIş); reinforcement adjectives; diminutive (-CIk, -CA); direct speech (diye sordu/söyledi…); (hem…hem, ne…ne, ya…ya);
present habitual (-(A/I)r); present participle (-mAktA); copula (-DIr); -Abil; gerund (-(y)Ip, -mAdAn).
`.trim()

const GRAMMAR_B1 = `
B1 (add to A2): gerunds (-(y)ArAk, -(y)A -(A), ken, -mAk/-mA/-(y)Iş); imperfect (-(I)yordu); necessitative (-mAlI, gerek, lazım…);
gerunds (-mAk için, -mA+possessive için, -mAk üzere, -mAktAnsA); past necessitative (-mAlIydI); rağmen; subjunctive (-sA);
past subjunctive (-sAydI); (-IncA, -(l/A)r -mAz); conditional (-(tense)+sA, -sAydI); (-DIk+poss+dAn beri, -(y)AlI, -DI -(y)AlI).
`.trim()

const GRAMMAR_B2 = `
B2 (add to B1): reciprocal, passive, reflexive, causative voices; gerunds (-DIkçA/-DIğI sürece, -IncAyA/-AnA kadar/dek/değin);
verbal adjectives (-An, -DIk, -AcAk, -(l/A)r, -mAz, -mIş, -AsI); (-DIğI/-AcAğI zaman/sırada, için, IndAn dolayı, IndAn);
adverbs (sanki, artık, bile, zaten); indirect speech; conjunctions (oysaki/halbuki, ne var ki, ne yazık ki, neyse ki, meğer(se),
madem ki, nitekim, hiç değilse/olmazsa, ayrıca, bununla birlikte/beraber, yanı sıra, üstelik, hatta).
`.trim()

const GRAMMAR_C1 = `
C1 (add to B2): imperfect paradigm (-(I)yordu, -(A/I)rdI, -AcAktI, -mIştI, -mAlIydI, -sAydI); evidential compound
(-(I)yormuş, -(A/I)rmIş, -AcAkmIş, -mIşmış, -mAlIymış, -sAymış); conditional compound (-(I)yorsa, -(A/I)rsA, -AcAksA, -DIysA, -mIşsA);
compound tenses (-(I)yor/-(A/I)r/-AcAk/-mIş ol-); gerunds (-DIk/-AcAk+poss kadar/gibi, -AcAk kadar); conjunctions (zira, aksi halde/takdirde);
adverbs (açıkçası/doğrusu, aksine); periphrastic compounds (quickness, persistence, approach); conjunction ki and ki-phrases;
(-DIk/-AcAk+poss (nA)/göre/takdirde).
`.trim()

const DESCRIPTORS = `
A1 — Recognition only. Familiar names/words/simple sentences; functional formats (signs, posters, catalogues, tickets).
Text types: functional or immediate-environment descriptions. Example: concert ticket (who, when, where). Reading purpose:
accessing specific information / adjustment.

A2 — Locating explicit, predictable information in everyday texts (ads, menus, timetables, short personal letters).
Text types: posters, tickets, menus, announcements, environment descriptions. Example: metrobus notices. Reading purpose:
accessing specific information / learning.

B1 — Threshold: transition to interpretation. Everyday/professional topics; letters with events, feelings, wishes.
Text types: opinion columns, news, essays, simplified academic texts, letters, petitions. Reader interprets (not only reports).
Reading purpose: finding main idea / understanding in detail.

B2 — Evaluation and perspective. Articles/reports with clear stance; modern literary prose features.
Text types: research reports, opinion columns, essays, simplified academic, literary summaries/short stories.
Reading purpose: understanding in detail / reaching implicit meaning.

C1 — Inference and abstraction. Long complex factual/literary texts; stylistic differences; specialized/technical content.
All text types. Reading purpose: reaching implicit meaning / using reference sources.
`.trim()

export type TtflPromptContext = {
  topic: string
  topicSummary?: string
  nativeLanguageLabel: string
}

export function buildTtflTurkishCefrSystemInstruction(context: TtflPromptContext): string {
  return [
    'CEFR-Based Turkish Reading Text Generation System (TTFL).',
    'ROLE: Specialist in Teaching Turkish as a Foreign Language, CEFR reading descriptors, Turkish morphology/syntax,',
    'linguistic complexity progression, and pedagogical material design.',
    '',
    'PRIMARY OBJECTIVE: Generate five Turkish texts (A1, A2, B1, B2, C1) that:',
    '- Align strictly with CEFR reading descriptors below.',
    '- Support at least one clearly identifiable reading purpose per level.',
    '- Use ONLY grammar assigned to each level PLUS all grammar from previous levels (cumulative).',
    '- Never use grammar from a higher level at a lower level.',
    '- Increase cognitive and linguistic complexity progressively.',
    '- Share the same core facts and thematic topic across all five levels.',
    '',
    `TOPIC (from current news — adapt faithfully, do not sensationalize): ${context.topic}`,
    context.topicSummary ? `SOURCE SUMMARY: ${context.topicSummary}` : '',
    '',
    'READING PURPOSES (choose the best fit per level and state it in readingPurpose):',
    TTFL_READING_PURPOSES.join('; '),
    '',
    'CEFR READING DESCRIPTORS:',
    DESCRIPTORS,
    '',
    'GRAMMAR (cumulative — each level may only add its band on top of prior bands):',
    GRAMMAR_A1,
    GRAMMAR_A2,
    GRAMMAR_B1,
    GRAMMAR_B2,
    GRAMMAR_C1,
    '',
    'OUTPUT RULES:',
    '- Write all titles, decks, and paragraphs in Turkish.',
    `- Vocabulary glosses (meaning field) in ${context.nativeLanguageLabel}.`,
    '- A1: 2–4 very short paragraphs; functional/format-friendly layout where appropriate.',
    '- A2: 3 short paragraphs; explicit locatable facts.',
    '- B1: 3 paragraphs; interpretation begins.',
    '- B2: 3–4 paragraphs; stance and evaluation language.',
    '- C1: 4 paragraphs; complex syntax, inference, stylistic nuance.',
    '- Include 3–5 vocabulary items per level drawn from the text.',
    '- deck: one sentence on text type + cognitive demand for teachers.',
    '- grammarUsed: array of Turkish structures actually used (3–8 items).',
    '- readingPurpose: one label from the reading purposes list.',
    '- Return valid JSON only (no markdown). Same schema for all levels A1–C1.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function isTurkishTargetLanguage(languageCode: string): boolean {
  return languageCode.trim().toLowerCase() === 'tr'
}
