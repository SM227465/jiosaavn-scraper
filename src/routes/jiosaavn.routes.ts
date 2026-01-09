import { Router } from 'express';
import { jioSaavnController } from '../controllers/jiosaavn.controller';

const router: Router = Router();

// GET /api/jiosaavn - Get all scraped data
router.get('/', jioSaavnController.getAll.bind(jioSaavnController));

// GET /api/jiosaavn/new-releases - Get new releases
router.get('/new-releases', jioSaavnController.getNewReleases.bind(jioSaavnController));

// GET /api/jiosaavn/top-charts - Get top charts
router.get('/top-charts', jioSaavnController.getTopCharts.bind(jioSaavnController));

// GET /api/jiosaavn/top-playlists - Get top playlists (IDs for saavn.sumit.co API)
router.get('/top-playlists', jioSaavnController.getTopPlaylists.bind(jioSaavnController));

// GET /api/jiosaavn/top-artists - Get top artists
router.get('/top-artists', jioSaavnController.getTopArtists.bind(jioSaavnController));

// GET /api/jiosaavn/last-scraped - Get last scraping timestamp
router.get('/last-scraped', jioSaavnController.getLastScraped.bind(jioSaavnController));

// GET /api/jiosaavn/homepage - Get homepage data with all modules
router.get('/homepage', jioSaavnController.getHomePage.bind(jioSaavnController));

export { router as jioSaavnRouter };
