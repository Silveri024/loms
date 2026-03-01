import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean up existing data to allow re-running seed
  await prisma.payment.deleteMany({});
  await prisma.caseFee.deleteMany({});
  await prisma.interactionLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.caseAccess.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.template.deleteMany({});
  // Don't delete users to preserve admin/lawyer accounts

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminPassword,
      role: 'admin'
    },
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin'
    }
  });
  console.log('Created admin user:', admin.username);

  const lawyerPassword = await bcrypt.hash('lawyer123', 10);
  const lawyer = await prisma.user.upsert({
    where: { username: 'lawyer1' },
    update: {
      passwordHash: lawyerPassword,
      role: 'lawyer'
    },
    create: {
      username: 'lawyer1',
      passwordHash: lawyerPassword,
      role: 'lawyer'
    }
  });
  console.log('Created lawyer user:', lawyer.username);

  const client1 = await prisma.client.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+90 555 123 4567',
      address: 'Istanbul, Turkey'
    }
  });

  const client2 = await prisma.client.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+90 555 987 6543',
      address: 'Ankara, Turkey'
    }
  });

  const client3 = await prisma.client.upsert({
    where: { email: 'legal@techinnovations.com' },
    update: {},
    create: {
      name: 'Tech Innovations Inc.',
      email: 'legal@techinnovations.com',
      phone: '+90 216 555 1111',
      address: 'Besiktash, Istanbul, Turkey',
      idNumber: '1234567890'
    }
  });

  const client4 = await prisma.client.upsert({
    where: { email: 'info@globaltrade.com' },
    update: {},
    create: {
      name: 'Global Trade Ltd.',
      email: 'info@globaltrade.com',
      phone: '+90 312 555 2222',
      address: 'Cankaya, Ankara, Turkey'
    }
  });

  const client5 = await prisma.client.upsert({
    where: { email: 'support@istanbulrealestate.com' },
    update: {},
    create: {
      name: 'Istanbul Real Estate Group',
      email: 'support@istanbulrealestate.com',
      phone: '+90 212 555 3333',
      address: 'Kadikoy, Istanbul, Turkey'
    }
  });

  console.log('Created sample clients');

  const case1 = await prisma.case.create({
    data: {
      title: 'Contract Dispute Case',
      clientId: client1.id,
      lawyerId: lawyer.id,
      status: 'open',
      deadline: new Date('2025-12-31')
    }
  });

  const case2 = await prisma.case.create({
    data: {
      title: 'Property Rights Case',
      clientId: client2.id,
      lawyerId: lawyer.id,
      status: 'open',
      deadline: new Date('2025-11-30')
    }
  });

  const case3 = await prisma.case.create({
    data: {
      title: 'Software License Dispute',
      clientId: client3.id,
      lawyerId: lawyer.id,
      status: 'open',
      deadline: new Date('2026-03-15'),
      opposition: 'Competing Software Corp',
      oppositionLawyer: 'John Richardson, Esq.'
    }
  });

  const case4 = await prisma.case.create({
    data: {
      title: 'International Trade Agreement',
      clientId: client4.id,
      lawyerId: lawyer.id,
      status: 'in_progress',
      deadline: new Date('2026-02-28')
    }
  });

  const case5 = await prisma.case.create({
    data: {
      title: 'Commercial Property Lease Review',
      clientId: client5.id,
      lawyerId: lawyer.id,
      status: 'closed',
      opposition: 'Property Management Corp',
      oppositionLawyer: 'Sarah Mitchell'
    }
  });

  console.log('Created sample cases');

  await prisma.document.create({
    data: {
      caseId: case1.id,
      title: 'Initial Contract',
      content: 'This is the initial contract document for the dispute case.'
    }
  });

  await prisma.document.create({
    data: {
      caseId: case1.id,
      title: 'Evidence Document',
      content: 'Evidence collected for the contract dispute.'
    }
  });

  await prisma.document.create({
    data: {
      caseId: case2.id,
      title: 'Property Deed',
      content: 'Official property deed and ownership documentation.'
    }
  });

  await prisma.document.create({
    data: {
      caseId: case3.id,
      title: 'Software License Agreement',
      content: 'Original software license agreement between parties.'
    }
  });

  await prisma.document.create({
    data: {
      caseId: case3.id,
      title: 'Technical Report',
      content: 'Technical analysis of software licensing terms and compliance.'
    }
  });

  await prisma.document.create({
    data: {
      caseId: case4.id,
      title: 'Trade Agreement Draft',
      content: 'First draft of international trade agreement terms.'
    }
  });

  console.log('Created sample documents');

  await prisma.interactionLog.create({
    data: {
      caseId: case1.id,
      note: 'Initial client meeting completed. Discussed case details.'
    }
  });

  await prisma.interactionLog.create({
    data: {
      caseId: case1.id,
      note: 'Submitted initial documents to court.'
    }
  });

  await prisma.interactionLog.create({
    data: {
      caseId: case2.id,
      note: 'Property inspection completed. All documentation reviewed.'
    }
  });

  await prisma.interactionLog.create({
    data: {
      caseId: case3.id,
      note: 'Conference call with opposing counsel regarding license terms.'
    }
  });

  await prisma.interactionLog.create({
    data: {
      caseId: case4.id,
      note: 'International trade team meeting to review agreement framework.'
    }
  });

  await prisma.interactionLog.create({
    data: {
      caseId: case4.id,
      note: 'Revised terms submitted for client approval.'
    }
  });

  console.log('Created sample logs');

  await prisma.caseFee.create({
    data: {
      caseId: case1.id,
      totalFee: 50000,
      amountPaid: 20000,
      paymentStatus: 'partial'
    }
  });

  await prisma.caseFee.create({
    data: {
      caseId: case2.id,
      totalFee: 75000,
      amountPaid: 0,
      paymentStatus: 'pending'
    }
  });

  await prisma.caseFee.create({
    data: {
      caseId: case3.id,
      totalFee: 120000,
      amountPaid: 40000,
      paymentStatus: 'partial'
    }
  });

  await prisma.caseFee.create({
    data: {
      caseId: case4.id,
      totalFee: 200000,
      amountPaid: 100000,
      paymentStatus: 'partial'
    }
  });

  await prisma.caseFee.create({
    data: {
      caseId: case5.id,
      totalFee: 35000,
      amountPaid: 35000,
      paymentStatus: 'paid'
    }
  });

  console.log('Created sample fees');

  await prisma.payment.create({
    data: {
      caseId: case1.id,
      amount: 20000,
      paymentDate: new Date('2025-10-15'),
      method: 'bank_transfer'
    }
  });

  await prisma.payment.create({
    data: {
      caseId: case3.id,
      amount: 40000,
      paymentDate: new Date('2025-11-20'),
      method: 'bank_transfer'
    }
  });

  await prisma.payment.create({
    data: {
      caseId: case4.id,
      amount: 100000,
      paymentDate: new Date('2025-12-01'),
      method: 'credit_card'
    }
  });

  await prisma.payment.create({
    data: {
      caseId: case5.id,
      amount: 35000,
      paymentDate: new Date('2025-09-10'),
      method: 'bank_transfer'
    }
  });

  console.log('Created sample payments');

  await prisma.template.create({
    data: {
      title: 'Standard Contract Template',
      content: 'This is a standard contract template. [PARTY_A] and [PARTY_B] agree to...'
    }
  });

  await prisma.template.create({
    data: {
      title: 'Court Petition Template',
      content: 'To the Honorable Court, We hereby petition for...'
    }
  });
  console.log('Created sample templates');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
