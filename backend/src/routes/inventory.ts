import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Get all inventory from all tables
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { type } = req.query; // product, material, color, mold, packing, others
        
        if (!type) {
            return res.status(400).json({ message: 'Type query parameter is required' });
        }

        let query = '';
        switch (type) {
            case 'product':
                query = 'SELECT * FROM inventory_product ORDER BY product_name ASC';
                break;
            case 'material':
                query = 'SELECT * FROM inventory_materials ORDER BY material_name ASC';
                break;
            case 'color':
                query = 'SELECT * FROM inventory_colors ORDER BY color_name ASC';
                break;
            case 'mold':
                query = 'SELECT * FROM inventory_molds ORDER BY mold_name ASC';
                break;
            case 'packing':
                query = "SELECT id, item_name as material_name, stock_qty_pcs as stock_qty, 'Packing' as category FROM inventory_packing ORDER BY item_name ASC";
                break;
            case 'others':
                query = "SELECT id, item_name as material_name, stock_qty, 'Others' as category FROM inventory_others ORDER BY item_name ASC";
                break;
            case 'machine':
                query = 'SELECT *, machine_name as material_name, status as category FROM machine_status ORDER BY machine_name ASC';
                break;
            default:
                return res.status(400).json({ message: 'Invalid inventory type' });
        }
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching inventory' });
    }
});

// Helper for direct access (backward compatibility)
const handleDirectAccess = (type: string) => async (req: express.Request, res: express.Response) => {
    try {
        let query = '';
        switch (type) {
            case 'material': query = 'SELECT * FROM inventory_materials ORDER BY material_name ASC'; break;
            case 'color': query = "SELECT id, color_name as material_name, stock_qty_kgs as stock_qty, 'Colors' as category FROM inventory_colors ORDER BY color_name ASC"; break;
            case 'mold': query = "SELECT id, mold_name as material_name, 'Molds' as category FROM inventory_molds ORDER BY mold_name ASC"; break;
            case 'packing': query = "SELECT id, item_name as material_name, stock_qty_pcs as stock_qty, 'Packing' as category FROM inventory_packing ORDER BY item_name ASC"; break;
            case 'others': query = "SELECT id, item_name as material_name, stock_qty, 'Others' as category FROM inventory_others ORDER BY item_name ASC"; break;
        }
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: `Error fetching ${type}` });
    }
};

router.get('/materials', authenticateAdmin, handleDirectAccess('material'));
router.get('/colors', authenticateAdmin, handleDirectAccess('color'));
router.get('/molds', authenticateAdmin, handleDirectAccess('mold'));
router.get('/packing', authenticateAdmin, handleDirectAccess('packing'));
router.get('/others', authenticateAdmin, handleDirectAccess('others'));

// Generic update for inventory
router.put('/:type/:id', authenticateAdmin, async (req, res) => {
    const { type, id } = req.params;
    const body = req.body;
    
    try {
        let query = '';
        let params: any[] = [];
        
        if (type === 'product') {
            query = 'UPDATE inventory_product SET product_name = $1, opening_stock = $2, closing_stock = $3, minimum_stock_level = $4, unit_weight_gm = $5, vendor_name = $6, vendor_price = $7, unit = $8 WHERE id = $9 RETURNING *';
            params = [body.product_name, body.opening_stock, body.closing_stock, body.minimum_stock_level, body.unit_weight_gm, body.vendor_name, body.vendor_price, body.unit || 'KG', id];
        } else if (type === 'material') {
            query = 'UPDATE inventory_materials SET material_name = $1, opening_stock = $2, closing_stock = $3, minimum_stock_level = $4, unit = $5, vendor_name = $6, vendor_price = $7 WHERE id = $8 RETURNING *';
            params = [body.material_name, body.opening_stock, body.closing_stock, body.minimum_stock_level, body.unit || 'KG', body.vendor_name, body.vendor_price, id];
        } else if (type === 'color') {
            query = 'UPDATE inventory_colors SET color_name = $1, stock_qty_kgs = $2, unit = $3 WHERE id = $4 RETURNING *';
            params = [body.color_name, body.stock_qty_kgs, body.unit || 'KG', id];
        } else if (type === 'mold') {
            let totalWeight = 0;
            if (Array.isArray(body.cavity_weights)) {
                totalWeight = body.cavity_weights.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            } else if (typeof body.cavity_weights === 'object' && body.cavity_weights !== null) {
                totalWeight = Object.values(body.cavity_weights).reduce((a: any, b: any) => a + (Number(b) || 0), 0);
            }
            query = 'UPDATE inventory_molds SET mold_name = $1, cavity_options = $2, cavity_count = $3, cavity_weights = $4, total_weight = $5, unit = $6 WHERE id = $7 RETURNING *';
            params = [body.mold_name, body.cavity_options, body.cavity_count || 1, JSON.stringify(body.cavity_weights || []), totalWeight, body.unit || 'KG', id];
        } else if (type === 'packing') {
            query = 'UPDATE inventory_packing SET item_name = $1, stock_qty_pcs = $2, unit = $3 WHERE id = $4 RETURNING *';
            params = [body.item_name, body.stock_qty_pcs, body.unit || 'KG', id];
        } else if (type === 'others') {
            query = 'UPDATE inventory_others SET item_name = $1, stock_qty = $2, unit = $3 WHERE id = $4 RETURNING *';
            params = [body.item_name, body.stock_qty, body.unit || 'KG', id];
        } else if (type === 'machine') {
            query = 'UPDATE machine_status SET machine_name = $1, status = $2, cycle_timing = $3, cavity = $4 WHERE id = $5 RETURNING *';
            params = [body.machine_name, body.status || 'idle', body.cycle_timing || 0, body.cavity || 1, id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating inventory' });
    }
});

// Generic create for inventory
router.post('/:type', authenticateAdmin, async (req, res) => {
    const { type } = req.params;
    const body = req.body;
    
    try {
        let query = '';
        let params: any[] = [];
        
        if (type === 'product') {
            query = 'INSERT INTO inventory_product (product_name, opening_stock, closing_stock, minimum_stock_level, unit_weight_gm, vendor_name, vendor_price, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
            params = [body.product_name, body.opening_stock || 0, body.closing_stock || 0, body.minimum_stock_level || 100, body.unit_weight_gm || 0, body.vendor_name || null, body.vendor_price || null, body.unit || 'KG'];
        } else if (type === 'material') {
            query = 'INSERT INTO inventory_materials (material_name, opening_stock, closing_stock, minimum_stock_level, unit, vendor_name, vendor_price) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
            params = [body.material_name, body.opening_stock || 0, body.closing_stock || 0, body.minimum_stock_level || 10, body.unit || 'KG', body.vendor_name || null, body.vendor_price || null];
        } else if (type === 'color') {
            query = 'INSERT INTO inventory_colors (color_name, stock_qty_kgs, unit) VALUES ($1, $2, $3) RETURNING *';
            params = [body.color_name, body.stock_qty_kgs || 0, body.unit || 'KG'];
        } else if (type === 'mold') {
            let totalWeight = 0;
            if (Array.isArray(body.cavity_weights)) {
                totalWeight = body.cavity_weights.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            } else if (typeof body.cavity_weights === 'object' && body.cavity_weights !== null) {
                totalWeight = Object.values(body.cavity_weights).reduce((a: any, b: any) => a + (Number(b) || 0), 0);
            }
            query = 'INSERT INTO inventory_molds (mold_name, cavity_options, cavity_count, cavity_weights, total_weight, unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
            params = [body.mold_name, body.cavity_options || '', body.cavity_count || 1, JSON.stringify(body.cavity_weights || []), totalWeight, body.unit || 'KG'];
        } else if (type === 'packing') {
            query = 'INSERT INTO inventory_packing (item_name, stock_qty_pcs, unit) VALUES ($1, $2, $3) RETURNING *';
            params = [body.item_name, body.stock_qty_pcs || 0, body.unit || 'KG'];
        } else if (type === 'others') {
            query = 'INSERT INTO inventory_others (item_name, stock_qty, unit) VALUES ($1, $2, $3) RETURNING *';
            params = [body.item_name, body.stock_qty || 0, body.unit || 'KG'];
        } else if (type === 'machine') {
            query = 'INSERT INTO machine_status (machine_name, status, cycle_timing, cavity) VALUES ($1, $2, $3, $4) RETURNING *';
            params = [body.machine_name, body.status || 'idle', body.cycle_timing || 0, body.cavity || 1];
        }
        
        const result = await pool.query(query, params);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating inventory' });
    }
});

router.delete('/:type/:id', authenticateAdmin, async (req, res) => {
    const { type, id } = req.params;
    try {
        let table = '';
        switch (type) {
            case 'product': table = 'inventory_product'; break;
            case 'material': table = 'inventory_materials'; break;
            case 'color': table = 'inventory_colors'; break;
            case 'mold': table = 'inventory_molds'; break;
            case 'packing': table = 'inventory_packing'; break;
            case 'others': table = 'inventory_others'; break;
            case 'machine': table = 'machine_status'; break;
            default: return res.status(400).json({ message: 'Invalid type' });
        }
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting item' });
    }
});

export default router;
