-- =====================================================================
-- Smart Transport System — Sample Seed Data
-- Run smart_transport_schema.sql FIRST, then this file.
-- =====================================================================

-- USERS
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
('Rucha Shah',      'rucha@example.com',     '9990000001', 'hash_placeholder_1', 'admin'),
('Aman Verma',       'aman@example.com',      '9990000002', 'hash_placeholder_2', 'passenger'),
('Priya Nair',       'priya@example.com',     '9990000003', 'hash_placeholder_3', 'passenger'),
('Ramesh Kumar',     'ramesh@example.com',    '9990000004', 'hash_placeholder_4', 'driver'),
('Sunita Rao',       'sunita@example.com',    '9990000005', 'hash_placeholder_5', 'driver'),
('Karan Mehta',      'karan@example.com',     '9990000006', 'hash_placeholder_6', 'passenger');

-- VEHICLES
INSERT INTO vehicles (registration_no, type, capacity, status) VALUES
('GJ01AB1234', 'bus',   40, 'active'),
('GJ01CD5678', 'bus',   35, 'active'),
('GJ01EF9012', 'cab',   4,  'active'),
('GJ01GH3456', 'metro', 200,'maintenance');

-- DRIVERS
INSERT INTO drivers (user_id, license_no, vehicle_id, is_available) VALUES
(4, 'DL-0420110149646', 1, true),
(5, 'DL-0420110149647', 2, true);

-- ROUTES
INSERT INTO routes (route_name, source, destination, distance_km, est_duration_min) VALUES
('Ahmedabad - Gandhinagar Express', 'Ahmedabad', 'Gandhinagar', 25.50, 45),
('Ahmedabad - Vadodara Highway',    'Ahmedabad', 'Vadodara',    110.00, 120),
('City Loop - Downtown',            'Maninagar', 'Navrangpura', 12.30, 30);

-- STOPS
INSERT INTO stops (stop_name, latitude, longitude) VALUES
('Kalupur Station',      23.025200, 72.601700),
('Gandhinagar Sector 11',23.222300, 72.647800),
('Vadodara Central',     22.307100, 73.181800),
('Maninagar Depot',      22.996800, 72.600900),
('Navrangpura Circle',   23.036800, 72.560900);

-- ROUTE_STOPS
INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES
(1, 1, 1),
(1, 2, 2),
(2, 1, 1),
(2, 3, 2),
(3, 4, 1),
(3, 5, 2);

-- SCHEDULES
INSERT INTO schedules (route_id, vehicle_id, driver_id, departure_time, arrival_time, available_seats) VALUES
(1, 1, 1, '2026-07-15 08:00:00+05:30', '2026-07-15 08:45:00+05:30', 40),
(2, 2, 2, '2026-07-15 09:00:00+05:30', '2026-07-15 11:00:00+05:30', 35),
(3, 1, 1, '2026-07-15 14:00:00+05:30', '2026-07-15 14:30:00+05:30', 38);

-- BOOKINGS
INSERT INTO bookings (user_id, schedule_id, seat_number, status) VALUES
(2, 1, 'A1', 'confirmed'),
(3, 1, 'A2', 'confirmed'),
(6, 2, 'B5', 'pending');

-- PAYMENTS
INSERT INTO payments (booking_id, amount, method, status, paid_at) VALUES
(1, 50.00,  'upi',    'success', '2026-07-12 10:15:00+05:30'),
(2, 50.00,  'card',   'success', '2026-07-12 10:16:00+05:30'),
(3, 220.00, 'wallet', 'pending', NULL);

-- GPS_LOGS
INSERT INTO gps_logs (vehicle_id, latitude, longitude, speed_kmph) VALUES
(1, 23.025200, 72.601700, 42.5),
(1, 23.100500, 72.615300, 38.0),
(2, 22.996800, 72.600900, 55.2);

-- FEEDBACK
INSERT INTO feedback (booking_id, user_id, rating, comments) VALUES
(1, 2, 5, 'On time and clean bus.'),
(2, 3, 4, 'Good ride, slightly delayed.');
