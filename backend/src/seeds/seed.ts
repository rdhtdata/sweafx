import {
  PrismaClient,
  UserRole,
  EntityStatus,
  VendorPartyType,
  VerificationStatus,
  EnquiryStatus,
  EnquirySourceChannel,
  QuoteAvailability,
  RequirementFinalStatus
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SweafEx Segment 1 comprehensive seed (Live Workflow & Masters)...');

  // 1. Wipe existing data in order
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
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Sweafex@2026', 10);

  // 2. Seed Internal Role Accounts
  console.log('👤 Seeding 5 internal role accounts...');
  const usersData = [
    {
      name: 'System Administrator',
      email: 'admin@sweafex.com',
      role: UserRole.ADMIN,
      department: 'Management',
      phone: '+91 9800000001'
    },
    {
      name: 'Rajesh Sharma (Management)',
      email: 'management@sweafex.com',
      role: UserRole.MANAGEMENT,
      department: 'Executive Leadership',
      phone: '+91 9800000002'
    },
    {
      name: 'Amit Patel (Sales Lead)',
      email: 'sales@sweafex.com',
      role: UserRole.SALES,
      department: 'Commercial & Sales',
      phone: '+91 9800000003'
    },
    {
      name: 'Vikas Deshmukh (Traffic Ops)',
      email: 'ops@sweafex.com',
      role: UserRole.TRAFFIC_OPS,
      department: 'Traffic & Fleet Operations',
      phone: '+91 9800000004'
    },
    {
      name: 'Sunita Menon (Accounts)',
      email: 'accounts@sweafex.com',
      role: UserRole.ACCOUNTS,
      department: 'Billing & Commercial Review',
      phone: '+91 9800000005'
    }
  ];

  for (const u of usersData) {
    await prisma.user.create({
      data: {
        ...u,
        passwordHash,
        isActive: true
      }
    });
  }

  // 3. Seed Realistic Indian Enterprise Customers (including Micron Electricals from live WhatsApp documentation!)
  console.log('🏢 Seeding Indian corporate customer master records...');
  const customersData = [
    {
      customerCode: 'CUST-001',
      companyName: 'Micron Electricals India Pvt Ltd',
      tradeName: 'Micron Electricals',
      gstin: '29AAACM4567P1Z1',
      pan: 'AAACM4567P',
      billingAddress: 'Plot 18, Peenya Industrial Area, 2nd Phase',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560058',
      industry: 'Electrical Equipment & Transformers',
      paymentTermsDays: 30,
      creditLimit: 3500000.0,
      status: EntityStatus.ACTIVE,
      contacts: [
        { name: 'K. S. Narayanan', designation: 'Dispatch Manager', phone: '+91 9845011223', email: 'narayanan@micronelectricals.com', isPrimary: true }
      ],
      corridors: [
        { originCity: 'Bangalore', originState: 'Karnataka', destCity: 'Tuni', destState: 'Andhra Pradesh', standardVehicleType: '20 FT Open Body', agreedRate: 35000, billingBasis: 'PER_TRIP' }
      ]
    },
    {
      customerCode: 'CUST-002',
      companyName: 'Marico Consumer Goods Pvt Ltd',
      tradeName: 'Marico India',
      gstin: '27AAACM1234F1Z5',
      pan: 'AAACM1234F',
      billingAddress: 'Grande Palladium, 7th Floor, 175 CST Road, Kalina, Santacruz East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400098',
      industry: 'FMCG & Edible Oils',
      paymentTermsDays: 30,
      creditLimit: 2500000.0,
      status: EntityStatus.ACTIVE,
      contacts: [
        { name: 'Siddharth Roy', designation: 'Supply Chain Manager', phone: '+91 9820112233', email: 'siddharth.roy@marico.com', isPrimary: true }
      ],
      corridors: [
        { originCity: 'Mumbai', originState: 'Maharashtra', destCity: 'Bangalore', destState: 'Karnataka', standardVehicleType: '32 FT Multi-Axle (MXL)', agreedRate: 68000, billingBasis: 'PER_TRIP' }
      ]
    },
    {
      customerCode: 'CUST-003',
      companyName: 'Havells Electricals India Ltd',
      tradeName: 'Havells',
      gstin: '06AAACH1234Q1Z8',
      pan: 'AAACH1234Q',
      billingAddress: 'QRG Towers, 2D Expressway, Sector 126',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201304',
      industry: 'Consumer Electricals & Cables',
      paymentTermsDays: 45,
      creditLimit: 4000000.0,
      status: EntityStatus.ACTIVE,
      contacts: [
        { name: 'Naveen Jindal', designation: 'General Manager - Dispatch', phone: '+91 9811002233', email: 'naveen.j@havells.com', isPrimary: true }
      ],
      corridors: [
        { originCity: 'Noida', originState: 'Uttar Pradesh', destCity: 'Pune', destState: 'Maharashtra', standardVehicleType: '32 FT Single-Axle (SXL)', agreedRate: 58000, billingBasis: 'PER_TRIP' }
      ]
    }
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const { contacts, corridors, ...custFields } = c;
    const created = await prisma.customer.create({
      data: {
        ...custFields,
        contacts: { create: contacts },
        corridors: { create: corridors }
      }
    });
    createdCustomers.push(created);
  }

  // 4. Seed Transporters with specific party types (BROKER, FLEET_OWNER, TRUCK_OWNER)
  console.log('🚛 Seeding Transporters & Brokers...');
  const transportersData = [
    {
      transporterCode: 'TRP-001',
      companyName: 'SM Transporter & Logistics',
      tradeName: 'SM Transporter',
      partyType: VendorPartyType.BROKER,
      gstin: '29AAECW3533B1ZI', // Trans ID from WhatsApp documentation!
      pan: 'AAECW3533B',
      contactPerson: 'Suresh More',
      phone: '+91 9845112233',
      email: 'suresh@smtransporter.com',
      address: 'Shop 14, APMC Yard, Yeshwanthpur',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560022',
      brokerName: 'Anil Brokerage Agency',
      truckOwnerName: 'Govindappa',
      brokerOwnerPhone: '+91 9845199999',
      standardPaymentDays: 15,
      rating: 4.8,
      reliabilityRating: 4.7,
      responseTimeMinutes: 20,
      totalTripsCount: 42,
      status: EntityStatus.ACTIVE,
      bankDetails: [
        {
          accountHolderName: 'SM Transporter',
          bankName: 'Canara Bank',
          accountNumber: '0412101009988',
          ifscCode: 'CNRB0000412',
          branchName: 'Yeshwanthpur Bangalore',
          isPrimary: true,
          isVerified: true
        }
      ]
    },
    {
      transporterCode: 'TRP-002',
      companyName: 'Surya Golden Cargo Carrier',
      tradeName: 'Surya Cargo',
      partyType: VendorPartyType.FLEET_OWNER,
      gstin: '07AAAFS4455M1Z9',
      pan: 'AAAFS4455M',
      contactPerson: 'Kuldeep Yadav',
      phone: '+91 9810112299',
      email: 'dispatch@suryacargo.com',
      address: 'Shop 12, Sanjay Gandhi Transport Nagar',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110042',
      brokerName: null,
      truckOwnerName: 'Kuldeep Yadav',
      brokerOwnerPhone: '+91 9810112299',
      standardPaymentDays: 15,
      rating: 4.6,
      reliabilityRating: 4.5,
      responseTimeMinutes: 25,
      totalTripsCount: 28,
      status: EntityStatus.ACTIVE,
      bankDetails: [
        {
          accountHolderName: 'Surya Golden Cargo',
          bankName: 'State Bank of India',
          accountNumber: '38192837465',
          ifscCode: 'SBIN0004523',
          branchName: 'SGT Nagar Delhi',
          isPrimary: true,
          isVerified: true
        }
      ]
    },
    {
      transporterCode: 'TRP-003',
      companyName: 'Kaveri Freight Lines South India',
      tradeName: 'Kaveri Freight',
      partyType: VendorPartyType.TRANSPORTER,
      gstin: '33AABCK7766D1Z1',
      pan: 'AABCK7766D',
      contactPerson: 'Senthil Murugan',
      phone: '+91 9444012345',
      email: 'senthil@kaverifreight.co.in',
      address: 'Door 8, Madhavaram Truck Terminal',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600110',
      brokerName: null,
      truckOwnerName: null,
      brokerOwnerPhone: null,
      standardPaymentDays: 15,
      rating: 4.5,
      reliabilityRating: 4.4,
      responseTimeMinutes: 35,
      totalTripsCount: 19,
      status: EntityStatus.ACTIVE,
      bankDetails: [
        {
          accountHolderName: 'Kaveri Freight Lines',
          bankName: 'ICICI Bank',
          accountNumber: '001805009988',
          ifscCode: 'ICIC0000018',
          branchName: 'Madhavaram Chennai',
          isPrimary: true,
          isVerified: true
        }
      ]
    }
  ];

  const createdTransporters: any[] = [];
  for (const t of transportersData) {
    const { bankDetails, ...tFields } = t;
    const created = await prisma.transporter.create({
      data: {
        ...tFields,
        bankDetails: { create: bankDetails }
      }
    });
    createdTransporters.push(created);
  }

  // 5. Seed Vehicles (including AP39UB 3717 from live WhatsApp documentation!)
  console.log('🚚 Seeding Fleet Vehicles with Passing Capacity and PUCC/Tax...');
  const now = new Date();
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const vehiclesData = [
    {
      vehicleNumber: 'AP39UB3717', // From WhatsApp confirmation example!
      transporterId: createdTransporters[0].id,
      vehicleSize: '20 Feet',
      vehicleType: '20 FT Open Body',
      carryingCapacityTons: 7.0,
      passingCapacityTons: 7.0,
      rcNumber: 'RC-AP39UB3717',
      rcExpiryDate: daysFromNow(280),
      insuranceNumber: 'BA-INS-99120',
      insuranceExpiryDate: daysFromNow(120),
      fitnessExpiryDate: daysFromNow(180),
      taxExpiryDate: daysFromNow(150),
      puccExpiryDate: daysFromNow(90),
      permitNumber: 'NP-AP-88190',
      permitExpiryDate: daysFromNow(210),
      isVerified: false,
      verificationStatus: VerificationStatus.UNVERIFIED, // Shows ❌ in WhatsApp!
      gpsInstalled: true,
      gpsDeviceId: 'GPS-AP-101'
    },
    {
      vehicleNumber: 'MH14GV5521',
      transporterId: createdTransporters[0].id,
      vehicleSize: '32 Feet',
      vehicleType: '32 FT Multi-Axle (MXL)',
      carryingCapacityTons: 15.0,
      passingCapacityTons: 14.5,
      rcNumber: 'RC-MH14GV5521',
      rcExpiryDate: daysFromNow(450),
      insuranceNumber: 'BA-INS-99121',
      insuranceExpiryDate: daysFromNow(120),
      fitnessExpiryDate: daysFromNow(180),
      taxExpiryDate: daysFromNow(200),
      puccExpiryDate: daysFromNow(110),
      permitNumber: 'NP-IND-88190',
      permitExpiryDate: daysFromNow(210),
      isVerified: true,
      verificationStatus: VerificationStatus.VERIFIED, // Shows ✅
      gpsInstalled: true,
      gpsDeviceId: 'GPS-TRK-101'
    },
    {
      vehicleNumber: 'DL01AB9944',
      transporterId: createdTransporters[1].id,
      vehicleSize: '32 Feet',
      vehicleType: '32 FT Single-Axle (SXL)',
      carryingCapacityTons: 9.0,
      passingCapacityTons: 8.5,
      rcNumber: 'RC-DL01AB9944',
      rcExpiryDate: daysFromNow(500),
      insuranceNumber: 'ICICI-LOMB-7761',
      insuranceExpiryDate: daysFromNow(200),
      fitnessExpiryDate: daysFromNow(-5), // EXPIRED (-5 days) -> Critical alert!
      taxExpiryDate: daysFromNow(60),
      puccExpiryDate: daysFromNow(-2), // EXPIRED PUCC
      permitNumber: 'NP-IND-33441',
      permitExpiryDate: daysFromNow(25), // EXPIRING SOON
      isVerified: false,
      verificationStatus: VerificationStatus.PENDING_CHECK,
      gpsInstalled: true,
      gpsDeviceId: 'GPS-TRK-103'
    }
  ];

  const createdVehicles: any[] = [];
  for (const v of vehiclesData) {
    const created = await prisma.vehicle.create({ data: v });
    createdVehicles.push(created);
  }

  // 6. Seed Drivers (including Vinod Kumar from live WhatsApp documentation!)
  console.log('👨‍✈️ Seeding Drivers with DL Compatibility and Verification states...');
  const driversData = [
    {
      fullName: 'Vinod Kumar', // From WhatsApp confirmation example!
      phone: '+91 9504884888',
      licenseNumber: 'AP00220210030453', // From WhatsApp confirmation example!
      licenseExpiryDate: daysFromNow(240),
      dlCompatibility: 'HTV - Heavy Transport Vehicle',
      transporterId: createdTransporters[0].id,
      city: 'Bangalore',
      state: 'Karnataka',
      isVerified: false,
      verificationStatus: VerificationStatus.UNVERIFIED // Shows ❌ in WhatsApp!
    },
    {
      fullName: 'Rameshwar Yadav',
      phone: '+91 9988776611',
      licenseNumber: 'MH1420180099123',
      licenseExpiryDate: daysFromNow(365),
      dlCompatibility: 'HTV - Heavy Transport Vehicle',
      transporterId: createdTransporters[0].id,
      city: 'Pune',
      state: 'Maharashtra',
      isVerified: true,
      verificationStatus: VerificationStatus.VERIFIED // Shows ✅
    },
    {
      fullName: 'P. Arumugam',
      phone: '+91 9988776633',
      licenseNumber: 'TN0520120044551',
      licenseExpiryDate: daysFromNow(-12), // EXPIRED
      dlCompatibility: 'HTV - Heavy Transport Vehicle',
      transporterId: createdTransporters[2].id,
      city: 'Chennai',
      state: 'Tamil Nadu',
      isVerified: false,
      verificationStatus: VerificationStatus.UNVERIFIED
    }
  ];

  const createdDrivers: any[] = [];
  for (const d of driversData) {
    const created = await prisma.driver.create({ data: d });
    createdDrivers.push(created);
  }

  // 7. Seed Enquiries, Quotations, and Requirements (including live Tuni enquiry ENQ1071!)
  console.log('📋 Seeding Live Operational Enquiries, 4-Vendor Quotations, and Requirements...');
  const enquiry1 = await prisma.enquiry.create({
    data: {
      enquiryNumber: 'ENQ1071',
      customerId: createdCustomers[0].id,
      customerName: createdCustomers[0].companyName,
      sourceChannel: EnquirySourceChannel.WHATSAPP,
      loadingAreaPin: 'Kumbalgodu - 560026',
      loadingCity: 'Bangalore',
      unloadingAreaPin: 'Tuni - 531127',
      unloadingCity: 'Tuni',
      vehicleLength: '20 Feet',
      vehicleType: 'Open Body',
      materialType: 'Iron and Steel',
      materialWeight: '7 Tonnes',
      loadingDate: daysFromNow(1),
      loadingRequirement: 'Immediate / Now',
      targetPrice: 32000.0,
      status: EnquiryStatus.RATE_SET,
      notes: 'Received via WhatsApp from Micron Electricals. High priority shipment.'
    }
  });

  // Seed 3 Vendor Quotations against ENQ1071
  const quote1 = await prisma.vendorQuote.create({
    data: {
      enquiryId: enquiry1.id,
      quoteNumber: 1,
      transporterId: createdTransporters[0].id,
      transporterName: createdTransporters[0].companyName,
      quotedRate: 31000.0,
      availability: QuoteAvailability.AVAILABLE,
      vehicleNumber: 'AP39UB3717',
      isBestRate: true, // Lowest rate!
      isSelected: true, // Manually selected by coordinator!
      notes: 'Can place vehicle within 2 hours.'
    }
  });

  await prisma.vendorQuote.create({
    data: {
      enquiryId: enquiry1.id,
      quoteNumber: 2,
      transporterId: createdTransporters[1].id,
      transporterName: createdTransporters[1].companyName,
      quotedRate: 33500.0,
      availability: QuoteAvailability.AVAILABLE,
      vehicleNumber: 'DL01AB9944',
      isBestRate: false,
      isSelected: false,
      notes: 'Regular market quote.'
    }
  });

  await prisma.vendorQuote.create({
    data: {
      enquiryId: enquiry1.id,
      quoteNumber: 3,
      transporterId: createdTransporters[2].id,
      transporterName: createdTransporters[2].companyName,
      quotedRate: 32000.0,
      availability: QuoteAvailability.TENTATIVE,
      vehicleNumber: null,
      isBestRate: false,
      isSelected: false,
      notes: 'Awaiting confirmation from driver.'
    }
  });

  // Create Requirement for ENQ1071 with placement handoff
  await prisma.requirement.create({
    data: {
      requirementNumber: 'REQ0001',
      enquiryId: enquiry1.id,
      enquiryNumber: enquiry1.enquiryNumber,
      customerId: createdCustomers[0].id,
      customerName: createdCustomers[0].companyName,
      loadingAreaPin: enquiry1.loadingAreaPin,
      loadingCity: enquiry1.loadingCity,
      unloadingAreaPin: enquiry1.unloadingAreaPin,
      unloadingCity: enquiry1.unloadingCity,
      vehicleLength: enquiry1.vehicleLength,
      vehicleType: enquiry1.vehicleType,
      materialType: enquiry1.materialType,
      materialWeight: enquiry1.materialWeight,
      loadingDate: enquiry1.loadingDate,
      tripRate: 32000.0, // Customer agreed rate
      finalStatus: RequirementFinalStatus.READY_FOR_PLACEMENT,
      selectedQuoteId: quote1.id,
      selectedTransporterId: createdTransporters[0].id,
      selectedTransporterName: createdTransporters[0].companyName,
      selectedVehicleId: createdVehicles[0].id,
      selectedVehicleNumber: createdVehicles[0].vehicleNumber,
      selectedDriverId: createdDrivers[0].id,
      selectedDriverName: createdDrivers[0].fullName,
      selectedDriverPhone: createdDrivers[0].phone,
      selectedDriverDl: createdDrivers[0].licenseNumber,
      finalTripId: 'EXP0369', // From WhatsApp confirmation example!
      notes: 'Customer rate ₹32,000, Vendor cost ₹31,000. Projected Gross Margin: ₹1,000.'
    }
  });

  // Seed Enquiry 2 (Marico Mumbai to Bangalore)
  await prisma.enquiry.create({
    data: {
      enquiryNumber: 'ENQ1072',
      customerId: createdCustomers[1].id,
      customerName: createdCustomers[1].companyName,
      sourceChannel: EnquirySourceChannel.WEBSITE,
      loadingAreaPin: 'Kalina Santacruz - 400098',
      loadingCity: 'Mumbai',
      unloadingAreaPin: 'Electronic City - 560100',
      unloadingCity: 'Bangalore',
      vehicleLength: '32 Feet',
      vehicleType: '32 FT Multi-Axle (MXL)',
      materialType: 'FMCG Oil Carts',
      materialWeight: '14 Tonnes',
      loadingDate: daysFromNow(2),
      loadingRequirement: 'Scheduled',
      targetPrice: 68000.0,
      status: EnquiryStatus.NEW,
      notes: 'Weekly recurring movement contract.'
    }
  });

  console.log('✅ Segment 1 Seed complete! Summary:');
  console.log('   - 5 Internal Users (Admin, Management, Sales, Traffic Ops, Accounts)');
  console.log('   - 3 Indian Corporate Customers (Micron Electricals, Marico, Havells)');
  console.log('   - 3 Transporters/Brokers (SM Transporter [Trans ID: 29AAECW3533B1ZI], Surya, Kaveri)');
  console.log('   - 3 Fleet Vehicles (including AP39UB3717 with passing & unverified status ❌)');
  console.log('   - 3 Drivers (including Vinod Kumar with DL AP00220210030453 ❌)');
  console.log('   - 2 Enquiries (including live Tuni ENQ1071 with 3 vendor quotes & best-rate calculation)');
  console.log('   - 1 Active Operational Requirement (REQ0001 / EXP0369 ready for placement handoff)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
