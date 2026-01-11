/**
 * Comprehensive Vehicle Database
 * Contains major automobile, motorcycle, and truck manufacturers with their models
 * Used for Add Listing form to allow users to list any vehicle
 */

export interface VehicleMake {
  name: string;
  country: string;
  type: 'car' | 'motorcycle' | 'truck' | 'multi';
  models: string[];
}

export const VEHICLE_DATABASE: VehicleMake[] = [
  // === CARS - Japanese ===
  {
    name: 'Toyota',
    country: 'Japan',
    type: 'car',
    models: [
      'Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', '4Runner', 'Prius',
      'Avalon', 'Sienna', 'Sequoia', 'Land Cruiser', 'Supra', 'GR86', 'Crown', 'Venza',
      'C-HR', 'bZ4X', 'Yaris', 'Celica', 'MR2', 'FJ Cruiser', 'Matrix', 'Echo',
      'Tercel', 'Paseo', 'Cressida', 'Previa', 'T100', 'Hilux', 'Fortuner', 'Innova',
      'Rush', 'Wigo', 'Vios', 'Alphard', 'Vellfire', 'Harrier', 'Mark X', 'Century'
    ]
  },
  {
    name: 'Honda',
    country: 'Japan',
    type: 'car',
    models: [
      'Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport',
      'Fit', 'Insight', 'Clarity', 'Element', 'S2000', 'NSX', 'Prelude', 'CR-Z',
      'Crosstour', 'Del Sol', 'CRX', 'Legend', 'Integra', 'City', 'Jazz', 'BR-V',
      'WR-V', 'Amaze', 'Brio', 'Mobilio', 'Freed', 'Step WGN', 'Vezel', 'ZR-V',
      'Prologue', 'e:Ny1', 'Civic Type R', 'Accord Type R'
    ]
  },
  {
    name: 'Nissan',
    country: 'Japan',
    type: 'car',
    models: [
      'Altima', 'Maxima', 'Sentra', 'Versa', 'Rogue', 'Murano', 'Pathfinder', 'Armada',
      'Titan', 'Frontier', 'Kicks', 'LEAF', 'Ariya', 'GT-R', '370Z', '350Z', '300ZX',
      'Z', 'Skyline', 'Silvia', '240SX', '180SX', 'Fairlady Z', 'Juke', 'Qashqai',
      'X-Trail', 'Navara', 'Patrol', 'Terra', 'Magnite', 'Sunny', 'Teana', 'Fuga',
      'Cima', 'President', 'Elgrand', 'Serena', 'Note', 'Cube', 'March', 'Micra'
    ]
  },
  {
    name: 'Mazda',
    country: 'Japan',
    type: 'car',
    models: [
      'Mazda3', 'Mazda6', 'CX-30', 'CX-5', 'CX-50', 'CX-70', 'CX-90', 'MX-5 Miata',
      'MX-30', 'CX-3', 'CX-9', 'RX-7', 'RX-8', 'Protege', '626', '929', 'MPV',
      'Tribute', 'CX-7', 'Mazda2', 'Mazda5', 'B-Series', 'BT-50', 'Speed3', 'Speed6',
      'Millenia', 'MX-6', 'Navajo', 'Cosmo', 'Familia', 'Demio', 'Atenza', 'Axela'
    ]
  },
  {
    name: 'Subaru',
    country: 'Japan',
    type: 'car',
    models: [
      'Outback', 'Forester', 'Crosstrek', 'Impreza', 'WRX', 'Legacy', 'Ascent',
      'BRZ', 'Solterra', 'Baja', 'Tribeca', 'SVX', 'XT', 'Justy', 'Loyale',
      'GL', 'DL', 'BRAT', 'Sambar', 'Levorg', 'Exiga', 'WRX STI', 'XV'
    ]
  },
  {
    name: 'Mitsubishi',
    country: 'Japan',
    type: 'car',
    models: [
      'Outlander', 'Eclipse Cross', 'Mirage', 'Lancer', 'Galant', 'Eclipse', '3000GT',
      'Montero', 'Pajero', 'Triton', 'L200', 'ASX', 'RVR', 'Endeavor', 'Raider',
      'Diamante', 'Sigma', 'Starion', 'Cordia', 'Tredia', 'Expo', 'Delica', 'Xpander',
      'Strada', 'Lancer Evolution', 'Colt', 'i-MiEV', 'Attrage', 'Space Star'
    ]
  },
  {
    name: 'Lexus',
    country: 'Japan',
    type: 'car',
    models: [
      'ES', 'IS', 'LS', 'GS', 'RC', 'LC', 'LFA', 'NX', 'RX', 'GX', 'LX', 'UX',
      'RZ', 'TX', 'CT', 'HS', 'SC', 'IS F', 'RC F', 'GS F', 'LX 600', 'NX 350h',
      'RX 350', 'ES 350', 'IS 500', 'LS 500', 'LC 500'
    ]
  },
  {
    name: 'Infiniti',
    country: 'Japan',
    type: 'car',
    models: [
      'Q50', 'Q60', 'Q70', 'QX50', 'QX55', 'QX60', 'QX80', 'G35', 'G37', 'M35',
      'M37', 'M45', 'M56', 'FX35', 'FX45', 'FX50', 'EX35', 'JX35', 'QX4', 'QX56',
      'I30', 'I35', 'J30', 'Q45', 'QX70'
    ]
  },
  {
    name: 'Acura',
    country: 'Japan',
    type: 'car',
    models: [
      'TLX', 'ILX', 'RLX', 'MDX', 'RDX', 'Integra', 'NSX', 'TSX', 'RSX', 'CL',
      'TL', 'RL', 'Legend', 'Vigor', 'SLX', 'ZDX', 'CDX', 'RDX', 'Type S'
    ]
  },
  {
    name: 'Suzuki',
    country: 'Japan',
    type: 'multi',
    models: [
      'Swift', 'Vitara', 'Jimny', 'S-Cross', 'Ignis', 'Baleno', 'Celerio', 'Dzire',
      'Ertiga', 'XL7', 'Ciaz', 'Grand Vitara', 'SX4', 'Kizashi', 'Aerio', 'Forenza',
      'Reno', 'Verona', 'Samurai', 'Sidekick', 'X-90', 'Esteem', 'Alto', 'Wagon R',
      'Spresso', 'Brezza', 'Fronx', 'Invicto', 'Hayabusa', 'GSX-R', 'V-Strom'
    ]
  },
  // === CARS - German ===
  {
    name: 'BMW',
    country: 'Germany',
    type: 'car',
    models: [
      '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series',
      '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z3', 'Z4', 'Z8',
      'i3', 'i4', 'i5', 'i7', 'iX', 'iX1', 'iX3', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8',
      'X3 M', 'X4 M', 'X5 M', 'X6 M', '2002', 'E30', 'E36', 'E46', 'E90', 'F30', 'G20'
    ]
  },
  {
    name: 'Mercedes-Benz',
    country: 'Germany',
    type: 'car',
    models: [
      'A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA',
      'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'AMG GT', 'SL', 'SLC', 'SLK', 'CLK',
      'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQV', 'Maybach', 'V-Class', 'Vito',
      'Sprinter', 'X-Class', '190E', '300E', '500E', 'W123', 'W124', 'W140', 'W210'
    ]
  },
  {
    name: 'Audi',
    country: 'Germany',
    type: 'car',
    models: [
      'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5',
      'Q6 e-tron', 'Q7', 'Q8', 'e-tron', 'e-tron GT', 'TT', 'R8', 'RS3', 'RS4',
      'RS5', 'RS6', 'RS7', 'RS Q8', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5',
      'SQ7', 'SQ8', '80', '90', '100', '200', 'Quattro', 'Allroad', 'Coupe'
    ]
  },
  {
    name: 'Volkswagen',
    country: 'Germany',
    type: 'car',
    models: [
      'Golf', 'Jetta', 'Passat', 'Tiguan', 'Atlas', 'Taos', 'Arteon', 'ID.4',
      'ID.Buzz', 'ID.3', 'ID.5', 'Beetle', 'CC', 'Eos', 'GTI', 'R32', 'Rabbit',
      'Scirocco', 'Corrado', 'Karmann Ghia', 'Thing', 'Phaeton', 'Touareg', 'Polo',
      'Up!', 'T-Cross', 'T-Roc', 'Amarok', 'Caddy', 'Transporter', 'Sharan', 'Touran'
    ]
  },
  {
    name: 'Porsche',
    country: 'Germany',
    type: 'car',
    models: [
      '911', '718 Cayman', '718 Boxster', 'Taycan', 'Panamera', 'Macan', 'Cayenne',
      '944', '928', '968', '914', '912', '356', 'Carrera GT', '918 Spyder', '959',
      '911 GT3', '911 GT2', '911 Turbo', 'Cayman GT4', 'Boxster Spyder'
    ]
  },
  // === CARS - American ===
  {
    name: 'Ford',
    country: 'USA',
    type: 'multi',
    models: [
      'F-150', 'F-250', 'F-350', 'Ranger', 'Maverick', 'Mustang', 'Bronco',
      'Bronco Sport', 'Explorer', 'Expedition', 'Edge', 'Escape', 'EcoSport',
      'Fusion', 'Focus', 'Fiesta', 'Taurus', 'Crown Victoria', 'Thunderbird',
      'GT', 'GT40', 'Shelby GT500', 'Mach-E', 'Lightning', 'Flex', 'Transit',
      'E-Series', 'Excursion', 'Freestyle', 'Five Hundred', 'Contour', 'Probe',
      'Pinto', 'Tempo', 'Escort', 'Festiva', 'Aspire', 'Model T', 'Model A'
    ]
  },
  {
    name: 'Chevrolet',
    country: 'USA',
    type: 'multi',
    models: [
      'Silverado', 'Colorado', 'Tahoe', 'Suburban', 'Traverse', 'Equinox', 'Blazer',
      'Trailblazer', 'Trax', 'Bolt EV', 'Bolt EUV', 'Camaro', 'Corvette', 'Malibu',
      'Impala', 'Cruze', 'Spark', 'Sonic', 'Cavalier', 'Cobalt', 'Aveo', 'Volt',
      'SS', 'Monte Carlo', 'Caprice', 'Lumina', 'Venture', 'Uplander', 'Astro',
      'Express', 'Avalanche', 'S-10', 'SSR', 'El Camino', 'Nova', 'Chevelle', 'Bel Air'
    ]
  },
  {
    name: 'GMC',
    country: 'USA',
    type: 'truck',
    models: [
      'Sierra', 'Canyon', 'Yukon', 'Yukon XL', 'Acadia', 'Terrain', 'Hummer EV',
      'Jimmy', 'Envoy', 'Safari', 'Savana', 'Sonoma', 'Syclone', 'Typhoon',
      'Vandura', 'Rally', 'C/K Series', 'TopKick', 'W Series'
    ]
  },
  {
    name: 'Ram',
    country: 'USA',
    type: 'truck',
    models: [
      '1500', '2500', '3500', 'ProMaster', 'ProMaster City', 'Dakota', 'SRT-10',
      'Power Wagon', 'TRX', 'REV', 'Ramcharger', 'Chassis Cab'
    ]
  },
  {
    name: 'Dodge',
    country: 'USA',
    type: 'car',
    models: [
      'Challenger', 'Charger', 'Durango', 'Hornet', 'Journey', 'Grand Caravan',
      'Viper', 'Dart', 'Neon', 'Avenger', 'Caliber', 'Nitro', 'Magnum', 'Intrepid',
      'Stratus', 'Spirit', 'Dynasty', 'Monaco', 'Stealth', 'Daytona', 'Shadow',
      'Omni', 'Colt', 'Rampage', 'Dakota', 'Ram Van', 'Sprinter'
    ]
  },
  {
    name: 'Jeep',
    country: 'USA',
    type: 'car',
    models: [
      'Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator',
      'Wagoneer', 'Grand Wagoneer', 'Commander', 'Patriot', 'Liberty', 'CJ',
      'Scrambler', 'Comanche', 'J-Series', 'FC', 'Willys', 'Recon', 'Avenger'
    ]
  },
  {
    name: 'Cadillac',
    country: 'USA',
    type: 'car',
    models: [
      'Escalade', 'CT4', 'CT5', 'XT4', 'XT5', 'XT6', 'Lyriq', 'Celestiq',
      'ATS', 'CTS', 'XTS', 'STS', 'DTS', 'DeVille', 'Seville', 'Eldorado',
      'Fleetwood', 'Brougham', 'Allante', 'Catera', 'Cimarron', 'ELR', 'SRX'
    ]
  },
  {
    name: 'Lincoln',
    country: 'USA',
    type: 'car',
    models: [
      'Navigator', 'Aviator', 'Nautilus', 'Corsair', 'Continental', 'MKZ', 'MKC',
      'MKX', 'MKS', 'MKT', 'Town Car', 'LS', 'Zephyr', 'Mark LT', 'Mark VIII',
      'Mark VII', 'Mark VI', 'Mark V', 'Mark IV', 'Mark III', 'Blackwood'
    ]
  },
  {
    name: 'Buick',
    country: 'USA',
    type: 'car',
    models: [
      'Enclave', 'Envision', 'Encore', 'Encore GX', 'LaCrosse', 'Regal',
      'Verano', 'Cascada', 'Lucerne', 'Park Avenue', 'LeSabre', 'Century',
      'Rendezvous', 'Rainier', 'Terraza', 'Riviera', 'Reatta', 'Grand National',
      'Roadmaster', 'Skylark', 'Electra', 'Wildcat'
    ]
  },
  {
    name: 'Tesla',
    country: 'USA',
    type: 'car',
    models: [
      'Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster',
      'Semi', 'Model S Plaid', 'Model X Plaid'
    ]
  },
  {
    name: 'Rivian',
    country: 'USA',
    type: 'car',
    models: ['R1T', 'R1S', 'R2', 'R3', 'EDV']
  },
  {
    name: 'Lucid',
    country: 'USA',
    type: 'car',
    models: ['Air', 'Air Pure', 'Air Touring', 'Air Grand Touring', 'Gravity']
  },
  // === CARS - Korean ===
  {
    name: 'Hyundai',
    country: 'South Korea',
    type: 'car',
    models: [
      'Elantra', 'Sonata', 'Accent', 'Tucson', 'Santa Fe', 'Palisade', 'Kona',
      'Venue', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Nexo', 'Veloster', 'Genesis Coupe',
      'Azera', 'Equus', 'Santa Cruz', 'Tiburon', 'Excel', 'Scoupe', 'XG350',
      'Entourage', 'Veracruz', 'Creta', 'i10', 'i20', 'i30', 'Casper', 'Staria'
    ]
  },
  {
    name: 'Kia',
    country: 'South Korea',
    type: 'car',
    models: [
      'Forte', 'K5', 'Stinger', 'Rio', 'Sportage', 'Sorento', 'Telluride', 'Seltos',
      'Soul', 'Niro', 'EV6', 'EV9', 'Carnival', 'Optima', 'Cadenza', 'K900',
      'Sedona', 'Borrego', 'Mohave', 'Rondo', 'Spectra', 'Sephia', 'Amanti',
      'Sonet', 'Carens', 'Picanto', 'Ceed', 'XCeed', 'Proceed'
    ]
  },
  {
    name: 'Genesis',
    country: 'South Korea',
    type: 'car',
    models: [
      'G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80', 'Electrified G80',
      'Electrified GV70', 'X Coupe', 'X Speedium Coupe'
    ]
  },
  // === CARS - British ===
  {
    name: 'Land Rover',
    country: 'UK',
    type: 'car',
    models: [
      'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque',
      'Discovery', 'Discovery Sport', 'Defender', 'Freelander', 'LR2', 'LR3', 'LR4'
    ]
  },
  {
    name: 'Jaguar',
    country: 'UK',
    type: 'car',
    models: [
      'XE', 'XF', 'XJ', 'F-Type', 'F-Pace', 'E-Pace', 'I-Pace', 'XK', 'XKR',
      'S-Type', 'X-Type', 'XJS', 'XJ6', 'XJ8', 'XJ12', 'XJR', 'E-Type', 'C-Type',
      'D-Type', 'Mark II', 'XK120', 'XK140', 'XK150'
    ]
  },
  {
    name: 'Bentley',
    country: 'UK',
    type: 'car',
    models: [
      'Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Arnage',
      'Azure', 'Brooklands', 'Turbo R', 'Continental R', 'Continental T'
    ]
  },
  {
    name: 'Rolls-Royce',
    country: 'UK',
    type: 'car',
    models: [
      'Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spectre',
      'Silver Shadow', 'Silver Spirit', 'Silver Spur', 'Corniche', 'Park Ward'
    ]
  },
  {
    name: 'Aston Martin',
    country: 'UK',
    type: 'car',
    models: [
      'DB11', 'DB12', 'DBS', 'Vantage', 'DBX', 'Rapide', 'Vanquish', 'DB9',
      'DB7', 'V8 Vantage', 'V12 Vantage', 'Virage', 'Lagonda', 'One-77',
      'Vulcan', 'Valkyrie', 'DB5', 'DB4', 'DB6'
    ]
  },
  {
    name: 'McLaren',
    country: 'UK',
    type: 'car',
    models: [
      '720S', '750S', '765LT', 'Artura', 'GT', '570S', '570GT', '540C', '600LT',
      '650S', '675LT', 'P1', 'Senna', 'Speedtail', 'Elva', 'F1', '12C', 'GTS'
    ]
  },
  {
    name: 'Lotus',
    country: 'UK',
    type: 'car',
    models: [
      'Emira', 'Eletre', 'Evija', 'Evora', 'Exige', 'Elise', 'Esprit', 'Europa',
      'Elan', 'Seven', 'Elite', 'Eclat', 'Carlton', '340R'
    ]
  },
  {
    name: 'MINI',
    country: 'UK',
    type: 'car',
    models: [
      'Cooper', 'Cooper S', 'Cooper SE', 'Countryman', 'Clubman', 'Convertible',
      'John Cooper Works', 'Paceman', 'Coupe', 'Roadster', 'Aceman'
    ]
  },
  // === CARS - Italian ===
  {
    name: 'Ferrari',
    country: 'Italy',
    type: 'car',
    models: [
      '296 GTB', '296 GTS', 'SF90', 'F8 Tributo', 'Roma', 'Portofino', '812',
      'Purosangue', 'LaFerrari', '488', '458', 'F12', 'FF', 'GTC4Lusso',
      'California', '599', '612', 'F430', '360', 'F355', '348', 'Testarossa',
      '308', '328', '288 GTO', 'F40', 'F50', 'Enzo', '250', '275', 'Dino'
    ]
  },
  {
    name: 'Lamborghini',
    country: 'Italy',
    type: 'car',
    models: [
      'Huracán', 'Urus', 'Revuelto', 'Aventador', 'Gallardo', 'Murciélago',
      'Diablo', 'Countach', 'Jalpa', 'Urraco', 'Espada', 'Miura', 'Islero',
      'Jarama', 'Silhouette', '350 GT', '400 GT', 'LM002', 'Centenario', 'Sián'
    ]
  },
  {
    name: 'Maserati',
    country: 'Italy',
    type: 'car',
    models: [
      'Ghibli', 'Quattroporte', 'Levante', 'GranTurismo', 'GranCabrio', 'MC20',
      'Grecale', 'Spyder', 'Coupe', '3200 GT', 'Shamal', 'Karif', 'Biturbo',
      'Bora', 'Merak', 'Khamsin', 'Indy', 'Mexico', 'Sebring'
    ]
  },
  {
    name: 'Alfa Romeo',
    country: 'Italy',
    type: 'car',
    models: [
      'Giulia', 'Stelvio', 'Tonale', '4C', '8C', 'Giulietta', 'MiTo', 'Brera',
      'Spider', '159', '156', '147', '166', 'GT', 'GTV', '164', '75', '33',
      'Alfetta', 'Alfasud', 'Montreal', 'Junior', 'Duetto', '2000', '1750'
    ]
  },
  {
    name: 'Fiat',
    country: 'Italy',
    type: 'car',
    models: [
      '500', '500X', '500L', '500e', 'Panda', 'Tipo', 'Punto', 'Bravo', 'Stilo',
      '124 Spider', 'Multipla', 'Doblo', 'Qubo', 'Freemont', 'Sedici', 'Croma',
      'Marea', 'Barchetta', 'Coupe', 'Uno', 'Cinquecento', 'Seicento', '128',
      '131', '132', 'X1/9', 'Ritmo', 'Regata', 'Tempra', 'Palio', 'Siena'
    ]
  },
  // === CARS - French ===
  {
    name: 'Peugeot',
    country: 'France',
    type: 'car',
    models: [
      '208', '308', '408', '508', '2008', '3008', '5008', 'Rifter', 'Traveller',
      'Partner', 'Expert', '207', '307', '407', '607', '107', '206', '406',
      '106', '205', '306', '405', '605', '806', '1007', 'RCZ', '4008', '4007'
    ]
  },
  {
    name: 'Renault',
    country: 'France',
    type: 'car',
    models: [
      'Clio', 'Megane', 'Captur', 'Kadjar', 'Arkana', 'Austral', 'Scenic',
      'Espace', 'Talisman', 'Koleos', 'Zoe', 'Twingo', 'Kangoo', 'Master',
      'Trafic', 'Fluence', 'Laguna', 'Latitude', 'Safrane', 'Vel Satis',
      'Avantime', 'Modus', 'Wind', '5', '9', '11', '19', '21', '25', 'Alpine'
    ]
  },
  {
    name: 'Citroën',
    country: 'France',
    type: 'car',
    models: [
      'C3', 'C4', 'C5', 'C3 Aircross', 'C4 Cactus', 'C5 Aircross', 'Berlingo',
      'SpaceTourer', 'Jumpy', 'Jumper', 'C1', 'C2', 'C6', 'C8', 'DS3', 'DS4',
      'DS5', 'Saxo', 'Xsara', 'Xantia', 'XM', 'CX', 'BX', 'AX', 'ZX', '2CV',
      'Dyane', 'Ami', 'GS', 'SM', 'Mehari', 'Traction Avant'
    ]
  },
  // === CARS - Swedish ===
  {
    name: 'Volvo',
    country: 'Sweden',
    type: 'car',
    models: [
      'S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX90',
      'S40', 'S70', 'S80', 'V40', 'V50', 'V70', 'XC70', 'C30', 'C70', '240',
      '740', '760', '780', '850', '940', '960', 'P1800', 'Amazon', 'PV444'
    ]
  },
  // === CARS - Chinese ===
  {
    name: 'BYD',
    country: 'China',
    type: 'car',
    models: [
      'Seal', 'Dolphin', 'Atto 3', 'Han', 'Tang', 'Song', 'Qin', 'Yuan',
      'Seagull', 'Frigate 7', 'Destroyer 05', 'Sea Lion', 'Yangwang U8'
    ]
  },
  {
    name: 'Geely',
    country: 'China',
    type: 'car',
    models: [
      'Coolray', 'Tugella', 'Emgrand', 'Monjaro', 'Atlas', 'Okavango',
      'Azkarra', 'Preface', 'Icon', 'Xingyue', 'Boyue', 'Binyue'
    ]
  },
  {
    name: 'NIO',
    country: 'China',
    type: 'car',
    models: ['ET5', 'ET7', 'ES6', 'ES7', 'ES8', 'EC6', 'EC7', 'EP9']
  },
  {
    name: 'XPeng',
    country: 'China',
    type: 'car',
    models: ['P7', 'P5', 'G3', 'G6', 'G9', 'X9']
  },
  {
    name: 'Li Auto',
    country: 'China',
    type: 'car',
    models: ['L7', 'L8', 'L9', 'MEGA']
  },
  // === MOTORCYCLES ===
  {
    name: 'Harley-Davidson',
    country: 'USA',
    type: 'motorcycle',
    models: [
      'Street Glide', 'Road Glide', 'Road King', 'Softail', 'Fat Boy', 'Breakout',
      'Heritage Classic', 'Low Rider', 'Street Bob', 'Fat Bob', 'Sportster',
      'Iron 883', 'Forty-Eight', 'Nightster', 'Pan America', 'LiveWire',
      'Electra Glide', 'CVO', 'Tri Glide', 'Freewheeler', 'V-Rod'
    ]
  },
  {
    name: 'Honda Motorcycles',
    country: 'Japan',
    type: 'motorcycle',
    models: [
      'CBR1000RR', 'CBR600RR', 'CBR500R', 'CBR300R', 'CB1000R', 'CB650R',
      'CB500F', 'CB300R', 'Gold Wing', 'Africa Twin', 'Rebel', 'Shadow',
      'Fury', 'CRF', 'XR', 'Grom', 'Monkey', 'Trail', 'NC750X', 'X-ADV'
    ]
  },
  {
    name: 'Yamaha Motorcycles',
    country: 'Japan',
    type: 'motorcycle',
    models: [
      'YZF-R1', 'YZF-R6', 'YZF-R7', 'YZF-R3', 'MT-10', 'MT-09', 'MT-07', 'MT-03',
      'VMAX', 'FJR1300', 'Tracer', 'Tenere', 'Super Tenere', 'Bolt', 'V Star',
      'Star Venture', 'WR', 'YZ', 'TW200', 'SR400', 'XSR', 'NMAX', 'XMAX'
    ]
  },
  {
    name: 'Kawasaki',
    country: 'Japan',
    type: 'motorcycle',
    models: [
      'Ninja ZX-10R', 'Ninja ZX-6R', 'Ninja 650', 'Ninja 400', 'Ninja 300',
      'Z900', 'Z650', 'Z400', 'Versys', 'Vulcan', 'Concours', 'KLR', 'KLX',
      'KX', 'W800', 'H2', 'H2 SX', 'Eliminator', 'Ninja H2'
    ]
  },
  {
    name: 'BMW Motorrad',
    country: 'Germany',
    type: 'motorcycle',
    models: [
      'S1000RR', 'S1000R', 'S1000XR', 'R1250GS', 'R1250RT', 'R1250RS', 'R18',
      'R NineT', 'F900R', 'F900XR', 'F850GS', 'F750GS', 'G310R', 'G310GS',
      'K1600', 'CE 04', 'CE 02', 'M1000RR', 'M1000R', 'M1000XR'
    ]
  },
  {
    name: 'Ducati',
    country: 'Italy',
    type: 'motorcycle',
    models: [
      'Panigale V4', 'Panigale V2', 'Streetfighter V4', 'Streetfighter V2',
      'Monster', 'Diavel', 'Multistrada', 'Hypermotard', 'Scrambler', 'XDiavel',
      'SuperSport', 'Desert X', 'DesertX Discovery', 'Superleggera', '916', '996', '998',
      '999', '1098', '1198', '848', '749', 'ST', 'GT', 'Paso', 'MH900e'
    ]
  },
  {
    name: 'Triumph',
    country: 'UK',
    type: 'motorcycle',
    models: [
      'Speed Triple', 'Street Triple', 'Tiger', 'Bonneville', 'Thruxton',
      'Scrambler', 'Rocket 3', 'Trident', 'Speed Twin', 'Daytona', 'Sprint',
      'Trophy', 'Thunderbird', 'America', 'Speedmaster', 'Bobber'
    ]
  },
  {
    name: 'KTM',
    country: 'Austria',
    type: 'motorcycle',
    models: [
      '1290 Super Duke', '890 Duke', '790 Duke', '390 Duke', '125 Duke',
      '1290 Super Adventure', '890 Adventure', '390 Adventure', 'RC 390',
      'RC 125', 'RC 8C', '450 SX-F', '250 SX-F', '350 EXC-F', '500 EXC-F'
    ]
  },
  {
    name: 'Indian',
    country: 'USA',
    type: 'motorcycle',
    models: [
      'Chief', 'Chieftain', 'Roadmaster', 'Springfield', 'Scout', 'Scout Bobber',
      'FTR', 'Challenger', 'Pursuit', 'Super Chief', 'Vintage', 'Dark Horse'
    ]
  },
  {
    name: 'Aprilia',
    country: 'Italy',
    type: 'motorcycle',
    models: [
      'RSV4', 'Tuono V4', 'RS 660', 'Tuono 660', 'RS 125', 'Shiver', 'Dorsoduro',
      'Caponord', 'SX', 'RX', 'SR GT', 'Mille', 'Falco'
    ]
  },
  {
    name: 'Royal Enfield',
    country: 'India',
    type: 'motorcycle',
    models: [
      'Classic 350', 'Bullet 350', 'Meteor 350', 'Hunter 350', 'Continental GT',
      'Interceptor 650', 'Super Meteor 650', 'Himalayan', 'Scram 411', 'Shotgun 650'
    ]
  },
  // === TRUCKS ===
  {
    name: 'Freightliner',
    country: 'USA',
    type: 'truck',
    models: [
      'Cascadia', 'Columbia', 'Coronado', 'Century', 'Argosy', 'FLD', 'Classic XL',
      'M2', 'Business Class', '114SD', '122SD', 'Sprinter', 'eM2', 'eCascadia'
    ]
  },
  {
    name: 'Kenworth',
    country: 'USA',
    type: 'truck',
    models: [
      'W900', 'T680', 'T880', 'T800', 'C500', 'T660', 'T600', 'W990',
      'T270', 'T370', 'K270', 'K370', 'T440', 'T470', 'T680E'
    ]
  },
  {
    name: 'Peterbilt',
    country: 'USA',
    type: 'truck',
    models: [
      '579', '389', '367', '365', '567', '520', '220', '337', '348',
      '379', '357', '330', '335', '340', '536', '537', '538'
    ]
  },
  {
    name: 'Mack',
    country: 'USA',
    type: 'truck',
    models: [
      'Anthem', 'Granite', 'Pinnacle', 'TerraPro', 'LR', 'MD', 'Titan',
      'Super-Liner', 'R Model', 'CH Series', 'Vision', 'Mack LR Electric'
    ]
  },
  {
    name: 'International',
    country: 'USA',
    type: 'truck',
    models: [
      'LT', 'RH', 'HV', 'HX', 'MV', 'CV', 'LoneStar', 'ProStar', '9900i',
      'WorkStar', 'DuraStar', 'TranStar', 'PayStar', 'eMV'
    ]
  },
  {
    name: 'Volvo Trucks',
    country: 'Sweden',
    type: 'truck',
    models: [
      'VNL', 'VNR', 'VHD', 'VAH', 'VNX', 'FH', 'FH16', 'FM', 'FMX',
      'FE', 'FL', 'VNL Electric', 'VNR Electric'
    ]
  },
  {
    name: 'Scania',
    country: 'Sweden',
    type: 'truck',
    models: [
      'R-Series', 'S-Series', 'G-Series', 'P-Series', 'L-Series', 'XT',
      'NXT', '25 P', '25 L', 'Super', 'V8'
    ]
  },
  {
    name: 'MAN',
    country: 'Germany',
    type: 'truck',
    models: [
      'TGX', 'TGS', 'TGM', 'TGL', 'TGE', 'eTGE', 'eTGM', 'Lion\'s City',
      'Lion\'s Coach', 'Lion\'s Intercity'
    ]
  },
  {
    name: 'DAF',
    country: 'Netherlands',
    type: 'truck',
    models: [
      'XF', 'XG', 'XG+', 'XD', 'XB', 'CF', 'LF', 'XFC', 'XDC'
    ]
  },
  {
    name: 'Isuzu',
    country: 'Japan',
    type: 'truck',
    models: [
      'N-Series', 'F-Series', 'FTR', 'FVR', 'NRR', 'NPR', 'NQR', 'D-Max',
      'MU-X', 'Giga', 'Forward', 'Elf'
    ]
  },
  {
    name: 'Hino',
    country: 'Japan',
    type: 'truck',
    models: [
      '268', '338', '358', '500', '600', '700', 'L6', 'L7', 'XL7', 'XL8',
      'Dutro', 'Ranger', 'Profia'
    ]
  },
  // === MORE CAR BRANDS ===
  {
    name: 'Chrysler',
    country: 'USA',
    type: 'car',
    models: [
      '300', 'Pacifica', 'Voyager', 'Aspen', 'Crossfire', 'PT Cruiser',
      'Sebring', 'Concorde', 'LHS', 'Town & Country', 'New Yorker', 'Fifth Avenue',
      'Imperial', 'Prowler', 'Cirrus', 'Neon', 'Laser', 'LeBaron', 'Cordoba'
    ]
  },
  {
    name: 'Pontiac',
    country: 'USA',
    type: 'car',
    models: [
      'Firebird', 'Trans Am', 'GTO', 'Grand Prix', 'Bonneville', 'G8', 'G6',
      'Solstice', 'Vibe', 'Aztec', 'Grand Am', 'Sunfire', 'Montana', 'Torrent',
      'Fiero', 'Le Mans', 'Tempest', 'Safari', 'Parisienne', '6000'
    ]
  },
  {
    name: 'Oldsmobile',
    country: 'USA',
    type: 'car',
    models: [
      'Cutlass', '442', 'Toronado', '88', '98', 'Alero', 'Aurora', 'Intrigue',
      'Bravada', 'Silhouette', 'Achieva', 'Ciera', 'Delta 88', 'Custom Cruiser'
    ]
  },
  {
    name: 'Saturn',
    country: 'USA',
    type: 'car',
    models: [
      'S-Series', 'L-Series', 'Ion', 'Vue', 'Outlook', 'Aura', 'Sky', 'Relay',
      'SC', 'SL', 'SW', 'LS', 'LW'
    ]
  },
  {
    name: 'Mercury',
    country: 'USA',
    type: 'car',
    models: [
      'Mariner', 'Mountaineer', 'Milan', 'Sable', 'Grand Marquis', 'Cougar',
      'Marauder', 'Monterey', 'Villager', 'Tracer', 'Mystique', 'Capri'
    ]
  },
  {
    name: 'Hummer',
    country: 'USA',
    type: 'car',
    models: ['H1', 'H2', 'H3', 'H3T', 'EV Pickup', 'EV SUV']
  },
  {
    name: 'Saab',
    country: 'Sweden',
    type: 'car',
    models: [
      '9-3', '9-5', '9-7X', '9-2X', '9-4X', '900', '9000', '99', '96', '95',
      '93', 'Sonett'
    ]
  },
  {
    name: 'Polestar',
    country: 'Sweden',
    type: 'car',
    models: ['1', '2', '3', '4', '5', '6']
  },
  {
    name: 'Cupra',
    country: 'Spain',
    type: 'car',
    models: ['Formentor', 'Born', 'Leon', 'Ateca', 'Tavascan', 'Terramar']
  },
  {
    name: 'SEAT',
    country: 'Spain',
    type: 'car',
    models: [
      'Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Toledo', 'Altea', 'Exeo',
      'Alhambra', 'Mii', 'Cordoba', 'Malaga', 'Marbella', 'Ronda'
    ]
  },
  {
    name: 'Skoda',
    country: 'Czech Republic',
    type: 'car',
    models: [
      'Octavia', 'Superb', 'Fabia', 'Kodiaq', 'Karoq', 'Kamiq', 'Scala', 'Enyaq',
      'Rapid', 'Yeti', 'Roomster', 'Felicia', 'Favorit', 'Forman'
    ]
  },
  {
    name: 'Dacia',
    country: 'Romania',
    type: 'car',
    models: [
      'Sandero', 'Duster', 'Jogger', 'Spring', 'Logan', 'Lodgy', 'Dokker'
    ]
  },
  {
    name: 'Lada',
    country: 'Russia',
    type: 'car',
    models: [
      'Niva', 'Vesta', 'XRAY', 'Granta', 'Largus', 'Kalina', 'Priora', '2107',
      '2106', '2105', '2104', '2101', 'Samara', 'Oka'
    ]
  }
];

/**
 * Get all unique make names sorted alphabetically
 */
export function getAllMakes(): string[] {
  return VEHICLE_DATABASE
    .map(v => v.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Get models for a specific make
 */
export function getModelsForMake(makeName: string): string[] {
  const make = VEHICLE_DATABASE.find(
    v => v.name.toLowerCase() === makeName.toLowerCase()
  );
  return make ? [...make.models].sort((a, b) => a.localeCompare(b)) : [];
}

/**
 * Get vehicle type for a make
 */
export function getVehicleType(makeName: string): string | null {
  const make = VEHICLE_DATABASE.find(
    v => v.name.toLowerCase() === makeName.toLowerCase()
  );
  return make ? make.type : null;
}

/**
 * Search makes by partial name
 */
export function searchMakes(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return VEHICLE_DATABASE
    .filter(v => v.name.toLowerCase().includes(lowerQuery))
    .map(v => v.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Get makes by type
 */
export function getMakesByType(type: 'car' | 'motorcycle' | 'truck' | 'multi'): string[] {
  return VEHICLE_DATABASE
    .filter(v => v.type === type || v.type === 'multi')
    .map(v => v.name)
    .sort((a, b) => a.localeCompare(b));
}
