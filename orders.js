import { orderRegistry } from './state.js';

export function getOrderProductImage(orderProductsText) {
  const text = (orderProductsText || "").toLowerCase();
  if (text.includes("khakhra")) return "mushroom/methikhakhra2.png"; 
  if (text.includes("papad")) return "mushroom/adadpapad2.png";   
  if (text.includes("dry") || text.includes("dried")) return "mushroom/oyst dry.webp";
  if (text.includes("powder")) return "mushroom/oyster powder.png";
  if (text.includes("green") || text.includes("fresh")) return "mushroom/Screenshot 2025-10-24 154001.png";
  return "mushroom/g mushroom.png";
}