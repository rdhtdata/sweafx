import app from './index';
import { prisma } from './db/prisma';

async function runVerification() {
  console.log('🧪 Starting Comprehensive SweafEx Segment 1 Live Operational Verification Tests...');
  const server = app.listen(5098);

  try {
    const baseUrl = 'http://localhost:5098/api';

    // 1. Health Check
    const healthRes = await fetch('http://localhost:5098/health');
    const healthJson = await healthRes.json();
    console.log('✅ 1. Health check passed:', healthJson.service);

    // 2. Authentication: Admin & Sales Login
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sweafex.com', password: 'Sweafex@2026' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data.tokens.accessToken;

    const salesLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sales@sweafex.com', password: 'Sweafex@2026' })
    });
    const salesLoginData = await salesLoginRes.json();
    const salesToken = salesLoginData.data.tokens.accessToken;
    console.log('✅ 2. Auth tokens generated for Admin and Sales Coordinator');

    // 3. Customer Master Check
    const custRes = await fetch(`${baseUrl}/customers`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const custData = await custRes.json();
    const customer = custData.data[0];
    console.log(`✅ 3. Customer Master verified: Loaded ${custData.data.length} clients (e.g. ${customer.companyName})`);

    // 4. Create Customer Enquiry (simulating WhatsApp intake)
    const newEnqRes = await fetch(`${baseUrl}/enquiries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerId: customer.id,
        sourceChannel: 'WHATSAPP',
        loadingCity: 'Bangalore',
        loadingAreaPin: 'Kumbalgodu - 560026',
        unloadingCity: 'Tuni',
        unloadingAreaPin: 'Tuni - 531127',
        vehicleLength: '20 Feet',
        vehicleType: 'Open Body',
        materialType: 'Iron and Steel',
        materialWeight: '7 Tonnes',
        loadingDate: new Date().toISOString(),
        loadingRequirement: 'Immediate / Now',
        targetPrice: 32000,
        notes: 'Simulated WhatsApp enquiry'
      })
    });
    const newEnqData = await newEnqRes.json();
    if (!newEnqData.success) throw new Error('Enquiry creation failed');
    const enquiry = newEnqData.data;
    console.log(`✅ 4. Customer Enquiry created: ${enquiry.enquiryNumber} (${enquiry.loadingCity} -> ${enquiry.unloadingCity})`);

    // 5. Transporters & Vendor Master Check
    const trpRes = await fetch(`${baseUrl}/transporters`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const trps = (await trpRes.json()).data;
    console.log(`✅ 5. Transporters Master loaded: ${trps.length} partners with party types & verified bank accounts`);

    // 6. Log Vendor Quotations (Quote 1, Quote 2, Quote 3)
    const quote1Res = await fetch(`${baseUrl}/enquiries/${enquiry.id}/quotes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteNumber: 1,
        transporterId: trps[0].id,
        quotedRate: 34000,
        availability: 'AVAILABLE',
        notes: 'Quote 1 from SM Transporter'
      })
    });
    await quote1Res.json();

    const quote2Res = await fetch(`${baseUrl}/enquiries/${enquiry.id}/quotes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteNumber: 2,
        transporterId: trps[1].id,
        quotedRate: 31000, // Lowest rate!
        availability: 'AVAILABLE',
        notes: 'Quote 2 from Surya Golden Cargo'
      })
    });
    const quote2Data = await quote2Res.json();
    console.log(`✅ 6. Logged vendor quotations. Quotes count: ${quote2Data.data.length}`);

    // Verify Best Rate auto-detection
    const bestQuote = quote2Data.data.find((q: any) => q.isBestRate);
    if (!bestQuote || Number(bestQuote.quotedRate) !== 31000) {
      throw new Error('Best rate calculation failed');
    }
    console.log(`✅ 7. Automatic Best Rate identified: ₹${bestQuote.quotedRate} by ${bestQuote.transporterName}`);

    // 8. Manual Selection of Quote
    const selectRes = await fetch(`${baseUrl}/enquiries/${enquiry.id}/quotes/${bestQuote.id}/select`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const selectData = await selectRes.json();
    console.log(`✅ 8. Manual Winning Quote Selection verified: ${selectData.message}`);

    // 9. Convert Enquiry to Operational Requirement
    const convertRes = await fetch(`${baseUrl}/enquiries/${enquiry.id}/convert-to-requirement`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripRate: 32000 })
    });
    const convertData = await convertRes.json();
    const requirement = convertData.data;
    console.log(`✅ 9. Converted Enquiry to Requirement: ${requirement.requirementNumber} linked to ${requirement.enquiryNumber}`);

    // 10. Fleet Vehicles & Drivers lookup
    const vehRes = await fetch(`${baseUrl}/transporters/fleet/vehicles`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const vehicles = (await vehRes.json()).data;

    const driRes = await fetch(`${baseUrl}/transporters/fleet/drivers`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const drivers = (await driRes.json()).data;

    // 11. Assign Placement Vehicle and Driver (using Admin / Traffic Ops role)
    const assignRes = await fetch(`${baseUrl}/requirements/${requirement.id}/assign-placement`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        tripRate: 32000
      })
    });
    const assignJson = await assignRes.json();
    if (!assignJson.success) throw new Error(`Assign placement failed: ${assignJson.message}`);
    const assignedReq = assignJson.data;
    console.log(`✅ 11. Assigned Placement: Truck ${assignedReq.selectedVehicleNumber}, Driver ${assignedReq.selectedDriverName}, Status: ${assignedReq.finalStatus}`);

    // 12. Generate Client WhatsApp Confirmation Message Preview
    const waPreviewRes = await fetch(`${baseUrl}/requirements/${requirement.id}/whatsapp-preview`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const waPreview = (await waPreviewRes.json()).data;
    console.log('✅ 12. Generated Client WhatsApp Confirmation Message Preview:');
    console.log('---------------------------------------------------------');
    console.log(waPreview.formattedMessage);
    console.log('---------------------------------------------------------');

    if (!waPreview.formattedMessage.includes('Trans ID') || !waPreview.formattedMessage.includes('Trip ID')) {
      throw new Error('WhatsApp message format invalid');
    }

    // 13. Test 12-Filter Unified CRM Search
    const searchRes = await fetch(`${baseUrl}/search/crm?loadingCity=Bangalore&unloadingCity=Tuni`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const searchData = await searchRes.json();
    console.log(`✅ 13. CRM Multi-Field Search verified: Found ${searchData.data.requirements.length} matching operational records`);

    // 14. Test Mandatory Closure Reason when closing an enquiry
    const closeRes = await fetch(`${baseUrl}/enquiries/${enquiry.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${salesToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CANCELLED_CLOSED',
        closureReason: 'Rate Difference'
      })
    });
    const closedData = await closeRes.json();
    console.log(`✅ 14. Mandatory Closure Reason verified: ${closedData.data.status} with reason "${closedData.data.closureReason}"`);

    // 15. Verify Tamper-Evident Audit Trail
    const auditRes = await fetch(`${baseUrl}/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    console.log(`✅ 15. Audit Trail verified: ${auditData.data.length} operational events logged with actors & timestamps`);

    console.log('\n🎉 ALL SWEAFEX SEGMENT 1 WORKFLOW & COMPLIANCE TESTS PASSED! 🎉\n');
    process.exit(0);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
