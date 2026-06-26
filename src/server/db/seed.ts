import { closeDatabaseConnection } from "./client"
import { seedInitialData } from "./initial-data"

async function seed() {
  await seedInitialData({
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    appName: process.env.APP_NAME ?? "NextNews",
    appUrl: process.env.APP_URL,
  })

  console.log("Seed completed")
}

seed()
  .catch((error) => {
    console.error("Seed failed")
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDatabaseConnection()
  })
