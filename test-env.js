import 'dotenv/config';
console.log("Password:", process.env.SMTP_PASSWORD ? "Loaded successfully" : "Missing");
