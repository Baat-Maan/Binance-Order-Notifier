require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const { WebsocketClient } = require('binance');

const app = express();
const port = process.env.PORT || 3000;

const binanceClient = new WebsocketClient({
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_SECRET_KEY,
});

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject,
    text,
  };
  await emailTransporter.sendMail(mailOptions);
}

async function start() {
  await binanceClient.subscribeUsdFuturesUserDataStream();
  binanceClient.on('message', async (message) => {
    const data = JSON.parse(message);

    if (data.e === 'ORDER_TRADE_UPDATE' && data.o.X === 'FILLED') {
      const symbol = data.o.s;
      const side = data.o.S;
      const price = data.o.ap;
      const quantity = data.o.q;

      const subject = `Binance Futures Order Filled: ${symbol}`;
      const text = `Your order has been filled:\nSymbol: ${symbol}\nSide: ${side}\nPrice: ${price}\nQuantity: ${quantity}`;

      await sendEmail(subject, text);
    }
  });

  binanceClient.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  start().catch((error) => console.error('Error starting the app:', error));
});