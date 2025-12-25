-- Add critic review fields to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS positive_reviews INT DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS mixed_reviews INT DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS negative_reviews INT DEFAULT 0;

-- Update existing records to have default values
UPDATE content SET positive_reviews = 0 WHERE positive_reviews IS NULL;
UPDATE content SET mixed_reviews = 0 WHERE mixed_reviews IS NULL;
UPDATE content SET negative_reviews = 0 WHERE negative_reviews IS NULL;
