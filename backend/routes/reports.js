const express = require('express');
const router = express.Router();
const { generatePatientPDF, generateClinicReport } = require('../utils/pdfGenerator');
const { authenticate } = require('../middleware/auth');
router.get('/patient/:patientId', authenticate, generatePatientPDF);
router.get('/clinic', authenticate, generateClinicReport);
module.exports = router;
