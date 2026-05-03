export interface InvoiceOrder {
  id: string;
  customer_name: string;
  product: string;
  qty: number;
  total: number;
  status: string;
  deadline: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  baru: "Baru",
  produksi: "Dalam Produksi",
  selesai: "Selesai",
  batal: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  baru: "#0d9488",
  produksi: "#d97706",
  selesai: "#059669",
  batal: "#dc2626",
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "-";
  }
};

const formatInvoiceNo = (orderId: string) => orderId.toUpperCase();

export function printInvoice(order: InvoiceOrder): void {
  const invoiceDate = formatDate(order.created_at);
  const deadlineDate = formatDate(order.deadline);
  const totalText = formatRp(order.total);
  const unitPrice = order.qty > 0 ? formatRp(order.total / order.qty) : "-";
  const statusLabel = STATUS_LABEL[order.status] ?? order.status;
  const statusColor = STATUS_COLOR[order.status] ?? "#6b7280";
  const invoiceNo = formatInvoiceNo(order.id);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNo}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #111;
      background: #fff;
      font-size: 13px;
      line-height: 1.5;
    }
    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 48px 40px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 2px solid #134e4a;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px;
      background: #134e4a;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #5eead4;
      font-weight: 900;
      font-size: 16px;
      letter-spacing: -1px;
    }
    .brand-name { font-size: 18px; font-weight: 700; color: #134e4a; }
    .brand-sub { font-size: 11px; color: #6b7280; margin-top: 1px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 26px; font-weight: 800; color: #134e4a; letter-spacing: -0.5px; }
    .invoice-title .inv-no { font-size: 13px; color: #6b7280; margin-top: 2px; font-family: monospace; }
    .status-pill {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      background: ${statusColor};
    }

    /* Meta row */
    .meta-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .meta-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .meta-value { font-size: 14px; font-weight: 600; color: #111; }
    .meta-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }

    /* Items table */
    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    thead tr {
      background: #134e4a;
      color: #fff;
    }
    thead th {
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody td {
      padding: 12px 14px;
      font-size: 13px;
      color: #374151;
      vertical-align: top;
    }
    tbody td:last-child { text-align: right; font-weight: 600; }
    tbody tr:nth-child(even) { background: #fafafa; }

    /* Total */
    .total-section {
      margin-top: 0;
      border-top: 2px solid #134e4a;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 14px;
    }
    .total-label { font-size: 15px; font-weight: 700; color: #134e4a; }
    .total-amount { font-size: 22px; font-weight: 800; color: #134e4a; }

    /* Notes */
    .notes-box {
      margin-top: 28px;
      padding: 14px 16px;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      border-radius: 10px;
    }
    .notes-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0d9488; margin-bottom: 4px; }
    .notes-text { font-size: 12px; color: #374151; }

    /* Footer */
    .footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-left { font-size: 11px; color: #9ca3af; line-height: 1.6; }
    .signature-box { text-align: center; }
    .signature-line {
      width: 160px;
      border-bottom: 1px solid #374151;
      margin-bottom: 4px;
      height: 48px;
    }
    .signature-label { font-size: 11px; color: #6b7280; }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 24px; }
      @page { margin: 10mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">VK</div>
      <div>
        <div class="brand-name">Vanny Konveksi</div>
        <div class="brand-sub">Produksi Seragam, Mudah & Terpercaya</div>
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="inv-no">${invoiceNo}</div>
      <div><span class="status-pill">${statusLabel}</span></div>
    </div>
  </div>

  <!-- Meta: Pelanggan & Tanggal -->
  <div class="meta-row">
    <div class="meta-box">
      <div class="meta-label">Tagihan Kepada</div>
      <div class="meta-value">${order.customer_name}</div>
      <div class="meta-sub">Pelanggan Vanny Konveksi</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Info Invoice</div>
      <div class="meta-value">Tgl. Pesanan: ${invoiceDate}</div>
      <div class="meta-sub">Deadline: ${deadlineDate}</div>
    </div>
  </div>

  <!-- Items Table -->
  <div class="section-title">Detail Pesanan</div>
  <table>
    <thead>
      <tr>
        <th style="width:40%">Produk / Deskripsi</th>
        <th style="text-align:center">Jumlah</th>
        <th style="text-align:right">Harga Satuan</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${order.product}</strong>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">Pesanan No. ${invoiceNo}</div>
        </td>
        <td style="text-align:center">${order.qty} pcs</td>
        <td style="text-align:right">${unitPrice}</td>
        <td>${totalText}</td>
      </tr>
    </tbody>
  </table>

  <!-- Total -->
  <div class="total-section">
    <div class="total-row">
      <span class="total-label">Total yang Harus Dibayar</span>
      <span class="total-amount">${totalText}</span>
    </div>
  </div>

  <!-- Notes -->
  <div class="notes-box">
    <div class="notes-label">Catatan</div>
    <div class="notes-text">
      Mohon selesaikan pembayaran sebelum tanggal deadline. Untuk konfirmasi atau pertanyaan, hubungi tim Vanny Konveksi.
      Terima kasih atas kepercayaan Anda.
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <strong>Vanny Konveksi</strong><br/>
      Produksi Seragam Berkualitas<br/>
      Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">Tanda Tangan &amp; Stempel</div>
    </div>
  </div>
</div>

<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=820,height=1000");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak invoice.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
