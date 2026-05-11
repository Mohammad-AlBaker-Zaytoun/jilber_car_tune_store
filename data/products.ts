export type Category =
  | 'ECU Tuning'
  | 'Exhaust'
  | 'Suspension'
  | 'Wheels'
  | 'Brakes'
  | 'Aero'
  | 'Diagnostics'
  | 'Maintenance';

export const CATEGORIES: Category[] = [
  'ECU Tuning',
  'Exhaust',
  'Suspension',
  'Wheels',
  'Brakes',
  'Aero',
  'Diagnostics',
  'Maintenance',
];

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency: string;
  badge?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured: boolean;
  images?: string[];
  visualColor: string;
  visualColor2: string;
  specs: ProductSpec[];
  compatibility: string[];
  includedItems: string[];
}

export const products: Product[] = [
  {
    id: 'prod-001',
    slug: 'stage-1-ecu-tune',
    name: 'Stage 1 ECU Tune',
    category: 'ECU Tuning',
    shortDescription: 'Precision remap for bolt-on builds. Unlocks hidden power without hardware changes.',
    description:
      'Our Stage 1 ECU remap is engineered for stock or lightly modified vehicles. Using a direct OBD-II connection to your ECU, our calibrators rewrite the fuel, ignition, boost, and throttle maps to extract every available horsepower and torque the engine is physically capable of on standard hardware. Typical gains range from 15–30% depending on platform. All maps are custom-written on our in-house Mustang dynamometer — no generic off-the-shelf files.',
    price: 499,
    currency: 'USD',
    badge: 'Best Seller',
    rating: 4.9,
    reviewCount: 142,
    inStock: true,
    featured: true,
    visualColor: '#00d4ff',
    visualColor2: '#0066cc',
    specs: [
      { label: 'Tune Method', value: 'OBD-II Direct Flash' },
      { label: 'Dyno Verified', value: 'Yes — before & after runs' },
      { label: 'Power Gain', value: '15–30% (platform dependent)' },
      { label: 'Torque Gain', value: '12–25% (platform dependent)' },
      { label: 'Map Types', value: 'Fuel · Ignition · Boost · Throttle' },
      { label: 'Warranty', value: '12-month performance guarantee' },
    ],
    compatibility: [
      'BMW M2/M3/M4 (F/G series)',
      'Audi RS3/RS4/RS6/TT RS',
      'Mercedes-AMG A45/C63/E63',
      'Volkswagen Golf R / Arteon R',
      'Porsche 992 Carrera / Cayenne GTS',
    ],
    includedItems: [
      'Custom ECU remap file',
      'Pre-tune health check',
      'Before & after dyno sheet',
      'Post-tune data log review',
      '12-month map update support',
    ],
  },
  {
    id: 'prod-002',
    slug: 'stage-2-performance-tune',
    name: 'Stage 2 Performance Tune',
    category: 'ECU Tuning',
    shortDescription: 'Full calibration suite for hardware-upgraded builds. Mapped to your exact spec.',
    description:
      'Stage 2 is for vehicles with supporting hardware modifications such as upgraded intercoolers, downpipes, intakes, or exhaust systems. This is a full custom calibration written to your exact specification — we log your car under load across the full RPM range, refine ignition timing for your fuel quality, and optimize boost curves for your specific turbocharger and supporting mods. Every Stage 2 tune includes a minimum of three dyno sessions to verify stability and maximize output.',
    price: 699,
    oldPrice: 799,
    currency: 'USD',
    badge: 'Popular',
    rating: 4.8,
    reviewCount: 89,
    inStock: true,
    featured: true,
    visualColor: '#00d4ff',
    visualColor2: '#003d99',
    specs: [
      { label: 'Tune Method', value: 'OBD-II + Bench Flash (platform dependent)' },
      { label: 'Dyno Sessions', value: '3 minimum included' },
      { label: 'Power Gain', value: '25–50% (hardware dependent)' },
      { label: 'Torque Gain', value: '20–45% (hardware dependent)' },
      { label: 'Map Types', value: 'Full ECU + TCU (if applicable)' },
      { label: 'Warranty', value: '12-month performance guarantee' },
    ],
    compatibility: [
      'BMW M2/M3/M4 Competition (S58)',
      'Audi TTRS / RS3 (EVO platform)',
      'Mercedes-AMG C63 S (M177)',
      'Toyota GR Supra A90 (B58)',
      'Nissan GT-R (VR38DETT)',
    ],
    includedItems: [
      'Full custom ECU calibration',
      'TCU calibration (if applicable)',
      '3 dyno sessions (baseline + 2 refinement)',
      'Comprehensive before & after dyno report',
      'Ongoing map support (12 months)',
      'Phone/email consultation',
    ],
  },
  {
    id: 'prod-003',
    slug: 'valvetronic-exhaust-system',
    name: 'Valvetronic Exhaust System',
    category: 'Exhaust',
    shortDescription: 'Variable-valve catback with remote actuation. Quiet cruise, race mode on demand.',
    description:
      'Our Valvetronic catback exhaust system delivers split-personality performance: near-stock decibels in comfort mode, full race sound when the valve opens. Constructed from 304 stainless steel with polished 102mm quad tips, the system is mandrel-bent for maximum flow and features a remote-actuated butterfly valve controlled via your OEM driving mode selector or our included Bluetooth module. Gain 8–14 hp at the rear wheels from reduced back pressure alone.',
    price: 1899,
    currency: 'USD',
    badge: 'Premium',
    rating: 4.9,
    reviewCount: 56,
    inStock: true,
    featured: true,
    visualColor: '#f97316',
    visualColor2: '#7c2d12',
    specs: [
      { label: 'Material', value: '304 Stainless Steel' },
      { label: 'Tip Size', value: '102mm Quad Polished' },
      { label: 'Valve Control', value: 'OEM Mode Selector / Bluetooth' },
      { label: 'dB Reduction (closed)', value: '18–22 dB vs open' },
      { label: 'Pipe Diameter', value: '76mm mandrel-bent' },
      { label: 'Weight Saving', value: '4.2 kg vs OEM' },
    ],
    compatibility: [
      'BMW M3/M4 (F8x / G8x) — 2014–present',
      'BMW M2 Competition / CS (F87)',
      'Mercedes-AMG C63 / C63 S (W205/W206)',
      'Audi RS5 / RS4 B9',
    ],
    includedItems: [
      'Valvetronic catback exhaust',
      'Bluetooth controller module',
      'OEM mode integration harness',
      'Polished 102mm quad tips',
      'All mounting hardware & gaskets',
      'Installation guide',
    ],
  },
  {
    id: 'prod-004',
    slug: 'titanium-downpipe',
    name: 'Titanium Downpipe',
    category: 'Exhaust',
    shortDescription: 'Race-grade titanium downpipe. Maximum flow, minimum weight, real gains.',
    description:
      'Machined from grade-2 aerospace titanium, this downpipe eliminates the primary restriction in your exhaust system. The 90mm main pipe flows significantly more than OEM, reducing turbo back-pressure and allowing the turbocharger to spool earlier and more aggressively. Available in catted (200 cpsi high-flow metal cat) and catless variants. Weight savings of 1.8 kg over OEM steel units contribute to sharper throttle response.',
    price: 1099,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 34,
    inStock: true,
    featured: false,
    visualColor: '#f97316',
    visualColor2: '#431407',
    specs: [
      { label: 'Material', value: 'Grade-2 Aerospace Titanium' },
      { label: 'Pipe Diameter', value: '90mm main / 76mm secondary' },
      { label: 'Cat Option', value: 'Catted (200 cpsi) or Catless' },
      { label: 'Weight', value: '1.4 kg (vs 3.2 kg OEM)' },
      { label: 'Finish', value: 'Natural titanium / brushed' },
      { label: 'Fitment', value: 'Direct OEM replacement' },
    ],
    compatibility: [
      'BMW B58 (G20/G21/G22/G26/G80/G82)',
      'BMW S55 (F80/F82/F83)',
      'BMW S58 (G80/G82/G83)',
      'Toyota GR Supra A90 (B58)',
    ],
    includedItems: [
      'Titanium downpipe assembly',
      'V-band clamp',
      'High-temp gasket set',
      'Mounting hardware',
    ],
  },
  {
    id: 'prod-005',
    slug: 'ohlins-coilover-kit',
    name: 'Öhlins Road & Track Coilover Kit',
    category: 'Suspension',
    shortDescription: 'Swedish precision coilovers with 20-way damping adjustment. Street to track in minutes.',
    description:
      'Öhlins Road & Track coilovers represent the pinnacle of street-legal suspension engineering. The twin-tube DFV (Dual Flow Valve) technology delivers consistent damping characteristics across the full stroke — no fade, no compromise. Twenty-way damping adjustment allows instant configuration changes between daily comfort and track-optimised stiffness. Height-adjustable from −30 mm to −70 mm. Installed and corner-weighted at our workshop for zero-compromise setup.',
    price: 1499,
    currency: 'USD',
    badge: 'Featured',
    rating: 4.8,
    reviewCount: 78,
    inStock: true,
    featured: true,
    visualColor: '#a855f7',
    visualColor2: '#4c1d95',
    specs: [
      { label: 'Technology', value: 'DFV Twin-Tube' },
      { label: 'Damping Adjustment', value: '20-way (compression + rebound)' },
      { label: 'Height Range', value: '−30 mm to −70 mm' },
      { label: 'Spring Rate (F/R)', value: 'Platform-specific' },
      { label: 'Body Material', value: 'Aluminium alloy' },
      { label: 'Includes', value: 'Corner weight setup session' },
    ],
    compatibility: [
      'BMW M3/M4 G80/G82 (2021–present)',
      'BMW M2 G87',
      'Porsche 911 992 (all variants)',
      'Audi RS3 8Y / TTRS 8S',
    ],
    includedItems: [
      '4× Öhlins Road & Track struts',
      'Vehicle-specific top mounts',
      'Alignment bolts & hardware',
      'Damper adjustment tool',
      'Corner-weight alignment session',
      'Öhlins setup guide',
    ],
  },
  {
    id: 'prod-006',
    slug: 'performance-brake-kit',
    name: 'Performance Brake Kit',
    category: 'Brakes',
    shortDescription: 'Cross-drilled rotors + high-performance pads. Consistent stopping from 200+ km/h.',
    description:
      'This performance brake kit addresses the single most overlooked upgrade for spirited drivers: stopping power. Two-piece floating rotors with cross-drilled and slotted faces evacuate heat and gases efficiently, maintaining bite through repeated hard braking. Paired with our specified Ferodo DS2500 pads — aggressive enough for track use, stable enough for daily driving. Includes braided stainless lines for improved pedal feel and resistance to fade under extreme temperatures.',
    price: 1299,
    oldPrice: 1499,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 45,
    inStock: true,
    featured: false,
    visualColor: '#ef4444',
    visualColor2: '#7f1d1d',
    specs: [
      { label: 'Rotor Type', value: '2-piece floating, cross-drilled & slotted' },
      { label: 'Rotor Material', value: 'High-carbon iron hat / steel bell' },
      { label: 'Pad Compound', value: 'Ferodo DS2500 (street/track)' },
      { label: 'Brake Lines', value: 'Braided stainless steel' },
      { label: 'Temp Range', value: '50°C – 650°C' },
      { label: 'Axle Coverage', value: 'Front + Rear kit' },
    ],
    compatibility: [
      'BMW M3/M4 F8x / G8x',
      'Mercedes-AMG C63/E63',
      'Audi RS5/RS4 B9',
      'Volkswagen Golf R (Mk7/Mk8)',
    ],
    includedItems: [
      '4× two-piece floating rotors (F+R)',
      '4× Ferodo DS2500 pad sets',
      'Braided stainless brake lines',
      'Caliper guide pins & hardware',
      'Brake bedding guide',
    ],
  },
  {
    id: 'prod-007',
    slug: 'forged-wheel-set',
    name: 'Forged Wheel Set — 20"',
    category: 'Wheels',
    shortDescription: 'Monoblock forged aluminium. 7 kg per wheel. Form and function at the limit.',
    description:
      'Forged from a single billet of 6061-T6 aluminium alloy, these monoblock wheels represent the lightest, strongest option for performance fitment. At 7.2 kg per wheel in 20×9.5J, they reduce unsprung mass by up to 9 kg per axle versus cast OEM wheels — directly improving steering response, ride quality, and suspension geometry compliance. Available in Matte Graphite, Satin Black, or Polished Silver. CNC-machined to 0.1 mm tolerance, PCD-specific for zero-fitment compromise.',
    price: 2499,
    currency: 'USD',
    badge: 'Limited',
    rating: 4.9,
    reviewCount: 27,
    inStock: true,
    featured: true,
    visualColor: '#fbbf24',
    visualColor2: '#78350f',
    specs: [
      { label: 'Construction', value: 'Monoblock forged 6061-T6' },
      { label: 'Size', value: '20×9.5J (F) / 20×10.5J (R)' },
      { label: 'Weight', value: '7.2 kg per wheel' },
      { label: 'Offset', value: 'ET35 (F) / ET25 (R) — platform specific' },
      { label: 'Finish Options', value: 'Matte Graphite / Satin Black / Polished' },
      { label: 'Centre Bore', value: 'Machined to OEM spec' },
    ],
    compatibility: [
      'BMW M2/M3/M4 (5×112)',
      'Audi RS4/RS5/TTRS (5×112)',
      'Mercedes-AMG C/E class (5×112)',
      'Volkswagen Golf R / Arteon R (5×112)',
    ],
    includedItems: [
      '4× forged wheels',
      'Centre caps (JILBER logo)',
      'Extended lug bolts (if required)',
      'Wheel specification certificate',
      'Carry bag',
    ],
  },
  {
    id: 'prod-008',
    slug: 'cold-air-intake-system',
    name: 'Cold Air Intake System',
    category: 'Maintenance',
    shortDescription: 'High-flow induction kit. Cooler denser air, sharper throttle response, better sound.',
    description:
      'A properly engineered cold air intake is one of the most cost-effective modifications available. Our system replaces the restrictive OEM airbox with a mandrel-bent aluminium pipe, high-flow oiled cotton filter element, and a sealed heat shield that isolates the filter from engine bay heat. Results: 4–8 hp at the wheel, crisper throttle response, and a more aggressive induction note. Unlike generic pods, our system maintains the factory MAF sensor position for seamless ECU integration.',
    price: 349,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 112,
    inStock: true,
    featured: false,
    visualColor: '#3b82f6',
    visualColor2: '#1e3a8a',
    specs: [
      { label: 'Pipe Material', value: 'Mandrel-bent aluminium' },
      { label: 'Filter Type', value: 'Oiled cotton high-flow element' },
      { label: 'Heat Shield', value: 'Sealed aluminium (included)' },
      { label: 'MAF Compatibility', value: 'OEM sensor position retained' },
      { label: 'Power Gain', value: '4–8 hp (dyno verified)' },
      { label: 'Filter Lifespan', value: '50,000 km between service' },
    ],
    compatibility: [
      'BMW B48/B58 (G/F series)',
      'Toyota GR Supra A90 (B58)',
      'Audi 2.0 TFSI / 2.5 TFSI',
      'Volkswagen EA888 (Mk7/Mk8)',
    ],
    includedItems: [
      'Aluminium intake pipe',
      'High-flow oiled filter element',
      'Heat shield assembly',
      'Silicone couplers & clamps',
      'All mounting hardware',
    ],
  },
  {
    id: 'prod-009',
    slug: 'track-alignment-package',
    name: 'Track Alignment Package',
    category: 'Diagnostics',
    shortDescription: 'Four-wheel laser alignment optimised for your driving style and tyre preference.',
    description:
      'Geometry is everything at the limit. Our track alignment package uses a Hofmann 4-wheel laser alignment system to set camber, caster, toe, and thrust angle to a specification tailored for your driving: aggressive circuit work, fast road, or a compromise of both. Unlike generic high street alignment, we discuss your tyre wear targets, preferred understeer/oversteer balance, and current suspension setup before we begin. Includes a detailed alignment report with before and after figures.',
    price: 199,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 93,
    inStock: true,
    featured: false,
    visualColor: '#22c55e',
    visualColor2: '#14532d',
    specs: [
      { label: 'Equipment', value: 'Hofmann 4-wheel laser alignment' },
      { label: 'Parameters Set', value: 'Camber · Caster · Toe · Thrust' },
      { label: 'Setup Options', value: 'Circuit / Fast Road / OEM' },
      { label: 'Duration', value: '90–120 minutes' },
      { label: 'Report', value: 'Full printed + digital before/after' },
      { label: 'Follow-up', value: 'Free recheck within 30 days' },
    ],
    compatibility: ['All road and track vehicles', 'Coilover-equipped builds', 'Post-suspension-installation checks'],
    includedItems: [
      'Full 4-wheel alignment session',
      'Pre-alignment inspection',
      'Printed alignment report',
      'Digital copy via email',
      '30-day free recheck',
    ],
  },
  {
    id: 'prod-010',
    slug: 'full-dyno-session',
    name: 'Full Dyno Diagnostic Session',
    category: 'Diagnostics',
    shortDescription: 'Measure, log, and understand your car\'s true output. Essential baseline for any build.',
    description:
      'Before modifying, you need facts. Our dyno diagnostic session puts your vehicle on our Mustang 4WD rolling road for a full power and torque run with comprehensive data logging. We record peak power, torque curve, air/fuel ratio, boost pressure, intake air temperature, and exhaust gas temperature across the full RPM range. The result is a complete picture of where your car is now and exactly where to target modifications for maximum return on investment.',
    price: 149,
    oldPrice: 199,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 204,
    inStock: true,
    featured: false,
    visualColor: '#22c55e',
    visualColor2: '#052e16',
    specs: [
      { label: 'Dynamometer', value: 'Mustang MD-AWD-1100 (4WD)' },
      { label: 'Max Capacity', value: '1,100 hp / 1,500 Nm' },
      { label: 'Runs Included', value: '3 power runs + steady state' },
      { label: 'Parameters Logged', value: 'Power · Torque · AFR · Boost · IAT · EGT' },
      { label: 'Report Format', value: 'PDF + raw data export' },
      { label: 'Duration', value: 'Approx 2 hours' },
    ],
    compatibility: ['All RWD, FWD, AWD vehicles', 'Up to 1,100 hp / 1,500 Nm', 'Street & race builds'],
    includedItems: [
      '3 full power runs',
      'Steady-state AFR sweep',
      'Full data log (PDF + raw)',
      'Verbal debrief with calibrator',
      'Recommendations report',
    ],
  },
  {
    id: 'prod-011',
    slug: 'carbon-fiber-front-lip',
    name: 'Carbon Fiber Front Lip',
    category: 'Aero',
    shortDescription: '2×2 twill weave dry carbon. Adds front-end downforce without adding weight.',
    description:
      'Crafted from 2×2 twill weave dry carbon fibre prepreg, this front lip spoiler generates measurable front-axle downforce at speeds above 80 km/h while remaining compliant with road regulations. The single-piece construction eliminates the flex and vibration associated with multi-section designs. UV-protected gloss clearcoat preserves the carbon weave finish. Fitment uses OEM mounting points — no drilling required. Compatible with active aerodynamic sensors.',
    price: 699,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 38,
    inStock: true,
    featured: false,
    visualColor: '#14b8a6',
    visualColor2: '#134e4a',
    specs: [
      { label: 'Material', value: '2×2 twill dry carbon prepreg' },
      { label: 'Finish', value: 'UV gloss clearcoat' },
      { label: 'Downforce', value: '+18 kg @ 200 km/h (estimated)' },
      { label: 'Weight', value: '1.1 kg' },
      { label: 'Fitment', value: 'OEM mounting points, no drilling' },
      { label: 'Warranty', value: '24-month structural warranty' },
    ],
    compatibility: [
      'BMW M3/M4 G80/G82 (2021–present)',
      'BMW M2 G87 (2023–present)',
      'BMW M4 CSL (specific fitment)',
    ],
    includedItems: [
      'Carbon front lip assembly',
      'OEM-spec mounting hardware',
      'Touch-up lacquer pen',
      'Fitting template guide',
    ],
  },
  {
    id: 'prod-012',
    slug: 'carbon-rear-diffuser',
    name: 'Carbon Rear Diffuser',
    category: 'Aero',
    shortDescription: 'Venturi-optimised rear diffuser. Reduces drag while generating rear-axle downforce.',
    description:
      'Our rear diffuser uses a multi-element venturi design validated in CFD simulation to accelerate underbody airflow and generate rear-axle downforce without the drag penalty of a spoiler. Constructed from the same 2×2 twill prepreg carbon as our front lip, the diffuser integrates flush with OEM bumper geometry — no cutting or body modification required. Pairs exceptionally with our Valvetronic exhaust system, designed to pass through the diffuser\'s central channel.',
    price: 899,
    currency: 'USD',
    badge: 'New',
    rating: 4.8,
    reviewCount: 19,
    inStock: true,
    featured: false,
    visualColor: '#14b8a6',
    visualColor2: '#0f766e',
    specs: [
      { label: 'Material', value: '2×2 twill dry carbon prepreg' },
      { label: 'Design', value: 'Multi-element venturi' },
      { label: 'Downforce', value: '+24 kg @ 200 km/h (CFD)' },
      { label: 'Drag Delta', value: '−0.002 Cd (CFD)' },
      { label: 'Weight', value: '1.4 kg' },
      { label: 'Body Modification', value: 'None required' },
    ],
    compatibility: [
      'BMW M3/M4 G80/G82',
      'BMW M2 G87',
      'Compatible with JILBER Valvetronic exhaust',
    ],
    includedItems: [
      'Carbon rear diffuser assembly',
      'OEM-spec hardware kit',
      'Touch-up lacquer pen',
      'Fitting guide',
    ],
  },
  {
    id: 'prod-013',
    slug: 'big-brake-upgrade',
    name: 'Big Brake Kit — 6-Piston',
    category: 'Brakes',
    shortDescription: '6-piston monobloc caliper with 380mm 2-piece rotor. Race-grade stopping for the road.',
    description:
      'When the stock braking system is a limiting factor on track or on fast mountain roads, this big brake kit provides an unambiguous step up. The 6-piston monobloc aluminium caliper provides massive, consistent clamping force across the full pad face, eliminating the flex and fade that plagues stock sliding calipers at elevated temperatures. Paired with a 380×34mm 2-piece floating rotor, the thermal mass advantage delays brake fade indefinitely under normal track-day conditions.',
    price: 2299,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 31,
    inStock: true,
    featured: true,
    visualColor: '#ef4444',
    visualColor2: '#450a0a',
    specs: [
      { label: 'Caliper Type', value: '6-piston monobloc aluminium' },
      { label: 'Rotor Size', value: '380×34mm 2-piece floating' },
      { label: 'Pad Compound', value: 'Pagid RS19 (street/track)' },
      { label: 'Temp Rating', value: 'Up to 800°C continuous' },
      { label: 'Caliper Finish', value: 'Anodised (black or red)' },
      { label: 'Axle', value: 'Front kit (rear upgrade available separately)' },
    ],
    compatibility: [
      'BMW M3/M4 F8x / G8x',
      'BMW M2 F87 / G87',
      'Audi RS3 8Y / TTRS 8S',
      'Requires 19"+ wheel clearance',
    ],
    includedItems: [
      '2× 6-piston monobloc calipers',
      '2× 380mm 2-piece floating rotors',
      'Pagid RS19 pad set',
      'Braided stainless lines',
      'Caliper mounting brackets',
      'All hardware & guide pins',
      'Brake bedding protocol',
    ],
  },
  {
    id: 'prod-014',
    slug: 'full-performance-inspection',
    name: 'Full Performance Inspection',
    category: 'Diagnostics',
    shortDescription: 'Complete pre-build health check. Know exactly what you\'re working with before spending a penny.',
    description:
      'Whether you\'ve just acquired a new performance car, are planning a build, or want to understand the current state of your vehicle, our full performance inspection covers every system relevant to modified use. Our technicians work through a 62-point checklist covering engine health, transmission, drivetrain, suspension geometry, brake condition, fluid quality, ECU fault codes, and visual inspection of all key components. You receive a comprehensive written report with photographs and recommended action priorities.',
    price: 249,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 167,
    inStock: true,
    featured: false,
    visualColor: '#22c55e',
    visualColor2: '#166534',
    specs: [
      { label: 'Checklist Points', value: '62-point inspection' },
      { label: 'Systems Covered', value: 'Engine · Transmission · Drivetrain · Suspension · Brakes' },
      { label: 'Diagnostics', value: 'Full OBD-II scan (all modules)' },
      { label: 'Duration', value: '3–4 hours' },
      { label: 'Report', value: 'Written report + photographic evidence' },
      { label: 'Follow-up', value: '30-min consultation call included' },
    ],
    compatibility: ['All makes and models', 'Pre-purchase inspections', 'Pre-build assessments'],
    includedItems: [
      '62-point physical inspection',
      'Full OBD-II multi-module scan',
      'Fluid analysis',
      'Written report with photographs',
      '30-minute consultation call',
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, count = 3): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, count);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}
