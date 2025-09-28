import nodemailer from 'nodemailer';
import { env } from '../config/env';

type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

type SendOrderConfirmationOptions = {
  orderId: number;
  customerName?: string | null | undefined;
  customerEmail: string;
  items: OrderEmailItem[];
  totalAmount: number;
  notes?: string | null | undefined;
};

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPassword,
  },
});

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const sendOrderConfirmationEmail = async ({
  orderId,
  customerName,
  customerEmail,
  items,
  totalAmount,
  notes,
}: SendOrderConfirmationOptions): Promise<void> => {
  const subject = `e-Parts order confirmation (#${orderId})`;
  const greeting = customerName ? `Hi ${customerName},` : 'Hello,';

  const lines = items
    .map((item) => `- ${item.name} x${item.quantity} @ ${formatCurrency(item.unitPrice)}`)
    .join('\n');

  const text = `${greeting}

Thank you for your order with e-Parts. Here are the details:

${lines}

Total: ${formatCurrency(totalAmount)}
${notes ? `\nNotes: ${notes}\n` : ''}
We will contact you shortly to confirm fulfillment details.

— e-Parts Team`;

  const htmlRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${item.name}</td>
          <td style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
            item.unitPrice,
          )}</td>
        </tr>
      `,
    )
    .join('');

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b;">
      <p>${greeting}</p>
      <p>Thank you for your order with <strong>e-Parts</strong>. Here are the details:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 640px; margin: 16px 0;">
        <thead>
          <tr>
            <th style="padding: 6px 12px; border: 1px solid #e2e8f0; background: #f1f5f9; text-align: left;">Item</th>
            <th style="padding: 6px 12px; border: 1px solid #e2e8f0; background: #f1f5f9; text-align: center;">Qty</th>
            <th style="padding: 6px 12px; border: 1px solid #e2e8f0; background: #f1f5f9; text-align: right;">Unit price</th>
          </tr>
        </thead>
        <tbody>
          ${htmlRows}
        </tbody>
      </table>
      <p><strong>Total:</strong> ${formatCurrency(totalAmount)}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      <p>We will contact you shortly to confirm fulfillment details.</p>
      <p style="margin-top: 24px;">— e-Parts Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: `e-Parts <${env.smtpUser}>`,
    to: customerEmail,
    bcc: env.orderNotificationEmail,
    subject,
    text,
    html,
  });
};
