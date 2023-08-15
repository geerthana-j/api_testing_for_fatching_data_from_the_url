import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import cheerio from "cheerio";
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const mongoUri = "mongodb+srv://geerthikumar:f3rk02JZjpHfJ3z4@cluster0.3o1mx9f.mongodb.net/?retryWrites=true&w=majority";
const mongoClient = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
const SECRET_KEY = '123@abc';
// f3rk02JZjpHfJ3z4
app.post('/signin', async function (req, res) {
    try {
        console.log(req.body);
        const email_req = req.body.email;
        const password_req = req.body.password;
        if (email_req && password_req) {
            await mongoClient.connect();
            const collection = await mongoClient.db('datavio').collection('user_data');
            const return_data = await collection.findOne({ email: email_req });
            if (return_data == null) {
                res.status(200).json({ message: "please signup" });

            }
            else {
                if (password_req !== return_data.password) {
                    res.status(403).json({ message: "please provide the correct password!!" });
                }
                else {
                    const token = jwt.sign({ email_req }, SECRET_KEY, { expiresIn: '1h' });
                    console.log('JWT Token:', token);
                    res.status(200).json({ message: "login sucessfully", auth_token: token });
                }

            }
        }
        else {
            res.status(400).json({ message: "please provide the required field" })
        }
        return
    }
    catch {
        res.status(500).json({ message: "internal server error" });

    }



})
app.post('/signup', async function (req, res) {
    try {
        console.log(req.body);
        const email_req = req.body.email;
        const password_req = req.body.password;

        if (email_req && password_req) {
            await mongoClient.connect();
            const collection = await mongoClient.db('datavio').collection('user_data');

            const return_data = await collection.findOne({ email: email_req });
            if (return_data == null) {
                await collection.insertOne(req.body);
                res.status(200).json({ message: "registered sucessfully" });
            }
            else {
                res.status(200).json({ message: "email already exists please signin!!" })

            }
        }
        else {
            res.status(400).json({ message: "please provide the required field" });
        }
        return
    }
    catch {
        res.status(500).json({ message: "internal server error" });
    }
})
function verifyToken(authHeader) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        console.log(token)
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            console.log(decoded);
            return decoded.email_req;
        } catch (error) {
            return null;
        }

    }
}
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbF9yZXEiOiJnZWVydGhpQGdtYWlsLmNvbSIsImlhdCI6MTY5MjA5NTcyMSwiZXhwIjoxNjkyMDk5MzIxfQ.pdOGxyT-jIqgGYksYsRGqcry89Zkr9LEyuDJ8MmE6Bo
app.post('/url-scrape', async function (req, res) {
    try {
        const authHeader = req.headers['authorization'];
        const user_id = verifyToken(authHeader);
        console.log(user_id);
        console.log(authHeader);
        if (user_id == null) {
            res.status(403).json({ message: "invalid token" });
        }
        else {
            const product_object = {};

            const url = req.body.url;
            if (url == null) {
                req.status(400).json({ message: "please provide the correct url" });
            }
            else {
                const response = await fetch(url);
                const html = await response.text();
                const $ = cheerio.load(html);
                const title = $('title').text();
                console.log(title);
                const price = $('._30jeq3._16Jk6d').text();
                console.log('price:', price);

                const xpathSelector_description = '#container div div:nth-child(3) div:nth-child(1) div:nth-child(2) div:nth-child(8) div:nth-child(3) div div:nth-child(2) div:nth-child(1) div:nth-child(1) table';
                const tableElement = $(xpathSelector_description);

                const dataObject = {};

                tableElement.find('tr').each((index, row) => {
                    const columns = $(row).find('td');
                    if (columns.length === 2) {
                        const key = $(columns[0]).text().trim();
                        const value = $(columns[1]).text().trim();
                        dataObject[key] = value;
                    }
                });

                console.log('description:', dataObject);


                const xpathSelector_ratings = '#container div div:nth-child(3) div:nth-child(1) div:nth-child(2) div:nth-child(8) div:nth-child(5) div div:nth-child(2) div:nth-child(1) div div:nth-child(1) div div:nth-child(2) div span';
                const ratingsElement = $(xpathSelector_ratings);
                const ratingsText = ratingsElement.text();
                const match_ratings = ratingsText.match(/\d+/);
                const numberOfRatings = match_ratings ? parseInt(match_ratings[0]) : 0;

                console.log('Number of Ratings:', numberOfRatings);

                const xpathSelector_review = '#container div div:nth-child(3) div:nth-child(1) div:nth-child(2) div:nth-child(8) div:nth-child(5) div div:nth-child(2) div:nth-child(1) div div:nth-child(1) div div:nth-child(3) div span';
                const reviewsElement = $(xpathSelector_review);
                const reviewsText = reviewsElement.text();
                const match_review = reviewsText.match(/\d+/);
                const numberOfReviews = match_review ? parseInt(match_review[0]) : 0;
                console.log('Number of Reviews:', numberOfReviews);

                const xpathSelector_overall_ratings = '#container div div:nth-child(3) div:nth-child(1) div:nth-child(2) div:nth-child(8) div:nth-child(5) div div:nth-child(2) div:nth-child(1) div div:nth-child(1) div div:nth-child(1) div div:nth-child(1)';
                const overallRatingsElement = $(xpathSelector_overall_ratings);
                const overallRatingsText = overallRatingsElement.text();
                console.log('Overall Ratings:', overallRatingsText);

                const xpathSelector = '#container div div:nth-child(3) div:nth-child(1) div:nth-child(1) div:nth-child(1) div div:nth-child(1) div:nth-child(1) div div:nth-child(1) ul';
                const ulElement = $(xpathSelector);
                const liElementsCount = ulElement.find('li').length;

                console.log('The number of media counts present in the product display box:', liElementsCount);
                product_object['user_email'] = user_id;
                product_object['url'] = url;
                product_object['title'] = title;
                product_object['price'] = price;
                product_object['description'] = dataObject;
                product_object['ratings'] = numberOfRatings;
                product_object['reviews'] = numberOfReviews;
                product_object['over_all_reviews'] = overallRatingsText;
                product_object['media_count'] = liElementsCount;

                await mongoClient.connect();
                const collection = await mongoClient.db('datavio').collection('product_data');
                const return_data = await collection.insertOne(product_object);

                res.status(200).json({ message: "url scraped and inserted sucessfully" });
            }
        }
        return
    }
    catch {
        res.status(500).json({ message: "internal server error" });
    }

})
app.post('/get-url', async function (req, res) {
    try {
        console.log(req.body);
        const authHeader = req.headers['authorization'];
        const user_id = verifyToken(authHeader);
        if (user_id == null) {
            res.status(403).json({ message: "invalid token" });
        }
        else {

            const url_req = req.body.url;
            if (url_req == null) {
                res.status(400).json({ message: "please provide the correct url" });
            }
            else {
                await mongoClient.connect();
                const collection = await mongoClient.db('datavio').collection('product_data');
                const return_data = await collection.findOne({ user_email: user_id, url: url_req });
                if (return_data == null) {
                    res.status(404).json({ message: "product data for the specific url and user is not found" });
                }
                else {
                    delete (return_data['user_email']);
                    delete (return_data['url']);
                    delete (return_data['_id']);
                    res.status(200).send(return_data);

                }
            }

        }
        return
    }
    catch {
        res.status(500).json({ message: "internal server error" });
    }

})



app.listen(8085, function () {
    console.log("server started");
})