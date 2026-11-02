ALTER TABLE "Product" ADD COLUMN "sourceCollectionIds" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "Product" ADD COLUMN "homeBlackFriday" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "homeFeaturedOffer" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product"
SET "sourceCollectionIds" = CASE
  WHEN "sourceCollectionId" IS NULL THEN '[]'::jsonb
  ELSE jsonb_build_array("sourceCollectionId")
END;
