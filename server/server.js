// import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import cors from 'cors';
// import dotenv from 'dotenv';
// // import rubberDuckRoutes from './routes/rubberDucks.js'; // Import the routes
// import analyzeRoutes from './routes/analyzeMessage.js';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();

// const app = express();

// app.use(express.json());
// app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve static images

// app.use(cors({
//   origin: process.env.CLIENT_URL
// }));

// // Use the routes file for all `/ducks` routes
// app.use('/ducks', analyzeRoutes);

// // Start server
// const PORT = process.env.PORT;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });


import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

import analyzeRoutes from "./routes/analyzeMessage.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL, 
  })
);


app.use("/images", express.static(path.join(__dirname, "images")));


app.use("/api/analyze", analyzeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server is running on port ${PORT}');
});



