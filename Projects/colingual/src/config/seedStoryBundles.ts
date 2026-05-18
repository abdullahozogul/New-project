import type { Level, VocabularyItem } from '../data'
import type { ArticleVariantContent, NewsStoryBundle } from '../lib/cefrNews'

type VariantMap = Partial<Record<Level, ArticleVariantContent>>

function bundle(
  storyId: string,
  sourceTitle: string,
  category: string,
  imageTone: NewsStoryBundle['imageTone'],
  variants: VariantMap,
): NewsStoryBundle {
  return {
    storyId,
    sourceTitle,
    category,
    fetchedAt: 0,
    imageTone,
    isLive: false,
    variants,
  }
}

const gardenVocab = {
  garden: {
    term: 'garden',
    meaning: 'a place with plants and flowers',
    pronunciation: 'gar-den',
    example: 'We read in the garden.',
  },
  quiet: {
    term: 'quiet',
    meaning: 'not noisy',
    pronunciation: 'kwy-et',
    example: 'The morning is quiet.',
  },
  visit: {
    term: 'visit',
    meaning: 'to go and see a place or person',
    pronunciation: 'viz-it',
    example: 'Families visit the garden.',
  },
} satisfies Record<string, VocabularyItem>

export const seedStoryBundles: NewsStoryBundle[] = [
  bundle('city-garden', 'A New Garden Opens in the City', 'Community', 'mint', {
    A1: {
      title: 'A New Garden Opens in the City',
      deck: 'Short sentences for first daily news reading.',
      minutes: 4,
      listening: 'Slow voice',
      video: 'Street clip',
      paragraphs: [
        'A new garden opens in the city today. People can walk, sit, and read there.',
        'The garden has trees, small flowers, and a place for children. It is quiet in the morning.',
        'City workers say the garden helps people meet. Many families visit after school.',
      ],
      vocabulary: [gardenVocab.garden, gardenVocab.quiet, gardenVocab.visit],
    },
    A2: {
      title: 'A New Garden Opens in the City',
      deck: 'Simple past and present forms about a local park.',
      minutes: 5,
      listening: 'Clear voice',
      video: 'Street clip',
      paragraphs: [
        'A new community garden opened in the city centre this week. Visitors can walk along the paths, sit on benches, and read books in the shade.',
        'The garden includes tall trees, colourful flowers, and a small play area for children. In the early morning it is usually very quiet.',
        'City workers explained that the space helps neighbours meet each other. Many families come to visit after school on weekdays.',
      ],
      vocabulary: [
        gardenVocab.garden,
        {
          term: 'bench',
          meaning: 'a long seat for two or more people',
          pronunciation: 'bench',
          example: 'We sat on a bench in the garden.',
        },
        gardenVocab.visit,
      ],
    },
    B1: {
      title: 'A New Garden Opens in the City',
      deck: 'Cause and effect language about a new public space.',
      minutes: 6,
      listening: 'News voice',
      video: 'Street clip',
      paragraphs: [
        'Residents celebrated the opening of a new community garden in the city centre, which was designed to give people a calm place to relax outdoors.',
        'Because the area includes trees, flower beds, and a children’s corner, families have started visiting after work and school. Local volunteers help keep the paths clean.',
        'City officials believe the project will encourage neighbours to talk more often, although they say more benches may be needed as visitor numbers grow.',
      ],
      vocabulary: [
        {
          term: 'resident',
          meaning: 'a person who lives in a place',
          pronunciation: 'rez-i-dent',
          example: 'Residents celebrated the opening.',
        },
        {
          term: 'volunteer',
          meaning: 'someone who works without pay to help',
          pronunciation: 'vol-un-teer',
          example: 'Volunteers keep the paths clean.',
        },
        gardenVocab.quiet,
      ],
    },
    B2: {
      title: 'A New Garden Opens in the City',
      deck: 'Contrast and evaluation of a municipal green space.',
      minutes: 7,
      listening: 'News voice',
      video: 'Street clip',
      paragraphs: [
        'A newly opened community garden in the city centre has been praised by residents who wanted more green space, although some critics argue that maintenance costs could rise during hot summers.',
        'The site combines shaded walkways, native plants, and a supervised play zone, which planners say should reduce noise from nearby roads while giving children a safer outdoor area.',
        'Early surveys suggest that foot traffic peaks after school hours, when families gather before heading home. Officials are now studying whether similar gardens should be built in other districts.',
      ],
      vocabulary: [
        {
          term: 'maintenance',
          meaning: 'work needed to keep something in good condition',
          pronunciation: 'main-te-nance',
          example: 'Maintenance costs could rise.',
        },
        {
          term: 'native',
          meaning: 'originally from a particular region',
          pronunciation: 'nay-tiv',
          example: 'The garden uses native plants.',
        },
        {
          term: 'district',
          meaning: 'an area of a city',
          pronunciation: 'dis-trict',
          example: 'Other districts may get gardens too.',
        },
      ],
    },
    C1: {
      title: 'A New Garden Opens in the City',
      deck: 'Policy implications and long-term urban planning vocabulary.',
      minutes: 8,
      listening: 'Full speed',
      video: 'Street clip',
      paragraphs: [
        'The inauguration of a centrally located community garden has been framed by city planners as a modest but symbolic step toward greener neighbourhoods, even as debate continues over long-term funding for irrigation and seasonal staffing.',
        'While proponents highlight the garden’s potential to foster informal social ties and offer respite from traffic noise, sceptics caution that popularity alone does not guarantee equitable access for residents living farther from the core.',
        'Preliminary attendance data indicate sustained evening use among families, prompting officials to commission a wider study on whether replicating the model could support climate adaptation targets without displacing existing recreational facilities.',
      ],
      vocabulary: [
        {
          term: 'inauguration',
          meaning: 'an official opening ceremony',
          pronunciation: 'in-og-yur-ay-shun',
          example: 'The inauguration drew local media.',
        },
        {
          term: 'equitable',
          meaning: 'fair for different groups of people',
          pronunciation: 'ek-wi-ta-ble',
          example: 'Planners want equitable access.',
        },
        {
          term: 'replicate',
          meaning: 'to copy or repeat something successfully',
          pronunciation: 'rep-li-kate',
          example: 'Other areas may replicate the model.',
        },
      ],
    },
  }),
  bundle('train-service', 'Night Trains Return This Summer', 'Transport', 'blue', {
    A1: {
      title: 'Night Trains Return This Summer',
      deck: 'Short travel news for beginners.',
      minutes: 4,
      listening: 'Slow voice',
      video: 'Station update',
      paragraphs: [
        'Night trains come back in June. They connect three big cities.',
        'You can buy a seat or a small bed on the train. Tickets cost less on Monday to Friday.',
        'The company says night trains save hotel money. They also help roads with less cars.',
      ],
      vocabulary: [
        {
          term: 'train',
          meaning: 'a vehicle that runs on rails',
          pronunciation: 'trayn',
          example: 'The night train leaves at ten.',
        },
        {
          term: 'ticket',
          meaning: 'a paper or digital pass to travel',
          pronunciation: 'tik-et',
          example: 'Tickets are cheaper on weekdays.',
        },
        {
          term: 'city',
          meaning: 'a large town',
          pronunciation: 'sit-ee',
          example: 'The train connects three cities.',
        },
      ],
    },
    A2: {
      title: 'Night Trains Return This Summer',
      deck: 'Practical travel vocabulary with familiar grammar.',
      minutes: 5,
      listening: 'Clear voice',
      video: 'Station update',
      paragraphs: [
        'The national train company will bring back night trains in June. The first route will connect three large cities.',
        'Passengers can buy a seat or a small sleeping room. Tickets will be cheaper on weekdays.',
        'The company says night trains can help travelers save hotel money and reduce traffic on busy roads.',
      ],
      vocabulary: [
        {
          term: 'route',
          meaning: 'the way from one place to another',
          pronunciation: 'root',
          example: 'The route connects three cities.',
        },
        {
          term: 'passenger',
          meaning: 'a person traveling in a vehicle',
          pronunciation: 'pas-en-jer',
          example: 'Passengers can buy tickets online.',
        },
        {
          term: 'weekday',
          meaning: 'Monday through Friday',
          pronunciation: 'week-day',
          example: 'Tickets are cheaper on weekdays.',
        },
      ],
    },
    B1: {
      title: 'Night Trains Return This Summer',
      deck: 'Scheduling and benefits explained for intermediate readers.',
      minutes: 6,
      listening: 'News voice',
      video: 'Station update',
      paragraphs: [
        'After a long pause, the national rail operator announced that overnight services will restart in June, beginning with a route linking three major cities.',
        'Travellers will be able to choose between standard seats and compact sleeping cabins, while weekday fares are expected to stay lower than weekend prices.',
        'Company representatives argued that restoring night trains could cut accommodation costs for tourists and ease congestion on motorways during holiday periods.',
      ],
      vocabulary: [
        {
          term: 'overnight',
          meaning: 'during the night',
          pronunciation: 'oh-ver-nayt',
          example: 'Overnight services restart in June.',
        },
        {
          term: 'fare',
          meaning: 'the price of a journey',
          pronunciation: 'fair',
          example: 'Weekday fares will stay lower.',
        },
        {
          term: 'congestion',
          meaning: 'too much traffic in one place',
          pronunciation: 'kun-jes-chun',
          example: 'Trains may reduce road congestion.',
        },
      ],
    },
    B2: {
      title: 'Night Trains Return This Summer',
      deck: 'Policy trade-offs and passenger choice at B2.',
      minutes: 7,
      listening: 'News voice',
      video: 'Station update',
      paragraphs: [
        'The state-owned rail operator confirmed that sleeper services, discontinued during the pandemic, will resume in June on a flagship corridor connecting three regional capitals.',
        'Although cabin berths will remain limited, analysts expect demand to rise among budget-conscious tourists who would otherwise book airport hotels for early flights.',
        'Environmental groups welcomed the move, yet some motorists’ associations questioned whether marketing night trains as a congestion cure oversimplifies the cost of maintaining ageing track sections.',
      ],
      vocabulary: [
        {
          term: 'discontinued',
          meaning: 'stopped being offered',
          pronunciation: 'dis-kon-tin-yood',
          example: 'Services were discontinued in 2020.',
        },
        {
          term: 'berth',
          meaning: 'a sleeping place on a train',
          pronunciation: 'burth',
          example: 'Cabin berths are limited.',
        },
        {
          term: 'flagship',
          meaning: 'the most important product or service',
          pronunciation: 'flag-ship',
          example: 'The flagship corridor opens first.',
        },
      ],
    },
    C1: {
      title: 'Night Trains Return This Summer',
      deck: 'Infrastructure funding and modal shift discourse.',
      minutes: 8,
      listening: 'Full speed',
      video: 'Station update',
      paragraphs: [
        'The reinstatement of overnight rail services on a strategically important corridor has been presented by ministers as evidence of renewed commitment to intercity connectivity, notwithstanding lingering uncertainty over rolling-stock upgrades.',
        'While proponents frame sleeper cabins as an economical alternative to short-stay hotels near airports, sceptics note that modal shift from private cars depends on punctuality improvements that have yet to be demonstrated across the wider network.',
        'Subsequent tenders for additional routes are likely to hinge on patronage data collected during the inaugural summer season, when operators will test dynamic pricing models aimed at filling off-peak capacity.',
      ],
      vocabulary: [
        {
          term: 'reinstatement',
          meaning: 'the act of bringing something back',
          pronunciation: 'ree-in-state-ment',
          example: 'Reinstatement of services was announced.',
        },
        {
          term: 'patronage',
          meaning: 'the number of people using a service',
          pronunciation: 'pa-tron-ij',
          example: 'Patronage data will guide expansion.',
        },
        {
          term: 'modal shift',
          meaning: 'a change from one transport type to another',
          pronunciation: 'moh-dal shift',
          example: 'Analysts debate whether modal shift will occur.',
        },
      ],
    },
  }),
  bundle('food-waste', 'Restaurants Share Leftover Food With Students', 'Environment', 'coral', {
    A1: {
      title: 'Restaurants Share Leftover Food With Students',
      deck: 'Very simple sentences about food and students.',
      minutes: 4,
      listening: 'Slow voice',
      video: 'Interview',
      paragraphs: [
        'Some restaurants give extra food to students at night. The food is safe and fresh.',
        'Students get dinner for a low price. Volunteers bring the food to the university.',
        'An app shows how many meals are free each day. Owners say the plan is easy.',
      ],
      vocabulary: [
        {
          term: 'food',
          meaning: 'something people eat',
          pronunciation: 'food',
          example: 'The food is fresh.',
        },
        {
          term: 'student',
          meaning: 'a person who studies at school or university',
          pronunciation: 'stu-dent',
          example: 'Students get dinner.',
        },
        {
          term: 'app',
          meaning: 'a program on a phone',
          pronunciation: 'ap',
          example: 'An app shows free meals.',
        },
      ],
    },
    A2: {
      title: 'Restaurants Share Leftover Food With Students',
      deck: 'Everyday vocabulary about sharing meals.',
      minutes: 5,
      listening: 'Clear voice',
      video: 'Interview',
      paragraphs: [
        'Several restaurants now give unsold meals to university students in the evening.',
        'The meals are still safe to eat. Volunteers pick them up and take them to campus.',
        'Restaurant owners use an app to show how many portions are available each night.',
      ],
      vocabulary: [
        {
          term: 'unsold',
          meaning: 'not bought by customers',
          pronunciation: 'un-sold',
          example: 'Unsold meals go to students.',
        },
        {
          term: 'volunteer',
          meaning: 'a person who helps without pay',
          pronunciation: 'vol-un-teer',
          example: 'Volunteers pick up the meals.',
        },
        {
          term: 'portion',
          meaning: 'an amount of food for one person',
          pronunciation: 'por-shun',
          example: 'The app lists available portions.',
        },
      ],
    },
    B1: {
      title: 'Restaurants Share Leftover Food With Students',
      deck: 'Intermediate article with cause and effect language.',
      minutes: 7,
      listening: 'News voice',
      video: 'Interview',
      paragraphs: [
        'Several restaurants have started a program that gives unsold meals to university students at the end of the day.',
        'The project reduces food waste and supports students who need affordable dinners. Volunteers collect the meals and deliver them to campus centers.',
        'Restaurant owners say the system is simple because an app shows how many portions are available each evening.',
      ],
      vocabulary: [
        {
          term: 'leftover',
          meaning: 'food that remains after a meal or sale',
          pronunciation: 'left-oh-ver',
          example: 'The restaurant shared leftover meals.',
        },
        {
          term: 'affordable',
          meaning: 'not too expensive',
          pronunciation: 'a-for-da-ble',
          example: 'Students need affordable dinners.',
        },
        {
          term: 'portion',
          meaning: 'an amount of food for one person',
          pronunciation: 'por-shun',
          example: 'The app shows available portions.',
        },
      ],
    },
    B2: {
      title: 'Restaurants Share Leftover Food With Students',
      deck: 'Evaluating a food-waste partnership model.',
      minutes: 8,
      listening: 'News voice',
      video: 'Interview',
      paragraphs: [
        'A growing coalition of restaurants has partnered with student groups to redistribute unsold meals that would otherwise be discarded, provided hygiene checks are completed within strict time windows.',
        'Advocates claim the arrangement tackles both food insecurity and landfill emissions, although some chefs worry that unpredictable demand makes forecasting kitchen orders more difficult.',
        'The coordinating app, which logs real-time inventory, has been credited with reducing coordination costs, yet organisers acknowledge that scaling beyond the pilot district will require additional refrigerated transport.',
      ],
      vocabulary: [
        {
          term: 'redistribute',
          meaning: 'to share something again in a new way',
          pronunciation: 'ree-dis-trib-yoot',
          example: 'Volunteers redistribute unsold meals.',
        },
        {
          term: 'landfill',
          meaning: 'a place where rubbish is buried',
          pronunciation: 'land-fill',
          example: 'The program cuts landfill waste.',
        },
        {
          term: 'hygiene',
          meaning: 'clean conditions that keep food safe',
          pronunciation: 'hy-jeen',
          example: 'Hygiene checks must be completed.',
        },
      ],
    },
    C1: {
      title: 'Restaurants Share Leftover Food With Students',
      deck: 'Systems thinking around surplus food redistribution.',
      minutes: 9,
      listening: 'Full speed',
      video: 'Interview',
      paragraphs: [
        'An expanding network of eateries and campus charities has formalised the redistribution of same-day surplus meals, a practice proponents describe as a pragmatic intersection of waste reduction and student welfare policy.',
        'While early impact assessments cite measurable declines in organic refuse sent to landfill, critics caution that reliance on voluntary pickups may obscure the need for municipal investment in cold-chain logistics.',
        'The digital platform underpinning the initiative aggregates portion counts in near real time; however, legal advisers stress that liability frameworks must be clarified before the model is replicated across jurisdictions with differing food-safety statutes.',
      ],
      vocabulary: [
        {
          term: 'surplus',
          meaning: 'more than what is needed',
          pronunciation: 'sur-plus',
          example: 'Surplus meals are logged in the app.',
        },
        {
          term: 'cold-chain',
          meaning: 'temperature-controlled transport for fresh goods',
          pronunciation: 'kold chayn',
          example: 'Cold-chain logistics remain limited.',
        },
        {
          term: 'jurisdiction',
          meaning: 'an area where particular laws apply',
          pronunciation: 'joor-is-dik-shun',
          example: 'Laws differ across jurisdictions.',
        },
      ],
    },
  }),
  bundle('ai-museum', 'Museums Use AI Guides to Personalize Visits', 'Culture', 'violet', {
    A1: {
      title: 'Museums Use AI Guides to Personalize Visits',
      deck: 'Simple technology words in the museum.',
      minutes: 4,
      listening: 'Slow voice',
      video: 'Gallery tour',
      paragraphs: [
        'Some museums test AI guides on phones. The guide changes words for each visitor.',
        'Children get short texts. Experts get longer history stories. Staff check all texts first.',
        'Visitors like the guide when they ask questions. Some people still want human guides for feelings and local stories.',
      ],
      vocabulary: [
        {
          term: 'museum',
          meaning: 'a building that shows art or history',
          pronunciation: 'myoo-zee-um',
          example: 'We visited the museum.',
        },
        {
          term: 'guide',
          meaning: 'someone or something that helps you learn',
          pronunciation: 'gyd',
          example: 'The AI guide answers questions.',
        },
        {
          term: 'visitor',
          meaning: 'a person who goes to see a place',
          pronunciation: 'viz-i-tor',
          example: 'Visitors use phones in the gallery.',
        },
      ],
    },
    A2: {
      title: 'Museums Use AI Guides to Personalize Visits',
      deck: 'Technology in everyday museum visits.',
      minutes: 5,
      listening: 'Clear voice',
      video: 'Gallery tour',
      paragraphs: [
        'A group of museums is testing AI guides on mobile phones. The guide can change explanations for each visitor.',
        'It gives shorter texts to children and longer history notes to adults who want more detail.',
        'Curators check every script before visitors hear it. Many guests like asking follow-up questions, but some still prefer human staff for emotional stories.',
      ],
      vocabulary: [
        {
          term: 'mobile',
          meaning: 'able to move or used on a phone',
          pronunciation: 'moh-bile',
          example: 'The guide works on mobile phones.',
        },
        {
          term: 'script',
          meaning: 'the written words someone will say',
          pronunciation: 'skript',
          example: 'Curators check every script.',
        },
        {
          term: 'detail',
          meaning: 'a small specific fact',
          pronunciation: 'dee-tayl',
          example: 'Adults can read more detail.',
        },
      ],
    },
    B1: {
      title: 'Museums Use AI Guides to Personalize Visits',
      deck: 'How museums adapt explanations with AI.',
      minutes: 7,
      listening: 'News voice',
      video: 'Gallery tour',
      paragraphs: [
        'Several museums are piloting AI audio guides that adjust vocabulary and sentence length depending on a visitor’s profile.',
        'The system can simplify descriptions for younger guests or add historical context for enthusiasts, although curators still approve each script before it is published.',
        'Early feedback suggests the guides are helpful for follow-up questions, yet many visitors value human docents when stories require local emotion and personal memory.',
      ],
      vocabulary: [
        {
          term: 'pilot',
          meaning: 'to test something in a small way first',
          pronunciation: 'py-lot',
          example: 'Museums are piloting AI guides.',
        },
        {
          term: 'profile',
          meaning: 'information about a person’s interests or level',
          pronunciation: 'proh-fyle',
          example: 'The guide reads your profile.',
        },
        {
          term: 'docent',
          meaning: 'a museum guide who explains exhibits',
          pronunciation: 'doh-sent',
          example: 'Human docents share local stories.',
        },
      ],
    },
    B2: {
      title: 'Museums Use AI Guides to Personalize Visits',
      deck: 'Longer clauses, contrast, and technology vocabulary.',
      minutes: 8,
      listening: 'News voice',
      video: 'Gallery tour',
      paragraphs: [
        'A group of museums is testing AI guides that adapt explanations to each visitor. The guide can simplify a painting description for children or provide deeper historical context for specialists.',
        'Curators believe the technology may make collections more accessible, although they still review every script before it reaches the public.',
        'Early visitors say the guides feel useful when they ask follow-up questions, but some prefer human staff for emotional stories and local details.',
      ],
      vocabulary: [
        {
          term: 'adapt',
          meaning: 'to change something for a situation',
          pronunciation: 'a-dapt',
          example: 'The guide can adapt explanations.',
        },
        {
          term: 'curator',
          meaning: 'a person who manages a museum collection',
          pronunciation: 'kyur-ay-ter',
          example: 'Curators review every script.',
        },
        {
          term: 'accessible',
          meaning: 'easy for people to use or understand',
          pronunciation: 'ak-ses-i-ble',
          example: 'The tool makes collections accessible.',
        },
      ],
    },
    C1: {
      title: 'Museums Use AI Guides to Personalize Visits',
      deck: 'Curatorial ethics and interpretive technology.',
      minutes: 9,
      listening: 'Full speed',
      video: 'Gallery tour',
      paragraphs: [
        'A consortium of institutions is experimenting with generative interpretation layers that tailor lexical density and narrative depth to inferred visitor expertise, a trend curators describe as promising yet epistemically fraught.',
        'Although algorithmic personalisation could democratise access to specialist commentary, oversight committees insist that human judgment remain the final gatekeeper lest synthetic prose introduce anachronisms or flatten contested histories.',
        'Ethnographic interviews reveal a bifurcated audience: technophile guests appreciate iterative questioning, whereas others seek embodied storytelling that algorithms, however fluent, struggle to replicate with cultural nuance.',
      ],
      vocabulary: [
        {
          term: 'interpretation',
          meaning: 'an explanation of meaning in art or history',
          pronunciation: 'in-ter-pre-tay-shun',
          example: 'Generative interpretation layers are tested.',
        },
        {
          term: 'anachronism',
          meaning: 'something placed in the wrong time period',
          pronunciation: 'a-nak-ron-iz-um',
          example: 'Editors guard against anachronisms.',
        },
        {
          term: 'nuance',
          meaning: 'a small subtle difference in meaning',
          pronunciation: 'noo-ahns',
          example: 'Human guides convey cultural nuance.',
        },
      ],
    },
  }),
  bundle('coastal-research', 'Coastal Researchers Map Microclimate Changes', 'Science', 'gold', {
    A1: {
      title: 'Coastal Researchers Map Microclimate Changes',
      deck: 'Basic science words about weather near the sea.',
      minutes: 4,
      listening: 'Slow voice',
      video: 'Research brief',
      paragraphs: [
        'Scientists study small weather areas near the coast. Neighbourhoods close together can feel different heat and wind.',
        'City plans often use big weather maps. These maps do not show local hot days or cool wind.',
        'The team wants more trees and better drains. They also plan cool rooms for very hot days.',
      ],
      vocabulary: [
        {
          term: 'weather',
          meaning: 'sun, rain, wind, and temperature outside',
          pronunciation: 'weth-er',
          example: 'Weather can change quickly.',
        },
        {
          term: 'coast',
          meaning: 'land next to the sea',
          pronunciation: 'kohst',
          example: 'They study the coast.',
        },
        {
          term: 'heat',
          meaning: 'high temperature',
          pronunciation: 'heet',
          example: 'Some streets have more heat.',
        },
      ],
    },
    A2: {
      title: 'Coastal Researchers Map Microclimate Changes',
      deck: 'Local climate differences in simple science English.',
      minutes: 5,
      listening: 'Clear voice',
      video: 'Research brief',
      paragraphs: [
        'A research team mapped small climate zones along the coast. Areas only a few kilometres apart can have different temperature and wind.',
        'Scientists say city planners often use regional forecasts that hide local conditions. Their sensors showed strong differences between neighbourhoods.',
        'The results may change tree planting, drainage plans, and the location of cooling centres on hot days.',
      ],
      vocabulary: [
        {
          term: 'sensor',
          meaning: 'a device that measures something',
          pronunciation: 'sen-sor',
          example: 'Sensors recorded local heat.',
        },
        {
          term: 'forecast',
          meaning: 'a prediction about future weather',
          pronunciation: 'for-kast',
          example: 'Regional forecasts hide local wind.',
        },
        {
          term: 'neighbourhood',
          meaning: 'a small area of a city where people live',
          pronunciation: 'nay-ber-hood',
          example: 'Neighbourhoods can feel different heat.',
        },
      ],
    },
    B1: {
      title: 'Coastal Researchers Map Microclimate Changes',
      deck: 'Linking local data to city planning decisions.',
      minutes: 7,
      listening: 'News voice',
      video: 'Research brief',
      paragraphs: [
        'Coastal researchers have published a map showing how districts only a few kilometres apart experience different temperature, humidity, and wind patterns.',
        'They argue that regional weather forecasts often hide local conditions that affect housing design and emergency planning during heat waves.',
        'Officials are now reviewing targets for tree cover, drainage spending, and the placement of public cooling centres.',
      ],
      vocabulary: [
        {
          term: 'humidity',
          meaning: 'the amount of water in the air',
          pronunciation: 'hyoo-mid-i-tee',
          example: 'Humidity varied between districts.',
        },
        {
          term: 'drainage',
          meaning: 'systems that remove rainwater',
          pronunciation: 'dray-nij',
          example: 'Drainage spending may increase.',
        },
        {
          term: 'heat wave',
          meaning: 'a period of unusually hot weather',
          pronunciation: 'heet wayv',
          example: 'Cooling centres open during heat waves.',
        },
      ],
    },
    B2: {
      title: 'Coastal Researchers Map Microclimate Changes',
      deck: 'Advanced reading with abstract nouns and reporting verbs.',
      minutes: 10,
      listening: 'News voice',
      video: 'Research brief',
      paragraphs: [
        'A coastal research team has released a detailed map showing how neighborhoods only a few kilometers apart are experiencing sharply different microclimate patterns.',
        'The scientists argue that city planners often rely on regional forecasts that conceal local heat, humidity, and wind conditions. Their sensors recorded differences large enough to influence housing design and emergency planning.',
        'The findings have prompted officials to reconsider tree coverage targets, drainage investments, and the placement of cooling centers during prolonged heat events.',
      ],
      vocabulary: [
        {
          term: 'microclimate',
          meaning: 'the climate of a small, specific area',
          pronunciation: 'my-kroh-kly-met',
          example: 'The study maps microclimate changes.',
        },
        {
          term: 'conceal',
          meaning: 'to hide or make difficult to see',
          pronunciation: 'kun-seel',
          example: 'Regional forecasts can conceal local heat.',
        },
        {
          term: 'prolonged',
          meaning: 'lasting for a long time',
          pronunciation: 'pro-longd',
          example: 'Cooling centers open during prolonged heat.',
        },
      ],
    },
    C1: {
      title: 'Coastal Researchers Map Microclimate Changes',
      deck: 'Urban resilience and high-register scientific reporting.',
      minutes: 10,
      listening: 'Full speed',
      video: 'Research brief',
      paragraphs: [
        'Interdisciplinary coastal researchers have released a high-resolution cartography of intra-urban microclimatic variance, demonstrating that proximate neighbourhoods can diverge markedly in thermal load, humidity, and aeolian exposure.',
        'The authors contend that reliance on coarse regional meteorological models systematically obscures hyperlocal risk profiles material to building-code revisions and anticipatory emergency governance during protracted thermal extremes.',
        'Policy ripples already include recalibrated urban-forestry mandates, re-prioritised stormwater infrastructure, and contested siting debates over municipal cooling shelters whose equity implications remain under peer review.',
      ],
      vocabulary: [
        {
          term: 'variance',
          meaning: 'the degree to which things differ',
          pronunciation: 'vair-ee-ans',
          example: 'The map shows microclimatic variance.',
        },
        {
          term: 'meteorological',
          meaning: 'relating to weather science',
          pronunciation: 'mee-tee-or-oh-loj-i-kal',
          example: 'Coarse meteorological models may mislead planners.',
        },
        {
          term: 'equity',
          meaning: 'fair treatment and access for all groups',
          pronunciation: 'ek-wi-tee',
          example: 'Shelter siting raises equity questions.',
        },
      ],
    },
  }),
]

export const seedStoryBundleIds = new Set(seedStoryBundles.map((item) => item.storyId))
