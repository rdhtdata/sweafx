import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanForProduction() {
  console.log('🧹 SweafEx Production Clean Script Initialized...');
  console.log('⚠️  This will delete all demo customers, transporters, vehicles, drivers, and non-admin users.');

  // 1. Delete all operational and master records
  await prisma.auditLog.deleteMany();
  await prisma.documentAttachment.deleteMany();
  await prisma.vendorQuote.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.customerCorridor.deleteMany();
  await prisma.customerContact.deleteMany();
  await prisma.customerRateContract.deleteMany();
  await prisma.transporterBankDetail.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.transporter.deleteMany();
  await prisma.refreshToken.deleteMany();

  // 2. Remove all non-admin users
  await prisma.user.deleteMany({
    where: {
      role: { not: UserRole.ADMIN }
    }
  });

  // 3. Ensure one clean production Super Admin exists
  const adminEmail = process.env.PROD_ADMIN_EMAIL || 'admin@sweafex.com';
  const adminPass = process.env.PROD_ADMIN_PASSWORD || 'SweafexAdmin@2026';
  const existingAdmin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPass, 12);
    await prisma.user.create({
      data: {
        name: 'SweafEx Super Administrator',
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        department: 'Operations & Management',
        isActive: true
      }
    });
    console.log(`✅ Pristine bootstrap Admin created: ${adminEmail}`);
  } else {
    console.log(`✅ Existing Super Admin preserved: ${existingAdmin.email}`);
  }

  console.log('🎉 Production clean complete! All demo data has been wiped.');
}

cleanForProduction()
  .catch((e) => {
    console.error('Clean error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
