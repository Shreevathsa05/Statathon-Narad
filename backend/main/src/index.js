import app from './app.js';
import dotenv from 'dotenv';
// import connectDB from './db/connection.js'

dotenv.config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server listening on ${PORT}`);
})

// connectDB()
//     .then(() => {
//         app.on('error', (err) => {
//             console.log('server error: ', err);
//         })

//         app.listen(port, () => {
//             console.log(`server listening on ${port}`);
//         })
//     })
//     .catch((err) => console.log("MONGO db connection failed", err));