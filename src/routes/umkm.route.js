// src/routes/umkm.route.js
import express from 'express';
import * as umkmController from '../controllers/umkm.controller.js';

const router = express.Router();

// GET /umkm?limit=&cursor=&sortBy=&order=&q=&category=
router.get('/', umkmController.getAllUmkm);

// GET /umkm/:id
router.get('/:id', umkmController.getUmkmById);

// POST /umkm
router.post('/', umkmController.createUmkm);

// PUT /umkm/:id
router.put('/:id', umkmController.updateUmkm);

// DELETE /umkm/:id
router.delete('/:id', umkmController.deleteUmkm);

export default router;