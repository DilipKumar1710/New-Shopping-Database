const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cors());

let db = null;

const dbPath = path.join(__dirname,"shoppingDatabase.db");

const initializeDBAndServer = async () =>{
    try{
        db = await open({
            filename:dbPath,
            driver:sqlite3.Database
        });
    
        app.listen(3000, () => {
            console.log("Server is Running...");
        });
    }catch(error){
        console.log(`Database Error: ${error.message}`);
    }
}

app.get("/products/", async (req, res) =>{
    let jwtToken;
    const authHeader = req.headers["authorization"];
    if (authHeader !== undefined){
        jwtToken = authHeader.split(" ")[1];
    }

    if (jwtToken === undefined){
        res.status(401);
        res.send("Invalid Access Token..");
    }else{
        jwt.verify(jwtToken,"MY_SECRET_ACCESS_WEB_TOKEN", async () =>{
            if (error){
                res.send("Invalid Access Token...");
            }else{
                const getAllProducts = `
                    SELECT 
                        * 
                    FROM 
                        shoppingMall
                    ORDER BY
                        product_id;`;
                const results = await db.all(getAllProducts);
                res.send(results);
            }
        })
    }
});

app.post("/register/", async(req, res) =>{
    const {username, name, password, emailId, gender, phoneNumber} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM users WHERE username = ${username}`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined){
        const insertUser = `
        INSERT INTO users(
            username, name, password, email_id, gender, phone_number
        )
        VALUES(
            ${username}, 
            ${name}, 
            ${hashedPassword}, 
            ${emailId}, 
            ${gender}, 
            ${phoneNumber} 
        )`;
        const dbResponse = await db.run(insertUser);
        const newUserId = dbResponse.lastID;
        res.send(`New User is Created with User Id: ${newUserId}`);
    }else{
        res.status = 400;
        res.send('User Already Exists...');
    }
});

app.post('/login/', async (req, res) => {
    const {username, password} = req.body;
    const checkUserQuery = `SELECT * FROM users WHERE username = ${username}`;
    const dbUser = await db.get(checkUserQuery);

    if(dbUser !== undefined){
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched === true){
            const payload = {
                username: username,
            }

            const jwtToken = jwt.sign(payload, "MY_SECRET_ACCESS_WEB_TOKEN");
            res.send({jwtToken});
        }else{
            res.status(400);
            res.send("Invalid Username or Password");
        }
    }else{
        res.status(400);
        res.send("Invalid Username or Password");
    }
})

app.get("/products/category/", async(request, response) =>{
    let jwtToken;
    
    const authHeader = request.headers["authorization"];

    if (authHeader === undefined){
        response.status(401);
        response.send("Invalid Access Token...");
    }else{
        jwt.verify(jwtToken, "MY_SECRET_ACCESS_WEB_TOKEN", async () => {
            if (error){
                response.send("Invalid Access Token...");
            }else{
                const {category} = request.query;

                const oneCategory = `SELECT * FROM shopping_cart WHERE category = ${category}`;

                const specificCategory = await db.all(oneCategory);

                response.send(specificCategory);
            }
        })
    }

});

app.get("/products/:product_id/", async (request, response) =>{
    let jwtToken;

    const authHeader = request.headers["authorization"];

    if (authHeader === undefined){
        response.status(401);
        response.send("Invalid Access Token...");
    }else{
        jwt.verify(jwtToken, "MY_SECRET_ACCESS_WEB_TOKEN", async () => {
            if (error){
                response.send("Invalid Access Token...");
            }else{
                const {product_id} = request.query;

                const oneProduct = `SELECT * FROM shopping_cart WHERE product_id = ${product_id}`;

                const specificProduct = await db.get(oneProduct);

                response.send(specificProduct);    
            }
        });
    }
});

initializeDBAndServer();