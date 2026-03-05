import app from './app';
import { startExpiryJob } from './jobs/expireReservations';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpiryJob();
});