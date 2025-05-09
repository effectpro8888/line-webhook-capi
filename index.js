const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

app.use(express.json({
  verify: (req, res, buf) => {
    const signature = req.headers['x-line-signature'];
    const hash = crypto.createHmac('sha256', LINE_CHANNEL_SECRET)
      .update(buf)
      .digest('base64');
    if (signature !== hash) throw new Error('Invalid signature');
  }
}));

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'follow') {
      const userId = event.source.userId;
      const hash = crypto.createHash('sha256').update(userId).digest('hex');

      await axios.post(`https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`, {
        data: [
          {
            event_name: 'CompleteRegistration',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'system_generated',
            user_data: {
              external_id: hash
            }
          }
        ]
      });
    }
  }

  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('OK'));
app.listen(3000);
