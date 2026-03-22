const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');

const TOTAL_PER_GROUP = 50;
const SEED_TAG = 'bulk-seed-150';

const bikeBrands = ['Yamaha', 'Honda', 'KTM', 'Bajaj', 'TVS', 'Suzuki', 'Royal Enfield'];
const carBrands = ['Toyota', 'BMW', 'Audi', 'Hyundai', 'Ford', 'Nissan', 'Volkswagen'];
const superbikeBrands = ['Ducati', 'Kawasaki', 'Aprilia', 'MV Agusta', 'Triumph', 'BMW Motorrad'];
const engineBrands = ['Bosch', 'Valeo', 'Mahle', 'Denso', 'Delphi', 'NGK'];

const bikePartNames = [
  'Disc Brake Pad Set',
  'Chain Sprocket Kit',
  'Front Fork Oil Seal',
  'Clutch Plate Kit',
  'LED Headlight Assembly',
  'Throttle Cable',
  'Rear Shock Absorber',
  'Fuel Pump Module',
  'Air Filter Element',
  'Radiator Coolant Hose',
];

const carPartNames = [
  'Engine Oil Filter',
  'Front Bumper Grill',
  'Brake Disc Rotor',
  'Cabin AC Filter',
  'Spark Plug Set',
  'Alternator Assembly',
  'Steering Rack End',
  'Suspension Strut',
  'Fuel Injector Rail',
  'Radiator Fan Motor',
];

const superbikePartNames = [
  'Performance Exhaust Slip-On',
  'Quick Shifter Sensor',
  'Forged Clutch Basket',
  'ECU Tuning Module',
  'Titanium Brake Caliper Bolt Kit',
  'Race Spec Rearset',
  'Carbon Fiber Chain Guard',
  'High Flow Air Intake',
  'Race Brake Master Cylinder',
  'Lightweight Front Sprocket',
];

const enginePartNames = [
  'Engine Block Assembly',
  'Cylinder Head Kit',
  'Crankshaft Set',
  'Piston Ring Set',
  'Camshaft Unit',
  'Timing Belt Kit',
  'Engine Mount Bracket',
  'Oil Pump Assembly',
  'Valve Cover Gasket',
  'Fuel Injector Kit',
];

const bikeModels = ['R15', 'Pulsar 220', 'Duke 390', 'Apache RTR 200', 'Classic 350'];
const carModels = ['Corolla', 'Civic', 'Elantra', 'Passat', 'X5', 'Q5'];
const superbikeModels = ['Panigale V4', 'Ninja ZX-10R', 'RSV4', 'Street Triple RS', 'F4'];
const engineModels = ['Universal Fit', 'Pro Series', 'Touring Kit', 'Racing Spec', 'OEM Standard'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];

const imagePoolByType = {
  bike: ['/seed-images/bike-parts.svg'],
  car: ['/seed-images/car-parts.svg'],
  superbike: ['/seed-images/superbike-parts.svg'],
  engine: ['/seed-images/engine-parts.svg'],
  accessories: ['/seed-images/accessories-parts.svg'],
};

const createImage = (type, index) => {
  const url = pick(imagePoolByType[type] || ['/placeholder-product.svg']);

  return {
    url,
    publicId: `seed/${type}/${index + 1}`,
  };
};

const ensureSeedSeller = async () => {
  let seller = await User.findOne({ role: { $in: ['admin', 'seller'] }, isActive: true });

  if (seller) return seller;

  seller = await User.create({
    name: 'Seed Seller',
    email: 'seed.seller@motoparts.local',
    password: 'SeedSeller@123',
    role: 'seller',
    sellerStatus: 'approved',
    businessName: 'MotoParts Seed Store',
    sellerBio: 'Auto-generated seller for product seeding.',
    emailVerified: true,
  });

  console.log('Created fallback seller account: seed.seller@motoparts.local / SeedSeller@123');
  return seller;
};

const buildProducts = (type, category, vehicleType, brands, names, models, sellerId) => {
  const priceRangeByType = {
    bike: [80, 850],
    car: [120, 2200],
    superbike: [150, 3000],
    engine: [250, 4500],
  };

  const [minPrice, maxPrice] = priceRangeByType[type];

  return Array.from({ length: TOTAL_PER_GROUP }, (_, i) => {
    const brand = pick(brands);
    const model = pick(models);
    const baseName = pick(names);
    const price = randomInt(minPrice, maxPrice);
    const hasDiscount = Math.random() > 0.55;
    const discountPercent = randomInt(5, 20);
    const discountedPrice = hasDiscount
      ? Number((price * (1 - discountPercent / 100)).toFixed(2))
      : null;

    return {
      name: `${brand} ${baseName} ${i + 1}`,
      description: `${baseName} for ${brand} ${model}. Durable fitment-tested part for daily and long-distance performance.` ,
      price,
      discountedPrice,
      images: [createImage(type, i)],
      category,
      vehicleType,
      brand,
      condition: 'new',
      partNumber: `${type.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
      compatibleVehicles: [
        {
          make: brand,
          model,
          yearFrom: '2018',
          yearTo: '2025',
        },
      ],
      stock: randomInt(5, 60),
      seller: sellerId,
      tags: [SEED_TAG, type, 'performance', 'marketplace'],
      shippingDays: randomInt(2, 7),
      isActive: true,
      isApproved: true,
    };
  });
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Please configure server/.env first.');
  }

  await connectDB();

  const seller = await ensureSeedSeller();

  const existing = await Product.countDocuments({ tags: SEED_TAG });
  if (existing > 0) {
    await Product.deleteMany({ tags: SEED_TAG });
    console.log(`Removed ${existing} existing seeded products.`);
  }

  const bikeProducts = buildProducts(
    'bike',
    'bike-parts',
    'bike',
    bikeBrands,
    bikePartNames,
    bikeModels,
    seller._id
  );

  const carProducts = buildProducts(
    'car',
    'car-parts',
    'car',
    carBrands,
    carPartNames,
    carModels,
    seller._id
  );

  const superbikeProducts = buildProducts(
    'superbike',
    'superbike-parts',
    'superbike',
    superbikeBrands,
    superbikePartNames,
    superbikeModels,
    seller._id
  );

  const engineProducts = buildProducts(
    'engine',
    'engine-parts',
    'universal',
    engineBrands,
    enginePartNames,
    engineModels,
    seller._id
  );

  const allProducts = [...bikeProducts, ...carProducts, ...superbikeProducts, ...engineProducts];
  await Product.insertMany(allProducts);

  console.log(
    `Seed complete: ${bikeProducts.length} bike parts, ${carProducts.length} car parts, ${superbikeProducts.length} superbike parts, ${engineProducts.length} engine parts inserted.`
  );
  process.exit(0);
};

seed().catch((error) => {
  console.error(`Seed failed: ${error.message}`);
  process.exit(1);
});
