import { CategoryItem, Venue } from "@/types/venue";

export const CATEGORIES: CategoryItem[] = [
  {
    id: "cricket",
    name: "Cricket",
    iconName: "Flame",
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    description: "Box cricket & turf pitches",
  },
  {
    id: "football",
    name: "Football",
    iconName: "Shield",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10 border-blue-500/20",
    description: "5v5 & 7v7 artificial turfs",
  },
  {
    id: "private-theatre",
    name: "Private Theatre",
    iconName: "Tv",
    colorClass: "text-indigo-500",
    bgClass: "bg-indigo-500/10 border-indigo-500/20",
    description: "4K Dolby Atmos mini cinemas",
  },
  {
    id: "party-hall",
    name: "Party Hall",
    iconName: "PartyPopper",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    description: "Birthdays, anniversaries & celebrations",
  },
  {
    id: "resort",
    name: "Resorts",
    iconName: "Palmtree",
    colorClass: "text-teal-500",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    description: "Day out & weekend staycations",
  },
  {
    id: "gaming",
    name: "Gaming",
    iconName: "Gamepad2",
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    description: "PS5, Racing Simulators & PC gaming",
  },
  {
    id: "swimming",
    name: "Swimming",
    iconName: "Waves",
    colorClass: "text-sky-500",
    bgClass: "bg-sky-500/10 border-sky-500/20",
    description: "Heated pools & private splash zones",
  },
  {
    id: "badminton",
    name: "Badminton",
    iconName: "Activity",
    colorClass: "text-rose-500",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    description: "Wooden & synthetic indoor courts",
  },
  {
    id: "pickleball",
    name: "Pickleball",
    iconName: "Sparkles",
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/10 border-orange-500/20",
    description: "Fast-growing paddle sport courts",
  },
];

export const CITIES = [
  "Hyderabad",
  "Warangal",
  "Bengaluru",
  "Chennai",
  "Vijayawada",
  "Visakhapatnam",
  "Mumbai",
  "Pune",
];

export const VENUES: Venue[] = [
  {
    id: "venue-1",
    slug: "cgi-sports-arena",
    name: "CGI Sports Arena",
    tagline: "World-class FIFA approved box cricket & football turf",
    description:
      "Premium box cricket & football turfs with floodlights, professional pitch bounce, and dugout seating. Perfect for corporate tournaments, late-night matches with friends, and community leagues. Includes premium shower rooms and an open-air cafe.",
    category: "cricket",
    location: {
      address: "Survey No 45, Financial District, Gachibowli",
      neighborhood: "Gachibowli",
      city: "Hyderabad",
      distanceKm: 3.5,
      mapCoordinates: { lat: 17.4401, lng: 78.3489 },
    },
    rating: 4.8,
    reviewCount: 1240,
    startingPrice: 1200,
    priceUnit: "hour",
    isAvailableToday: true,
    isPopular: true,
    isTrending: true,
    images: [
      "https://images.unsplash.com/photo-1529900241929-54a3500d8d7a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518604666864-742395d10b7f?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { id: "turf", name: "FIFA Turf", icon: "Shield" },
      { id: "parking", name: "Free Parking", icon: "Car" },
      { id: "washrooms", name: "Washrooms", icon: "Bath" },
      { id: "cafeteria", name: "Cafeteria", icon: "Coffee" },
      { id: "changing", name: "Changing Rooms", icon: "DoorClosed" },
      { id: "cctv", name: "CCTV & Security", icon: "Camera" },
      { id: "lights", name: "LED Floodlights", icon: "Sun" },
      { id: "drinking_water", name: "RO Water", icon: "Droplet" },
    ],
    rules: [
      "Non-marking turf shoes recommended. Spikes strictly prohibited.",
      "Please arrive 10 minutes before your booked slot.",
      "Drinking & smoking are strictly prohibited inside the playing arena.",
      "Management is not responsible for lost personal belongings.",
    ],
    resources: [
      {
        id: "res-turf-1",
        name: "Box Turf #01 (Main Pitch)",
        category: "cricket",
        capacity: 16,
        basePricePerHour: 1200,
      },
      {
        id: "res-turf-2",
        name: "Box Turf #02 (Championship Pitch)",
        category: "cricket",
        capacity: 20,
        basePricePerHour: 1400,
      },
    ],
    slotsByDate: {
      "2026-09-18": [
        { id: "s1", resourceId: "res-turf-1", startTime: "06:00", endTime: "07:00", timeOfDay: "morning", price: 1000, status: "AVAILABLE" },
        { id: "s2", resourceId: "res-turf-1", startTime: "07:00", endTime: "08:00", timeOfDay: "morning", price: 1000, status: "AVAILABLE" },
        { id: "s3", resourceId: "res-turf-1", startTime: "08:00", endTime: "09:00", timeOfDay: "morning", price: 1000, status: "BOOKED" },
        { id: "s4", resourceId: "res-turf-1", startTime: "09:00", endTime: "10:00", timeOfDay: "morning", price: 1000, status: "AVAILABLE" },
        { id: "s5", resourceId: "res-turf-1", startTime: "10:00", endTime: "11:00", timeOfDay: "morning", price: 1000, status: "AVAILABLE" },
        { id: "s6", resourceId: "res-turf-1", startTime: "11:00", endTime: "12:00", timeOfDay: "morning", price: 1000, status: "BOOKED" },
        { id: "s7", resourceId: "res-turf-1", startTime: "12:00", endTime: "13:00", timeOfDay: "afternoon", price: 1200, status: "AVAILABLE" },
        { id: "s8", resourceId: "res-turf-1", startTime: "13:00", endTime: "14:00", timeOfDay: "afternoon", price: 1200, status: "AVAILABLE" },
        { id: "s9", resourceId: "res-turf-1", startTime: "14:00", endTime: "15:00", timeOfDay: "afternoon", price: 1200, status: "AVAILABLE" },
        { id: "s10", resourceId: "res-turf-1", startTime: "15:00", endTime: "16:00", timeOfDay: "afternoon", price: 1200, status: "BOOKED" },
        { id: "s11", resourceId: "res-turf-1", startTime: "17:00", endTime: "18:00", timeOfDay: "evening", price: 1500, status: "AVAILABLE" },
        { id: "s12", resourceId: "res-turf-1", startTime: "18:00", endTime: "19:00", timeOfDay: "evening", price: 1500, status: "AVAILABLE" },
        { id: "s13", resourceId: "res-turf-1", startTime: "19:00", endTime: "20:00", timeOfDay: "evening", price: 1500, status: "BOOKED" },
        { id: "s14", resourceId: "res-turf-1", startTime: "20:00", endTime: "21:00", timeOfDay: "evening", price: 1500, status: "AVAILABLE" },
        { id: "s15", resourceId: "res-turf-1", startTime: "21:00", endTime: "22:00", timeOfDay: "evening", price: 1500, status: "AVAILABLE" },
        { id: "s16", resourceId: "res-turf-1", startTime: "22:00", endTime: "23:00", timeOfDay: "evening", price: 1500, status: "BOOKED" },
      ],
      "2026-09-19": [
        { id: "s101", resourceId: "res-turf-1", startTime: "07:00", endTime: "08:00", timeOfDay: "morning", price: 1000, status: "AVAILABLE" },
        { id: "s102", resourceId: "res-turf-1", startTime: "08:00", endTime: "09:00", timeOfDay: "morning", price: 1000, status: "AVAILABLE" },
        { id: "s103", resourceId: "res-turf-1", startTime: "17:00", endTime: "18:00", timeOfDay: "evening", price: 1500, status: "AVAILABLE" },
        { id: "s104", resourceId: "res-turf-1", startTime: "18:00", endTime: "19:00", timeOfDay: "evening", price: 1500, status: "AVAILABLE" },
      ]
    },
  },
  {
    id: "venue-2",
    slug: "skyline-private-theatre",
    name: "Skyline Private Theatre",
    tagline: "4K Laser Dolby Atmos Private Cinema & Celebration Lounge",
    description:
      "Celebrate birthdays, romantic movie nights, and sports screenings in total exclusivity. Featuring plush recliner seating, 150-inch 4K HDR projection, Dolby Atmos 7.1.4 sound system, ambient LED lighting, and customized decoration packages.",
    category: "private-theatre",
    location: {
      address: "Road No 12, Above Starbucks, Banjara Hills",
      neighborhood: "Banjara Hills",
      city: "Hyderabad",
      distanceKm: 5.2,
      mapCoordinates: { lat: 17.4156, lng: 78.4358 },
    },
    rating: 4.9,
    reviewCount: 892,
    startingPrice: 1500,
    priceUnit: "hour",
    isAvailableToday: true,
    isPopular: true,
    isTrending: false,
    images: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { id: "atmos", name: "Dolby Atmos 7.1", icon: "Speaker" },
      { id: "projector", name: "4K Laser Display", icon: "Tv" },
      { id: "recliners", name: "Luxury Recliners", icon: "Armchair" },
      { id: "aircon", name: "Central AC", icon: "Wind" },
      { id: "decor", name: "Cake Cutting Area", icon: "PartyPopper" },
      { id: "parking", name: "Valet Parking", icon: "Car" },
    ],
    rules: [
      "Maximum capacity 12 guests.",
      "External cakes allowed; outside hot meals require prior notice.",
      "Please arrive 15 minutes before the booking for setup.",
    ],
    resources: [
      {
        id: "res-theatre-1",
        name: "Platinum Screen (Up to 10 Guests)",
        category: "private-theatre",
        capacity: 10,
        basePricePerHour: 1500,
      },
      {
        id: "res-theatre-2",
        name: "Diamond Screen (Up to 16 Guests)",
        category: "private-theatre",
        capacity: 16,
        basePricePerHour: 2200,
      },
    ],
    slotsByDate: {
      "2026-09-18": [
        { id: "st1", resourceId: "res-theatre-1", startTime: "10:00", endTime: "12:00", timeOfDay: "morning", price: 3000, status: "AVAILABLE" },
        { id: "st2", resourceId: "res-theatre-1", startTime: "12:30", endTime: "14:30", timeOfDay: "afternoon", price: 3000, status: "BOOKED" },
        { id: "st3", resourceId: "res-theatre-1", startTime: "15:00", endTime: "17:00", timeOfDay: "afternoon", price: 3000, status: "AVAILABLE" },
        { id: "st4", resourceId: "res-theatre-1", startTime: "18:00", endTime: "20:00", timeOfDay: "evening", price: 3600, status: "AVAILABLE" },
        { id: "st5", resourceId: "res-theatre-1", startTime: "20:30", endTime: "22:30", timeOfDay: "evening", price: 3600, status: "BOOKED" },
      ]
    },
  },
  {
    id: "venue-3",
    slug: "urban-play-zone",
    name: "Urban Play Zone & PS5 Arena",
    tagline: "Ultra-modern gaming lounge with PS5 Pro & Sim-Rigs",
    description:
      "State of the art gaming zone with 65-inch OLED displays, PlayStation 5 Pro consoles, steering wheel simulation rigs for F1 and Forza, RTX 4090 PC rigs, and ultra-fast Gigabit optical fiber.",
    category: "gaming",
    location: {
      address: "4th Floor, Mindspace Mall, Hitech City",
      neighborhood: "Hitech City",
      city: "Hyderabad",
      distanceKm: 2.1,
      mapCoordinates: { lat: 17.4474, lng: 78.3762 },
    },
    rating: 4.6,
    reviewCount: 563,
    startingPrice: 300,
    priceUnit: "hour",
    isAvailableToday: true,
    isPopular: true,
    isTrending: true,
    images: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { id: "ps5", name: "PS5 Pro Setup", icon: "Gamepad2" },
      { id: "oled", name: "4K 120Hz OLED", icon: "Tv" },
      { id: "racing", name: "Fanatec F1 Sim", icon: "Car" },
      { id: "fiber", name: "1 Gbps Fiber", icon: "Zap" },
      { id: "beverages", name: "Energy Drinks & Snacks", icon: "Coffee" },
    ],
    rules: [
      "No drinks placed directly on console tables.",
      "Controllers must be handled with care.",
    ],
    resources: [
      {
        id: "res-game-1",
        name: "PS5 Pro Station #01",
        category: "gaming",
        capacity: 4,
        basePricePerHour: 300,
      },
      {
        id: "res-game-2",
        name: "F1 Motion Simulator Rig",
        category: "gaming",
        capacity: 1,
        basePricePerHour: 600,
      },
    ],
    slotsByDate: {
      "2026-09-18": [
        { id: "sg1", resourceId: "res-game-1", startTime: "10:00", endTime: "11:00", timeOfDay: "morning", price: 300, status: "AVAILABLE" },
        { id: "sg2", resourceId: "res-game-1", startTime: "11:00", endTime: "12:00", timeOfDay: "morning", price: 300, status: "AVAILABLE" },
        { id: "sg3", resourceId: "res-game-1", startTime: "14:00", endTime: "15:00", timeOfDay: "afternoon", price: 300, status: "AVAILABLE" },
        { id: "sg4", resourceId: "res-game-1", startTime: "18:00", endTime: "19:00", timeOfDay: "evening", price: 400, status: "AVAILABLE" },
        { id: "sg5", resourceId: "res-game-1", startTime: "19:00", endTime: "20:00", timeOfDay: "evening", price: 400, status: "BOOKED" },
      ]
    },
  },
  {
    id: "venue-4",
    slug: "green-meadows-resort",
    name: "Green Meadows Luxury Villa Resort",
    tagline: "Private swimming pool, lawn & banquet for grand celebrations",
    description:
      "Sprawling 2-acre private villa featuring a private crystal-clear swimming pool, manicured banquet lawn, 4 master bedrooms, gazebo, BBQ grill, and indoor recreation area. Ideal for family staycations, birthday parties, and corporate retreats.",
    category: "resort",
    location: {
      address: "Near ORR Exit 7, Shamirpet",
      neighborhood: "Shamirpet",
      city: "Hyderabad",
      distanceKm: 18.0,
      mapCoordinates: { lat: 17.5892, lng: 78.5638 },
    },
    rating: 4.9,
    reviewCount: 421,
    startingPrice: 12000,
    priceUnit: "day",
    isAvailableToday: true,
    isPopular: true,
    isTrending: false,
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { id: "pool", name: "Private Pool", icon: "Waves" },
      { id: "lawn", name: "Large Lawn (100+ guests)", icon: "Sun" },
      { id: "kitchen", name: "Full Kitchen & BBQ", icon: "Flame" },
      { id: "sound", name: "JBL Party Sound", icon: "Speaker" },
      { id: "parking", name: "Covered Parking (10 cars)", icon: "Car" },
      { id: "rooms", name: "4 AC Bedrooms", icon: "Bed" },
    ],
    rules: [
      "Check-in 2:00 PM, Check-out 11:00 AM.",
      "Pool timing until 10:00 PM.",
      "Refundable security deposit of ₹5,000 at check-in.",
    ],
    resources: [
      {
        id: "res-resort-1",
        name: "Entire 4BHK Villa & Pool (Day/Night Stay)",
        category: "resort",
        capacity: 40,
        basePricePerHour: 12000,
      },
    ],
    slotsByDate: {
      "2026-09-18": [
        { id: "sr1", resourceId: "res-resort-1", startTime: "14:00", endTime: "11:00", timeOfDay: "morning", price: 12000, status: "AVAILABLE" }
      ]
    },
  },
  {
    id: "venue-5",
    slug: "kakatiya-grand-banquet",
    name: "Kakatiya Grand Celebration Hall",
    tagline: "Elegant indoor banquet hall with air conditioning & catering",
    description:
      "Spacious modern banquet hall designed for engagements, sangeet functions, birthday bashes, and corporate conferences. Features grand crystal chandeliers, centralized air conditioning, stage lighting, and bridal green room.",
    category: "party-hall",
    location: {
      address: "Hanamkonda Main Road, Naimnagar",
      neighborhood: "Naimnagar",
      city: "Warangal",
      distanceKm: 1.8,
      mapCoordinates: { lat: 17.9689, lng: 79.5941 },
    },
    rating: 4.7,
    reviewCount: 310,
    startingPrice: 18000,
    priceUnit: "slot",
    isAvailableToday: true,
    isPopular: false,
    isTrending: true,
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { id: "ac", name: "Central AC", icon: "Wind" },
      { id: "stage", name: "Stage & Lighting", icon: "Sun" },
      { id: "dining", name: "Dining Hall (300 Cap)", icon: "Coffee" },
      { id: "generator", name: "100% Power Backup", icon: "Zap" },
    ],
    rules: [
      "Decoration packages available via empaneled vendors.",
      "Music to be lowered after 10:30 PM per municipal guidelines.",
    ],
    resources: [
      {
        id: "res-hall-1",
        name: "Main Grand Banquet Hall",
        category: "party-hall",
        capacity: 350,
        basePricePerHour: 18000,
      }
    ],
    slotsByDate: {
      "2026-09-18": [
        { id: "sk1", resourceId: "res-hall-1", startTime: "09:00", endTime: "15:00", timeOfDay: "morning", price: 18000, status: "AVAILABLE" },
        { id: "sk2", resourceId: "res-hall-1", startTime: "17:00", endTime: "23:00", timeOfDay: "evening", price: 24000, status: "AVAILABLE" },
      ]
    }
  },
  {
    id: "venue-6",
    slug: "aqua-splash-olympic-pool",
    name: "AquaSplash Olympic & Heated Pool",
    tagline: "International standard temperature-controlled swimming arena",
    description:
      "Half-Olympic temperature-controlled indoor swimming pool with clean chlorinated ozone filtration, dedicated coaching lanes, kids shallow splash deck, and poolside lounge.",
    category: "swimming",
    location: {
      address: "Near Sarath City Mall, Kondapur",
      neighborhood: "Kondapur",
      city: "Hyderabad",
      distanceKm: 4.8,
      mapCoordinates: { lat: 17.4622, lng: 78.3568 },
    },
    rating: 4.8,
    reviewCount: 680,
    startingPrice: 350,
    priceUnit: "hour",
    isAvailableToday: true,
    isPopular: true,
    isTrending: false,
    images: [
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      { id: "heated", name: "Heated Pool (28°C)", icon: "Waves" },
      { id: "lifeguard", name: "Certified Lifeguards", icon: "Shield" },
      { id: "showers", name: "Hot Showers", icon: "Bath" },
      { id: "lockers", name: "Digital Lockers", icon: "Key" },
    ],
    rules: [
      "Nylon or lycra swimwear is mandatory.",
      "Shower before entering the pool.",
    ],
    resources: [
      {
        id: "res-pool-1",
        name: "General Lap Lane & Pool Access",
        category: "swimming",
        capacity: 25,
        basePricePerHour: 350,
      }
    ],
    slotsByDate: {
      "2026-09-18": [
        { id: "sa1", resourceId: "res-pool-1", startTime: "06:00", endTime: "07:00", timeOfDay: "morning", price: 350, status: "AVAILABLE" },
        { id: "sa2", resourceId: "res-pool-1", startTime: "07:00", endTime: "08:00", timeOfDay: "morning", price: 350, status: "AVAILABLE" },
        { id: "sa3", resourceId: "res-pool-1", startTime: "17:00", endTime: "18:00", timeOfDay: "evening", price: 450, status: "AVAILABLE" },
        { id: "sa4", resourceId: "res-pool-1", startTime: "18:00", endTime: "19:00", timeOfDay: "evening", price: 450, status: "BOOKED" },
      ]
    }
  }
];
