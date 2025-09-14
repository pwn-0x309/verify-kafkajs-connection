# verify-kafkajs-connection

A tiny Node.js script to verify connectivity to a Kafka cluster using KafkaJS. It checks Admin, Producer, and Consumer connections with clear logs and helpful hints on failure.

## Prerequisites

- Node.js 18+ (recommended)
- Access to a Kafka broker (local or remote)
- If using SASL/SSL, have the correct credentials and config ready

## KafkaJS Version

- Library: `kafkajs` `^2.2.4` (installed via `package.json`)
- APIs used: `Kafka`, `admin`, `producer`, `consumer` (stable in 2.x)
- Node support: KafkaJS recommends modern LTS; this project targets Node 18+
- Broker compatibility: Kafka 2.0+ (commonly used with Kafka 2.8–3.7+)
- Docs: [kafka.js.org](https://kafka.js.org/) — Releases: [tulios/kafkajs releases](https://github.com/tulios/kafkajs/releases)

Verify installed version:

```bash
npm ls kafkajs
node -e "console.log(require('kafkajs/package.json').version)"
```

## Setup

1. Install dependencies:

```bash
npm install
```

1. Configure environment variables by creating a `.env` file (or rename `.env.example`):

```dotenv
# Kafka Configuration
KAFKA_DEFAULT_BROKER_URL=localhost:9092
KAFKA_DEFAULT_CLIENT_ID=blink-service
KAFKA_DEFAULT_GROUP_ID=my-consumer-group
KAFKA_DEFAULT_AUTO_CREATE_TOPIC=true
KAFKA_DEFAULT_REQUEST_TIMEOUT=30000
KAFKA_DEFAULT_CONCURRENTLY=1
KAFKA_DEFAULT_SSL=false
# Use `NONE` to disable SASL entirely, otherwise one of: PLAIN, SCRAM-SHA-256, SCRAM-SHA-512, AWS, OAUTHBEARER
KAFKA_DEFAULT_MECHANISM=NONE
KAFKA_DEFAULT_USERNAME=your-username
KAFKA_DEFAULT_PASSWORD=your-password
KAFKA_ENV=development
```

Notes:

- Set `KAFKA_DEFAULT_MECHANISM=NONE` to disable SASL. Any other value enables SASL with the provided username/password.
- When `KAFKA_DEFAULT_SSL=true`, ensure your broker supports SSL and trust settings are configured appropriately.

## Run

Run the script to test the connection:

```bash
npm start
```

On success, you should see output similar to the following.

## The expected output

```text
🔍 Testing Kafka Connection...
📡 Brokers: localhost:9092
🆔 Client ID: blink-service
🔐 SSL Enabled: false
🔑 SASL Enabled: No
🏷️  Auto Create Topics: true
──────────────────────────────────────────────────
🔌 Connecting to Kafka...
✅ Connected successfully!
📋 Fetching topics...
✅ Connection verified! Found 2 topics.
📝 Topics: __consumer_offsets, test-topic
📤 Testing producer connection...
✅ Producer connected successfully!
✅ Producer disconnected successfully!
📥 Testing consumer connection...
✅ Consumer connected successfully!
✅ Consumer disconnected successfully!
👋 Admin disconnected
──────────────────────────────────────────────────
🎉 Kafka connection test PASSED
```

Your actual topics and counts may differ.

## Troubleshooting

- Connection refused (ECONNREFUSED): Ensure Kafka is running and accessible at the configured broker address/port.
- Connection timeout: Check network/firewall; increase `connectionTimeout` if needed (hardcoded to 10000ms in `test-kafka.js`).
- ENOTFOUND: Verify the broker hostname/IP.
- SASL errors: Confirm `KAFKA_DEFAULT_MECHANISM`, `KAFKA_DEFAULT_USERNAME`, and `KAFKA_DEFAULT_PASSWORD`.
- SSL errors: Ensure `KAFKA_DEFAULT_SSL` is correct and certificates are properly configured.

Refer to `test-kafka.js` for the exact configuration used when connecting.

## Optional: Start a local Kafka quickly (Docker)

If you don't already have Kafka running locally, you can spin up a single-broker cluster with Docker. Example using Bitnami images:

```bash
# Create a Docker network
docker network create kafka-net

# Start Zookeeper (only if using ZooKeeper-based Kafka distribution)
docker run -d --name zookeeper --network kafka-net -e ALLOW_ANONYMOUS_LOGIN=yes bitnami/zookeeper:3.9

# Start Kafka broker (PLAINTEXT on 9092)
docker run -d --name kafka --network kafka-net -p 9092:9092 \
  -e KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181 \
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092 \
  -e KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e ALLOW_PLAINTEXT_LISTENER=yes \
  bitnami/kafka:3.7
```

After containers are healthy, run `npm start` again.
