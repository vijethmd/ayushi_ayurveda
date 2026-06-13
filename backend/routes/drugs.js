const express = require('express');
const router  = express.Router();
const {
  getAllDrugs, getDrugById, createDrug, updateDrug, getDrugCategories,
  getAdminsByTreatment, addDrugAdmin, updateDrugAdmin,
  addOutcome, getDrugAnalytics, generateDrugAI
} = require('../controllers/drugController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Drug master
router.get('/categories',                    authenticate, getDrugCategories);
router.get('/analytics',                     authenticate, getDrugAnalytics);
router.get('/',                              authenticate, getAllDrugs);
router.get('/:id',                           authenticate, getDrugById);
router.post('/',                             authenticate, authorizeAdmin, createDrug);
router.put('/:id',                           authenticate, authorizeAdmin, updateDrug);

// Drug administrations (per treatment)
router.get('/administrations/treatment/:treatmentId', authenticate, getAdminsByTreatment);
router.post('/administrations',              authenticate, addDrugAdmin);
router.put('/administrations/:id',           authenticate, updateDrugAdmin);

// Drug outcomes (efficacy)
router.post('/outcomes',                     authenticate, addOutcome);

// AI research
router.post('/ai/:drugId',                   authenticate, generateDrugAI);

module.exports = router;
