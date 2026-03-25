import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Get all vendors with their material prices
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, 
                   json_agg(json_build_object(
                       'material_id', vmp.material_id, 
                       'category', vmp.category,
                       'material_name', COALESCE(im.material_name, ic.color_name, imo.mold_name, ip.item_name, io.item_name), 
                       'price_per_kg', vmp.price_per_kg
                   )) FILTER (WHERE vmp.material_id IS NOT NULL) as materials
            FROM vendors v
            LEFT JOIN vendor_material_prices vmp ON v.id = vmp.vendor_id
            LEFT JOIN inventory_materials im ON vmp.material_id = im.id AND vmp.category = 'Materials'
            LEFT JOIN inventory_colors ic ON vmp.material_id = ic.id AND vmp.category = 'Colors'
            LEFT JOIN inventory_molds imo ON vmp.material_id = imo.id AND vmp.category = 'Molds'
            LEFT JOIN inventory_packing ip ON vmp.material_id = ip.id AND vmp.category = 'Packing'
            LEFT JOIN inventory_others io ON vmp.material_id = io.id AND vmp.category = 'Others'
            GROUP BY v.id
            ORDER BY v.created_at DESC
        `);
        res.json(result.rows);
    } catch (err: any) {
        console.error("Fetch Vendors Error:", err.message);
        res.status(500).json({ message: 'Error fetching vendors' });
    }
});

// Create a new vendor
router.post('/', authenticateAdmin, async (req, res) => {
    const { name, address, phone_number, alternate_phone_number, email, gst, created_by } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vendors (name, address, phone_number, alternate_phone_number, email, gst, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, address, phone_number, alternate_phone_number, email, gst, created_by || 'Admin']
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error("Create Vendor Error:", err.message);
        res.status(500).json({ message: 'Error creating vendor' });
    }
});

// Delete vendor
router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM vendors WHERE id = $1', [id]);
        res.json({ message: 'Vendor deleted successfully' });
    } catch (err: any) {
        console.error("Delete Vendor Error:", err.message);
        res.status(500).json({ message: 'Error deleting vendor' });
    }
});

export default router;
