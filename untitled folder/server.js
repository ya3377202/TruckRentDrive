const express = require('express');
const stripe = require('stripe')('your_stripe_secret_key');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Truck rates
const TRUCK_RATES = {
  'standard': 100,
  'heavy-duty': 150,
  'refrigerated': 200
};

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, truckType, duration } = req.body;
    
    // Validate the amount based on truck type and duration
    const expectedAmount = TRUCK_RATES[truckType] * duration;
    if (amount !== expectedAmount) {
      throw new Error('Invalid amount');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        truckType,
        duration
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Handle successful payment
app.post('/payment-success', async (req, res) => {
  try {
    const { paymentIntent, rentalDetails } = req.body;

    // Send confirmation email
    const emailContent = generateEmailTemplate(rentalDetails);
    await sendEmail(rentalDetails.email, 'TruckRentDrive Rental Confirmation', emailContent);

    // Send SMS notification (if phone number provided)
    if (rentalDetails.phone) {
      await sendSMS(rentalDetails.phone, 'Your TruckRentDrive truck rental has been confirmed!');
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate detailed email template
function generateEmailTemplate(details) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f3f4f6; }
        .details { background-color: #f8fafc; padding: 15px; margin: 15px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TruckRentDrive Rental Confirmation</h1>
        </div>
        <div class="content">
          <p>Dear ${details.name},</p>
          <p>Thank you for choosing TruckRentDrive! Your truck rental has been confirmed.</p>
          
          <div class="details">
            <h3>Rental Details:</h3>
            <p><strong>Truck Type:</strong> ${details['truck-type']}</p>
            <p><strong>Pickup Date:</strong> ${details.pickup_date}</p>
            <p><strong>Return Date:</strong> ${details.return_date}</p>
            <p><strong>Pickup Location:</strong> ${details.pickup}</p>
            <p><strong>Drop-off Location:</strong> ${details.dropoff}</p>
            <p><strong>Total Amount:</strong> $${details.amount}</p>
          </div>

          <h3>Important Information:</h3>
          <ul>
            <li>Please bring a valid ID and the credit card used for payment</li>
            <li>Arrive 15 minutes before your scheduled pickup time</li>
            <li>Check the truck's condition before departure</li>
            <li>Contact us immediately if you need to modify your reservation</li>
          </ul>

          <p>Track your truck's location anytime by logging into your account on our website.</p>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact us:</p>
          <p>Email: info@truckrentdrive.com</p>
          <p>Phone: (555) 123-4567</p>
          <p>© 2025 TruckRentDrive. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email sending function
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: 'info@truckrentdrive.com',
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// SMS sending function (using Twilio)
async function sendSMS(to, message) {
  try {
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Don't throw error for SMS failure
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 