import cron from 'node-cron';
import { ExpiryService } from '../services/expiry.service';

export const startExpiryJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const count = await ExpiryService.expireReservations();
      if (count > 0) {
        console.log(`[CRON] ${new Date().toISOString()} - Expired ${count} reservations`);
      }
    } catch (err) {
      console.error('[CRON] Error expiring reservations:', err);
    }
  });

  console.log('[CRON] Reservation expiry job started');
};