CREATE DATABASE IF NOT EXISTS homesurge;
USE homesurge;

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  full_name TEXT,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(36) PRIMARY KEY,
  listing_reference VARCHAR(20) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ai_generated_description TEXT,
  price DECIMAL(15, 2) NOT NULL,
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

-- Triggers for UUID and Listing Reference
DELIMITER //
CREATE TRIGGER tr_properties_before_insert
CREATE TRIGGER IF NOT EXISTS tr_properties_before_insert
BEFORE INSERT ON properties
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
    
    IF NEW.listing_reference IS NULL OR NEW.listing_reference = '' THEN
        SET @yr = YEAR(NOW());
        SET @seq = (SELECT COUNT(*) + 1 FROM properties WHERE listing_reference LIKE CONCAT('HT-', @yr, '-%'));
        SET NEW.listing_reference = CONCAT('HT-', @yr, '-', LPAD(@seq, 6, '0'));
    END IF;
END //
DELIMITER ;

-- Inquiries Table
CREATE TABLE IF NOT EXISTS property_inquiries (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property Images
CREATE TABLE IF NOT EXISTS property_images (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  image_url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Amenities
CREATE TABLE IF NOT EXISTS amenities (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id VARCHAR(36) PRIMARY KEY,
  admin_id VARCHAR(36),
  action VARCHAR(50) NOT NULL,
  property_id VARCHAR(36),
  property_ref VARCHAR(50),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_pub ON properties (is_published, is_available, county, town);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images (property_id);
CREATE INDEX IF NOT EXISTS idx_amenities_property ON amenities (property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property ON property_inquiries (property_id);

-- Trigger for updated_at on properties
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_properties_updated
BEFORE UPDATE ON properties
FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- Admin activity log trigger
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_log_property_changes
AFTER INSERT ON properties
FOR EACH ROW
BEGIN
  INSERT INTO admin_activity_log (id, admin_id, action, property_id, property_ref, details)
  VALUES (UUID(), NULL, 'CREATE', NEW.id, NEW.listing_reference, JSON_OBJECT('after', JSON_OBJECT('title', NEW.title, 'price', NEW.price)));
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_log_property_changes_update
AFTER UPDATE ON properties
FOR EACH ROW
BEGIN
  IF NEW.is_published = 1 AND OLD.is_published = 0 THEN
    SET @action = 'PUBLISH';
  ELSEIF NEW.is_published = 0 AND OLD.is_published = 1 THEN
    SET @action = 'UNPUBLISH';
  ELSE
    SET @action = 'UPDATE';
  END IF;
  INSERT INTO admin_activity_log (id, admin_id, action, property_id, property_ref, details)
  VALUES (UUID(), NULL, @action, NEW.id, NEW.listing_reference, JSON_OBJECT('before', JSON_OBJECT('title', OLD.title), 'after', JSON_OBJECT('title', NEW.title)));
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_log_property_changes_delete
AFTER DELETE ON properties
FOR EACH ROW
BEGIN
  INSERT INTO admin_activity_log (id, admin_id, action, property_id, property_ref, details)
  VALUES (UUID(), NULL, 'DELETE', OLD.id, OLD.listing_reference, JSON_OBJECT('before', JSON_OBJECT('title', OLD.title)));
END //
DELIMITER ;

-- Duplicate property stored procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS duplicate_property(IN source_id VARCHAR(36), OUT new_id VARCHAR(36))
BEGIN
  SET new_id = UUID();
  INSERT INTO properties (id, title, description, ai_generated_description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, is_available, is_published, cover_image_url)
  SELECT new_id, CONCAT(title, ' (Copy)'), description, ai_generated_description, price, price_type, bedrooms, bathrooms, property_type, furnished, size_sqm, county, town, area_label, estate, address, latitude, longitude, owner_phone, 0, 0, cover_image_url
  FROM properties WHERE id = source_id;
END //
DELIMITER ;

-- Geocode property stored procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS geocode_property(IN p_id VARCHAR(36), IN p_lat DECIMAL(10,8), IN p_lng DECIMAL(11,8))
BEGIN
  UPDATE properties SET latitude = p_lat, longitude = p_lng, updated_at = NOW() WHERE id = p_id;
END //
DELIMITER ;
