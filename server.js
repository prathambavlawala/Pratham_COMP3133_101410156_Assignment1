require('dotenv').config();  // Load .env file

const mongoose = require('mongoose'); // ✅ Import mongoose

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./graphql/schema');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path'); // ✅ Import path module

const app = express();

// ✅ Connect to MongoDB Atlas
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://bavlawalapratham:U7sbynp37f1JQ0XF@cluster0.mxqbk.mongodb.net/COMP3133_101410156_Ass1?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.log('❌ MongoDB Atlas Connection Error:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.use(cors());

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;