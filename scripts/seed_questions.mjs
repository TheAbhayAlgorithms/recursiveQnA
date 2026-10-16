import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'recursiveqna-production-jwt-key-2026';

const token = jwt.sign(
  {
    id: 'abhayraj',
    name: 'ABHAY R SINGH',
    role: 'user',
    field_of_interest: 'General',
  },
  JWT_SECRET,
  { expiresIn: '30d' }
);

const questions = [
  // --- Personal Finance (10) ---
  {
    field: "Personal Finance",
    title: "What’s the difference between net worth and cash flow?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "Why is an emergency fund recommended before investing?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "How does compound interest benefit savers but hurt debtors?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "What’s a “backdoor Roth IRA” and who uses it?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "Why check your credit report annually even if you don’t apply for loans?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "What’s the 50/30/20 budget rule?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "How does dollar-cost averaging reduce investment risk?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "Why are index funds often recommended over individual stocks for beginners?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "What’s “lifestyle inflation” and why avoid it?",
    content: ""
  },
  {
    field: "Personal Finance",
    title: "How does tax-loss harvesting work?",
    content: ""
  },

  // --- Digital Marketing (10) ---
  {
    field: "Digital Marketing",
    title: "What’s the core difference between SEO and SEM?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "Why is CTR (click-through rate) a key metric in ad campaigns?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "What’s a “buyer persona” and why create one?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "How does retargeting (remarketing) increase conversions?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "What’s the purpose of A/B testing in email marketing?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "Why is mobile optimization critical for digital campaigns?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "What does “conversion funnel” mean in marketing?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "How do influencers differ from traditional celebrities in marketing?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "What’s “content marketing” vs. “advertising”?",
    content: ""
  },
  {
    field: "Digital Marketing",
    title: "Why track ROI (return on investment) in campaigns?",
    content: ""
  },

  // --- History (10) ---
  {
    field: "History",
    title: "What event marked the end of the Roman Republic?",
    content: ""
  },
  {
    field: "History",
    title: "Why was the Magna Carta (1215) revolutionary?",
    content: ""
  },
  {
    field: "History",
    title: "What caused the fall of Constantinople in 1453?",
    content: ""
  },
  {
    field: "History",
    title: "How did the Printing Press (c. 1440) change Europe?",
    content: ""
  },
  {
    field: "History",
    title: "What was the main goal of the Congress of Vienna (1815)?",
    content: ""
  },
  {
    field: "History",
    title: "Why is the Battle of Hastings (1066) pivotal for England?",
    content: ""
  },
  {
    field: "History",
    title: "What triggered the American Revolution (1775–1783)?",
    content: ""
  },
  {
    field: "History",
    title: "How did the Silk Road shape global history?",
    content: ""
  },
  {
    field: "History",
    title: "What was the Cold War’s defining ideological conflict?",
    content: ""
  },
  {
    field: "History",
    title: "Why did the Berlin Wall fall in 1989?",
    content: ""
  },

  // --- Biology and Life Science (10) ---
  {
    field: "Biology and Life Science",
    title: "What’s the central dogma of molecular biology?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "Why are mitochondria called the “powerhouse of the cell”?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "How does natural selection drive evolution?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "What’s the role of enzymes in metabolism?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "Why is biodiversity crucial for ecosystem stability?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "What distinguishes prokaryotic from eukaryotic cells?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "How do vaccines confer immunity?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "What’s the function of the CRISPR-Cas9 system?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "Why do plants perform photosynthesis?",
    content: ""
  },
  {
    field: "Biology and Life Science",
    title: "What’s the significance of the human microbiome?",
    content: ""
  },

  // --- Languages (10) ---
  {
    field: "Languages",
    title: "How many languages are estimated to exist worldwide today?",
    content: ""
  },
  {
    field: "Languages",
    title: "What’s the most spoken language by total speakers (native + non-native)?",
    content: ""
  },
  {
    field: "Languages",
    title: "What is “lingua franca”?",
    content: ""
  },
  {
    field: "Languages",
    title: "Why is Latin considered a “dead” language?",
    content: ""
  },
  {
    field: "Languages",
    title: "What’s the difference between syntax and semantics?",
    content: ""
  },
  {
    field: "Languages",
    title: "How did the Rosetta Stone help decipher hieroglyphs?",
    content: ""
  },
  {
    field: "Languages",
    title: "What’s “code-switching” in bilingual speakers?",
    content: ""
  },
  {
    field: "Languages",
    title: "Why is Mandarin Chinese the most spoken native language?",
    content: ""
  },
  {
    field: "Languages",
    title: "What’s an example of onomatopoeia across languages?",
    content: ""
  },
  {
    field: "Languages",
    title: "How do creole languages form?",
    content: ""
  },

  // --- Nutrition (10) ---
  {
    field: "Nutrition",
    title: "What’s the difference between macronutrients and micronutrients?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "Why is dietary fiber important?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "What’s the “sunshine vitamin” and why?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "How many calories are in 1g of fat vs. 1g of protein?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "What’s the recommended daily water intake for adults?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "Why are omega-3 fatty acids essential?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "What’s the role of antioxidants?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "How does protein support muscle repair?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "What’s “hidden sugar” in processed foods?",
    content: ""
  },
  {
    field: "Nutrition",
    title: "Why limit trans fats?",
    content: ""
  },

  // --- Cooking (10) ---
  {
    field: "Cooking",
    title: "What’s the Maillard reaction?",
    content: ""
  },
  {
    field: "Cooking",
    title: "Why rest meat after cooking?",
    content: ""
  },
  {
    field: "Cooking",
    title: "What’s the purpose of “blooming” spices?",
    content: ""
  },
  {
    field: "Cooking",
    title: "How does acid (lemon/vinegar) tenderize meat?",
    content: ""
  },
  {
    field: "Cooking",
    title: "Why use cold butter in pie crusts?",
    content: ""
  },
  {
    field: "Cooking",
    title: "What’s “deglazing” a pan?",
    content: ""
  },
  {
    field: "Cooking",
    title: "How does salt enhance flavor beyond just “salty”?",
    content: ""
  },
  {
    field: "Cooking",
    title: "Why soak beans before cooking?",
    content: ""
  },
  {
    field: "Cooking",
    title: "What’s the difference between baking and roasting?",
    content: ""
  },
  {
    field: "Cooking",
    title: "How does yeast make dough rise?",
    content: ""
  },

  // --- Gaming (10) ---
  {
    field: "Gaming",
    title: "What was the first commercially successful video game?",
    content: ""
  },
  {
    field: "Gaming",
    title: "Why are “loot boxes” controversial?",
    content: ""
  },
  {
    field: "Gaming",
    title: "What’s the difference between FPS and TPS games?",
    content: ""
  },
  {
    field: "Gaming",
    title: "How do esports differ from casual gaming?",
    content: ""
  },
  {
    field: "Gaming",
    title: "What’s “frame rate” (FPS) and why does it matter?",
    content: ""
  },
  {
    field: "Gaming",
    title: "Why do games use “save points”?",
    content: ""
  },
  {
    field: "Gaming",
    title: "What’s the “Konami Code” and its origin?",
    content: ""
  },
  {
    field: "Gaming",
    title: "How does VR (virtual reality) enhance immersion?",
    content: ""
  },
  {
    field: "Gaming",
    title: "What’s a “speedrun” in gaming?",
    content: ""
  },
  {
    field: "Gaming",
    title: "Why are indie games significant in the industry?",
    content: ""
  },

  // --- Anime and Manga (10) ---
  {
    field: "Anime and Manga",
    title: "What’s the difference between shonen and shojo manga?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "Who created Astro Boy, the foundational manga character?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "What does “isekai” mean in anime?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "Why is Dragon Ball Z iconic globally?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "What’s a “filler episode” in anime?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "How did Akira (1988) impact anime?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "What’s the “Big Three” of 2000s shonen anime?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "Why do manga use right-to-left reading in English releases?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "What’s “mecha” anime?",
    content: ""
  },
  {
    field: "Anime and Manga",
    title: "How did streaming change anime distribution?",
    content: ""
  },

  // --- Fashion (10) ---
  {
    field: "Fashion",
    title: "What’s “haute couture” and who regulates it?",
    content: ""
  },
  {
    field: "Fashion",
    title: "Who popularized the “little black dress”?",
    content: ""
  },
  {
    field: "Fashion",
    title: "What’s the difference between “bespoke” and “ready-to-wear”?",
    content: ""
  },
  {
    field: "Fashion",
    title: "Why is Milan a fashion capital?",
    content: ""
  },
  {
    field: "Fashion",
    title: "What fabric comes from flax plants?",
    content: ""
  },
  {
    field: "Fashion",
    title: "Who created the iconic “wrap dress”?",
    content: ""
  },
  {
    field: "Fashion",
    title: "What’s “streetwear” in fashion?",
    content: ""
  },
  {
    field: "Fashion",
    title: "Which designer is known for red-soled shoes?",
    content: ""
  },
  {
    field: "Fashion",
    title: "What’s a “capsule collection”?",
    content: ""
  },
  {
    field: "Fashion",
    title: "How did the Met Gala become “fashion’s biggest night”?",
    content: ""
  },

  // --- Sports (10) ---
  {
    field: "Sports",
    title: "Who holds the MLB record for most home runs in a season?",
    content: ""
  },
  {
    field: "Sports",
    title: "What’s the longest point in tennis history?",
    content: ""
  },
  {
    field: "Sports",
    title: "Which NFL team has never played in or hosted a Super Bowl?",
    content: ""
  },
  {
    field: "Sports",
    title: "When was the first NBA game played?",
    content: ""
  },
  {
    field: "Sports",
    title: "Who was the first U.S. president to throw a ceremonial first pitch?",
    content: ""
  },
  {
    field: "Sports",
    title: "What’s the “Triple Crown” in horse racing?",
    content: ""
  },
  {
    field: "Sports",
    title: "How many rings make a “Grand Slam” in tennis?",
    content: ""
  },
  {
    field: "Sports",
    title: "What’s the maximum break in snooker?",
    content: ""
  },
  {
    field: "Sports",
    title: "Who won India’s first individual Olympic gold in athletics?",
    content: ""
  },
  {
    field: "Sports",
    title: "What’s “offside” in soccer?",
    content: ""
  }
];

console.log(`Total questions to upload: ${questions.length}`);

async function run() {
  const cookieHeader = `rqna_token=${token}; edu_token=${token}`;
  let successCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const postRes = await fetch('http://localhost:3000/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        title: q.title,
        content: q.content,
        field: q.field,
        imageUrl: null,
        videoUrl: null
      })
    });

    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) {
      console.error(`Failed to post [${q.field}] "${q.title}":`, postData);
    } else {
      successCount++;
      if (successCount % 10 === 0 || successCount === questions.length) {
        console.log(`Progress: ${successCount}/${questions.length} posted. (Latest: [${q.field}] ${q.title})`);
      }
    }
  }

  console.log(`\nCOMPLETED: Successfully posted ${successCount} of ${questions.length} questions as @abhayraj (ABHAY R SINGH).`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
