// REMOVED: Synthetic data import - all car data now comes from backend API only
// The backend loads real car data from the DriveArabia SQL dump via ingest_excel_to_db.py
import { Car } from './types';

// Empty array - no synthetic/mock data fallback
// Frontend must rely on backend API for all car data
export const MOCK_CARS: Car[] = [];
