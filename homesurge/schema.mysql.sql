-- homesurge MySQL Schema

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) PRIMARY KEY,
    full_name VARCHAR(255),
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS properties (
    id CHAR(36) PRIMARY KEY,
    listing_reference VARCHAR(20) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ai_generated_description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    price_type ENUM('monthly', 'sale', 'negotiable') NOT NULL DEFAULT 'monthly',
    bedrooms INT,
    bathrooms INT,
    property_type VARCHAR(50) NOT NULL DEFAULT 'apartment',
    furnished BOOLEAN DEFAULT FALSE,
    size_sqm DECIMAL(10, 2),
    county VARCHAR(100) NOT NULL DEFAULT '',
    town VARCHAR(100) NOT NULL DEFAULT '',
    area_label VARCHAR(100),
    estate VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    owner_phone VARCHAR(20),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    cover_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_images (
    id CHAR(36) PRIMARY KEY,
    property_id CHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS amenities (
    id CHAR(36) PRIMARY KEY,
    property_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_inquiries (
    id CHAR(36) PRIMARY KEY,
    property_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Index for search performance
CREATE INDEX idx_properties_lookup ON properties (is_published, is_available, county, town);

-- Trigger to auto-generate Listing Reference HT-YYYY-XXXXXX
DELIMITER //
CREATE TRIGGER tr_listing_ref_before_insert
BEFORE INSERT ON properties
FOR EACH ROW
BEGIN
    DECLARE seq_count INT;
    DECLARE yr CHAR(4);
    SET yr = YEAR(NOW());
    
    IF NEW.listing_reference IS NULL OR NEW.listing_reference = '' THEN
        SELECT COUNT(*) + 1 INTO seq_count 
        FROM properties 
        WHERE listing_reference LIKE CONCAT('HT-', yr, '-%');
        
        SET NEW.listing_reference = CONCAT('HT-', yr, '-', LPAD(seq_count, 6, '0'));
    END IF;
END;
//
DELIMITER ;
