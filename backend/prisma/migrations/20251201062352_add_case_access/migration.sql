-- CreateTable
CREATE TABLE `CaseAccess` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `internId` VARCHAR(191) NOT NULL,
    `grantedById` VARCHAR(191) NOT NULL,
    `canViewDocuments` BOOLEAN NOT NULL DEFAULT true,
    `canUploadDocuments` BOOLEAN NOT NULL DEFAULT false,
    `canViewLogs` BOOLEAN NOT NULL DEFAULT true,
    `canAddLogs` BOOLEAN NOT NULL DEFAULT false,
    `canViewPayments` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CaseAccess_caseId_internId_key`(`caseId`, `internId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CaseAccess` ADD CONSTRAINT `CaseAccess_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseAccess` ADD CONSTRAINT `CaseAccess_internId_fkey` FOREIGN KEY (`internId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseAccess` ADD CONSTRAINT `CaseAccess_grantedById_fkey` FOREIGN KEY (`grantedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
