const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose")
const authRouter = require("./routes/AuthRouter")
const answerRouter = require("./routes/AnswerRouter")
const questionRouter = require("./routes/QuestionsRouter")

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
}

app.use(cors({     
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'contenttype', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    return res.status(200).json({ "status": "UP" })
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/answer", answerRouter);
app.use("/api/v1/question", questionRouter);

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
        console.log(`🚀 Server started on http://localhost:${PORT}`);
    });

}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});
