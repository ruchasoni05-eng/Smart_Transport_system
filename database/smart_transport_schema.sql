-- =====================================================================
-- Smart Transport System — PostgreSQL Database Schema
-- =====================================================================

-- Clean slate (safe to re-run during development)
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS gps_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Reusable enum types
CREATE TYPE user_role       AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE vehicle_type    AS ENUM ('bus', 'cab', 'train', 'metro');
CREATE TYPE vehicle_status  AS ENUM ('active', 'maintenance', 'inactive');
CREATE TYPE booking_status  AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status  AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE payment_method  AS ENUM ('card', 'upi', 'wallet', 'cash');

-- ---------------------------------------------------------------------
-- USERS (passengers, drivers, admins)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    phone           VARCHAR(20)   NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            user_role     NOT NULL DEFAULT 'passenger',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- VEHICLES
-- ---------------------------------------------------------------------
CREATE TABLE vehicles (
    vehicle_id      SERIAL PRIMARY KEY,
    registration_no VARCHAR(30)   NOT NULL UNIQUE,
    type            vehicle_type  NOT NULL,
    capacity        SMALLINT      NOT NULL CHECK (capacity > 0),
    status          vehicle_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- DRIVERS (one-to-one with a user account that has role = 'driver')
-- ---------------------------------------------------------------------
CREATE TABLE drivers (
    driver_id       SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    license_no      VARCHAR(40) NOT NULL UNIQUE,
    vehicle_id      INTEGER REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    is_available    BOOLEAN NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------
-- ROUTES
-- ---------------------------------------------------------------------
CREATE TABLE routes (
    route_id        SERIAL PRIMARY KEY,
    route_name      VARCHAR(150) NOT NULL,
    source          VARCHAR(120) NOT NULL,
    destination     VARCHAR(120) NOT NULL,
    distance_km     NUMERIC(6,2) NOT NULL CHECK (distance_km > 0),
    est_duration_min INTEGER     NOT NULL CHECK (est_duration_min > 0)
);

-- ---------------------------------------------------------------------
-- STOPS (master list of physical stops)
-- ---------------------------------------------------------------------
CREATE TABLE stops (
    stop_id         SERIAL PRIMARY KEY,
    stop_name       VARCHAR(120) NOT NULL,
    latitude        NUMERIC(9,6) NOT NULL,
    longitude       NUMERIC(9,6) NOT NULL
);

-- ---------------------------------------------------------------------
-- ROUTE_STOPS (junction table — ordered stops per route)
-- ---------------------------------------------------------------------
CREATE TABLE route_stops (
    route_id        INTEGER NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    stop_id         INTEGER NOT NULL REFERENCES stops(stop_id) ON DELETE RESTRICT,
    stop_order      SMALLINT NOT NULL CHECK (stop_order > 0),
    PRIMARY KEY (route_id, stop_id),
    UNIQUE (route_id, stop_order)
);

-- ---------------------------------------------------------------------
-- SCHEDULES (a vehicle running a route at a given time)
-- ---------------------------------------------------------------------
CREATE TABLE schedules (
    schedule_id     SERIAL PRIMARY KEY,
    route_id        INTEGER NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    vehicle_id      INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    driver_id       INTEGER REFERENCES drivers(driver_id) ON DELETE SET NULL,
    departure_time  TIMESTAMPTZ NOT NULL,
    arrival_time    TIMESTAMPTZ NOT NULL,
    available_seats SMALLINT NOT NULL CHECK (available_seats >= 0),
    CHECK (arrival_time > departure_time)
);

-- ---------------------------------------------------------------------
-- BOOKINGS / TICKETS
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id      SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    schedule_id     INTEGER NOT NULL REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    seat_number     VARCHAR(10) NOT NULL,
    status          booking_status NOT NULL DEFAULT 'pending',
    booked_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (schedule_id, seat_number)
);

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    payment_id      SERIAL PRIMARY KEY,
    booking_id      INTEGER NOT NULL UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
    amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    method          payment_method NOT NULL,
    status          payment_status NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- GPS_LOGS (live tracking)
-- ---------------------------------------------------------------------
CREATE TABLE gps_logs (
    log_id          BIGSERIAL PRIMARY KEY,
    vehicle_id      INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    latitude        NUMERIC(9,6) NOT NULL,
    longitude       NUMERIC(9,6) NOT NULL,
    speed_kmph      NUMERIC(5,2),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- FEEDBACK / RATINGS
-- ---------------------------------------------------------------------
CREATE TABLE feedback (
    feedback_id     SERIAL PRIMARY KEY,
    booking_id      INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- INDEXES for common query patterns
-- =====================================================================
CREATE INDEX idx_routes_source_dest      ON routes (source, destination);
CREATE INDEX idx_schedules_route_time    ON schedules (route_id, departure_time);
CREATE INDEX idx_schedules_vehicle       ON schedules (vehicle_id);
CREATE INDEX idx_bookings_user           ON bookings (user_id);
CREATE INDEX idx_bookings_schedule       ON bookings (schedule_id);
CREATE INDEX idx_gps_logs_vehicle_time   ON gps_logs (vehicle_id, recorded_at DESC);
CREATE INDEX idx_payments_status         ON payments (status);
