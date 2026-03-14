import type { Metadata } from "next"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getAuthenticatedContext } from "@/lib/supabase/context"

export const metadata: Metadata = {
  title: "Finance | SysPilot",
  description: "Track financial movements and balances.",
}

const transactionTypes = ["revenue", "expense", "cogs", "payable", "receivable", "adjustment"] as const
const transactionCategories = [
  "sales",
  "purchase",
  "production",
  "labor",
  "overhead",
  "shipping",
  "tax",
  "other",
] as const

const createTransactionSchema = z.object({
  type: z.enum(transactionTypes),
  category: z.enum(transactionCategories),
  amount: z.coerce.number().positive(),
  description: z.string().min(5),
})

export default async function FinancePage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id,transaction_number,type,category,description,amount,running_balance,transaction_date")
    .eq("company_id", companyId)
    .order("transaction_date", { ascending: false })

  if (error) {
    throw new Error("Unable to load finance module")
  }

  const rows = transactions ?? []

  const revenue = rows
    .filter((row) => row.type === "revenue")
    .reduce((total, row) => total + Number(row.amount ?? 0), 0)

  const expenses = rows
    .filter((row) => row.type === "expense" || row.type === "cogs")
    .reduce((total, row) => total + Number(row.amount ?? 0), 0)

  const net = revenue - expenses

  async function createTransaction(formData: FormData) {
    "use server"

    const parsed = createTransactionSchema.parse({
      type: formData.get("type"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      description: formData.get("description"),
    })

    const { supabase: serverSupabase, companyId: serverCompanyId, user: serverUser } =
      await getAuthenticatedContext()

    const { data: latestTransaction } = await serverSupabase
      .from("transactions")
      .select("running_balance")
      .eq("company_id", serverCompanyId)
      .order("transaction_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    const previousBalance = Number(latestTransaction?.running_balance ?? 0)
    const signedAmount = parsed.type === "revenue" || parsed.type === "receivable" ? parsed.amount : -parsed.amount
    const runningBalance = previousBalance + signedAmount

    const { error: insertError } = await serverSupabase.from("transactions").insert({
      company_id: serverCompanyId,
      transaction_number: `TXN-${Date.now()}`,
      type: parsed.type,
      category: parsed.category,
      reference_type: "manual",
      description: parsed.description,
      amount: parsed.amount,
      running_balance: runningBalance,
      created_by: serverUser.id,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }

    revalidatePath("/finance")
    revalidatePath("/dashboard")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Financial Tracking</h1>
        <p className="text-sm text-muted-foreground">Monitor revenues, expenses, and rolling balance in one ledger.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bark-shadow glass-surface border-white/65">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">${revenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bark-shadow glass-surface border-white/65">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Expenses + COGS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-600">${expenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bark-shadow glass-surface border-white/65">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Net Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">${net.toLocaleString()}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Post Manual Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTransaction} className="grid gap-3 md:grid-cols-4">
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="type" required>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="category" required>
              {transactionCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <Input min={0.01} name="amount" placeholder="Amount" step="0.01" type="number" required />

            <div className="md:col-span-4">
              <Textarea name="description" placeholder="Narration" required />
            </div>

            <div className="md:col-span-4">
              <Button type="submit">Post Transaction</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Txn #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.transaction_number}</TableCell>
                  <TableCell>
                    <Badge variant={row.type === "revenue" ? "secondary" : "outline"}>{row.type}</Badge>
                  </TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{row.description}</TableCell>
                  <TableCell>${Number(row.amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>${Number(row.running_balance ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{new Date(row.transaction_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
