import { env } from '../config/env';
import { pool } from '../db/pool';
import { createUser, findUserByEmail } from '../services/userService';
import { createCategory } from '../services/categoryService';
import { createItem } from '../services/itemService';

const defaultCategories = [
  { name: 'Charging & Power', description: 'MagSafe adapters, USB-C chargers, power bricks, and cables.' },
  { name: 'Keyboards & Trackpads', description: 'Replacement keyboards, top cases, and trackpads for MacBook models.' },
  { name: 'Batteries', description: 'OEM and third-party internal batteries for Mac laptops.' },
  { name: 'Displays & Bezels', description: 'Complete display assemblies, panels, bezels, and hinges.' },
  { name: 'Logic Boards', description: 'Tested logic boards and motherboards for MacBook Air and Pro.' },
  { name: 'Storage & Memory', description: 'NVMe blades, SATA SSDs, and RAM upgrades compatible with Macs.' },
  { name: 'Cooling & Thermal', description: 'Fans, heat sinks, and thermal pad kits.' },
  { name: 'Cables & Flex', description: 'Display flex, keyboard flex, speakers, and internal cable assemblies.' },
  { name: 'Audio & Camera', description: 'Speakers, microphones, and FaceTime camera modules.' },
  { name: 'Accessories & Tools', description: 'External adapters, dongles, screwdrivers, and repair kits.' },
];

const placeholder = (text: string) =>
  `https://via.placeholder.com/640x360.png?text=${encodeURIComponent(text)}`;

const defaultItems = [
  {
    category: 'Charging & Power',
    name: '85W MagSafe 2 Power Adapter',
    brand: 'Apple',
    model: 'A1424',
    price: 89.99,
    stock: 12,
    imageUrl: placeholder('MagSafe 2 85W'),
    description: 'Original 85W MagSafe 2 adapter compatible with MacBook Pro 15-inch Retina (2012-2015).',
  },
  {
    category: 'Charging & Power',
    name: '96W USB-C Power Adapter',
    brand: 'Apple',
    model: 'A2166',
    price: 79.0,
    stock: 18,
    imageUrl: placeholder('96W USB-C Charger'),
    description: 'USB-C charger ideal for 16-inch MacBook Pro and USB-C charging MacBooks.',
  },
  {
    category: 'Keyboards & Trackpads',
    name: 'MacBook Air 13-inch Keyboard Assembly (2019)',
    brand: 'Apple',
    model: 'A1932',
    price: 139.5,
    stock: 6,
    imageUrl: placeholder('MBA 2019 Keyboard'),
    description: 'Backlit keyboard with top case and battery adhesive pre-installed.',
  },
  {
    category: 'Keyboards & Trackpads',
    name: 'MacBook Pro Force Touch Trackpad',
    brand: 'Apple',
    model: 'A1706',
    price: 99.99,
    stock: 15,
    imageUrl: placeholder('Force Touch Trackpad'),
    description: 'Force Touch trackpad for MacBook Pro 13-inch (Late 2016-2017).',
  },
  {
    category: 'Batteries',
    name: 'MacBook Pro 13-inch Battery (2018)',
    brand: 'Apple',
    model: 'A1964',
    price: 129.0,
    stock: 20,
    imageUrl: placeholder('MPB 13 Battery'),
    description: '6-cell lithium polymer battery for MacBook Pro 13-inch with Touch Bar.',
  },
  {
    category: 'Batteries',
    name: 'MacBook Air 11-inch Battery',
    brand: 'Apple',
    model: 'A1495',
    price: 89.0,
    stock: 9,
    imageUrl: placeholder('MBA 11 Battery'),
    description: 'OEM replacement battery for MacBook Air 11-inch (Mid 2013-Early 2015).',
  },
  {
    category: 'Displays & Bezels',
    name: 'MacBook Pro 16-inch Display Assembly',
    brand: 'Apple',
    model: 'A2141',
    price: 549.99,
    stock: 3,
    imageUrl: placeholder('16-inch Display Assembly'),
    description: 'Complete retina display panel with housing and True Tone camera.',
  },
  {
    category: 'Displays & Bezels',
    name: 'MacBook Air 13-inch LCD Panel',
    brand: 'LG',
    model: 'LP133WP2',
    price: 189.0,
    stock: 7,
    imageUrl: placeholder('MBA 13 LCD Panel'),
    description: '13.3-inch LCD replacement compatible with 2010-2017 MacBook Air.',
  },
  {
    category: 'Logic Boards',
    name: 'Logic Board 2.3GHz i5 8GB (2017)',
    brand: 'Apple',
    model: '661-07970',
    price: 329.0,
    stock: 4,
    imageUrl: placeholder('Logic Board 2017 i5'),
    description: 'Refurbished logic board for MacBook Pro 13-inch (Function Keys, 2017).',
  },
  {
    category: 'Logic Boards',
    name: 'MacBook Air M1 Logic Board 8-Core',
    brand: 'Apple',
    model: '661-18855',
    price: 599.0,
    stock: 2,
    imageUrl: placeholder('M1 Logic Board'),
    description: 'Apple silicon logic board with 8-core GPU, 8GB unified memory.',
  },
  {
    category: 'Storage & Memory',
    name: '512GB NVMe Blade SSD Upgrade',
    brand: 'OWC',
    model: 'Aura Pro X2',
    price: 169.99,
    stock: 25,
    imageUrl: placeholder('512GB NVMe Blade'),
    description: 'High performance NVMe SSD for MacBook Pro 2013-2015 and MacBook Air 2013-2017.',
  },
  {
    category: 'Storage & Memory',
    name: '16GB DDR3L 1600MHz SO-DIMM Kit',
    brand: 'Crucial',
    model: 'CT2K8G3S160BM',
    price: 74.99,
    stock: 30,
    imageUrl: placeholder('16GB DDR3L Kit'),
    description: '2x8GB memory kit compatible with 2011-2012 MacBook Pro models.',
  },
  {
    category: 'Cooling & Thermal',
    name: 'MacBook Pro 15-inch Dual Fan Set',
    brand: 'Apple',
    model: 'A1398',
    price: 59.99,
    stock: 14,
    imageUrl: placeholder('15-inch Fan Set'),
    description: 'Left and right cooling fan assembly for MacBook Pro 15-inch (Mid 2012-Early 2013).',
  },
  {
    category: 'Cooling & Thermal',
    name: 'Thermal Pad & Paste Kit',
    brand: 'iFixit',
    price: 24.99,
    stock: 50,
    imageUrl: placeholder('Thermal Kit'),
    description: 'High-quality thermal paste with pre-cut pads for MacBook Pro repairs.',
  },
  {
    category: 'Cables & Flex',
    name: '2016-2017 MacBook Pro Display Flex Cable',
    brand: 'Apple',
    model: '923-01301',
    price: 19.99,
    stock: 40,
    imageUrl: placeholder('Display Flex Cable'),
    description: 'Flex cable to resolve stage-light display issues in Touch Bar MacBook Pro.',
  },
  {
    category: 'Cables & Flex',
    name: 'MacBook Air Trackpad Flex Cable',
    brand: 'Apple',
    model: '923-0441',
    price: 14.99,
    stock: 35,
    imageUrl: placeholder('Trackpad Flex Cable'),
    description: 'Replacement flex cable connecting trackpad to logic board.',
  },
  {
    category: 'Audio & Camera',
    name: 'MacBook Pro Speaker Pair (13-inch 2020)',
    brand: 'Apple',
    price: 39.99,
    stock: 22,
    imageUrl: placeholder('MPB Speakers'),
    description: 'Left and right speakers for MacBook Pro 13-inch (2020, Four Thunderbolt 3 Ports).',
  },
  {
    category: 'Audio & Camera',
    name: 'FaceTime HD Camera Cable',
    brand: 'Apple',
    price: 17.5,
    stock: 28,
    imageUrl: placeholder('FaceTime Camera Cable'),
    description: 'Front camera flex cable for MacBook Air 13-inch (2015-2017).',
  },
  {
    category: 'Accessories & Tools',
    name: 'USB-C to Thunderbolt 2 Adapter',
    brand: 'Apple',
    model: 'MJ1L2AM/A',
    price: 39.0,
    stock: 45,
    imageUrl: placeholder('USB-C to Thunderbolt 2'),
    description: 'Connect Thunderbolt devices to newer USB-C Mac models.',
  },
  {
    category: 'Accessories & Tools',
    name: 'Essential MacBook Repair Toolkit',
    brand: 'iFixit',
    model: 'MMT-001',
    price: 69.99,
    stock: 60,
    imageUrl: placeholder('Repair Toolkit'),
    description: 'Precision screwdriver set, spudgers, and pry tools for MacBook repairs.',
  },
];

const seed = async () => {
  try {
    const password = env.adminPassword ?? 'ChangeMe123!';

    for (const adminEmail of env.adminEmails) {
      const normalized = adminEmail.toLowerCase();
      const existingAdmin = await findUserByEmail(normalized);

      if (!existingAdmin) {
        await createUser(normalized, password, 'admin');
        console.log(`Admin user created: ${normalized}`);
      } else {
        console.log(`Admin user already exists: ${normalized}`);
      }
    }

    const categoryNameToId = new Map<string, number>();

    for (const category of defaultCategories) {
      const result = await pool.query<{ id: number }>('SELECT id FROM categories WHERE name = $1', [category.name]);
      if ((result.rowCount ?? 0) > 0 && result.rows[0]) {
        categoryNameToId.set(category.name, result.rows[0].id);
        continue;
      }

      const created = await createCategory(category.name, category.description ?? undefined);
      categoryNameToId.set(created.name, created.id);
      console.log(`Category created: ${created.name}`);
    }

    for (const item of defaultItems) {
      const categoryId = categoryNameToId.get(item.category);
      if (!categoryId) {
        continue;
      }

      const exists = await pool.query('SELECT id FROM items WHERE name = $1 AND category_id = $2', [item.name, categoryId]);
      if ((exists.rowCount ?? 0) > 0) {
        continue;
      }

      await createItem({
        categoryId,
        name: item.name,
        brand: item.brand,
        model: item.model,
        price: item.price,
        stock: item.stock,
        imageUrl: item.imageUrl,
        description: item.description,
      });
      console.log(`Item created: ${item.name}`);
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();
