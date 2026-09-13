import { products, dailyDryStockRegistry, purchasesRegistry, orderRegistry, salesRegistry } from './state.js';
import { renderProducts, saveProductsToStorage } from './products.js';

export function renderAdminLiveStockSummary() {
  const container = document.getElementById("adminLiveStockCardsContainer");
  if (!container) return;

  const dryProd = products.find(p => p.type === "dry") || { stock: 0 };
  const powderProd = products.find(p => p.type === "powder") || { stock: 0 };
  const khakhraProd = products.find(p => p.type === "khakhra") || { stock: 0 };
  const papadProd = products.find(p => p.type === "papad") || { stock: 0 };

  const totalDailyDryKg = dailyDryStockRegistry.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  
  const totalBuyDryKg = purchasesRegistry
    .filter(p => p && p.product && p.product.toLowerCase().includes("dry"))
    .reduce((sum, p) => sum + Number(p.qty || 0), 0);

  const totalOrderDryKg = orderRegistry
    .filter(o => o && o.status && (o.status === 'Approved' || o.status === 'Delivered') && o.products && o.products.toLowerCase().includes("dry"))
    .reduce((sum, o) => sum + 1, 0);

  const totalSellDryKg = salesRegistry
    .filter(s => s && s.product && s.product.toLowerCase().includes("dry"))
    .reduce((sum, s) => sum + Number(s.qty || 0), 0);

  let calculatedDryStockKg = (totalDailyDryKg + totalBuyDryKg) - (totalOrderDryKg + totalSellDryKg);
  if (calculatedDryStockKg < 0) calculatedDryStockKg = 0;
  dryProd.stock = calculatedDryStockKg;

  const totalBuyPowderKg = purchasesRegistry
    .filter(p => p && p.product && p.product.toLowerCase().includes("powder"))
    .reduce((sum, p) => sum + Number(p.qty || 0), 0);

  const totalOrderPowder = orderRegistry
    .filter(o => o && o.status && (o.status === 'Approved' || o.status === 'Delivered') && o.products && o.products.toLowerCase().includes("powder"))
    .reduce((sum, o) => sum + 1, 0);

  const totalSellPowder = salesRegistry
    .filter(s => s && s.product && s.product.toLowerCase().includes("powder"))
    .reduce((sum, s) => sum + Number(s.qty || 0), 0);

  let calculatedPowderStock = (calculatedDryStockKg + totalBuyPowderKg) - (totalOrderPowder + totalSellPowder);
  if (calculatedPowderStock < 0) calculatedPowderStock = 0;
  powderProd.stock = calculatedPowderStock;

  const totalBuyKhakhraKg = purchasesRegistry
    .filter(p => p && p.product && p.product.toLowerCase().includes("khakhra"))
    .reduce((sum, p) => sum + Number(p.qty || 0), 0);
  const totalBuyKhakhraPackets = totalBuyKhakhraKg * 5;

  const totalOrderKhakhra = orderRegistry
    .filter(o => o && o.status && (o.status === 'Approved' || o.status === 'Delivered') && o.products && o.products.toLowerCase().includes("khakhra"))
    .reduce((sum, o) => sum + 1, 0);

  const totalSellKhakhra = salesRegistry
    .filter(s => s && s.product && s.product.toLowerCase().includes("khakhra"))
    .reduce((sum, s) => sum + Number(s.qty || 0), 0);

  let calculatedKhakhraStock = totalBuyKhakhraPackets - (totalOrderKhakhra + totalSellKhakhra);
  if (calculatedKhakhraStock < 0) calculatedKhakhraStock = 0;
  khakhraProd.stock = calculatedKhakhraStock;

  const totalBuyPapadKg = purchasesRegistry
    .filter(p => p && p.product && p.product.toLowerCase().includes("papad"))
    .reduce((sum, p) => sum + Number(p.qty || 0), 0);
  const totalBuyPapadPackets = totalBuyPapadKg * 5;

  const totalOrderPapad = orderRegistry
    .filter(o => o && o.status && (o.status === 'Approved' || o.status === 'Delivered') && o.products && o.products.toLowerCase().includes("papad"))
    .reduce((sum, o) => sum + 1, 0);

  const totalSellPapad = salesRegistry
    .filter(s => s && s.product && s.product.toLowerCase().includes("papad"))
    .reduce((sum, s) => sum + Number(s.qty || 0), 0);

  let calculatedPapadStock = totalBuyPapadPackets - (totalOrderPapad + totalSellPapad);
  if (calculatedPapadStock < 0) calculatedPapadStock = 0;
  papadProd.stock = calculatedPapadStock;

  saveProductsToStorage();
  renderProducts();

  container.innerHTML = `
    <div style="background: ${calculatedDryStockKg > 0 ? '#fefce8' : '#fee2e2'}; border: 1px solid ${calculatedDryStockKg > 0 ? '#fef08a' : '#fca5a5'}; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: ${calculatedDryStockKg > 0 ? '#854d0e' : '#991b1b'}; font-weight: bold;">🌾 Dry Mushroom Stock</div>
      <div style="font-size: 20px; font-weight: 900; color: ${calculatedDryStockKg > 0 ? '#a16207' : '#dc2626'}; margin: 4px 0;">${calculatedDryStockKg.toFixed(2)} kg</div>
      <div style="font-size: 11px; font-weight: bold; color: ${calculatedDryStockKg > 0 ? '#16a34a' : '#dc2626'};">
        ${calculatedDryStockKg > 0 ? '🟢 Stock Available' : '🔴 Out of Stock'}
      </div>
    </div>

    <div style="background: ${calculatedPowderStock > 0 ? '#f0fdf4' : '#fee2e2'}; border: 1px solid ${calculatedPowderStock > 0 ? '#bbf7d0' : '#fca5a5'}; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: ${calculatedPowderStock > 0 ? '#166534' : '#991b1b'}; font-weight: bold;">🧪 Powder Stock (1kg=10 Packets)</div>
      <div style="font-size: 20px; font-weight: 900; color: ${calculatedPowderStock > 0 ? '#15803d' : '#dc2626'}; margin: 4px 0;">${(calculatedPowderStock * 10).toFixed(0)} packets</div>
      <div style="font-size: 11px; font-weight: bold; color: ${calculatedPowderStock > 0 ? '#16a34a' : '#dc2626'};">
        ${calculatedPowderStock > 0 ? '🟢 Stock Available' : '🔴 Out of Stock'}
      </div>
    </div>

    <div style="background: ${calculatedKhakhraStock > 0 ? '#fff7ed' : '#fee2e2'}; border: 1px solid ${calculatedKhakhraStock > 0 ? '#ffedd5' : '#fca5a5'}; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: ${calculatedKhakhraStock > 0 ? '#9a3412' : '#991b1b'}; font-weight: bold;">🧇 Khakhra Stock (1kg=5 Packets)</div>
      <div style="font-size: 20px; font-weight: 900; color: ${calculatedKhakhraStock > 0 ? '#ea580c' : '#dc2626'}; margin: 4px 0;">${calculatedKhakhraStock} packs</div>
      <div style="font-size: 11px; font-weight: bold; color: ${calculatedKhakhraStock > 0 ? '#16a34a' : '#dc2626'};">
        ${calculatedKhakhraStock > 0 ? '🟢 Stock Available' : '🔴 Out of Stock'}
      </div>
    </div>

    <div style="background: ${calculatedPapadStock > 0 ? '#f0fdf4' : '#fee2e2'}; border: 1px solid ${calculatedPapadStock > 0 ? '#bbf7d0' : '#fca5a5'}; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: ${calculatedPapadStock > 0 ? '#166534' : '#991b1b'}; font-weight: bold;">🫓 Papad Stock (1kg=5 Packets)</div>
      <div style="font-size: 20px; font-weight: 900; color: ${calculatedPapadStock > 0 ? '#15803d' : '#dc2626'}; margin: 4px 0;">${calculatedPapadStock} packs</div>
      <div style="font-size: 11px; font-weight: bold; color: ${calculatedPapadStock > 0 ? '#16a34a' : '#dc2626'};">
        ${calculatedPapadStock > 0 ? '🟢 Stock Available' : '🔴 Out of Stock'}
      </div>
    </div>
  `;
}