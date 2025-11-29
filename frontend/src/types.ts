export interface Item {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_base64?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillItem {
  id: string;
  item_id: string;
  name: string;
  image_base64?: string | null;
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

export interface Bill {
  id: string;
  bill_date: string;
  total_price: number;
  final_price: number;
  created_at?: string;
  items: BillItem[];
}

export interface CreateBillItemInput {
  itemId: string;
  quantity: number;
  pricePerUnit?: number;
}

export interface CreateBillPayload {
  billDate: string;
  items: CreateBillItemInput[];
  finalPrice?: number;
}

export interface CreateItemPayload {
  name: string;
  price: number;
  stock: number;
  imageBase64?: string | null;
}
