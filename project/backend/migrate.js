const { User, Detection, ActivityLog } = require("./src/models");
const bcrypt = require("bcryptjs");

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    // Sync all models (creates tables if they don't exist)
    await User.sync({ alter: true });
    console.log("✅ User table synced");

    await Detection.sync({ alter: true });
    console.log("✅ Detection table synced");

    await ActivityLog.sync({ alter: true });
    console.log("✅ ActivityLog table synced");

    console.log("🎉 All migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { email: "admin@nsfwdetection.com" },
    });

    if (!adminExists) {
      // Create admin user
      const adminPassword = await bcrypt.hash("admin123", 12);
      const admin = await User.create({
        email: "admin@nsfwdetection.com",
        passwordHash: adminPassword,
        firstName: "Admin",
        lastName: "User",
        isVerified: true,
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
          privacy: {
            shareAnalytics: false,
            retentionDays: 90,
          },
          ui: {
            theme: "dark",
            language: "en",
            compactMode: false,
          },
        },
      });

      console.log("✅ Admin user created");
      console.log(`   Email: admin@nsfwdetection.com`);
      console.log(`   Password: admin123`);
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Check if demo user exists
    const demoExists = await User.findOne({
      where: { email: "demo@example.com" },
    });

    if (!demoExists) {
      // Create demo user
      const demoPassword = await bcrypt.hash("demo123", 12);
      const demo = await User.create({
        email: "demo@example.com",
        passwordHash: demoPassword,
        firstName: "Demo",
        lastName: "User",
        isVerified: true,
        settings: {
          notifications: {
            email: false,
            browser: true,
            riskLevels: ["MEDIUM", "HIGH"],
          },
          detection: {
            sensitivity: "MEDIUM",
            autoBlock: false,
            showWarnings: true,
            logActivity: true,
          },
          privacy: {
            shareAnalytics: true,
            retentionDays: 30,
          },
          ui: {
            theme: "light",
            language: "en",
            compactMode: true,
          },
        },
      });

      // Create some sample detection data
      await Detection.bulkCreate([
        {
          userId: demo.id,
          imageUrl: "https://example.com/image1.jpg",
          pageUrl: "https://example.com/page1",
          domain: "example.com",
          riskLevel: "HIGH",
          confidence: 0.92,
          nudityScores: {
            exposed_anus: 0.02,
            exposed_armpits: 0.15,
            exposed_belly: 0.25,
            exposed_buttocks: 0.03,
            exposed_breast_f: 0.85,
            exposed_breast_m: 0.05,
            exposed_genitalia_f: 0.02,
            exposed_genitalia_m: 0.01,
            exposed_thighs: 0.45,
            face_f: 0.78,
            face_m: 0.02,
            feet: 0.12,
            hands: 0.34,
            underwear: 0.15,
            covered: 0.25,
          },
          isBlocked: true,
        },
        {
          userId: demo.id,
          imageUrl: "https://example.com/image2.jpg",
          pageUrl: "https://example.com/page2",
          domain: "example.com",
          riskLevel: "MEDIUM",
          confidence: 0.67,
          nudityScores: {
            exposed_anus: 0.01,
            exposed_armpits: 0.12,
            exposed_belly: 0.45,
            exposed_buttocks: 0.02,
            exposed_breast_f: 0.25,
            exposed_breast_m: 0.03,
            exposed_genitalia_f: 0.01,
            exposed_genitalia_m: 0.01,
            exposed_thighs: 0.55,
            face_f: 0.65,
            face_m: 0.05,
            feet: 0.18,
            hands: 0.42,
            underwear: 0.35,
            covered: 0.45,
          },
          isBlocked: false,
        },
      ]);

      // Create some sample activity logs
      await ActivityLog.bulkCreate([
        {
          userId: demo.id,
          type: "DETECTION",
          action: "IMAGE_SCANNED",
          domain: "example.com",
          pageUrl: "https://example.com/page1",
          metadata: { riskLevel: "HIGH", blocked: true },
        },
        {
          userId: demo.id,
          type: "NAVIGATION",
          action: "PAGE_VISIT",
          domain: "example.com",
          pageUrl: "https://example.com/page2",
          metadata: { images: 3, videos: 0 },
        },
        {
          userId: demo.id,
          type: "SETTINGS",
          action: "SENSITIVITY_CHANGED",
          metadata: { from: "LOW", to: "MEDIUM" },
        },
      ]);

      console.log("✅ Demo user created with sample data");
      console.log(`   Email: demo@example.com`);
      console.log(`   Password: demo123`);
    } else {
      console.log("ℹ️  Demo user already exists");
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "migrate":
      await runMigrations();
      break;
    case "seed":
      await seedDatabase();
      break;
    case "reset":
      await runMigrations();
      await seedDatabase();
      break;
    default:
      console.log(`
Usage: node migrate.js [command]

Commands:
  migrate  - Run database migrations (create/update tables)
  seed     - Seed database with initial data
  reset    - Run migrations and seed (full reset)

Examples:
  node migrate.js migrate
  node migrate.js seed
  node migrate.js reset
      `);
      break;
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { runMigrations, seedDatabase };
