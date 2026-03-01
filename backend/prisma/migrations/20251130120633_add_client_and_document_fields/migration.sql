-- AlterTable
ALTER TABLE `Client` ADD COLUMN `eDevletPassword` VARCHAR(191) NULL,
    ADD COLUMN `idNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Document` ADD COLUMN `fileName` VARCHAR(191) NULL,
    ADD COLUMN `fileType` VARCHAR(191) NULL,
    ADD COLUMN `fileUrl` VARCHAR(191) NULL,
    MODIFY `content` TEXT NULL;
