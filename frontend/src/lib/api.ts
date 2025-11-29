import axios from 'axios';
import type { Bill, CreateBillPayload, CreateItemPayload, Item } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000'
});

interface BillsQueryParams {
  date?: string;
  start?: string;
  end?: string;
}

async function getBills(params: BillsQueryParams = {}) {
  const { data } = await api.get<Bill[]>('/bills', { params });
  return data;
}

export async function fetchItems(): Promise<Item[]> {
  const { data } = await api.get<Item[]>('/items');
  return data;
}

export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const { data } = await api.post<Item>('/items', payload);
  return data;
}

export async function updateItem(id: string, payload: Partial<CreateItemPayload>): Promise<Item> {
  const { data } = await api.put<Item>(`/items/${id}`, payload);
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/items/${id}`);
}

export async function fetchBills(date: string): Promise<Bill[]> {
  return getBills({ date });
}

export async function fetchBillsInRange(start: string, end: string): Promise<Bill[]> {
  return getBills({ start, end });
}

export async function createBill(payload: CreateBillPayload): Promise<Bill> {
  const { data } = await api.post<Bill>('/bills', payload);
  return data;
}

export async function updateBill(id: string, payload: CreateBillPayload): Promise<Bill> {
  const { data } = await api.put<Bill>(`/bills/${id}`, payload);
  return data;
}

export async function deleteBill(id: string): Promise<void> {
  await api.delete(`/bills/${id}`);
}

export async function fetchBillById(id: string): Promise<Bill> {
  const { data } = await api.get<Bill>(`/bills/${id}`);
  return data;
}
