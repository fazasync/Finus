export type { Currency } from "@/lib/currency";

export type TransactionType = "income" | "expense";

export type Profile = {
  id: string;
  base_currency: "IDR" | "MYR";
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Balance = {
  id: string;
  user_id: string;
  currency: "IDR" | "MYR";
  initial_balance: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  type: TransactionType;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  currency: "IDR" | "MYR";
  exchange_rate: number | null;
  transaction_at: string;
  created_at: string;
  updated_at: string;
};

export type ExchangeRate = {
  id: string;
  user_id: string;
  rate: number;
  effective_at: string;
  created_at: string;
};

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, "id" | "name" | "type"> | null;
};
