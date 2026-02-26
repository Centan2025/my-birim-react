const email = "cenktanrikulu@gmail.com";
const url = "http://localhost:3002/api/send-verification";

fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        email,
        verificationUrl: "http://localhost:3001/verify?token=test_123",
        logoUrl: "http://localhost:3001/logo.png"
    })
}).then(async res => {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
})
    .catch(err => console.error("Error:", err));
