"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seed...');
    const adminPassword = await bcrypt_1.default.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminPassword,
            role: 'admin'
        }
    });
    console.log('Created admin user:', admin.username);
    const lawyerPassword = await bcrypt_1.default.hash('lawyer123', 10);
    const lawyer = await prisma.user.upsert({
        where: { username: 'lawyer1' },
        update: {},
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
    console.log('Created sample fees');
    await prisma.payment.create({
        data: {
            caseId: case1.id,
            amount: 20000,
            paymentDate: new Date('2025-10-15'),
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
