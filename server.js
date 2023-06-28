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
    if (message.e === 'ORDER_TRADE_UPDATE' && message.o.X === 'FILLED') {
      const symbol = message.o.s;
      const side = message.o.S;
      const price = message.o.ap;
      const quantity = message.o.q;

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