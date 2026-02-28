const axios = require('axios');

async function testAI() {
    try {
        console.log("1. Logging in as test2@example.com...");
        const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
            email: 'test2@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log("   -> Login successful! Token acquired.");

        console.log("\n2. Requesting AI Insights from /api/ai/all-insights");
        console.log("   -> This will trigger Gemini. Please wait...");

        // We will measure the time it takes
        const startTime = Date.now();
        const aiRes = await axios.get('http://127.0.0.1:5000/api/ai/all-insights', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const endTime = Date.now();

        console.log(`\n============== AI RESPONSE (Took ${(endTime - startTime) / 1000}s) ==============`);
        if (aiRes.data && Object.keys(aiRes.data).length > 0) {
            console.log("Data structure returned successfully.");
            // Just printing a preview so the console output isn't too huge
            const preview = JSON.stringify(aiRes.data, null, 2).substring(0, 500) + '... [TRUNCATED]';
            console.log(preview);
            console.log("\n✅ AI TEST PASSED");
        } else {
            console.log("No data returned.");
            console.log("❌ AI TEST FAILED");
        }

    } catch (error) {
        console.error("\n❌ TEST FAILED:");
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testAI();
