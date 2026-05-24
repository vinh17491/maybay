import { PrismaClient, CabinClass, FlightStatus, BookingStatus, DiscountType, TicketStatus, Priority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- Roles & Permissions ---
  const permissions = [
    { action: "users.manage", description: "Manage users and roles" },
    { action: "flights.manage", description: "Manage flights, aircrafts, and airports" },
    { action: "bookings.manage", description: "Manage all bookings" },
    { action: "payments.manage", description: "Manage payments and refunds" },
    { action: "cms.manage", description: "Manage banners and content" },
    { action: "settings.manage", description: "Manage system settings" },
    { action: "reports.view", description: "View statistics and reports" },
    { action: "support.manage", description: "Manage support tickets" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { action: p.action },
        update: {},
        create: p,
      })
    )
  );

  const roles = [
    { name: "SUPER_ADMIN", description: "Full system access" },
    { name: "ADMIN", description: "Administrative access" },
    { name: "STAFF", description: "Staff access" },
    { name: "AGENT", description: "Travel agent access" },
    { name: "CUSTOMER", description: "Customer access" },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });

    // Assign all permissions to SUPER_ADMIN
    if (role.name === "SUPER_ADMIN") {
      await Promise.all(
        createdPermissions.map((p) =>
          prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: p.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: p.id,
            },
          })
        )
      );
    }
  }

  // --- Airports ---
  const airports = [
    { code: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
    { code: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
    { code: "DAD", name: "Da Nang International Airport", city: "Da Nang", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
    { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore", timezone: "Asia/Singapore" },
    { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok" },
    { code: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", timezone: "Asia/Tokyo" },
    { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", timezone: "Europe/London" },
    { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", timezone: "America/New_York" },
  ];

  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { code: airport.code },
      update: {},
      create: airport,
    });
  }

  // --- Airlines ---
  const airlines = [
    { code: "VN", name: "Vietnam Airlines", country: "Vietnam" },
    { code: "VJ", name: "VietJet Air", country: "Vietnam" },
    { code: "QH", name: "Bamboo Airways", country: "Vietnam" },
    { code: "SQ", name: "Singapore Airlines", country: "Singapore" },
    { code: "TG", name: "Thai Airways", country: "Thailand" },
    { code: "JL", name: "Japan Airlines", country: "Japan" },
    { code: "BA", name: "British Airways", country: "United Kingdom" },
    { code: "AA", name: "American Airlines", country: "United States" },
  ];

  for (const airline of airlines) {
    await prisma.airline.upsert({
      where: { code: airline.code },
      update: {},
      create: airline,
    });
  }

  // --- System Settings ---
  const settings = [
    { key: "SITE_NAME", value: "SkyBooking", group: "GENERAL" },
    { key: "CONTACT_EMAIL", value: "support@skybooking.com", group: "GENERAL" },
    { key: "CURRENCY_DEFAULT", value: "USD", group: "PAYMENT" },
    { key: "MAINTENANCE_MODE", value: "false", group: "SYSTEM" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // --- Default Admin User ---
  const adminEmail = "admin@skybooking.com";
  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  
  if (superAdminRole) {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        // Password: 'password123'
        password: "$argon2id$v=19$m=65536,t=3,p=4$6v8v6v8v6v8v6v8v6v8v6v$fG9H8I7J6K5L4M3N2O1P0Q9R8S7T6U5V4W3X2Y1Z0A9", 
        roles: {
          create: {
            roleId: superAdminRole.id,
          }
        },
        profile: {
          create: {
            firstName: "System",
            lastName: "Administrator",
          }
        }
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
