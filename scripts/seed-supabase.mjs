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
        role: "admin",
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

  const { data: companyData, error: companyError } = await authedClient
    .from("companies")
    .upsert(
      {
        name: "SysPilot Demo Manufacturing",
        code: "DEMO",
        industry: "Manufacturing",
        country: "US",
        currency: "USD",
        city: "Austin",
      },
      { onConflict: "code" }
    )
    .select("id")
    .single()

  if (companyError || !companyData) {
    throw new Error(`Failed to seed company: ${companyError?.message ?? "no company id returned"}`)
  }

  const companyId = companyData.id

  const { error: profileError } = await authedClient.from("profiles").upsert(
    {
      id: userId,
      company_id: companyId,
      full_name: seedAdminFullName,
      email: seedAdminEmail,
      role: "admin",
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
    "code",
    "id,code"
  )

  const facilityIds = facilities.map((row) => row.id)

  const supplierRows = Array.from({ length: 20 }, (_, index) => {
    const supplierNumber = String(index + 1).padStart(3, "0")
    return {
      company_id: companyId,
      code: `SUP-${supplierNumber}`,
      name: `Supplier ${supplierNumber}`,
      contact_person: `Contact ${supplierNumber}`,
      email: `supplier${supplierNumber}@example.com`,
      phone: `+1-555-81${String(index).padStart(2, "0")}`,
      country: "US",
      rating: 3.5 + (index % 3) * 0.5,
      lead_time_days: 5 + (index % 10),
    }
  })

  const suppliers = await upsertInChunks(
    authedClient,
    "suppliers",
    supplierRows,
    "code",
    "id,code"
  )

  const supplierIds = suppliers.map((row) => row.id)

  const customerRows = Array.from({ length: 50 }, (_, index) => {
    const customerNumber = String(index + 1).padStart(3, "0")
    return {
      company_id: companyId,
      code: `CUST-${customerNumber}`,
      name: `Customer ${customerNumber}`,
      contact_person: `Buyer ${customerNumber}`,
      email: `customer${customerNumber}@example.com`,
      phone: `+1-555-90${String(index).padStart(2, "0")}`,
      country: "US",
      credit_limit: 15000 + index * 600,
    }
  })

  const customers = await upsertInChunks(
    authedClient,
    "customers",
    customerRows,
    "code",
    "id,code"
  )

  const customerIds = customers.map((row) => row.id)

  const categories = ["raw_material", "wip", "finished_good", "component", "consumable"]
  const uoms = ["EA", "KG", "LB", "BOX", "PKG"]

  const productRows = Array.from({ length: 100 }, (_, index) => {
    const productNumber = String(index + 1).padStart(3, "0")
    const baseCost = 8 + (index % 25) * 3.5

    return {
      company_id: companyId,
      sku: `PRD-${productNumber}`,
      name: `Product ${productNumber}`,
      description: `Seeded product ${productNumber}`,
      category: categories[index % categories.length],
      unit_of_measure: uoms[index % uoms.length],
      quantity_on_hand: 80 + (index % 11) * 15,
      reorder_level: 20 + (index % 7) * 4,
      reorder_quantity: 60 + (index % 9) * 10,
      unit_cost: Number(baseCost.toFixed(2)),
      selling_price: Number((baseCost * 1.45).toFixed(2)),
      overhead_cost: Number((baseCost * 0.18).toFixed(2)),
      labor_cost_per_unit: Number((baseCost * 0.14).toFixed(2)),
      facility_id: facilityIds[index % facilityIds.length],
      supplier_id: supplierIds[index % supplierIds.length],
      is_active: true,
    }
  })

  const products = await upsertInChunks(
    authedClient,
    "products",
    productRows,
    "sku",
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
    "order_number",
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
    "po_number",
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
    "wo_number",
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
    "transaction_number"
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
    "inspection_number"
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
