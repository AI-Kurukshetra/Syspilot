import { createClient } from "@supabase/supabase-js"

function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

function isAlreadyRegisteredError(message) {
  const normalized = message.toLowerCase()
  return normalized.includes("already registered") || normalized.includes("already been registered")
}

function isEmailConfirmationError(message) {
  return message.toLowerCase().includes("email not confirmed")
}

const supplierCatalog = [
  { name: "Apex Steel & Alloys", contact: "Mason Rivera", city: "Chicago" },
  { name: "Blue Ridge Components", contact: "Emma Collins", city: "Charlotte" },
  { name: "Summit Industrial Supply", contact: "Noah Patel", city: "Denver" },
  { name: "Northline Fabrication", contact: "Olivia Brooks", city: "Detroit" },
  { name: "Titan Precision Metals", contact: "Liam Turner", city: "Cleveland" },
  { name: "Everest Bearing Works", contact: "Sophia Bennett", city: "Pittsburgh" },
  { name: "Harbor Motion Systems", contact: "Lucas Perry", city: "Seattle" },
  { name: "Ironwood Process Tech", contact: "Ava Reed", city: "St. Louis" },
  { name: "Metro Valve & Flow", contact: "Ethan Carter", city: "Atlanta" },
  { name: "Frontier Tooling Group", contact: "Mia Hayes", city: "Phoenix" },
  { name: "Polar Gasket Industries", contact: "James Foster", city: "Minneapolis" },
  { name: "Delta Industrial Electric", contact: "Isabella Price", city: "Nashville" },
  { name: "Prairie Automation Parts", contact: "Henry Murphy", city: "Kansas City" },
  { name: "Keystone Pump Components", contact: "Amelia Ross", city: "Philadelphia" },
  { name: "Pacific Material Solutions", contact: "Benjamin Ward", city: "San Diego" },
  { name: "Redwood Hydraulics", contact: "Harper Kelly", city: "Sacramento" },
  { name: "Midwest Transmission Co.", contact: "Elijah Gray", city: "Indianapolis" },
  { name: "FoundryLink Components", contact: "Evelyn Cox", city: "Milwaukee" },
  { name: "Vertex Industrial Bearings", contact: "Daniel Morris", city: "Columbus" },
  { name: "Granite Machine Supplies", contact: "Scarlett Diaz", city: "Salt Lake City" },
]

const customerCatalog = [
  "Atlas Foods Manufacturing",
  "Brightline Packaging",
  "Cedar Valley Equipment",
  "Nova Auto Components",
  "Evergreen Processors",
  "Summit Beverage Works",
  "Helios Energy Systems",
  "IronPeak Construction",
  "Bluewater Marine Tech",
  "Meridian Pharma Labs",
  "Northstar Retail Logistics",
  "Sterling Medical Devices",
  "Harbor Freight Networks",
  "Asteria Consumer Goods",
  "Oakridge Furniture Co.",
  "Pioneer Plastics Group",
  "Westfield Agro Industries",
  "Lighthouse Chemical Works",
  "Vertex Smart Appliances",
  "ClearPath Mobility",
  "Glenwood Home Products",
  "Aurora Textiles",
  "Silverline Defense Tech",
  "Horizon Telecom Hardware",
  "Bridgeport HVAC Systems",
  "Pacific Fresh Foods",
  "Summit Solar Manufacturing",
  "Magnum Industrial Robotics",
  "Riverstone Paper Mills",
  "PrimeCore Electronics",
  "Golden Gate Hospitality Supply",
  "Blackstone Mining Equipments",
  "Delta Rail Components",
  "Cloudline Aerospace Parts",
  "Canyon Outdoor Gear",
  "UrbanGrid Infrastructure",
  "Fusion Biotech Instruments",
  "Greenfield Dairy Systems",
  "Omni Secure Solutions",
  "Velocity E-Bike Assembly",
  "MetroBuild Materials",
  "Ridgeview Ceramics",
  "NovaPulse Semiconductors",
  "Edgewater Water Systems",
  "BrightForge Lighting",
  "Aspire Office Furniture",
  "Zenith Cold Chain Logistics",
  "TerraForm Agricultural Tech",
  "Inland Marine Engines",
  "Coreline Industrial Printing",
]

const productCatalog = [
  { sku: "RM-STEEL-COIL-A36", name: "A36 Steel Coil", category: "raw_material", unit: "KG", cost: 2.8 },
  { sku: "RM-ALUM-SHEET-5052", name: "5052 Aluminum Sheet", category: "raw_material", unit: "KG", cost: 4.6 },
  { sku: "RM-COPPER-BAR-C110", name: "C110 Copper Bar", category: "raw_material", unit: "KG", cost: 8.2 },
  { sku: "RM-RUBBER-NBR", name: "NBR Industrial Rubber Roll", category: "raw_material", unit: "M", cost: 6.5 },
  { sku: "RM-ABS-PELLET", name: "ABS Resin Pellets", category: "raw_material", unit: "KG", cost: 2.3 },
  { sku: "RM-PP-PELLET", name: "Polypropylene Pellets", category: "raw_material", unit: "KG", cost: 2.1 },
  { sku: "RM-SS-PIPE-304", name: "304 Stainless Pipe", category: "raw_material", unit: "M", cost: 11.4 },
  { sku: "RM-BRASS-ROD", name: "Brass Rod Stock", category: "raw_material", unit: "KG", cost: 7.9 },
  { sku: "RM-NYLON-BAR", name: "Nylon Round Bar", category: "raw_material", unit: "M", cost: 5.2 },
  { sku: "RM-CARBON-FIBER", name: "Carbon Fiber Fabric", category: "raw_material", unit: "M", cost: 18.5 },
  { sku: "CP-BRG-6205", name: "Deep Groove Bearing 6205", category: "component", unit: "EA", cost: 9.8 },
  { sku: "CP-BRG-6208", name: "Deep Groove Bearing 6208", category: "component", unit: "EA", cost: 13.4 },
  { sku: "CP-SHAFT-25MM", name: "Hardened Shaft 25mm", category: "component", unit: "EA", cost: 22.6 },
  { sku: "CP-SHAFT-40MM", name: "Hardened Shaft 40mm", category: "component", unit: "EA", cost: 31.2 },
  { sku: "CP-VALVE-BALL-1IN", name: "1in Ball Valve", category: "component", unit: "EA", cost: 15.7 },
  { sku: "CP-VALVE-CHECK-1IN", name: "1in Check Valve", category: "component", unit: "EA", cost: 17.1 },
  { sku: "CP-GASKET-PTFE-50", name: "PTFE Gasket 50mm", category: "component", unit: "EA", cost: 3.2 },
  { sku: "CP-SEAL-VITON-45", name: "Viton Oil Seal 45mm", category: "component", unit: "EA", cost: 4.9 },
  { sku: "CP-COUPLING-FLEX-30", name: "Flexible Coupling 30mm", category: "component", unit: "EA", cost: 12.3 },
  { sku: "CP-COUPLING-FLEX-45", name: "Flexible Coupling 45mm", category: "component", unit: "EA", cost: 16.9 },
  { sku: "CP-CHAIN-08B", name: "Roller Chain 08B", category: "component", unit: "M", cost: 8.6 },
  { sku: "CP-SPROCKET-20T", name: "Sprocket 20T", category: "component", unit: "EA", cost: 11.4 },
  { sku: "CP-SPROCKET-28T", name: "Sprocket 28T", category: "component", unit: "EA", cost: 13.2 },
  { sku: "CP-GEAR-HELICAL-2M", name: "Helical Gear 2M", category: "component", unit: "EA", cost: 19.8 },
  { sku: "CP-GEAR-SPUR-1.5M", name: "Spur Gear 1.5M", category: "component", unit: "EA", cost: 14.6 },
  { sku: "CP-MOTOR-1.5KW", name: "1.5kW AC Motor", category: "component", unit: "EA", cost: 148 },
  { sku: "CP-MOTOR-3KW", name: "3kW AC Motor", category: "component", unit: "EA", cost: 219 },
  { sku: "CP-DRIVE-VFD-2.2KW", name: "VFD Drive 2.2kW", category: "component", unit: "EA", cost: 196 },
  { sku: "CP-SENSOR-PROX-M12", name: "M12 Proximity Sensor", category: "component", unit: "EA", cost: 24.5 },
  { sku: "CP-SENSOR-PRESS-10BAR", name: "Pressure Sensor 10bar", category: "component", unit: "EA", cost: 38.9 },
  { sku: "CS-COOLANT-SYNTH", name: "Synthetic Coolant 20L", category: "consumable", unit: "EA", cost: 56 },
  { sku: "CS-LUBE-ISO46", name: "Hydraulic Oil ISO 46", category: "consumable", unit: "L", cost: 4.2 },
  { sku: "CS-GREASE-EP2", name: "EP2 Bearing Grease", category: "consumable", unit: "KG", cost: 6.1 },
  { sku: "CS-CUTTER-CARBIDE-10", name: "Carbide End Mill 10mm", category: "consumable", unit: "EA", cost: 27.4 },
  { sku: "CS-CUTTER-CARBIDE-16", name: "Carbide End Mill 16mm", category: "consumable", unit: "EA", cost: 39.1 },
  { sku: "CS-FILTER-OIL-400", name: "Hydraulic Oil Filter 400", category: "consumable", unit: "EA", cost: 8.3 },
  { sku: "CS-FILTER-AIR-220", name: "Compressor Air Filter 220", category: "consumable", unit: "EA", cost: 10.6 },
  { sku: "CS-WIRE-ER70S", name: "Welding Wire ER70S", category: "consumable", unit: "KG", cost: 5.7 },
  { sku: "CS-ELECTRODE-E6013", name: "Electrode E6013 Pack", category: "consumable", unit: "BOX", cost: 18.5 },
  { sku: "CS-PACK-STRETCH-ROLL", name: "Stretch Wrap Roll", category: "consumable", unit: "EA", cost: 9.2 },
  { sku: "WIP-PUMP-HOUSING", name: "Pump Housing Assembly", category: "wip", unit: "EA", cost: 84 },
  { sku: "WIP-IMPELLER-ASSY", name: "Impeller Sub-Assembly", category: "wip", unit: "EA", cost: 49 },
  { sku: "WIP-SHAFT-MODULE", name: "Drive Shaft Module", category: "wip", unit: "EA", cost: 66 },
  { sku: "WIP-CONTROL-PANEL", name: "Control Panel Sub-Assembly", category: "wip", unit: "EA", cost: 112 },
  { sku: "WIP-FRAME-WELDED", name: "Welded Frame Assembly", category: "wip", unit: "EA", cost: 71 },
  { sku: "WIP-VALVE-BLOCK", name: "Valve Block Unit", category: "wip", unit: "EA", cost: 58 },
  { sku: "WIP-GEARBOX-ASSY", name: "Gearbox Assembly", category: "wip", unit: "EA", cost: 136 },
  { sku: "WIP-DRIVE-MODULE", name: "Drive Module Assembly", category: "wip", unit: "EA", cost: 124 },
  { sku: "WIP-SEAL-CARTRIDGE", name: "Seal Cartridge Assembly", category: "wip", unit: "EA", cost: 45 },
  { sku: "WIP-MOTOR-BRACKET", name: "Motor Bracket Assembly", category: "wip", unit: "EA", cost: 37 },
  { sku: "FG-HYD-PUMP-P100", name: "Hydraulic Pump P100", category: "finished_good", unit: "EA", cost: 212 },
  { sku: "FG-HYD-PUMP-P200", name: "Hydraulic Pump P200", category: "finished_good", unit: "EA", cost: 265 },
  { sku: "FG-HYD-PUMP-P300", name: "Hydraulic Pump P300", category: "finished_good", unit: "EA", cost: 318 },
  { sku: "FG-GEARBOX-GX40", name: "Industrial Gearbox GX40", category: "finished_good", unit: "EA", cost: 284 },
  { sku: "FG-GEARBOX-GX60", name: "Industrial Gearbox GX60", category: "finished_good", unit: "EA", cost: 349 },
  { sku: "FG-ACTUATOR-A12", name: "Linear Actuator A12", category: "finished_good", unit: "EA", cost: 194 },
  { sku: "FG-ACTUATOR-A20", name: "Linear Actuator A20", category: "finished_good", unit: "EA", cost: 226 },
  { sku: "FG-VALVE-CTRL-V10", name: "Control Valve V10", category: "finished_good", unit: "EA", cost: 167 },
  { sku: "FG-VALVE-CTRL-V22", name: "Control Valve V22", category: "finished_good", unit: "EA", cost: 214 },
  { sku: "FG-MIXER-IND-M5", name: "Industrial Mixer M5", category: "finished_good", unit: "EA", cost: 402 },
  { sku: "FG-MIXER-IND-M8", name: "Industrial Mixer M8", category: "finished_good", unit: "EA", cost: 456 },
  { sku: "FG-COMP-AIR-C15", name: "Air Compressor C15", category: "finished_good", unit: "EA", cost: 523 },
  { sku: "FG-COMP-AIR-C25", name: "Air Compressor C25", category: "finished_good", unit: "EA", cost: 618 },
  { sku: "FG-CHILLER-CH10", name: "Process Chiller CH10", category: "finished_good", unit: "EA", cost: 711 },
  { sku: "FG-CHILLER-CH20", name: "Process Chiller CH20", category: "finished_good", unit: "EA", cost: 836 },
  { sku: "FG-FILTER-UNIT-F90", name: "Filtration Unit F90", category: "finished_good", unit: "EA", cost: 276 },
  { sku: "FG-FILTER-UNIT-F120", name: "Filtration Unit F120", category: "finished_good", unit: "EA", cost: 341 },
  { sku: "FG-ROBOT-ARM-R4", name: "Material Handling Arm R4", category: "finished_good", unit: "EA", cost: 1280 },
  { sku: "FG-ROBOT-ARM-R7", name: "Material Handling Arm R7", category: "finished_good", unit: "EA", cost: 1670 },
  { sku: "CP-BOLT-M8-ZN", name: "Hex Bolt M8 Zinc", category: "component", unit: "BOX", cost: 12.8 },
  { sku: "CP-BOLT-M12-ZN", name: "Hex Bolt M12 Zinc", category: "component", unit: "BOX", cost: 18.6 },
  { sku: "CP-NUT-M8-ZN", name: "Hex Nut M8 Zinc", category: "component", unit: "BOX", cost: 8.4 },
  { sku: "CP-NUT-M12-ZN", name: "Hex Nut M12 Zinc", category: "component", unit: "BOX", cost: 11.7 },
  { sku: "CP-WASHER-M8", name: "Flat Washer M8", category: "component", unit: "BOX", cost: 6.9 },
  { sku: "CP-WASHER-M12", name: "Flat Washer M12", category: "component", unit: "BOX", cost: 8.2 },
  { sku: "CP-SPRING-COMPRESSION-30", name: "Compression Spring 30mm", category: "component", unit: "EA", cost: 2.6 },
  { sku: "CP-SPRING-COMPRESSION-45", name: "Compression Spring 45mm", category: "component", unit: "EA", cost: 3.7 },
  { sku: "CP-HOSE-HYD-10MM", name: "Hydraulic Hose 10mm", category: "component", unit: "M", cost: 5.4 },
  { sku: "CP-HOSE-HYD-16MM", name: "Hydraulic Hose 16mm", category: "component", unit: "M", cost: 8.1 },
  { sku: "RM-PAINT-POWDER-BLUE", name: "Powder Coat Blue", category: "raw_material", unit: "KG", cost: 7.3 },
  { sku: "RM-PAINT-POWDER-BLACK", name: "Powder Coat Black", category: "raw_material", unit: "KG", cost: 7.1 },
  { sku: "CS-PACK-CARTON-L", name: "Shipping Carton Large", category: "consumable", unit: "EA", cost: 2.9 },
  { sku: "CS-PACK-CARTON-M", name: "Shipping Carton Medium", category: "consumable", unit: "EA", cost: 2.1 },
  { sku: "CS-LABEL-RFID", name: "RFID Inventory Label", category: "consumable", unit: "PKG", cost: 16.4 },
  { sku: "CS-TAPE-IND-HEAVY", name: "Industrial Tape Heavy Duty", category: "consumable", unit: "EA", cost: 4.8 },
  { sku: "WIP-PUMP-TEST-RIG", name: "Pump Test Rig Assembly", category: "wip", unit: "EA", cost: 158 },
  { sku: "WIP-COMP-SKID-BASE", name: "Compressor Skid Base", category: "wip", unit: "EA", cost: 142 },
  { sku: "WIP-COOLING-MODULE", name: "Cooling Module Assembly", category: "wip", unit: "EA", cost: 173 },
  { sku: "FG-POWER-PACK-H150", name: "Hydraulic Power Pack H150", category: "finished_good", unit: "EA", cost: 936 },
  { sku: "FG-POWER-PACK-H220", name: "Hydraulic Power Pack H220", category: "finished_good", unit: "EA", cost: 1184 },
  { sku: "FG-AGITATOR-AQ30", name: "Tank Agitator AQ30", category: "finished_good", unit: "EA", cost: 624 },
  { sku: "FG-AGITATOR-AQ50", name: "Tank Agitator AQ50", category: "finished_good", unit: "EA", cost: 782 },
  { sku: "CP-PANEL-HMI-7IN", name: "HMI Touch Panel 7in", category: "component", unit: "EA", cost: 259 },
  { sku: "CP-PLC-MODULE-24IO", name: "PLC Module 24 IO", category: "component", unit: "EA", cost: 321 },
  { sku: "CP-SWITCH-SAFETY", name: "Safety Interlock Switch", category: "component", unit: "EA", cost: 29.7 },
  { sku: "CP-RELAY-24V", name: "Control Relay 24V", category: "component", unit: "EA", cost: 6.3 },
  { sku: "RM-CAST-IRON-BLOCK", name: "Cast Iron Block", category: "raw_material", unit: "KG", cost: 3.9 },
  { sku: "RM-POLYCARB-SHEET", name: "Polycarbonate Sheet", category: "raw_material", unit: "M", cost: 12.1 },
  { sku: "CS-SOLVENT-DEGREASER", name: "Degreasing Solvent 5L", category: "consumable", unit: "EA", cost: 19.5 },
  { sku: "CS-GLOVE-NITRILE", name: "Nitrile Gloves Pack", category: "consumable", unit: "BOX", cost: 7.4 },
]

function chunkArray(items, chunkSize) {
  const chunks = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

async function upsertInChunks(client, table, rows, onConflict, selectColumns) {
  const allRows = []

  for (const chunk of chunkArray(rows, 100)) {
    const query = client
      .from(table)
      .upsert(chunk, { onConflict })

    const result = selectColumns ? await query.select(selectColumns) : await query

    if (result.error) {
      throw new Error(`Failed to upsert ${table}: ${result.error.message}`)
    }

    if (selectColumns) {
      allRows.push(...(result.data ?? []))
    }
  }

  return allRows
}

async function insertInChunks(client, table, rows) {
  for (const chunk of chunkArray(rows, 150)) {
    const { error } = await client.from(table).insert(chunk)
    if (error) {
      throw new Error(`Failed to insert ${table}: ${error.message}`)
    }
  }
}

async function deleteByIdsInChunks(client, table, column, ids) {
  for (const chunk of chunkArray(ids, 100)) {
    const { error } = await client.from(table).delete().in(column, chunk)
    if (error) {
      throw new Error(`Failed to delete ${table}: ${error.message}`)
    }
  }
}

async function authenticateSeedUser(url, anonKey, email, password, fullName) {
  const client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const signInResult = await client.auth.signInWithPassword({ email, password })
  if (!signInResult.error && signInResult.data.session && signInResult.data.user) {
    return signInResult.data
  }

  const signUpResult = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "company_admin",
        company_name: "SysPilot Demo Manufacturing",
        company_slug: "demo",
      },
    },
  })

  if (signUpResult.error && !isAlreadyRegisteredError(signUpResult.error.message)) {
    throw new Error(`Unable to create seed user: ${signUpResult.error.message}`)
  }

  const signInRetry = await client.auth.signInWithPassword({ email, password })
  if (signInRetry.error || !signInRetry.data.session || !signInRetry.data.user) {
    const errorMessage = signInRetry.error?.message ?? "unknown sign-in error"

    if (isEmailConfirmationError(errorMessage)) {
      throw new Error(
        "Seed user exists but email confirmation is required. Confirm the account or disable email confirmation in Supabase Auth settings before seeding."
      )
    }

    throw new Error(`Unable to authenticate seed user: ${errorMessage}`)
  }

  return signInRetry.data
}

async function run() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@syspilot.com"
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "SysPilot#2026"
  const seedAdminFullName = process.env.SEED_ADMIN_FULL_NAME ?? "SysPilot Admin"

  console.log("Seeding SysPilot data (expanded dataset)...")

  const authData = await authenticateSeedUser(
    supabaseUrl,
    supabaseAnonKey,
    seedAdminEmail,
    seedAdminPassword,
    seedAdminFullName
  )

  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  })

  const userId = authData.user.id

  const { data: currentProfile, error: currentProfileError } = await authedClient
    .from("profiles")
    .select("company_id, role")
    .eq("id", userId)
    .maybeSingle()

  if (currentProfileError) {
    throw new Error(`Failed to read current profile: ${currentProfileError.message}`)
  }

  let companyId = currentProfile?.company_id ?? null

  if (!companyId) {
    if (currentProfile?.role !== "super_admin") {
      throw new Error("Seed user must belong to a company or be a super_admin.")
    }

    const { data: createdCompany, error: createdCompanyError } = await authedClient
      .from("companies")
      .insert({
        name: "SysPilot Demo Manufacturing",
        code: "DEMO",
        slug: "demo",
        industry: "Manufacturing",
        country: "US",
        currency: "USD",
        city: "Austin",
      })
      .select("id")
      .single()

    if (createdCompanyError || !createdCompany) {
      throw new Error(
        `Failed to create demo company for super admin seed: ${createdCompanyError?.message ?? "no company id returned"}`
      )
    }

    companyId = createdCompany.id
  }

  const { error: profileError } = await authedClient.from("profiles").upsert(
    {
      id: userId,
      company_id: companyId,
      full_name: seedAdminFullName,
      email: seedAdminEmail,
      role: "company_admin",
      is_active: true,
    },
    { onConflict: "id" }
  )

  if (profileError) {
    throw new Error(`Failed to seed profile: ${profileError.message}`)
  }

  const facilities = await upsertInChunks(
    authedClient,
    "facilities",
    [
      {
        company_id: companyId,
        name: "Main Warehouse",
        code: "MAIN-WH",
        type: "warehouse",
        city: "Austin",
        country: "US",
      },
      {
        company_id: companyId,
        name: "Assembly Plant",
        code: "ASMB-PLANT",
        type: "plant",
        city: "Dallas",
        country: "US",
      },
      {
        company_id: companyId,
        name: "Distribution Center",
        code: "DIST-HUB",
        type: "distribution_center",
        city: "Houston",
        country: "US",
      },
    ],
    "company_id,code",
    "id,code"
  )

  const facilityIds = facilities.map((row) => row.id)

  const supplierRows = Array.from({ length: 20 }, (_, index) => {
    const supplierNumber = String(index + 1).padStart(3, "0")
    const supplierInfo = supplierCatalog[index % supplierCatalog.length]
    const emailHandle = supplierInfo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/(^\.)|(\.$)/g, "")

    return {
      company_id: companyId,
      code: `SUP-${supplierNumber}`,
      name: supplierInfo.name,
      contact_person: supplierInfo.contact,
      email: `${emailHandle}@example.com`,
      phone: `+1-555-81${String(index).padStart(2, "0")}`,
      city: supplierInfo.city,
      country: "US",
      rating: 3.5 + (index % 3) * 0.5,
      lead_time_days: 5 + (index % 10),
    }
  })

  const suppliers = await upsertInChunks(
    authedClient,
    "suppliers",
    supplierRows,
    "company_id,code",
    "id,code"
  )

  const supplierIds = suppliers.map((row) => row.id)

  const customerRows = Array.from({ length: 50 }, (_, index) => {
    const customerNumber = String(index + 1).padStart(3, "0")
    const customerName = customerCatalog[index % customerCatalog.length]
    const emailHandle = customerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/(^\.)|(\.$)/g, "")

    return {
      company_id: companyId,
      code: `CUST-${customerNumber}`,
      name: customerName,
      contact_person: `Procurement Lead ${String(index + 11).padStart(2, "0")}`,
      email: `${emailHandle}@example.com`,
      phone: `+1-555-90${String(index).padStart(2, "0")}`,
      country: "US",
      credit_limit: 15000 + index * 600,
    }
  })

  const customers = await upsertInChunks(
    authedClient,
    "customers",
    customerRows,
    "company_id,code",
    "id,code"
  )

  const customerIds = customers.map((row) => row.id)

  const productRows = productCatalog.map((product, index) => {
    const baseCost = Number(product.cost)
    const markupFactor =
      product.category === "finished_good"
        ? 1.52
        : product.category === "wip"
          ? 1.36
          : 1.24

    const quantityOnHand = 70 + (index % 12) * 14
    const reorderLevel = 18 + (index % 8) * 4

    return {
      company_id: companyId,
      sku: product.sku,
      name: product.name,
      description: `${product.name} for industrial manufacturing operations`,
      category: product.category,
      unit_of_measure: product.unit,
      quantity_on_hand: quantityOnHand,
      reorder_level: reorderLevel,
      reorder_quantity: reorderLevel * 3,
      unit_cost: Number(baseCost.toFixed(2)),
      selling_price: Number((baseCost * markupFactor).toFixed(2)),
      overhead_cost: Number((baseCost * 0.17).toFixed(2)),
      labor_cost_per_unit: Number((baseCost * 0.13).toFixed(2)),
      facility_id: facilityIds[index % facilityIds.length],
      supplier_id: supplierIds[index % supplierIds.length],
      is_active: true,
    }
  })

  const products = await upsertInChunks(
    authedClient,
    "products",
    productRows,
    "company_id,sku",
    "id,sku,unit_cost,selling_price,category"
  )

  const finishedProductIds = products
    .filter((product) => product.category === "finished_good" || product.category === "wip")
    .map((product) => product.id)

  const salesStatuses = ["draft", "confirmed", "in_production", "shipped", "delivered", "invoiced"]
  const purchaseStatuses = ["draft", "sent", "acknowledged", "partially_received", "received"]
  const workOrderStatuses = ["planned", "released", "in_progress", "completed"]

  const salesOrderRows = Array.from({ length: 100 }, (_, index) => {
    const orderNo = String(index + 1).padStart(4, "0")
    const quantity = 5 + (index % 8)
    const product = products[index % products.length]
    const unitPrice = Number(product.selling_price ?? 50)
    const subtotal = quantity * unitPrice
    const taxAmount = subtotal * 0.1

    return {
      company_id: companyId,
      order_number: `SO-${orderNo}`,
      customer_id: customerIds[index % customerIds.length],
      status: salesStatuses[index % salesStatuses.length],
      order_date: new Date(Date.UTC(2026, index % 12, (index % 27) + 1)).toISOString(),
      subtotal,
      tax_rate: 10,
      tax_amount: taxAmount,
      total_amount: subtotal + taxAmount,
      created_by: userId,
    }
  })

  const salesOrders = await upsertInChunks(
    authedClient,
    "sales_orders",
    salesOrderRows,
    "company_id,order_number",
    "id,order_number,total_amount"
  )

  await deleteByIdsInChunks(
    authedClient,
    "sales_order_lines",
    "sales_order_id",
    salesOrders.map((row) => row.id)
  )

  const salesOrderLineRows = salesOrders.map((order, index) => {
    const product = products[index % products.length]
    const quantity = 5 + (index % 8)
    const unitPrice = Number(product.selling_price ?? 50)

    return {
      sales_order_id: order.id,
      product_id: product.id,
      quantity,
      unit_price: unitPrice,
      line_total: quantity * unitPrice,
      sort_order: 1,
    }
  })

  await insertInChunks(authedClient, "sales_order_lines", salesOrderLineRows)

  const purchaseOrderRows = Array.from({ length: 100 }, (_, index) => {
    const orderNo = String(index + 1).padStart(4, "0")
    const quantity = 20 + (index % 15)
    const product = products[(index * 2) % products.length]
    const unitCost = Number(product.unit_cost ?? 25)
    const subtotal = quantity * unitCost
    const taxAmount = subtotal * 0.1

    return {
      company_id: companyId,
      po_number: `PO-${orderNo}`,
      supplier_id: supplierIds[index % supplierIds.length],
      status: purchaseStatuses[index % purchaseStatuses.length],
      order_date: new Date(Date.UTC(2026, index % 12, (index % 26) + 1)).toISOString(),
      subtotal,
      tax_rate: 10,
      tax_amount: taxAmount,
      total_amount: subtotal + taxAmount,
      created_by: userId,
    }
  })

  const purchaseOrders = await upsertInChunks(
    authedClient,
    "purchase_orders",
    purchaseOrderRows,
    "company_id,po_number",
    "id,po_number"
  )

  await deleteByIdsInChunks(
    authedClient,
    "purchase_order_lines",
    "purchase_order_id",
    purchaseOrders.map((row) => row.id)
  )

  const purchaseOrderLineRows = purchaseOrders.map((order, index) => {
    const product = products[(index * 2) % products.length]
    const quantity = 20 + (index % 15)
    const unitCost = Number(product.unit_cost ?? 25)

    return {
      purchase_order_id: order.id,
      product_id: product.id,
      quantity_ordered: quantity,
      quantity_received: Math.floor(quantity * 0.4),
      unit_cost: unitCost,
      line_total: quantity * unitCost,
      sort_order: 1,
    }
  })

  await insertInChunks(authedClient, "purchase_order_lines", purchaseOrderLineRows)

  const workOrderRows = Array.from({ length: 100 }, (_, index) => {
    const woNo = String(index + 1).padStart(4, "0")
    const quantityPlanned = 5 + (index % 12)
    const status = workOrderStatuses[index % workOrderStatuses.length]

    return {
      company_id: companyId,
      wo_number: `WO-${woNo}`,
      product_id: finishedProductIds[index % finishedProductIds.length],
      sales_order_id: salesOrders[index % salesOrders.length].id,
      status,
      priority: ["low", "medium", "high", "urgent"][index % 4],
      quantity_planned: quantityPlanned,
      quantity_completed: status === "completed" ? quantityPlanned : Math.floor(quantityPlanned * 0.5),
      planned_start: new Date(Date.UTC(2026, (index + 1) % 12, 1)).toISOString(),
      planned_end: new Date(Date.UTC(2026, (index + 1) % 12, 8)).toISOString(),
      created_by: userId,
    }
  })

  const workOrders = await upsertInChunks(
    authedClient,
    "work_orders",
    workOrderRows,
    "company_id,wo_number",
    "id,wo_number,product_id"
  )

  const transactionRows = []
  let runningBalance = 0

  for (let index = 0; index < salesOrders.length; index += 1) {
    const amount = Number(salesOrderRows[index].total_amount)
    runningBalance += amount
    transactionRows.push({
      company_id: companyId,
      transaction_number: `TXN-S-${String(index + 1).padStart(4, "0")}`,
      type: "revenue",
      category: "sales",
      reference_type: "sales_order",
      reference_id: salesOrders[index].id,
      description: `Revenue for ${salesOrders[index].order_number}`,
      amount,
      running_balance: runningBalance,
      transaction_date: new Date(Date.UTC(2026, index % 12, (index % 27) + 1)).toISOString(),
      created_by: userId,
    })
  }

  for (let index = 0; index < purchaseOrders.length; index += 1) {
    const amount = Number(purchaseOrderRows[index].total_amount)
    runningBalance -= amount
    transactionRows.push({
      company_id: companyId,
      transaction_number: `TXN-P-${String(index + 1).padStart(4, "0")}`,
      type: "expense",
      category: "purchase",
      reference_type: "purchase_order",
      reference_id: purchaseOrders[index].id,
      description: `Procurement cost for ${purchaseOrders[index].po_number}`,
      amount,
      running_balance: runningBalance,
      transaction_date: new Date(Date.UTC(2026, index % 12, (index % 26) + 1)).toISOString(),
      created_by: userId,
    })
  }

  await upsertInChunks(
    authedClient,
    "transactions",
    transactionRows,
    "company_id,transaction_number"
  )

  const qualityRows = workOrders.map((workOrder, index) => {
    const inspectedQty = 5 + (index % 12)
    const failedQty = index % 6 === 0 ? 1 : 0

    return {
      company_id: companyId,
      inspection_number: `QC-${String(index + 1).padStart(4, "0")}`,
      product_id: workOrder.product_id,
      work_order_id: workOrder.id,
      inspection_type: ["incoming", "in_process", "final", "customer_return"][index % 4],
      status: failedQty > 0 ? "failed" : "passed",
      quantity_inspected: inspectedQty,
      quantity_passed: inspectedQty - failedQty,
      quantity_failed: failedQty,
      defect_description: failedQty > 0 ? "Surface variance" : null,
      corrective_action: failedQty > 0 ? "Rework required" : null,
      inspector_id: userId,
      inspected_at: new Date(Date.UTC(2026, index % 12, (index % 25) + 1)).toISOString(),
    }
  })

  await upsertInChunks(
    authedClient,
    "quality_inspections",
    qualityRows,
    "company_id,inspection_number"
  )

  const { data: existingSeedBoms, error: existingSeedBomsError } = await authedClient
    .from("bill_of_materials")
    .select("id")
    .eq("company_id", companyId)
    .ilike("bom_name", "Standard BOM %")

  if (existingSeedBomsError) {
    throw new Error(`Failed to lookup seeded BOMs: ${existingSeedBomsError.message}`)
  }

  const existingSeedBomIds = (existingSeedBoms ?? []).map((row) => row.id)

  if (existingSeedBomIds.length > 0) {
    await deleteByIdsInChunks(
      authedClient,
      "bom_lines",
      "bom_id",
      existingSeedBomIds
    )

    await deleteByIdsInChunks(
      authedClient,
      "bill_of_materials",
      "id",
      existingSeedBomIds
    )
  }

  const bomHeaderRows = finishedProductIds.slice(0, 30).map((productId, index) => ({
    company_id: companyId,
    product_id: productId,
    bom_name: `Standard BOM ${String(index + 1).padStart(3, "0")}`,
    version: "1.0",
    status: "active",
    created_by: userId,
  }))

  await insertInChunks(authedClient, "bill_of_materials", bomHeaderRows)

  const { data: boms, error: bomsError } = await authedClient
    .from("bill_of_materials")
    .select("id,product_id,bom_name")
    .eq("company_id", companyId)
    .ilike("bom_name", "Standard BOM %")
    .order("bom_name")

  if (bomsError || !boms) {
    throw new Error(`Failed to load seeded BOM headers: ${bomsError?.message ?? "missing rows"}`)
  }

  const bomLineRows = []
  for (let index = 0; index < boms.length; index += 1) {
    for (let lineNo = 0; lineNo < 3; lineNo += 1) {
      const componentProduct = products[(index * 3 + lineNo) % products.length]
      bomLineRows.push({
        bom_id: boms[index].id,
        component_id: componentProduct.id,
        quantity_required: 1 + lineNo,
        unit_cost: Number(componentProduct.unit_cost ?? 0),
        sort_order: lineNo + 1,
      })
    }
  }

  await insertInChunks(authedClient, "bom_lines", bomLineRows)

  const today = new Date()
  const forecastRows = []

  for (let productIndex = 0; productIndex < products.length; productIndex += 1) {
    for (let monthOffset = 0; monthOffset < 3; monthOffset += 1) {
      const forecastDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset, 1))
      const predicted = 90 + (productIndex % 30) * 3 + monthOffset * 6
      const actual = predicted - ((productIndex + monthOffset) % 8)

      forecastRows.push({
        company_id: companyId,
        product_id: products[productIndex].id,
        forecast_date: forecastDate.toISOString().slice(0, 10),
        predicted_demand: predicted,
        actual_demand: actual,
        confidence_score: 82 + ((productIndex + monthOffset) % 12),
        model_version: "seed-v3",
      })
    }
  }

  const { error: deleteForecastError } = await authedClient
    .from("demand_forecasts")
    .delete()
    .eq("company_id", companyId)
    .eq("model_version", "seed-v3")

  if (deleteForecastError) {
    throw new Error(`Failed to clear previous seed forecasts: ${deleteForecastError.message}`)
  }

  await insertInChunks(authedClient, "demand_forecasts", forecastRows)

  console.log("Seed completed successfully.")
  console.log(`Seed admin: ${seedAdminEmail}`)
  console.log("Created/updated: 50 customers, 20 suppliers, 100 products, 100 sales orders, 100 purchase orders, 100 work orders, 100 quality inspections, 30 BOMs, 300 forecasts.")
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
