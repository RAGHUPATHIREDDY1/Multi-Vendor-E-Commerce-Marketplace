import PDFDocument from 'pdfkit';
import { VendorOrder } from '../models/VendorOrder.js';
import { getOrderForCustomer } from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await getOrderForCustomer(req.params.orderId, req.user._id);
  const shipments = await VendorOrder.find({ order: order._id }).populate('vendor', 'name').lean();
  const document = new PDFDocument({ size: 'A4', margin: 52 });
  const safeNumber = order.orderNumber.replace(/[^A-Z0-9-]/gi, '');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${safeNumber}.pdf"`);
  document.pipe(res);
  document.fontSize(22).text('MarketHub', { continued: true }).fontSize(10).text('  Marketplace invoice', { align: 'right' });
  document.moveDown();
  document.fontSize(12).text(`Invoice: ${order.orderNumber}`);
  document.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  document.text(`Payment status: ${order.paymentStatus}`);
  document.moveDown();
  document.fontSize(14).text('Delivery address');
  const address = order.address;
  document.fontSize(10).text(`${address.recipient || ''}\n${address.line1 || ''}\n${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}\n${address.country || ''}`);
  document.moveDown();
  document.fontSize(14).text('Items');
  for (const shipment of shipments) {
    document.moveDown(0.5).fontSize(11).text(`Seller: ${shipment.vendor?.name || 'Marketplace seller'}`);
    for (const item of shipment.items) {
      document.fontSize(9).text(`${item.name}  x${item.quantity}  INR ${(item.unitPriceMinor / 100).toFixed(2)} each  INR ${(item.lineTotalMinor / 100).toFixed(2)}`);
    }
    if (shipment.discountMinor) document.text(`Seller discount: INR ${(shipment.discountMinor / 100).toFixed(2)}`);
    document.text(`Platform commission recorded: INR ${(shipment.commissionMinor / 100).toFixed(2)}`);
  }
  document.moveDown();
  document.fontSize(10).text(`Subtotal: INR ${(order.subtotalMinor / 100).toFixed(2)}`);
  document.text(`Discount: INR ${(order.discountMinor / 100).toFixed(2)}`);
  document.text(`Shipping: INR ${(order.shippingMinor / 100).toFixed(2)}`);
  document.text(`Tax: INR ${(order.taxMinor / 100).toFixed(2)}`);
  document.fontSize(14).text(`Total paid / due: INR ${(order.totalMinor / 100).toFixed(2)}`);
  document.end();
});
