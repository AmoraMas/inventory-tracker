const { Pool } = require('pg');
const dbConn = require('./dbConn');
const pool = dbConn.getPool();

// establish a connection we can close with a callback
function runSeeder1(pool, callback){
    // connect to DB
    pool.connect((err, client, done) => {
        if (err) {
            console.log("Failed to connect to the database");
            console.error(err);
            return done();
        }
        // run seed SQL
        pool.query(`SELECT COUNT(*) FROM products`, (err, data) => {
            console.log("number of existing rows: ", data.rows[0]['count']);
            // only INSERT new rows if the table is currently empty
            if (data.rows[0]['count'] == 0){
                pool.query(`INSERT INTO products (productName, productNumber, productLabel, startingInv, recievedInv, orderedInv, currentInv, minimumInv) VALUES 
                ('Red T-Shirt no-pocket', 'TS-Red-0001', 'Red T-Shirt without pocket', 25, 0, 0, 25, 15),
                ('Red T-Shirt pocket', 'TS-Red-0002', 'Red T-Shirt with pocket', 25, 0, 0, 25, 10),
                ('White T-Shirt no-pocket', 'TS-Wht-0001', 'White T-Shirt with no pocket', 25, 0, 0, 25, 15), 
                ('White T-Shirt pocket', 'TS-Wht-0002', 'White T-Shirt with pocket', 25, 0, 0, 25, 10),
                ('Blue T-Shirt pocket', 'TS-Blu-0001', 'Blue T-Shirt with no pocket', 25, 0, 0, 25, 15),
                ('Blue T-Shirt pocket', 'TS-Blu-0002', 'Blue T-Shirt with pocket', 25, 0, 0, 25, 10);`,
                (err, data) => {
                    if (err){
                        console.log("Insert products failed");
                    } else {
                        console.log("Seeding products complete");
                    }
                });
            } else {
                console.log("Did not seed new data because Table was not empty");
            }
            // tell pg we are done with this connection, then execute callback to close it
            done();
            runSeeder2();
        });
    });
};

function runSeeder2 () {
    pool.query(`SELECT COUNT(*) FROM purchases`, (err, data) => {
        console.log("number of existing rows: ", data.rows[0]['count']);
        // only INSERT new rows if the table is currently empty
        if (data.rows[0]['count'] == 0){
            pool.query(`INSERT INTO purchases (product_id, supplier, numPurchased, numRecieved, cost, datePurchased) VALUES 
            (1, 'Walmart', 10, 10, 55.00, '7 Mar 2023'),
            (2, 'Walmart', 10, 10, 55.00, '7 Mar 2023'),
            (3, 'Walmart', 10, 10, 55.00, '7 Mar 2023'),
            (4, 'Walmart', 10, 10, 55.00, '7 Mar 2023');`, 
            (err, data) => {
                if (err){
                    console.log("Insert purchases failed");
                } else {
                    console.log("Seeding purchases complete");
                }
            });
        } else {
            console.log("Did not seed new data because Table was not empty");
        }
        // tell pg we are done with this connection, then execute callback to close it
        done();
        runSeeder3();
    });
}

function runSeeder3 () {
    pool.query(`SELECT COUNT(*) FROM orders`, (err, data) => {
        console.log("number of existing rows: ", data.rows[0]['count']);
        // only INSERT new rows if the table is currently empty
        if (data.rows[0]['count'] == 0){
            pool.query(`INSERT INTO orders (customerTitle, customerFirstName, CustomerLastName, product_id, orderDetails, numOrdered, numShipped, price, dateOrdered, dateShipped) VALUES 
            ('Mr', 'David', 'Meltzer', 1, 'text front hi, text back bye', 2, 2, 30.00, '25 Feb 2023', '1 Mar 2023'),
            ('Mr', 'David', 'Meltzer', 3, 'text front hi, text back bye', 2, 2, 30.00, '25 Feb 2023', '1 Mar 2023'),
            ('Mr', 'Leonardo', 'Davinci', 3, 'text front I invented this', 5, 5, 75.00, '27 Feb 2023', '3 Mar 2023'),
            ('Mr', 'Leonardo', 'Davinci', 3, 'picture Ninja Turtle Leonardo', 5, 5, 75.00, '27 Feb 2023', '3 Mar 2023'),
            ('Ms', 'Baseball', 'Coach', 5, 'text front Team Name text back Player Name', 20, 0, 300.00, '3 Mar 2023', null),
            ('Mr', 'Baseball', 'Coach', 6, 'text front Team Name text back Player Name', 30, 0, 450.00, '4 Mar 2023', null);`, 
            (err, data) => {
                if (err){
                    console.log("Insert orders failed");
                } else {
                    console.log("Seeding orders complete");
                }
            });
        } else {
            console.log("Did not seed new data because Table was not empty");
        }
        // tell pg we are done with this connection, then execute callback to close it
        done();
        callback();
    });
}

runSeeder(pool, () => {
    // seeding is done, so we can close the pool
    pool.end();
})