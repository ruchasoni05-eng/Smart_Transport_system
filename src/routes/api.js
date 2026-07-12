import express from 'express';
import { db } from '../db/db.js';

const router = express.Router();

// Auth Endpoint
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = db.getAll('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Send back user data with mock token
  res.json({
    token: `mock-jwt-token-for-${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id
    }
  });
});

// Dashboard Stats Endpoint
router.get('/dashboard/stats', (req, res) => {
  const vehicles = db.getAll('vehicles');
  const trips = db.getAll('trips');
  
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'In Transit').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'Maintenance').length;
  
  const activeTrips = trips.filter(t => t.status === 'In Transit' || t.status === 'Delayed').length;
  const pendingTrips = trips.filter(t => t.status === 'Loading').length;
  
  // Calculate average utilization
  const utilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;
  
  res.json({
    activeVehicles,
    availableVehicles,
    maintenanceVehicles,
    activeTrips,
    pendingTrips,
    utilization
  });
});

// Trips Endpoints
router.get('/trips', (req, res) => {
  const trips = db.getAll('trips');
  const vehicles = db.getAll('vehicles');
  const drivers = db.getAll('drivers');

  // Populate vehicle and driver names
  const populatedTrips = trips.map(t => {
    const vehicle = vehicles.find(v => v.id === t.vehicle_id);
    const driver = drivers.find(d => d.id === t.driver_id);
    return {
      ...t,
      vehicle_name: vehicle ? `${vehicle.make_model} (${vehicle.plate_number})` : 'Unknown Vehicle',
      driver_name: driver ? driver.name : 'Unknown Driver',
      driver_employee_id: driver ? driver.employee_id : ''
    };
  });

  res.json(populatedTrips);
});

router.post('/trips', (req, res) => {
  const { vehicle_id, driver_id, source, destination, priority, load_type, refrigeration_required } = req.body;
  
  if (!vehicle_id || !driver_id || !source || !destination) {
    return res.status(400).json({ error: 'Missing required trip fields' });
  }

  // Create a new trip
  const vehicle = db.getById('vehicles', vehicle_id);
  const driver = db.getById('drivers', driver_id);

  if (!vehicle || !driver) {
    return res.status(400).json({ error: 'Invalid Vehicle or Driver ID' });
  }

  const tripNumber = 'TRP-' + Math.floor(1000 + Math.random() * 9000);
  
  const newTrip = {
    trip_number: tripNumber,
    vehicle_id: Number(vehicle_id),
    driver_id: Number(driver_id),
    source,
    destination,
    status: 'In Transit',
    priority: priority || 'Medium',
    load_type: load_type || 'General Cargo',
    refrigeration_required: !!refrigeration_required,
    eta: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration: '4h 00m',
    distance_miles: 240.0,
    notes: 'Dispatched successfully'
  };

  // Update vehicle and driver status
  db.update('vehicles', vehicle_id, { status: 'In Transit' });
  db.update('drivers', driver_id, { status: 'In Transit' });

  const savedTrip = db.insert('trips', newTrip);
  res.status(201).json(savedTrip);
});

router.post('/trips/:id/complete', (req, res) => {
  const { id } = req.params;
  const { odometer_end, fuel_consumption_gal, notes } = req.body;

  const trip = db.getById('trips', id);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  // Update trip details
  db.update('trips', id, {
    status: 'Completed',
    odometer_end: Number(odometer_end),
    fuel_consumption_gal: Number(fuel_consumption_gal),
    notes: notes || 'Trip completed successfully'
  });

  // Make vehicle and driver available
  db.update('vehicles', trip.vehicle_id, { status: 'Available' });
  db.update('drivers', trip.driver_id, { status: 'Active' });

  // Log fuel expense if applicable
  if (fuel_consumption_gal && Number(fuel_consumption_gal) > 0) {
    const cost = Number(fuel_consumption_gal) * 3.5; // Mock fuel cost
    db.insert('expenses', {
      type: 'Fuel',
      amount: Number(cost.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      reference_no: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
      status: 'Approved',
      description: `Fuel consumption logs for Trip ${trip.trip_number}`
    });
  }

  res.json({ success: true, message: 'Trip completed, vehicle and driver status updated.' });
});

// Fleet Endpoints
router.get('/fleet', (req, res) => {
  res.json(db.getAll('vehicles'));
});

router.post('/fleet', (req, res) => {
  const { plate_number, make_model, type, capacity_tons, status } = req.body;
  if (!plate_number || !make_model) {
    return res.status(400).json({ error: 'Plate number and Model are required' });
  }
  const newVehicle = db.insert('vehicles', {
    plate_number,
    make_model,
    type: type || 'Medium Duty',
    capacity_tons: Number(capacity_tons) || 5.0,
    status: status || 'Available',
    fuel_efficiency_mpg: 10.0,
    avg_downtime_hours: 0.0
  });
  res.status(201).json(newVehicle);
});

// Drivers Endpoints
router.get('/drivers', (req, res) => {
  res.json(db.getAll('drivers'));
});

router.post('/drivers', (req, res) => {
  const { name, employee_id, status, license_status, license_expiry, cdl_class } = req.body;
  if (!name || !employee_id) {
    return res.status(400).json({ error: 'Name and Employee ID are required' });
  }
  const newDriver = db.insert('drivers', {
    name,
    employee_id,
    status: status || 'Active',
    license_status: license_status || 'Active',
    license_expiry: license_expiry || '2028-12-31',
    cdl_class: cdl_class || 'Class A'
  });
  res.status(201).json(newDriver);
});

// Maintenance Endpoints
router.get('/maintenance', (req, res) => {
  const maintenance = db.getAll('maintenance');
  const vehicles = db.getAll('vehicles');
  
  const populated = maintenance.map(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicle_id);
    return {
      ...m,
      vehicle_name: vehicle ? `${vehicle.make_model} (${vehicle.plate_number})` : 'Unknown Vehicle'
    };
  });
  
  res.json(populated);
});

router.post('/maintenance', (req, res) => {
  const { vehicle_id, issue, scheduled_date, status, cost } = req.body;
  if (!vehicle_id || !issue) {
    return res.status(400).json({ error: 'Vehicle and Issue description are required' });
  }

  const log = db.insert('maintenance', {
    vehicle_id: Number(vehicle_id),
    issue,
    date_logged: new Date().toISOString().split('T')[0],
    scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
    status: status || 'Scheduled',
    cost: Number(cost) || 0.0
  });

  // If status is In Progress, mark vehicle as Maintenance
  if (status === 'In Progress' || status === 'Undergoing') {
    db.update('vehicles', vehicle_id, { status: 'Maintenance' });
  }

  // Log as maintenance expense
  if (cost && Number(cost) > 0) {
    db.insert('expenses', {
      type: 'Maintenance',
      amount: Number(cost),
      date: new Date().toISOString().split('T')[0],
      reference_no: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
      status: 'Pending',
      description: `Maintenance expense: ${issue}`
    });
  }

  res.status(201).json(log);
});

// Expenses Endpoints
router.get('/expenses', (req, res) => {
  res.json(db.getAll('expenses'));
});

router.post('/expenses', (req, res) => {
  const { type, amount, status, description } = req.body;
  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and Amount are required' });
  }
  const newExpense = db.insert('expenses', {
    type,
    amount: Number(amount),
    date: new Date().toISOString().split('T')[0],
    reference_no: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
    status: status || 'Pending',
    description: description || ''
  });
  res.status(201).json(newExpense);
});

// System Controls
router.post('/system/reset', (req, res) => {
  db.reset();
  res.json({ success: true, message: 'Database reset completed.' });
});

export default router;
