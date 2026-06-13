// routes/treatments.js
const express = require('express');
const router = express.Router();
const { getTreatmentsByPatient, getTreatmentById, createTreatment, updateTreatment, getAllTreatments } = require('../controllers/treatmentController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getAllTreatments);
router.get('/patient/:patientId', authenticate, getTreatmentsByPatient);
router.get('/:id', authenticate, getTreatmentById);
router.post('/', authenticate, createTreatment);
router.put('/:id', authenticate, updateTreatment);
module.exports = router;
