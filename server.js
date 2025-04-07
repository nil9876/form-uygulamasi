const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = 3000;

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheetId = process.env.SHEET_ID;

app.post('/submit', async (req, res) => {
    console.log('Form Data:', req.body);  // Form verilerini konsola yazdırıyoruz
    const { ad, email, mesaj } = req.body;

    // Verilerin eksik olup olmadığını kontrol ediyoruz
    if (!ad || !email || !mesaj) {
        return res.status(400).send('❌ Eksik veri gönderildi');
    }
  
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // Google Sheets'e veri ekleme
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: 'Sayfa1!A:D',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[new Date().toISOString(), ad, email, mesaj]]  // Verilerin eklenme şekli
          }
        });

        // E-posta gönderme
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
          }
        });

        await transporter.sendMail({
          from: `"Form App" <${process.env.MAIL_USER}>`,
          to: process.env.MAIL_TO,
          subject: '📥 Yeni Form Yanıtı',
          text: `Ad: ${ad}\nE-posta: ${email}\nMesaj: ${mesaj}`
        });

        res.send("✅ Form başarıyla gönderildi!");
    } catch (err) {
        console.error(err);
        res.status(500).send("❌ Hata oluştu: " + err.message);
    }
});

app.listen(PORT, () => console.log(`Sunucu çalışıyor: http://localhost:${PORT}`));
