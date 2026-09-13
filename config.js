export const SUPABASE_URL = 'https://prukoxvmwuzaacctjxph.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_3xW-grMnyyVpoFdRy5sgLg_kQoUMHyd';

const { createClient } = supabase;
export const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const farmEmail = "puregrowfarm001@gmail.com";
export const farmWhatsapp = "919067891039";
export const farmUpiId = "sohamgajera01@okhdfcbank";
export const farmName = "Pure Grow Farm";

export const ADMIN_CREDENTIALS = { user: "admin", pass: "PureGrow@2026" };

export const BASE_PRODUCTS = [
  { id: 1, name: "Fresh Green Oyster Mushroom", price: 180, unit: "1kg", image: "mushroom/Screenshot 2025-10-24 154001.png", detail: "Picked fresh, chilled and delivered within 24-48 hours.", type: "green", stock: 0 },
  { id: 2, name: "Dried Oyster Mushroom", price: 800, unit: "1kg pack", image: "mushroom/oyst dry.webp", detail: "Slow-dried to preserve flavor and nutrients.", type: "dry", stock: 0 },
  { id: 3, name: "Oyster Mushroom Powder", price: 130, unit: "100gm pack", image: "mushroom/oyster powder.png", detail: "Mushroom powder for soup, 1kg pack curry, health mix and snacks.", type: "powder", stock: 0 },
  { id: 4, name: "Methi Mushroom Khakhra", price: 70, unit: "200gm pack", image: "mushroom/methikhakhra2.png", detail: "Crispy khakhra prepared with oyster mushroom powder.", type: "khakhra", stock: 0 },
  { id: 5, name: "Adad Mushroom Papad", price: 120, unit: "1 pack", image: "mushroom/adadpapad2.png", detail: "Papad enriched with mushroom nutrition.", type: "papad", stock: 0 },
  { id: 6, name: "Bulk and Wholesale Supply", price: 0, unit: "Custom", bulk: true, image: "mushroom/bulk.png", detail: "Supply for restaurants, retailers and local markets.", stock: 99999 }
];