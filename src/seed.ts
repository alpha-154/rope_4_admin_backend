import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Load .env file manually if not in environment
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').replace(/(^["']|["']$)/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val.trim();
      }
    }
  }
}

const mongoUri =
  process.argv[2] ||
  process.env.MONGODB_URI ||
  'mongodb+srv://mrhrakib07_db_user:qBcOAhwylg341Mrt@cluster0.3dv8wky.mongodb.net/rope4?retryWrites=true&w=majority';

async function seed() {
  console.log('🚀 Connecting to MongoDB Atlas for Rope4 Seeding...');
  console.log(`📡 URI: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB Atlas successfully.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established.');
  }

  // Collections
  const orgCol = db.collection('organizations');
  const userCol = db.collection('users');
  const customerCol = db.collection('customers');
  const programCol = db.collection('programs');
  const productCol = db.collection('products');
  const stockMovementsCol = db.collection('stock_movements');
  const reviewCol = db.collection('reviews');
  const faqCol = db.collection('faqs');
  const newsCol = db.collection('news');
  const siteSettingsCol = db.collection('site_settings');
  const formDefsCol = db.collection('form_definitions');

  console.log('🌱 Starting idempotent data insertion...');

  // 1. Organization
  const orgSlug = 'rope4';
  let org = await orgCol.findOne({ slug: orgSlug });
  const orgData = {
    name: 'Rope4 Outdoor Education',
    slug: orgSlug,
    contactEmail: 'info@rope4.com',
    contactPhone: '+880 1711 767344',
    address: 'House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh',
    logo: '/images/rope4-logo.png',
    settings: {
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      defaultTaxPercent: 0,
    },
    socialLinks: {
      facebook: 'https://facebook.com/rope4outdoor',
      instagram: 'https://instagram.com/rope4outdoor',
      youtube: 'https://youtube.com/@rope4outdoor',
      linkedin: 'https://linkedin.com/company/rope4',
    },
    updatedAt: new Date(),
  };

  if (!org) {
    const res = await orgCol.insertOne({
      ...orgData,
      createdAt: new Date(),
    });
    org = { _id: res.insertedId, ...orgData };
    console.log(`✅ Organization created with ID: ${org._id}`);
  } else {
    await orgCol.updateOne({ _id: org._id }, { $set: orgData });
    console.log(`✅ Organization updated with ID: ${org._id}`);
  }

  const orgId = org._id;

  // 2. Admin & Staff Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      email: 'admin@rope4.com',
      passwordHash,
      firstName: 'Mohiuddin',
      lastName: 'Mahi',
      role: 'SUPER_ADMIN',
      organizationId: orgId,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'guide@rope4.com',
      passwordHash,
      firstName: 'Saleh',
      lastName: 'Akram',
      role: 'EDITOR',
      organizationId: orgId,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const u of users) {
    await userCol.updateOne({ email: u.email }, { $set: u }, { upsert: true });
  }
  console.log('✅ Admin and Editor staff seeded (Password: Password123!)');

  // 3. Customers
  const customerPasswordHash = await bcrypt.hash('Password123!', 10);
  const customers = [
    {
      email: 'traveler@example.com',
      passwordHash: customerPasswordHash,
      firstName: 'Tahmid',
      lastName: 'Hasan',
      phone: '+880 1711 223344',
      organizationId: orgId,
      isActive: true,
      shippingAddresses: [
        {
          id: 'addr-seed-1',
          label: 'Home',
          street: 'Flat 4B, House 12, Road 4, Dhanmondi',
          city: 'Dhaka',
          state: 'Dhaka Division',
          postalCode: '1205',
          country: 'Bangladesh',
          isDefault: true,
        },
      ],
      wishlist: [],
      totalOrders: 1,
      totalSpent: 28500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'farzana@adventure.bd',
      passwordHash: customerPasswordHash,
      firstName: 'Farzana',
      lastName: 'Rahman',
      phone: '+880 1819 556677',
      organizationId: orgId,
      isActive: true,
      shippingAddresses: [
        {
          id: 'addr-seed-2',
          label: 'Office Base',
          street: 'Level 8, Concord Tower, GEC Circle',
          city: 'Chittagong',
          state: 'Chittagong Division',
          postalCode: '4000',
          country: 'Bangladesh',
          isDefault: true,
        },
      ],
      wishlist: [],
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const c of customers) {
    await customerCol.updateOne(
      { email: c.email },
      { $set: c },
      { upsert: true },
    );
  }
  console.log('✅ Registered Customer accounts seeded');

  // 4. Six Realistic Rope4 Programs
  const programs = [
    {
      title: 'Everest Base Camp & Kala Patthar High-Altitude Trek',
      slug: 'everest-base-camp-kala-patthar',
      organizationId: orgId,
      category: 'Premium Trip',
      country: 'Nepal',
      region: 'Khumbu, Himalayas',
      difficulty: 'Challenging',
      duration: '14 Days',
      maxAltitude: '18,519 ft (5,644 m)',
      summary:
        'The iconic high-altitude pilgrimage through Sagarmatha National Park to the base of the highest summit on Earth.',
      shortDescription:
        '14-day Himalayan expedition through Namche Bazaar, Tengboche Monastery, and Gorak Shep to Everest Base Camp.',
      description: `
        <h3>The Ultimate Himalayan Pilgrimage</h3>
        <p>Stand face to face with Mount Everest (8,848m), Lhotse, Nuptse, and Ama Dablam. Led by certified Wilderness First Responders (WFR) and seasoned Sherpa sirdars, this expedition balances proper acclimatization with cultural immersion in the Khumbu valley.</p>
        <h4>Key Highlights</h4>
        <ul>
          <li>Scenic mountain flight into the world-famous Lukla airstrip (Tenzing-Hillary Airport).</li>
          <li>Two acclimatization rest days in Namche Bazaar and Dingboche with panoramic day hikes.</li>
          <li>Sunrise ascent of Kala Patthar (5,644m) for unmatched views of Everest's south face and Khumbu Icefall.</li>
          <li>Hot tea and sherpa hospitality in historic Buddhist villages.</li>
        </ul>
      `,
      price: {
        amount: 145000,
        currency: 'BDT',
        taxNote: 'per person / twin sharing',
      },
      images: [
        'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        type: 'Point',
        coordinates: [86.7303, 27.9881],
      },
      isFeatured: true,
      status: 'published',
      inclusions: [
        'Kathmandu to Lukla round-trip domestic flights and airport transfers',
        'Sagarmatha National Park permits & Khumbu Pasang Lhamu entry fees',
        'All teahouse accommodation during the trek (twin share)',
        '3 meals daily (Breakfast, Lunch, Dinner) with hot beverages on trail',
        'Certified Wilderness First Responder (WFR) trek leader & porter support (2:1 ratio)',
        'Comprehensive medical first aid kit, pulse oximeter & portable altitude chamber (PAC) access',
      ],
      exclusions: [
        'International flights to/from Kathmandu',
        'Nepal entry visa fees ($50 USD for 30 days)',
        'Travel & high-altitude emergency medical evacuation insurance (mandatory)',
        'Personal trekking gear (sleeping bag, down jacket, boots)',
        'Hot showers, device charging & bottled beverages at teahouses',
        'Staff gratuities & tips',
      ],
      eligibility: {
        minAge: 16,
        maxAge: 65,
        fitnessLevel:
          'High endurance: ability to hike 6-8 hours daily with a 6kg daypack.',
        medicalRequirements:
          'No uncontrolled cardiac, pulmonary, or severe hypertensive conditions.',
      },
      departures: [
        {
          id: 'dep-ebc-1',
          startDate: '2026-10-15',
          endDate: '2026-10-28',
          totalSeats: 12,
          availableSeats: 4,
          priceOverride: 145000,
          status: 'filling-fast',
        },
        {
          id: 'dep-ebc-2',
          startDate: '2026-11-05',
          endDate: '2026-11-18',
          totalSeats: 12,
          availableSeats: 8,
          priceOverride: 145000,
          status: 'available',
        },
        {
          id: 'dep-ebc-3',
          startDate: '2027-03-20',
          endDate: '2027-04-02',
          totalSeats: 12,
          availableSeats: 12,
          priceOverride: 150000,
          status: 'available',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Flight Kathmandu to Lukla & Trek to Phakding',
          description:
            'Scenic flight into Lukla (2,840m), meet porters, and follow Dudh Koshi river down to Phakding.',
          altitude: '2,610 m',
          distance: '8 km (3-4 hrs)',
          stay: 'Teahouse Lodge',
        },
        {
          day: 2,
          title: 'Trek Phakding to Namche Bazaar',
          description:
            'Cross high suspension bridges draped in prayer flags, enter Sagarmatha National Park, and climb up to the bustling Sherpa capital.',
          altitude: '3,440 m',
          distance: '11 km (6 hrs)',
          stay: 'Namche Teahouse',
        },
        {
          day: 3,
          title: 'Acclimatization Day in Namche Bazaar',
          description:
            'Hike up to Everest View Hotel for the first panoramic look at Everest and Ama Dablam; visit the Sherpa Culture Museum.',
          altitude: '3,880 m',
          distance: '5 km (4 hrs)',
          stay: 'Namche Teahouse',
        },
        {
          day: 4,
          title: 'Trek Namche Bazaar to Tengboche',
          description:
            'Trail winds along ridge before descending to Phunki Thenga and climbing through rhododendron forests to famous Tengboche Monastery.',
          altitude: '3,860 m',
          distance: '10 km (5 hrs)',
          stay: 'Tengboche Lodge',
        },
        {
          day: 5,
          title: 'Trek Tengboche to Dingboche',
          description:
            'Drop through birch forest to Pangboche and ascend alpine scrub plains surrounded by dramatic peaks into Dingboche.',
          altitude: '4,410 m',
          distance: '11 km (5-6 hrs)',
          stay: 'Dingboche Lodge',
        },
        {
          day: 6,
          title: 'Acclimatization Hike to Nagarjun Hill',
          description:
            'Ascend steep ridges above Dingboche to 5,050m for crucial red blood cell stimulation and views of Makalu.',
          altitude: '5,050 m',
          distance: '6 km (4-5 hrs)',
          stay: 'Dingboche Lodge',
        },
        {
          day: 7,
          title: 'Trek Dingboche to Lobuche',
          description:
            'Ascend past the memorial chortens at Thokla Pass dedicated to fallen climbers, then follow the moraine of the Khumbu Glacier to Lobuche.',
          altitude: '4,940 m',
          distance: '9 km (5 hrs)',
          stay: 'Lobuche Teahouse',
        },
        {
          day: 8,
          title: 'Lobuche to Gorak Shep & Hike to Everest Base Camp',
          description:
            'Early trek along rugged glacier to Gorak Shep, lunch, then push to Everest Base Camp (5,364m) right next to the Khumbu Icefall.',
          altitude: '5,364 m',
          distance: '13 km (7-8 hrs)',
          stay: 'Gorak Shep Lodge',
        },
        {
          day: 9,
          title: 'Sunrise Ascent of Kala Patthar & Descent to Pheriche',
          description:
            'Pre-dawn climb to Kala Patthar summit (5,644m) for unforgettable sunrise over Everest, then descend to Pheriche.',
          altitude: '4,240 m',
          distance: '14 km (7 hrs)',
          stay: 'Pheriche Lodge',
        },
        {
          day: 10,
          title: 'Trek Pheriche to Namche Bazaar',
          description:
            'Descend through Tengboche and hillside forest paths back into the warm comfort and bakeries of Namche Bazaar.',
          altitude: '3,440 m',
          distance: '14 km (6 hrs)',
          stay: 'Namche Teahouse',
        },
        {
          day: 11,
          title: 'Trek Namche Bazaar to Lukla',
          description:
            'Final day on trail descending beside the Dudh Koshi, crossing the Hillary bridge, and celebrating with staff in Lukla.',
          altitude: '2,840 m',
          distance: '18 km (7 hrs)',
          stay: 'Lukla Guest House',
        },
        {
          day: 12,
          title: 'Flight Lukla to Kathmandu',
          description:
            'Early morning flight back to Kathmandu. Transfer to hotel for long showers and celebratory dinner.',
          altitude: '1,400 m',
          distance: 'Flight (35 mins)',
          stay: 'Hotel in Kathmandu',
        },
        {
          day: 13,
          title: 'Contingency & Kathmandu Exploration Day',
          description:
            'Buffer day in case of Lukla weather delays. Optional city sightseeing at Swayambhunath and Thamel gear shopping.',
          altitude: '1,400 m',
          distance: 'Local',
          stay: 'Hotel in Kathmandu',
        },
        {
          day: 14,
          title: 'Final Departure',
          description:
            'Airport transfer for your journey home with memories of a lifetime.',
          altitude: '1,400 m',
          distance: 'N/A',
          stay: 'Departure',
        },
      ],
      seo: {
        metaTitle: 'Everest Base Camp Trek 2026/2027 | Rope4 Outdoor Education',
        metaDescription:
          'Join Rope4 certified expedition guides on the 14-day Everest Base Camp and Kala Patthar trek. Complete safety, small groups, and expert Sherpa logistics.',
      },
    },
    {
      title: 'Annapurna Circuit & Thorong La Pass Expedition',
      slug: 'annapurna-circuit-thorong-la-pass',
      organizationId: orgId,
      category: 'Premium Trip',
      country: 'Nepal',
      region: 'Annapurna Conservation Area',
      difficulty: 'Extreme',
      duration: '16 Days',
      maxAltitude: '17,769 ft (5,416 m)',
      summary:
        'Traverse from lush subtropical river valleys over the colossal Thorong La mountain pass to the arid Tibetan plateau.',
      shortDescription:
        '16-day grand traverse across the Annapurna massif crossing Thorong La Pass (5,416m) and sacred Muktinath.',
      description:
        'The world-renowned complete circuit through Gurung villages, pine forests, high-altitude desert lakes, and the colossal Thorong La pass.',
      price: { amount: 125000, currency: 'BDT', taxNote: 'per person' },
      images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?q=80&w=1200&auto=format&fit=crop',
      ],
      location: { type: 'Point', coordinates: [83.9856, 28.5355] },
      isFeatured: true,
      status: 'published',
      inclusions: [
        'ACAP & TIMS permits',
        'Pokhara/Kathmandu transfers and local mountain jeeps',
        'Teahouse accommodation across the circuit',
        '3 meals daily on trek',
        'Certified high-altitude guide & porters',
      ],
      exclusions: [
        'International flights',
        'Emergency helicopter evacuation insurance',
        'Personal gear',
      ],
      eligibility: {
        minAge: 18,
        maxAge: 60,
        fitnessLevel: 'Extreme physical condition required.',
      },
      departures: [
        {
          id: 'dep-ac-1',
          startDate: '2026-10-20',
          endDate: '2026-11-04',
          totalSeats: 10,
          availableSeats: 3,
          status: 'filling-fast',
        },
        {
          id: 'dep-ac-2',
          startDate: '2026-11-12',
          endDate: '2026-11-27',
          totalSeats: 10,
          availableSeats: 7,
          status: 'available',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Drive Kathmandu to Besisahar & Chame',
          description: 'Long scenic drive along Marshyangdi valley.',
          altitude: '2,670 m',
          distance: 'Drive',
          stay: 'Lodge',
        },
        {
          day: 2,
          title: 'Trek Chame to Pisang',
          description:
            'Walk through pine forests with views of Pisang Peak and Annapurna II.',
          altitude: '3,200 m',
          distance: '14 km (5 hrs)',
          stay: 'Lodge',
        },
        {
          day: 3,
          title: 'Pisang to Manang via Upper Route',
          description: 'Spectacular views from Upper Pisang and Braga.',
          altitude: '3,540 m',
          distance: '16 km (6 hrs)',
          stay: 'Lodge',
        },
        {
          day: 4,
          title: 'Acclimatization Day in Manang',
          description: 'Side hike to Gangapurna Lake and Ice Lake.',
          altitude: '3,540 m',
          distance: 'Day hike',
          stay: 'Lodge',
        },
        {
          day: 5,
          title: 'Manang to Yak Kharka',
          description: 'Cross alpine grasslands inhabited by blue sheep.',
          altitude: '4,050 m',
          distance: '10 km (4 hrs)',
          stay: 'Lodge',
        },
        {
          day: 6,
          title: 'Yak Kharka to Thorong Phedi / High Camp',
          description: 'Final approach to the foot of the giant pass.',
          altitude: '4,850 m',
          distance: '8 km (4 hrs)',
          stay: 'Lodge',
        },
        {
          day: 7,
          title: 'Crossing Thorong La Pass (5,416m) to Muktinath',
          description:
            '3:00 AM start over the highest point of the circuit down to sacred temples.',
          altitude: '5,416 m',
          distance: '15 km (8-9 hrs)',
          stay: 'Lodge',
        },
        {
          day: 8,
          title: 'Muktinath to Jomsom & Return via Pokhara',
          description: 'Follow Kali Gandaki gorge to Jomsom airstrip.',
          altitude: '2,720 m',
          distance: 'Vehicle',
          stay: 'Hotel',
        },
      ],
      seo: {
        metaTitle: 'Annapurna Circuit Trek | Rope4 Nepal Expeditions',
        metaDescription:
          'Conquer Thorong La Pass with Rope4 certified mountaineering guides.',
      },
    },
    {
      title: 'Keokradong & Nafakhum Wilderness Expedition',
      slug: 'keokradong-nafakhum-wilderness',
      organizationId: orgId,
      category: 'Family With Kids',
      country: 'Bangladesh',
      region: 'Bandarban Hill Tracts',
      difficulty: 'Moderate',
      duration: '4 Days',
      maxAltitude: '3,172 ft (967 m)',
      summary:
        'Explore the highest accessible peaks of Bangladesh, lush bamboo valleys, and the country’s grandest waterfall.',
      shortDescription:
        '4-day scenic trek through Boga Lake, Keokradong peak, and the hidden cascades of Nafakhum in Remakri.',
      description:
        'The definitive adventure in the Chittagong Hill Tracts. Experience indigenous Bawm and Marma village cultures while ascending Keokradong.',
      price: {
        amount: 14500,
        currency: 'BDT',
        taxNote: 'all inclusive from Dhaka',
      },
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200&auto=format&fit=crop',
      ],
      location: { type: 'Point', coordinates: [92.3333, 21.95] },
      isFeatured: true,
      status: 'published',
      inclusions: [
        'Round-trip AC bus tickets from Dhaka to Bandarban',
        'Reserved 4WD Chander Gari transport in hill tracts',
        'Indigenous wooden cottage stay at Boga Lake and Keokradong summit',
        'All meals featuring organic hill cuisine',
        'Certified Rope4 trip leader & local indigenous guides',
        'Administration security clearance & Army checkpost permits',
      ],
      exclusions: [
        'Personal snacks & soft drinks',
        'Tips for drivers and porters',
      ],
      eligibility: {
        minAge: 8,
        maxAge: 65,
        fitnessLevel:
          'Moderate: capable of walking 4-6 hours with elevation gain.',
      },
      departures: [
        {
          id: 'dep-keo-1',
          startDate: '2026-11-20',
          endDate: '2026-11-23',
          totalSeats: 16,
          availableSeats: 5,
          status: 'filling-fast',
        },
        {
          id: 'dep-keo-2',
          startDate: '2026-12-04',
          endDate: '2026-12-07',
          totalSeats: 16,
          availableSeats: 12,
          status: 'available',
        },
        {
          id: 'dep-keo-3',
          startDate: '2026-12-24',
          endDate: '2026-12-27',
          totalSeats: 16,
          availableSeats: 2,
          status: 'almost-full',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Dhaka to Bandarban & Chander Gari to Ruma',
          description:
            'Overnight bus arrival, breakfast, Chander Gari drive through winding hills to Ruma Bazar and on to mysterious Boga Lake.',
          altitude: '1,200 ft',
          distance: 'Vehicle + 2 km walk',
          stay: 'Bawm Indigenous Cottage',
        },
        {
          day: 2,
          title: 'Ascent to Keokradong Peak via Darjeeling Para',
          description:
            'Early morning hike past clear springs and cloud-capped Darjeeling Para village, reaching the windy Keokradong summit.',
          altitude: '3,172 ft',
          distance: '10 km (4-5 hrs)',
          stay: 'Summit Cottage',
        },
        {
          day: 3,
          title: 'Keokradong to Thanchi & Boat to Remakri',
          description:
            'Descent through pristine rainforest down to Thanchi, board wooden engine boat cruising Sangu river canyons to Remakri.',
          altitude: '500 ft',
          distance: 'Trek + 2 hr boat',
          stay: 'Remakri Marma Village',
        },
        {
          day: 4,
          title: 'Trek to Nafakhum Falls & Return to Dhaka',
          description:
            'Trek along rocky riverbed to the roaring Nafakhum falls, swim, return to Thanchi, and catch night coach to Dhaka.',
          altitude: '300 ft',
          distance: '8 km trek',
          stay: 'Overnight Coach',
        },
      ],
      seo: {
        metaTitle: 'Keokradong Trek & Nafakhum Tour | Rope4 Bandarban',
        metaDescription:
          'Join Rope4 for a safe, expertly guided trek to Keokradong and Nafakhum falls.',
      },
    },
    {
      title: 'Saka Haphong (Mowdok Mual) Remote Summit Trek',
      slug: 'saka-haphong-remote-summit-trek',
      organizationId: orgId,
      category: 'Premium Trip',
      country: 'Bangladesh',
      region: 'Thanchi, Bandarban',
      difficulty: 'Challenging',
      duration: '5 Days',
      maxAltitude: '3,451 ft (1,052 m)',
      summary:
        'Expedition to the undisputed highest peak in Bangladesh on the border with Myanmar through untouched jungle trails.',
      shortDescription:
        '5-day deep wilderness expedition to the summit of Saka Haphong (1,052m) through remote indigenous settlements.',
      description:
        'For experienced trekkers who wish to explore the wildest, least-trodden corner of Bangladesh. Deep river canyoning, pristine canopies, and border ridges.',
      price: {
        amount: 18500,
        currency: 'BDT',
        taxNote: 'per person / small expedition squad',
      },
      images: [
        'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?q=80&w=1200&auto=format&fit=crop',
      ],
      location: { type: 'Point', coordinates: [92.6075, 21.7867] },
      isFeatured: false,
      status: 'published',
      inclusions: [
        'All transport from Dhaka to Thanchi and Sangu boat transfers',
        'Rope4 expedition leader, indigenous Tripura guides, and camp cook',
        'All field meals, high-energy rations, and water filtration',
        'Expedition tents and sleeping mats',
      ],
      exclusions: ['Personal trekking gear', 'Personal porter services'],
      eligibility: {
        minAge: 18,
        maxAge: 55,
        fitnessLevel:
          'High: prior multi-day trekking experience in humid jungle terrain.',
      },
      departures: [
        {
          id: 'dep-saka-1',
          startDate: '2026-11-26',
          endDate: '2026-11-30',
          totalSeats: 8,
          availableSeats: 2,
          status: 'almost-full',
        },
        {
          id: 'dep-saka-2',
          startDate: '2027-01-14',
          endDate: '2027-01-18',
          totalSeats: 8,
          availableSeats: 8,
          status: 'available',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Dhaka to Thanchi & Boat to Remakri',
          description:
            'Reach Thanchi Bazar, complete BGB checkpost formalities, and boat up to Remakri.',
          altitude: '500 ft',
          distance: 'Vehicle + Boat',
          stay: 'Remakri',
        },
        {
          day: 2,
          title: 'Remakri to Durgam Para',
          description:
            'Follow Remakri khal upstream through dense bamboo groves into remote Tripura para.',
          altitude: '1,500 ft',
          distance: '16 km (7 hrs)',
          stay: 'Village Hut',
        },
        {
          day: 3,
          title: 'Summit Push: Saka Haphong & Return to Base',
          description:
            'Ascend steep untracked mountain ridges to the border pillar marker of Saka Haphong (1,052m).',
          altitude: '3,451 ft',
          distance: '14 km (8 hrs)',
          stay: 'Village Hut',
        },
        {
          day: 4,
          title: 'Trek Back to Remakri',
          description:
            'Descent along stream beds and natural rock formations back to Remakri.',
          altitude: '500 ft',
          distance: '16 km (6 hrs)',
          stay: 'Remakri',
        },
        {
          day: 5,
          title: 'Boat to Thanchi & Return to Dhaka',
          description:
            'Morning boat downstream to Thanchi, lunch, and return coach to Dhaka.',
          altitude: 'Sea Level',
          distance: 'Transit',
          stay: 'Home',
        },
      ],
      seo: {
        metaTitle: 'Saka Haphong Expedition | Rope4 Bangladesh',
        metaDescription:
          'Summitting the highest peak of Bangladesh with Rope4 wilderness experts.',
      },
    },
    {
      title: 'Youth Alpine & Wilderness Survival Summer Camp',
      slug: 'youth-alpine-wilderness-survival-camp',
      organizationId: orgId,
      category: 'Summer Camp',
      country: 'Bangladesh',
      region: 'Sitakunda Eco Park & Chandranath Ridge',
      difficulty: 'Easy',
      duration: '3 Days',
      maxAltitude: '1,150 ft (350 m)',
      summary:
        'Empowering children and youth with essential outdoor skills, knots, tent pitching, navigation, and leave-no-trace ethics.',
      shortDescription:
        '3-day foundational wilderness camp for youth aged 10-17 with expert scouts and certified instructors.',
      description:
        'Hands-on experiential learning in nature. Campers build self-reliance, leadership, outdoor cooking abilities, and campfire camaraderie.',
      price: { amount: 9500, currency: 'BDT', taxNote: 'all inclusive' },
      images: [
        'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1200&auto=format&fit=crop',
      ],
      location: { type: 'Point', coordinates: [91.6667, 22.6167] },
      isFeatured: false,
      status: 'published',
      inclusions: [
        'Dedicated campsite with 24/7 security and certified camp counselors (1:4 ratio)',
        'All camping equipment (tents, mats, stoves, compasses)',
        'Nutritious meals & hydration packs',
        'Survival handbook, certificate of completion & official Rope4 scout badge',
      ],
      exclusions: ['Personal sleeping bag or sheet', 'Personal clothing'],
      eligibility: {
        minAge: 10,
        maxAge: 17,
        fitnessLevel: 'Beginner friendly: eagerness to learn outdoors.',
      },
      departures: [
        {
          id: 'dep-youth-1',
          startDate: '2026-12-18',
          endDate: '2026-12-20',
          totalSeats: 20,
          availableSeats: 11,
          status: 'available',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arrival, Camp Setup & Knots Masterclass',
          description:
            'Campers arrive, pitch their own two-person tents, and master the 8 foundational climbing knots.',
          altitude: '200 ft',
          distance: 'Camp',
          stay: 'Rope4 Basecamp Tents',
        },
        {
          day: 2,
          title: 'Map & Compass Navigation & Stream Crossing',
          description:
            'Orienting by compass, finding bearings without GPS, and safe team river crossing drills.',
          altitude: '800 ft',
          distance: '5 km hike',
          stay: 'Rope4 Basecamp Tents',
        },
        {
          day: 3,
          title: 'Chandranath Ridge Sunrise Hike & Graduation',
          description:
            'Early summit hike up Chandranath hill, certificate award ceremony, and return to Dhaka.',
          altitude: '1,150 ft',
          distance: '4 km hike',
          stay: 'Departure',
        },
      ],
      seo: {
        metaTitle: 'Youth Wilderness Summer Camp | Rope4 Education',
        metaDescription:
          'Outdoor scout skills, camping, and wilderness education for youth.',
      },
    },
    {
      title: 'Certified Basic Mountaineering & Rope Rigging Course',
      slug: 'certified-basic-mountaineering-rigging-course',
      organizationId: orgId,
      category: 'Learning Program',
      country: 'Bangladesh',
      region: 'Dhaka & Sylhet',
      difficulty: 'Moderate',
      duration: '6 Days',
      maxAltitude: '500 ft (150 m)',
      summary:
        'Comprehensive classroom and crag practical training covering anchor building, rappelling, ascending, and crevasse rescue simulations.',
      shortDescription:
        '6-day certified technical course for aspiring mountaineers, trek leaders, and high-angle rescue operators.',
      description:
        'Endorsed by international alpine guidelines. Led by summiters of Himalayan 7,000m and 8,000m peaks.',
      price: {
        amount: 22000,
        currency: 'BDT',
        taxNote: 'includes gear rental and certification exam',
      },
      images: [
        'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1563299796-b729d03a115f?q=80&w=1200&auto=format&fit=crop',
      ],
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
      isFeatured: false,
      status: 'published',
      inclusions: [
        'Full UIAA/CE certified climbing hardware usage (harness, helmet, descenders, ascenders, carabiners, dynamic ropes)',
        'Classroom theory modules at Rope4 HQ & field practicals in Sylhet rocky crags',
        'Comprehensive technical manual & logbook',
        'Official Rope4 Basic Mountaineering Certificate & Pin',
      ],
      exclusions: ['Travel to field crag site in Sylhet', 'Personal meals'],
      eligibility: {
        minAge: 18,
        maxAge: 55,
        fitnessLevel:
          'Good upper body strength and basic cardiovascular fitness.',
      },
      departures: [
        {
          id: 'dep-bmc-1',
          startDate: '2026-11-10',
          endDate: '2026-11-15',
          totalSeats: 12,
          availableSeats: 6,
          status: 'available',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Mountaineering History, Equipment & UIAA Standards',
          description:
            'Theory module at Rope4 HQ covering rope dynamics, fall factors, and gear anatomy.',
          altitude: 'Sea Level',
          distance: 'Classroom',
          stay: 'Dhaka',
        },
        {
          day: 2,
          title: 'Anchor Building & Belaying Mechanics',
          description:
            'Building equalized multi-point anchors using slings, cams, and natural rock horns.',
          altitude: 'Sea Level',
          distance: 'Practical',
          stay: 'Dhaka',
        },
        {
          day: 3,
          title: 'Transit to Crag & Top-Rope Climbing Technique',
          description:
            'Footwork, 3-point contact, body balance, and friction climbing on granite surfaces.',
          altitude: '300 ft',
          distance: 'Crag',
          stay: 'Sylhet Guesthouse',
        },
        {
          day: 4,
          title: 'Rappelling (Abseiling) & Jumar Ascending Drills',
          description:
            'Self-arrest techniques, fireman belay, and ascending fixed lines with mechanical ascenders.',
          altitude: '300 ft',
          distance: 'Crag',
          stay: 'Sylhet Guesthouse',
        },
        {
          day: 5,
          title: 'Crevasse Rescue & Hauling Systems (3:1 Z-Rig)',
          description:
            'Simulated rescue scenarios pulling fallen team members out of vertical drops.',
          altitude: '300 ft',
          distance: 'Crag',
          stay: 'Sylhet Guesthouse',
        },
        {
          day: 6,
          title: 'Practical & Written Certification Exam',
          description:
            'Timed assessment of knots, anchors, and emergency rappels followed by debrief.',
          altitude: 'Sea Level',
          distance: 'Evaluation',
          stay: 'Return to Dhaka',
        },
      ],
      seo: {
        metaTitle: 'Basic Mountaineering Course (BMC) | Rope4',
        metaDescription:
          'Learn rock climbing, rope rigging, and alpine safety from certified instructors.',
      },
    },
  ];

  for (const prog of programs) {
    await programCol.updateOne(
      { organizationId: orgId, slug: prog.slug },
      { $set: { ...prog, updatedAt: new Date() } },
      { upsert: true },
    );
  }
  console.log(
    '✅ 6 Realistic Rope4 Adventure Programs seeded with itineraries & departures',
  );

  // 5. Store Products & Inventory
  const products = [
    {
      title: 'Osprey Atmos AG 65L Expedition Rucksack',
      slug: 'osprey-atmos-ag-65l-expedition-rucksack',
      sku: 'OSP-ATMOS-65',
      category: 'Camping & Backpacking',
      brand: 'Osprey',
      shortDescription:
        'Anti-Gravity suspension backpack built for heavy high-altitude loads and week-long treks.',
      description:
        'The award-winning Atmos AG 65 features revolutionary Anti-Gravity suspension that seamlessly contours your body with breathable mesh. Includes integrated raincover and trekking pole attachments.',
      price: 28500,
      compareAtPrice: 32000,
      costPrice: 22000,
      stockQuantity: 15,
      lowStockThreshold: 3,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
      ],
      specifications: [
        { key: 'Capacity', value: '65 Litres' },
        { key: 'Weight', value: '2.18 kg' },
        { key: 'Fabric', value: '210D Nylon Dobby' },
      ],
      tags: ['backpack', 'osprey', 'expedition', 'trekking'],
      isPublished: true,
      isFeatured: true,
      rating: 4.9,
      reviewsCount: 18,
      organizationId: orgId,
      updatedAt: new Date(),
    },
    {
      title: 'Black Diamond Distance Z Trekking Poles (Pair)',
      slug: 'black-diamond-distance-z-trekking-poles',
      sku: 'BD-DIST-Z',
      category: 'Climbing Gear',
      brand: 'Black Diamond',
      shortDescription:
        'Lightweight folding aluminum poles for mountain runners and high-altitude trekkers.',
      description:
        'Features Speed Cone deployment for fast three-section setup. Lightweight EVA foam grip with moisture-wicking strap reduces knee impact on steep descents.',
      price: 12000,
      compareAtPrice: 13500,
      costPrice: 8500,
      stockQuantity: 25,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
      ],
      specifications: [
        { key: 'Weight', value: '344g (pair)' },
        { key: 'Material', value: '7075 Aluminum' },
        { key: 'Collapsed Length', value: '37 cm' },
      ],
      tags: ['poles', 'black diamond', 'ultralight', 'trekking'],
      isPublished: true,
      isFeatured: true,
      rating: 4.8,
      reviewsCount: 24,
      organizationId: orgId,
      updatedAt: new Date(),
    },
    {
      title: 'The North Face Inferno -20F Down Sleeping Bag',
      slug: 'the-north-face-inferno-down-sleeping-bag',
      sku: 'TNF-INF-20',
      category: 'Camping & Backpacking',
      brand: 'The North Face',
      shortDescription:
        '800-fill ProDown expedition sleeping bag rated to -29°C for extreme Himalayan camps.',
      description:
        'Engineered for high-altitude bivouacs. Water-resistant ProDown insulation retains loft in damp conditions with an ergonomic draft collar and generous footbox.',
      price: 36000,
      compareAtPrice: 40000,
      costPrice: 28000,
      stockQuantity: 8,
      lowStockThreshold: 2,
      images: [
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop',
      ],
      specifications: [
        { key: 'Temp Rating', value: '-20°F / -29°C' },
        { key: 'Insulation', value: '800-fill ProDown' },
        { key: 'Total Weight', value: '1.45 kg' },
      ],
      tags: ['sleeping bag', 'down', 'himalayan', 'extreme'],
      isPublished: true,
      isFeatured: true,
      rating: 5.0,
      reviewsCount: 9,
      organizationId: orgId,
      updatedAt: new Date(),
    },
    {
      title: 'Petzl Boreo Mountaineering & Climbing Helmet',
      slug: 'petzl-boreo-mountaineering-climbing-helmet',
      sku: 'PTZ-BOR-01',
      category: 'Climbing Gear',
      brand: 'Petzl',
      shortDescription:
        'Robust hybrid helmet offering enhanced lateral, front, and rear impact protection.',
      description:
        'The standard in mountaineering safety. Thick ABS shell with dual EPP/EPS foam liners. Equipped with 4 clips for headlamp mounting on alpine pre-dawn ascents.',
      price: 8500,
      compareAtPrice: 9500,
      costPrice: 6000,
      stockQuantity: 30,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=800&auto=format&fit=crop',
      ],
      specifications: [
        { key: 'Certification', value: 'CE EN 12492, UIAA' },
        { key: 'Weight', value: '295g' },
        { key: 'Head Circumference', value: '53-61 cm (M/L)' },
      ],
      tags: ['helmet', 'petzl', 'climbing', 'mountaineering'],
      isPublished: true,
      isFeatured: false,
      rating: 4.9,
      reviewsCount: 31,
      organizationId: orgId,
      updatedAt: new Date(),
    },
    {
      title: 'Scarpa Ribelle Tech 2.0 HD Waterproof Boots',
      slug: 'scarpa-ribelle-tech-waterproof-mountaineering-boots',
      sku: 'SCP-RIB-43',
      category: 'Footwear',
      brand: 'Scarpa',
      shortDescription:
        'Revolutionary ultralight semi-automatic crampon-compatible alpine mountaineering boots.',
      description:
        'Hybrid trail-runner agility meets mountaineering rigidity. Integrated elastic gaiter blocks snow and scree. Vibram Mont outsole provides extraordinary traction.',
      price: 42000,
      compareAtPrice: 46000,
      costPrice: 33000,
      stockQuantity: 10,
      lowStockThreshold: 3,
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
      ],
      specifications: [
        { key: 'Crampon Rating', value: 'Semi-Automatic (C2 / B2)' },
        { key: 'Membrane', value: 'HDry Waterproof Breathable' },
        { key: 'Outsole', value: 'Vibram Precision Tech Roll' },
      ],
      tags: ['boots', 'scarpa', 'mountaineering', 'crampons'],
      isPublished: true,
      isFeatured: true,
      rating: 4.8,
      reviewsCount: 14,
      organizationId: orgId,
      updatedAt: new Date(),
    },
    {
      title: 'MSR Hubba Hubba NX 2-Person Ultralight Tent',
      slug: 'msr-hubba-hubba-nx-2p-tent',
      sku: 'MSR-HB2-NX',
      category: 'Camping & Backpacking',
      brand: 'MSR',
      shortDescription:
        'Freestanding 3-season backpacking tent engineered to endure mountain wind and rain.',
      description:
        'Optimized symmetrical geometry and non-tapered floor provide maximum liveable space for two climbers. Easton Syclone composite poles withstand fierce mountain gusts.',
      price: 48000,
      compareAtPrice: 52000,
      costPrice: 38000,
      stockQuantity: 6,
      lowStockThreshold: 2,
      images: [
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=800&auto=format&fit=crop',
      ],
      specifications: [
        { key: 'Capacity', value: '2 Person' },
        { key: 'Packed Weight', value: '1.72 kg' },
        { key: 'Floor Area', value: '2.7 sq. m' },
      ],
      tags: ['tent', 'msr', 'ultralight', 'camping'],
      isPublished: true,
      isFeatured: false,
      rating: 5.0,
      reviewsCount: 7,
      organizationId: orgId,
      updatedAt: new Date(),
    },
  ];

  for (const prod of products) {
    const res = await productCol.findOneAndUpdate(
      { organizationId: orgId, sku: prod.sku },
      { $set: prod },
      { upsert: true, returnDocument: 'after' },
    );

    const insertedDoc = res?.value || res;
    const prodId =
      insertedDoc?._id || (await productCol.findOne({ sku: prod.sku }))?._id;

    if (prodId) {
      await stockMovementsCol.updateOne(
        { productId: prodId, reason: 'Initial seed stock adjustment' },
        {
          $set: {
            productId: prodId,
            organizationId: orgId,
            change: prod.stockQuantity,
            balanceAfter: prod.stockQuantity,
            reason: 'Initial seed stock adjustment',
            createdBy: 'System Seed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }
  }
  console.log('✅ 6 Store Products & Initial Inventory Movements seeded');

  // 6. Authentic Reviews
  const reviews = [
    {
      author: 'Tahsin Ahmed',
      rating: 5,
      date: new Date('2026-09-12'),
      text: 'Completed the Everest Base Camp trek with Rope4. Their safety protocols, oxygen checks, and acclimatization strategy made all the difference. Our Sherpa team felt like family.',
      source: 'google',
      isFeatured: true,
      status: 'approved',
      programTitle: 'Everest Base Camp & Kala Patthar High-Altitude Trek',
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      author: 'Dr. Nusrat Jahan',
      rating: 5,
      date: new Date('2026-08-20'),
      text: 'As a physician, I was deeply impressed by the medical competence of the expedition guides. Proper hydration pacing and pulse oximeter readings every morning and evening. Highly recommend!',
      source: 'google',
      isFeatured: true,
      status: 'approved',
      programTitle: 'Annapurna Circuit & Thorong La Pass Expedition',
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      author: 'Shahriar Kabir',
      rating: 5,
      date: new Date('2026-10-04'),
      text: 'Our family trek to Keokradong was seamlessly organized. The kids loved the campfire storytelling and our guide was patient and knowledgeable about local flora and traditions.',
      source: 'ambassador',
      isFeatured: true,
      status: 'approved',
      programTitle: 'Keokradong & Nafakhum Wilderness Expedition',
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      author: 'Aiman Sadiq',
      rating: 5,
      date: new Date('2026-07-15'),
      text: 'The Basic Mountaineering Course transformed how I perceive high angles. Solid knots, reliable anchor building, and safe rappelling. Rope4 is setting the benchmark for outdoor education in BD.',
      source: 'video',
      videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      isFeatured: true,
      status: 'approved',
      programTitle: 'Certified Basic Mountaineering & Rope Rigging Course',
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      author: 'Rashedul Islam',
      rating: 4,
      date: new Date('2026-09-30'),
      text: 'Purchased an Osprey Atmos 65L pack and trekking poles. Fast courier delivery inside Dhaka within 24 hours, completely authentic mountain gear.',
      source: 'google',
      isFeatured: false,
      status: 'approved',
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const rev of reviews) {
    await reviewCol.updateOne(
      {
        organizationId: orgId,
        author: rev.author,
        programTitle: rev.programTitle,
      },
      { $set: rev },
      { upsert: true },
    );
  }
  console.log('✅ Approved customer reviews and video testimonials seeded');

  // 7. FAQs with Categories
  const faqs = [
    {
      category: 'High-Altitude Preparation',
      slug: 'high-altitude-preparation',
      index: 'a0',
      isActive: true,
      organizationId: orgId,
      items: [
        {
          question:
            'What physical fitness level is required for high-altitude treks (above 4,000m)?',
          answer:
            'You should be able to jog 5 kilometers in under 35 minutes comfortably or engage in 45 minutes of stair-climbing with a 5kg backpack. Cardiovascular stamina and mental endurance are far more critical than raw muscle mass.',
        },
        {
          question:
            'How does Rope4 prevent and manage Acute Mountain Sickness (AMS)?',
          answer:
            'We design our itineraries with conservative ascent gradients (never gaining more than 500m of sleeping altitude per day above 3,000m). Guides carry portable pulse oximeters, emergency Diamox, supplemental bottled oxygen, and hyperbaric bags on high passes.',
        },
      ],
      updatedAt: new Date(),
    },
    {
      category: 'Gear & Equipment Logistics',
      slug: 'gear-equipment-logistics',
      index: 'a1',
      isActive: true,
      organizationId: orgId,
      items: [
        {
          question:
            'What equipment does Rope4 provide vs what do I need to bring?',
          answer:
            'Rope4 provides group camping tents, cooking mess kits, climbing ropes, crampons, and expedition first-aid kits. Participants are responsible for personal layering (down jacket, thermal base layers, waterproof shell), broken-in trekking boots, and a personal -10°C sleeping bag (or rental).',
        },
        {
          question:
            'Can I rent high-altitude jackets and sleeping bags from Rope4?',
          answer:
            'Yes! We maintain an expedition rental locker in Dhaka and Kathmandu with tested 800-fill down parkas and sleeping bags available for booked participants at subsidized rates.',
        },
      ],
      updatedAt: new Date(),
    },
    {
      category: 'Expedition Safety & Wilderness Medicine',
      slug: 'expedition-safety-wilderness-medicine',
      index: 'a2',
      isActive: true,
      organizationId: orgId,
      items: [
        {
          question: 'What happens in case of a medical emergency on trail?',
          answer:
            'All our lead guides are certified Wilderness First Responders (WFR). In Nepal, we are partnered with emergency helicopter evacuation teams. In Bangladesh, we maintain direct coordination with Army checkposts and local administration.',
        },
        {
          question: 'Is travel insurance mandatory for high-altitude trips?',
          answer:
            'Yes, mandatory travel insurance covering high-altitude trekking and emergency helicopter evacuation up to 6,000m is required before departure for all Himalayan expeditions.',
        },
      ],
      updatedAt: new Date(),
    },
    {
      category: 'Bookings, Payments & Policies',
      slug: 'bookings-payments-policies',
      index: 'a3',
      isActive: true,
      organizationId: orgId,
      items: [
        {
          question: 'What is the deposit requirement and cancellation policy?',
          answer:
            'A 25% deposit secures your departure slot. Full balance is due 30 days prior to departure. Cancellations made 45+ days prior receive a full refund minus administrative fees; credits can be transferred to future treks.',
        },
        {
          question: 'What payment methods are supported?',
          answer:
            'We accept bank transfers, bKash, Nagad, Cash on Delivery for store gear, and major credit cards (Visa/Mastercard).',
        },
      ],
      updatedAt: new Date(),
    },
  ];

  for (const f of faqs) {
    await faqCol.updateOne(
      { organizationId: orgId, slug: f.slug },
      { $set: f },
      { upsert: true },
    );
  }
  console.log('✅ Categorized FAQs seeded');

  // 8. News & Expedition Articles
  const articles = [
    {
      title: 'Winter Trekking in Bandarban: The Ultimate Trail Guide',
      slug: 'winter-trekking-in-bandarban-trail-guide',
      organizationId: orgId,
      type: 'article',
      status: 'published',
      publishedAt: new Date('2026-10-01'),
      cover:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      excerpt:
        'Clear blue skies, mist-shrouded valleys, and dry trails make November through February the golden window for hiking in the Chittagong Hill Tracts.',
      content:
        '<p>Winter transforms Bandarban into a trekker paradise. With low humidity and dry riverbeds, routes to Nafakhum, Amiakhum, and Saka Haphong become dramatically safer to navigate.</p><p>Key checklist items: pack lightweight quick-dry clothing, water purification tablets, and a 15°C compact sleeping bag for chilly hilltop nights at Darjeeling Para.</p>',
      author: 'Saleh Akram (Rope4 Senior Instructor)',
      tags: ['bandarban', 'trail-guide', 'winter', 'keokradong'],
      seo: {
        title: 'Winter Trekking Guide in Bandarban | Rope4',
        description:
          'Complete guide to weather, gear, and trails for Bandarban winter expeditions.',
      },
      updatedAt: new Date(),
    },
    {
      title: 'The Layering Masterclass: Surviving -15°C in the High Himalayas',
      slug: 'layering-masterclass-surviving-subzero-himalayas',
      organizationId: orgId,
      type: 'article',
      status: 'published',
      publishedAt: new Date('2026-09-18'),
      cover:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
      excerpt:
        'Why sweating is your greatest enemy above 4,000 meters and how to configure moisture-wicking base layers, fleece insulation, and hardshell armor.',
      content:
        '<p>Staying warm in the alpine is about moisture management rather than bulk. When you climb steep moraines, moisture vapor must escape your base layer immediately before it condenses and freezes against your skin during rest stops.</p>',
      author: 'Mohiuddin Mahi (Everest Summiter)',
      tags: ['gear-masterclass', 'himalayas', 'layering', 'safety'],
      seo: {
        title: 'Alpine Layering Masterclass | Rope4 Outdoor Education',
        description:
          'Learn professional mountaineering layering techniques for extreme sub-zero conditions.',
      },
      updatedAt: new Date(),
    },
    {
      title:
        'Rope4 Completes Successful 2026 Youth Wilderness Survival Expedition',
      slug: 'rope4-youth-wilderness-survival-camp-recap-2026',
      organizationId: orgId,
      type: 'update',
      status: 'published',
      publishedAt: new Date('2026-08-05'),
      cover:
        'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1200&auto=format&fit=crop',
      excerpt:
        'Twenty enthusiastic scouts and young adventurers learned rope knotting, compass orientation, and tent pitch mechanics over an unforgettable 3-day camp in Sitakunda.',
      content:
        '<p>We are proud to announce the graduation of our Summer 2026 youth cohort. Through obstacle navigation, river safety, and team leadership challenges, every participant earned their junior mountaineer badge.</p>',
      author: 'Rope4 Expedition Team',
      tags: ['youth', 'summer-camp', 'survival', 'scouts'],
      seo: {
        title: 'Youth Wilderness Survival Camp 2026 Recap | Rope4',
        description:
          'Highlights and stories from Rope4 youth summer camp cohort.',
      },
      updatedAt: new Date(),
    },
  ];

  for (const art of articles) {
    await newsCol.updateOne(
      { organizationId: orgId, slug: art.slug },
      { $set: art },
      { upsert: true },
    );
  }
  console.log('✅ 3 Rich News and Educational Articles seeded');

  // 9. Site Settings (Header & Footer)
  const siteSettings = {
    organizationId: orgId,
    header: {
      brandName: 'Rope4',
      logoUrl: '/images/rope4-logo.png',
      announcementBar: {
        enabled: true,
        text: '🏔️ Autumn 2026 Himalayan Departures are now open for booking! Limited slots available.',
        linkText: 'View Departures',
        linkUrl: '/programs?category=Premium+Trip',
      },
      hotlinePhone: '+880 1711 767344',
      hotlineEmail: 'info@rope4.com',
      navItems: [
        { label: 'All Programs', href: '/programs' },
        { label: 'Gear Store', href: '/store', badge: 'Certified' },
        { label: 'Stay Informed', href: '/news' },
        { label: 'FAQs', href: '/faqs' },
        { label: 'Contact Us', href: '/contact' },
      ],
      categories: [
        {
          label: 'Himalayan Expeditions',
          subItems: [
            {
              label: 'Everest Base Camp Trek',
              href: '/programs/everest-base-camp-kala-patthar',
              description: 'Iconic 14-day trek to EBC and Kala Patthar',
              badge: 'Popular',
            },
            {
              label: 'Annapurna Circuit',
              href: '/programs/annapurna-circuit-thorong-la-pass',
              description: 'Cross the colossal Thorong La pass',
            },
          ],
        },
        {
          label: 'Bangladesh Trails',
          subItems: [
            {
              label: 'Keokradong & Nafakhum',
              href: '/programs/keokradong-nafakhum-wilderness',
              description: 'Summit the peak and discover waterfalls',
            },
            {
              label: 'Saka Haphong Summit',
              href: '/programs/saka-haphong-remote-summit-trek',
              description: 'Expedition to the border peak',
            },
          ],
        },
        {
          label: 'Outdoor Academy',
          subItems: [
            {
              label: 'Youth Summer Camps',
              href: '/programs/youth-alpine-wilderness-survival-camp',
              description: 'Scouting and wilderness survival for kids',
            },
            {
              label: 'Basic Mountaineering Course',
              href: '/programs/certified-basic-mountaineering-rigging-course',
              description: 'Certified rock and rope rigging instruction',
            },
          ],
        },
      ],
    },
    footer: {
      aboutText:
        'Rope4 Outdoor Education is Bangladesh premier mountaineering and wilderness training institution. Certified instructors, wilderness first responders, and world-class safety standards.',
      emergencyHotline: '+880 1819 737283',
      copyright: '© 2026 Rope4 Outdoor Education. All rights reserved.',
      socialLinks: [
        { platform: 'Facebook', url: 'https://facebook.com/rope4outdoor' },
        { platform: 'Instagram', url: 'https://instagram.com/rope4outdoor' },
        { platform: 'YouTube', url: 'https://youtube.com/@rope4outdoor' },
        { platform: 'LinkedIn', url: 'https://linkedin.com/company/rope4' },
      ],
      columns: [
        {
          title: 'Adventures',
          links: [
            { label: 'Himalayan Expeditions', url: '/programs?country=Nepal' },
            { label: 'Bandarban Treks', url: '/programs?country=Bangladesh' },
            { label: 'Youth Camps', url: '/programs?category=Summer+Camp' },
            {
              label: 'Mountaineering Courses',
              url: '/programs?category=Learning+Program',
            },
          ],
        },
        {
          title: 'Gear & Equipment',
          links: [
            {
              label: 'Trekking Backpacks',
              url: '/store?category=Camping+%26+Backpacking',
            },
            {
              label: 'Climbing Hardware',
              url: '/store?category=Climbing+Gear',
            },
            { label: 'Down Sleeping Bags', url: '/store' },
            { label: 'Trekking Footwear', url: '/store?category=Footwear' },
          ],
        },
        {
          title: 'Company & Safety',
          links: [
            { label: 'About Rope4', url: '/contact' },
            { label: 'Wilderness Safety Standards', url: '/faqs' },
            { label: 'Terms of Service', url: '/contact' },
            { label: 'Customer Portal', url: '/customer/login' },
          ],
        },
      ],
    },
    updatedAt: new Date(),
  };

  await siteSettingsCol.updateOne(
    { organizationId: orgId },
    { $set: siteSettings },
    { upsert: true },
  );
  console.log('✅ Site Settings (Header navigation & Footer) seeded');

  // 10. Form Definitions (contact-us & trek-inquiry)
  const forms = [
    {
      name: 'Contact & General Inquiry',
      slug: 'contact-us',
      organizationId: orgId,
      description: 'Public contact form on the Rope4 website',
      isActive: true,
      fields: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
        },
        {
          name: 'phone',
          label: 'Phone / WhatsApp',
          type: 'tel',
          required: false,
        },
        {
          name: 'inquiryType',
          label: 'Inquiry Nature',
          type: 'select',
          required: true,
          options: [
            'Expedition Booking',
            'Gear Store & Sizing',
            'Custom Corporate Trek',
            'Media & Partnership',
            'General Inquiry',
          ],
        },
        {
          name: 'programInterest',
          label: 'Program of Interest',
          type: 'text',
          required: false,
        },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ],
      updatedAt: new Date(),
    },
    {
      name: 'Quick Trek Booking Inquiry',
      slug: 'trek-inquiry',
      organizationId: orgId,
      description: 'Quick booking modal on program detail pages',
      isActive: true,
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        {
          name: 'participants',
          label: 'Number of Travelers',
          type: 'number',
          required: true,
        },
        {
          name: 'date',
          label: 'Preferred Departure',
          type: 'text',
          required: false,
        },
        {
          name: 'message',
          label: 'Questions or Notes',
          type: 'textarea',
          required: false,
        },
      ],
      updatedAt: new Date(),
    },
  ];

  for (const form of forms) {
    await formDefsCol.updateOne(
      { organizationId: orgId, slug: form.slug },
      { $set: form },
      { upsert: true },
    );
  }
  console.log('✅ Form Definitions (contact-us and trek-inquiry) seeded');

  console.log('\n🎉 ================================================');
  console.log('   ROPE4 DATABASE SEEDING COMPLETED SUCCESSFULLY!  ');
  console.log('   - Organization: Rope4 Outdoor Education        ');
  console.log('   - SuperAdmin: admin@rope4.com (Password123!)    ');
  console.log('   - Editor: guide@rope4.com (Password123!)        ');
  console.log('   - Customer: traveler@example.com (Password123!) ');
  console.log('   - Programs: 6 active with itineraries & departures');
  console.log('   - Products: 6 active with stock movements       ');
  console.log('   - Reviews, FAQs, News & Forms configured       ');
  console.log('================================================\n');

  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB Atlas.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
