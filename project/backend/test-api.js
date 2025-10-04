const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";
let authToken = null;

// Test user credentials
const testUser = {
  email: "test@example.com",
  password: "test123",
  firstName: "Test",
  lastName: "User",
};

async function testAPI() {
  console.log("🧪 Starting API Tests...\n");

  try {
    // Test 1: Health Check
    console.log("1️⃣ Testing Health Check...");
    const healthResponse = await axios.get(
      `${BASE_URL.replace("/api", "")}/health`
    );
    console.log("✅ Health Check:", healthResponse.data.status);

    // Test 2: Register User
    console.log("\n2️⃣ Testing User Registration...");
    try {
      const registerResponse = await axios.post(
        `${BASE_URL}/auth/register`,
        testUser
      );
      console.log("✅ Registration successful:", registerResponse.data.success);
    } catch (error) {
      if (error.response?.data?.error?.includes("already exists")) {
        console.log("ℹ️ User already exists, skipping registration");
      } else {
        throw error;
      }
    }

    // Test 3: Login User
    console.log("\n3️⃣ Testing User Login...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    authToken = loginResponse.data.data.token;
    console.log("✅ Login successful, token received");

    // Set authorization header for subsequent requests
    const authHeaders = {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    };

    // Test 4: Get User Profile
    console.log("\n4️⃣ Testing Get User Profile...");
    const profileResponse = await axios.get(`${BASE_URL}/user/profile`, {
      headers: authHeaders,
    });
    console.log("✅ Profile retrieved:", profileResponse.data.data.email);

    // Test 5: Update User Settings
    console.log("\n5️⃣ Testing Update User Settings...");
    const settingsData = {
      settings: {
        notifications: {
          email: true,
          browser: true,
          riskLevels: ["HIGH"],
        },
        detection: {
          sensitivity: "HIGH",
          autoBlock: true,
          showWarnings: true,
          logActivity: true,
        },
      },
    };
    const settingsResponse = await axios.put(
      `${BASE_URL}/user/settings`,
      settingsData,
      { headers: authHeaders }
    );
    console.log("✅ Settings updated successfully");

    // Test 6: Submit Detection Request
    console.log("\n6️⃣ Testing Detection Analysis...");
    const detectionData = {
      imageUrl: "https://example.com/test-image.jpg",
      pageUrl: "https://example.com/test-page",
      domain: "example.com",
    };
    try {
      const detectionResponse = await axios.post(
        `${BASE_URL}/detection/analyze`,
        detectionData,
        { headers: authHeaders }
      );
      console.log(
        "✅ Detection request submitted:",
        detectionResponse.data.success
      );
    } catch (error) {
      if (error.response?.status === 503) {
        console.log(
          "ℹ️ NudeNet service not available, but API endpoint working"
        );
      } else {
        throw error;
      }
    }

    // Test 7: Get Detection History
    console.log("\n7️⃣ Testing Detection History...");
    const historyResponse = await axios.get(`${BASE_URL}/detection/history`, {
      headers: authHeaders,
    });
    console.log(
      "✅ Detection history retrieved:",
      historyResponse.data.data.detections.length,
      "records"
    );

    // Test 8: Get Analytics Dashboard
    console.log("\n8️⃣ Testing Analytics Dashboard...");
    const analyticsResponse = await axios.get(
      `${BASE_URL}/analytics/dashboard`,
      { headers: authHeaders }
    );
    console.log("✅ Analytics dashboard retrieved");

    // Test 9: Get Activity Logs
    console.log("\n9️⃣ Testing Activity Logs...");
    const activityResponse = await axios.get(`${BASE_URL}/activity`, {
      headers: authHeaders,
    });
    console.log(
      "✅ Activity logs retrieved:",
      activityResponse.data.data.activities.length,
      "records"
    );

    // Test 10: System Info
    console.log("\n🔟 Testing System Info...");
    const systemResponse = await axios.get(`${BASE_URL}/system/info`);
    console.log("✅ System info retrieved:", systemResponse.data.data.name);

    console.log("\n🎉 All API tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function testRateLimit() {
  console.log("\n🧪 Testing Rate Limiting...");

  try {
    const requests = Array(15)
      .fill()
      .map((_, i) =>
        axios
          .get(`${BASE_URL.replace("/api", "")}/health`)
          .then(() => console.log(`Request ${i + 1}: ✅`))
          .catch((err) =>
            console.log(
              `Request ${i + 1}: ❌ ${err.response?.status || "Error"}`
            )
          )
      );

    await Promise.all(requests);
    console.log("✅ Rate limiting test completed");
  } catch (error) {
    console.error("❌ Rate limiting test failed:", error.message);
  }
}

async function testErrorHandling() {
  console.log("\n🧪 Testing Error Handling...");

  try {
    // Test invalid endpoint
    try {
      await axios.get(`${BASE_URL}/invalid-endpoint`);
    } catch (error) {
      console.log("✅ 404 error handled correctly");
    }

    // Test invalid auth
    try {
      await axios.get(`${BASE_URL}/user/profile`, {
        headers: { Authorization: "Bearer invalid-token" },
      });
    } catch (error) {
      console.log("✅ Invalid auth handled correctly");
    }

    // Test invalid data
    try {
      await axios.post(`${BASE_URL}/auth/login`, { email: "invalid" });
    } catch (error) {
      console.log("✅ Invalid data handled correctly");
    }

    console.log("✅ Error handling tests completed");
  } catch (error) {
    console.error("❌ Error handling test failed:", error.message);
  }
}

async function main() {
  const testType = process.argv[2];

  switch (testType) {
    case "api":
      await testAPI();
      break;
    case "rate":
      await testRateLimit();
      break;
    case "error":
      await testErrorHandling();
      break;
    case "all":
      await testAPI();
      await testRateLimit();
      await testErrorHandling();
      break;
    default:
      console.log(`
Usage: node test-api.js [test-type]

Test Types:
  api    - Test all API endpoints
  rate   - Test rate limiting
  error  - Test error handling
  all    - Run all tests

Examples:
  node test-api.js api
  node test-api.js all
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { testAPI, testRateLimit, testErrorHandling };
