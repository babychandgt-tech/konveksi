import { Router } from "express";

const router = Router();

router.post("/payment/create-token", async (req, res) => {
  const serverKey = process.env["MIDTRANS_SERVER_KEY"];

  if (!serverKey) {
    res.status(503).json({ error: "Midtrans server key belum dikonfigurasi." });
    return;
  }

  const { order_id, gross_amount, customer, items } = req.body as {
    order_id: string;
    gross_amount: number;
    customer: { name: string; email: string; phone: string };
    items: { id: string; name: string; price: number; quantity: number }[];
  };

  if (!order_id || !gross_amount || !customer?.email) {
    res.status(400).json({ error: "Data tidak lengkap." });
    return;
  }

  const credentials = Buffer.from(`${serverKey}:`).toString("base64");

  const payload = {
    transaction_details: {
      order_id,
      gross_amount: Math.round(gross_amount),
    },
    customer_details: {
      first_name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    item_details: items.map((item) => ({
      id: item.id,
      name: item.name.slice(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    callbacks: {
      finish: `${process.env["APP_URL"] ?? ""}/pesanan`,
    },
  };

  const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    res.status(response.status).json({ error: "Midtrans error", detail: body });
    return;
  }

  const data = await response.json() as { token: string; redirect_url: string };
  res.json({ token: data.token, redirect_url: data.redirect_url });
});

export default router;
