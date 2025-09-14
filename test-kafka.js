require("dotenv").config();
const { Kafka } = require("kafkajs");

console.log(`
  Environment Variables:
  KAFKA_DEFAULT_BROKER_URL=${process.env.KAFKA_DEFAULT_BROKER_URL || "not set"}
  KAFKA_DEFAULT_CLIENT_ID=${process.env.KAFKA_DEFAULT_CLIENT_ID || "not set"}
  KAFKA_DEFAULT_GROUP_ID=${process.env.KAFKA_DEFAULT_GROUP_ID || "not set"}
  KAFKA_DEFAULT_AUTO_CREATE_TOPIC=${
    process.env.KAFKA_DEFAULT_AUTO_CREATE_TOPIC || "not set"
  }
  KAFKA_DEFAULT_REQUEST_TIMEOUT=${
    process.env.KAFKA_DEFAULT_REQUEST_TIMEOUT || "not set"
  }
  KAFKA_DEFAULT_CONCURRENTLY=${
    process.env.KAFKA_DEFAULT_CONCURRENTLY || "not set"
  }
  KAFKA_DEFAULT_SSL=${process.env.KAFKA_DEFAULT_SSL || "not set"}
  KAFKA_DEFAULT_MECHANISM=${process.env.KAFKA_DEFAULT_MECHANISM || "not set"}
  KAFKA_DEFAULT_USERNAME=${process.env.KAFKA_DEFAULT_USERNAME || "not set"}
  KAFKA_DEFAULT_PASSWORD=${
    process.env.KAFKA_DEFAULT_PASSWORD ? "********" : "not set"
  }
  KAFKA_ENV=${process.env.KAFKA_ENV || "not set"}
`);

async function testKafkaConnection() {
  // Use the same configuration pattern as kafka.manager.js
  const sasl =
    process.env.KAFKA_DEFAULT_MECHANISM === "NONE" ||
    !process.env.KAFKA_DEFAULT_MECHANISM
      ? null
      : {
          mechanism: process.env.KAFKA_DEFAULT_MECHANISM,
          username: process.env.KAFKA_DEFAULT_USERNAME,
          password: process.env.KAFKA_DEFAULT_PASSWORD,
        };

  const config = {
    allowAutoTopicCreation:
      process.env.KAFKA_DEFAULT_AUTO_CREATE_TOPIC === "true",
    clientId: process.env.KAFKA_DEFAULT_CLIENT_ID || "kafka-test-client",
    brokers: [process.env.KAFKA_DEFAULT_BROKER_URL || "localhost:9092"],
    ssl: process.env.KAFKA_DEFAULT_SSL === "true",
    sasl,
    connectionTimeout: 10000,
    requestTimeout: 30000,
  };

  console.log("🔍 Testing Kafka Connection...");
  console.log(`📡 Brokers: ${config.brokers.join(", ")}`);
  console.log(`🆔 Client ID: ${config.clientId}`);
  console.log(`🔐 SSL Enabled: ${config.ssl}`);
  console.log(`🔑 SASL Enabled: ${sasl ? "Yes" : "No"}`);
  if (sasl) {
    console.log(`   Mechanism: ${sasl.mechanism}`);
    console.log(`   Username: ${sasl.username}`);
  }
  console.log(`🏷️  Auto Create Topics: ${config.allowAutoTopicCreation}`);
  console.log("─".repeat(50));

  const kafka = new Kafka(config);
  const admin = kafka.admin();

  try {
    console.log("🔌 Connecting to Kafka...");

    // Test connection with timeout
    await Promise.race([
      admin.connect(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection timeout")),
          config.connectionTimeout
        )
      ),
    ]);

    console.log("✅ Connected successfully!");

    // Test basic functionality by listing topics
    console.log("📋 Fetching topics...");
    const topics = await admin.listTopics();
    console.log(`✅ Connection verified! Found ${topics.length} topics.`);

    if (topics.length > 0) {
      console.log(
        `📝 Topics: ${topics.slice(0, 5).join(", ")}${
          topics.length > 5 ? "..." : ""
        }`
      );
    }

    // Test producer connection (similar to kafka.manager.js)
    console.log("📤 Testing producer connection...");
    const producer = kafka.producer({
      allowAutoTopicCreation: config.allowAutoTopicCreation,
    });
    await producer.connect();
    console.log("✅ Producer connected successfully!");
    await producer.disconnect();
    console.log("✅ Producer disconnected successfully!");

    // Test consumer connection (similar to kafka.manager.js)
    console.log("📥 Testing consumer connection...");
    const consumer = kafka.consumer({
      groupId: `${process.env.KAFKA_DEFAULT_GROUP_ID || "test-group"}-test`,
    });
    await consumer.connect();
    console.log("✅ Consumer connected successfully!");
    await consumer.disconnect();
    console.log("✅ Consumer disconnected successfully!");

    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    // Provide helpful error messages
    if (error.message.includes("ECONNREFUSED")) {
      console.error("💡 Hint: Make sure Kafka is running and accessible");
      console.error(`💡 Check if broker ${config.brokers[0]} is correct`);
    } else if (
      error.message.includes("timeout") ||
      error.message.includes("Connection timeout")
    ) {
      console.error(
        "💡 Hint: Check network connectivity and firewall settings"
      );
      console.error("💡 Increase connectionTimeout if network is slow");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("💡 Hint: Check if the broker hostname/IP is correct");
    } else if (error.message.includes("SASL")) {
      console.error("💡 Hint: Check SASL authentication credentials");
    } else if (error.message.includes("SSL")) {
      console.error("💡 Hint: Check SSL configuration");
    }

    console.error("\n🔧 Current configuration:");
    console.error(
      "   KAFKA_DEFAULT_BROKER_URL:",
      process.env.KAFKA_DEFAULT_BROKER_URL
    );
    console.error(
      "   KAFKA_DEFAULT_CLIENT_ID:",
      process.env.KAFKA_DEFAULT_CLIENT_ID
    );
    console.error("   KAFKA_DEFAULT_SSL:", process.env.KAFKA_DEFAULT_SSL);
    console.error(
      "   KAFKA_DEFAULT_MECHANISM:",
      process.env.KAFKA_DEFAULT_MECHANISM
    );
    console.error(
      "   KAFKA_DEFAULT_GROUP_ID:",
      process.env.KAFKA_DEFAULT_GROUP_ID
    );

    return false;
  } finally {
    try {
      await admin.disconnect();
      console.log("👋 Admin disconnected");
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

// Run the test
if (require.main === module) {
  testKafkaConnection()
    .then((success) => {
      console.log("─".repeat(50));
      console.log(
        success
          ? "🎉 Kafka connection test PASSED"
          : "💥 Kafka connection test FAILED"
      );
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Unexpected error:", error.message);
      process.exit(1);
    });
}

module.exports = testKafkaConnection;
