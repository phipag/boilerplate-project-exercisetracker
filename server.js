const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Exercise = require('./src/models/Exercise');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});
app.post('/api/exercise/new-user', async (req, res, next) => {
    const { username } = req.body;
    if (!username) return next({ status: 422, message: 'Username missing' });
    const newUser = await new User({ username }).save();
    return res.status(201).json(newUser);
});
app.get('/api/exercise/users', async (req, res) => {
    const users = await User.all().exec();
    return res.status(200).json(users);
});
app.post('/api/exercise/add', async (req, res, next) => {
    const { userId, description, duration, date } = req.body;
    // Joi or express-validator middleware npm packages can help with easier validation
    // but plain JS is okay for this use case
    if (!userId || !description || !duration) return next({ status: 422, message: 'Please fill in all mandatory fields' });
    if (!mongoose.Types.ObjectId.isValid(userId)) return next({ status: 422, message: 'User ID is invalid' });
    if (!/^\d+$/.test(duration)) return next({ status: 422, message: 'Duration is invalid' });

    // Check if user exists
    if (!await User.exists({ _id: userId })) return next({ status: 422, message: 'User ID not found' });
    // Parse date if given
    let parsedDate;
    if (!!date) {
        parsedDate = Date.parse(date);
        if (!parsedDate instanceof Date || isNaN(parsedDate)) parsedDate = Date.now();
    }
    // Add Exercise to database
    const newExercise = await new Exercise({
        userId,
        description,
        duration,
        date: parsedDate || undefined
    });
    return res.status(201).json(newExercise);
});
app.get('/api/exercise/log', async (req, res, next) => {
    const { userId, from, to, limit } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !await User.exists({ _id: userId })) return next({ status: 422, message: 'User ID is a mandatory field' });
    if (limit && !/^\d+$/.test(limit)) return next({ status: 422, message: 'Limit must be a number' });
    if (from && !/^\d+$/.test(from)) return next({ status: 422, message: 'From must be a number' });
    if (to && !/^\d+$/.test(to)) return next({ status: 422, message: 'To must be a number' });
    const exercises = await Exercise.find({ userId })
        .limit(limit)
        .from(from)
        .to(to)
        .exec();
    return res.status(200).json(exercises);
});

// Not found middleware
app.use((req, res, next) => {
    return next({ status: 404, message: 'not found' });
});

// Error Handling middleware
app.use((err, req, res, next) => {
    let errCode, errMessage;

    if (err.errors) {
        // mongoose validation error
        errCode = 400; // bad request
        const keys = Object.keys(err.errors);
        // report the first validation error
        errMessage = err.errors[keys[0]].message;
    } else {
        // generic or custom error
        errCode = err.status || 500;
        errMessage = err.message || 'Internal Server Error';
    }
    res.status(errCode).type('txt')
        .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
