import 'dotenv/config';
import app from './app.js';
import connectDB from './db/index.js';

const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`server listening on ${PORT}`);
        })
    })
    .catch((err) => console.log("MONGO db connection failed", err));