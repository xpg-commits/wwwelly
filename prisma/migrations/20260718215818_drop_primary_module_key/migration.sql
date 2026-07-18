-- Removed with the "star = módulo principal" feature: modules are already
-- manually reorderable, making a separate "primary module" pin redundant.
ALTER TABLE "household" DROP COLUMN "primaryModuleKey";
