const { Pool } = require('pg');
const dbConn = require('./dbConn');
const pool = dbConn.getPool();

// establish a connection we can close with a callback
function runMigration1(pool, callback){
    // connect to DB
    pool.connect((err, client, done) => {
        if (err) {
            console.log("Failed to connect to the database");
            console.error(err);
            return done();
        }
        // run migration SQL
        pool.query(`CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            productName VARCHAR(50),
            productNumber VARCHAR(25),
            productLabel VARCHAR(50),
            startingInv INTEGER,
            recievedInv INTEGER,
            orderedInv INTEGER,
            currentInv INTEGER,
            minimumInv INTEGER)`, (err, data) => {
                if (err){
                    console.log("CREATE TABLE pets failed");
                } else {
                    console.log("pets table created sucessfully");
                }
                // tell pg we are done with this connection, then execute callback to close it
                done();
                runMigration2();
            }
        );
    });
}
function runMigration2 () {
    pool.query(`CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products,
        supplier VARCHAR(100),
        numPurchased INTEGER,
        numRecieved INTEGER,
        cost NUMERIC,
        datePurchased DATE)`, (err, data) => {
            if (err){
                console.log("CREATE TABLE pets failed");
            } else {
                console.log("pets table created sucessfully");
            }
            // tell pg we are done with this connection, then execute callback to close it
            done();
            runMigration3();
        }
    );
}
function runMigration3 () {
    pool.query(`CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customerTitle VARCHAR(10),
        customerFirstName VARCHAR(30),
        customerLastName VARCHAR(30),
        product_id INTEGER REFERENCES products,
        orderDetails VARCHAR(200),
        numOrdered INTEGER,
        numShipped INTEGER,
        price NUMERIC,
        dateOrdered DATE,
        dateShipped DATE)`, (err, data) => {
            if (err){
                console.log("CREATE TABLE pets failed");
            } else {
                console.log("pets table created sucessfully");
            }
            // tell pg we are done with this connection, then execute callback to close it
            done();
            callback();
        }
    );
}

runMigration1(pool, () => {
    // migrations are complete, we can close the pool
    pool.end();
})