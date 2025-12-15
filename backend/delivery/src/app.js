import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors("*"));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

