// define dependencies
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000; // port that Express will listen to for requests

app.use(cors());

app.use(express.json());

// define structure for accessing database
const { Pool } = require('pg');

const pool = new Pool ({
  user: 'postgres',
  host: 'postgres-db',
  database: 'inventory-tracker',
  password: 'password',
  port: 5432
});

// serve your css and js as static to work with your .html
app.use(express.static(__dirname));



// listen to the port
app.listen(port, function () {
  console.log('Server is listening on port: ', port);
  console.log('Connecting to postgres pool: ', pool);
});


// html page request to send index.html to the user
app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
})
app.get("/index.html", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
})


//
// here is where all of your requests with routes go
//

// test request to verify this file is working
app.get("/api/test", (req, res, next) => {
  res.send('Programming is awesome! This page works!');
})

//
//  Special Routes
//

// ROUTES TO GET all entries with product_id  equal to id
app.get("/api/:table/product/:id", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['purchases', 'orders'];
    const id = req.params.id;

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `No product_id GET route for Table ${tableName}.`});
    }
    // Verify that id is a number
    else if (isNaN(id)) {
        return next({status: 404, message: `Product_id (${id}) is not a number.`});
    }
    // If all is good, perform the request
    else {
        const queryText = 'SELECT * FROM ' + tableName + ' WHERE product_id = $1;';
        const result = pool.query(queryText, [parseInt(id)], (err, data) => {
            if (err) {
            return next ({ status: 500, message: err });
            }
            res.send(data.rows);
        })
    }
});

// ROUTES TO GET all entries that have pending needs
app.get("/api/:table/pending", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['purchases', 'orders'];

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `No GET pending route for Table ${tableName}.`});
    }
    // If all is good, perform the request
    else {
        let search1; let search2;
        if (tableName == 'purchases') {
            search1 = 'numrecieved';
            search2 = 'numpurchased';
        }
        else if (tableName == 'orders') {
            search1 = 'numshipped';
            search2 = 'numordered';
        }
        const queryText = `SELECT * FROM ${tableName} WHERE ${search1} < ${search2};`;
        const result = pool.query(queryText, (err, data) => {
            if (err) {
            return next ({ status: 500, message: err });
            }
            //console.log('data:', data);
            res.send(data.rows);
        })
    }
});


//
//  Standard Routes
//

// ROUTES TO GET EVERYTHING IN A :table
app.get("/api/:table", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['products', 'purchases', 'orders'];

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `No GET route for Table ${tableName}.`});
    }
    // If all is good, perform the request
    else {
        let queryText = '';
        if (tableName == 'products') {
            queryText = `SELECT * FROM products ORDER BY currentInv ASC`;
        }
        else {
            queryText = `SELECT * FROM ${tableName} ORDER BY product_id ASC`;
        }
        pool.query(queryText, (err, data) => {
            if (err) {
            return next ({ status: 500, message: err });
            }
            res.send(data.rows);
        })
    }
});

// ROUTES TO GET :id IN A :table
app.get("/api/:table/:id", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['products', 'purchases', 'orders'];
    const id = req.params.id;

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `No GET route for Table ${tableName}.`});
    }
    // Verify that id is a number
    else if (isNaN(id)) {
        return next({status: 404, message: `Id (${id}) is not a number.`});
    }
    // If all is good, perform the request
    else {
        const queryText = 'SELECT * FROM ' + tableName + ' WHERE id = $1;';
        const result = pool.query(queryText, [parseInt(id)], (err, data) => {
            if (err) {
            return next ({ status: 500, message: err });
            }
            res.send(data.rows[0]);
        })
    }
});


// Adds entry to products
app.post("/api/products", (req, res, next) => {
  const { productName, productNumber, productLabel, startingInv, recievedInv, orderedInv, currentInv, minimumInv } = req.body;
  if (!productName || !productNumber || !productLabel || isNaN(startingInv) || isNaN(recievedInv) || isNaN(orderedInv) || isNaN(currentInv) || isNaN(minimumInv)) {
    return next({ status: 400, message: `Required information was not provided to add product.` });
  }

  const columnNames = `productName, productNumber, productLabel, startingInv, recievedInv, orderedInv, currentInv, minimumInv`;
  const references = '$1, $2, $3, $4, $5, $6, $7, $8';
  const queryText = `INSERT INTO products (${columnNames}) VALUES (${references}) RETURNING *`;
  const queryValues = [productName, productNumber, productLabel, startingInv, recievedInv, orderedInv, currentInv, minimumInv];
  
  const result = pool.query(queryText, queryValues, (err, data) => {
    if (err) {
      return next({ status: 500, message: err });
    }
    res.send('Added product');
  });
});

// Adds entry to purchases
app.post("/api/purchases", (req, res, next) => {
  const { product_id, supplier, numPurchased, numRecieved, cost, datePurchased } = req.body;
  if (!product_id || !supplier || !numPurchased || !numRecieved || !cost|| !datePurchased) {
    return next({ status: 400, message: `Required information was not provided to add purchase.` });
  }

  const columnNames = 'product_id, supplier, numPurchased, numRecieved, cost, datePurchased';
  const references = '$1, $2, $3, $4, $5, $6';
  const queryText = `INSERT INTO purchases (${columnNames}) VALUES (${references}) RETURNING *;`;
  const queryValues = [product_id, supplier, numPurchased, numRecieved, cost, datePurchased];
  
  const result = pool.query(queryText, queryValues, (err, data) => {
    if (err) {
      return next({ status: 500, message: err });
    }
    res.send('Added purchase');
  });
});

// Adds entry to orders
app.post("/api/orders", (req, res, next) => {
    //console.log('body:', req.body);
    const { customerTitle, customerFirstName, customerLastName, product_id, orderDetails, numOrdered, numShipped, price, dateOrdered, dateShipped } = req.body;
    if (!customerTitle || !customerFirstName || !customerLastName || !product_id || !orderDetails || !numOrdered || !numShipped || !price || !dateOrdered || !dateShipped ) {
        return next({ status: 400, message: `Required information was not provided to add product.` });
    }

  const columnNames = 'customerTitle, customerFirstName, customerLastName, product_id, orderDetails, numOrdered, numShipped, price, dateOrdered, dateShipped';
  const references = '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10';
  const queryText = `INSERT INTO orders (${columnNames}) VALUES (${references}) RETURNING *;`;
  const queryValues = [customerTitle, customerFirstName, customerLastName, product_id, orderDetails, numOrdered, numShipped, price, dateOrdered, dateShipped];
  const result = pool.query(queryText, queryValues, (err, data) => {
    if (err) {
      return next({ status: 500, message: err });
    }
    res.send('Added order');
  });
});


// Changes/replaces information in row id of product
app.patch("/api/products/:id", (req, res, next) => {
    const id = req.params.id;
    // Check if id in products exist
    const result = pool.query('SELECT * FROM products WHERE id = $1;', [id], (readError, data) => {
        if (readError) {
        return next({ status: 500, message: readError});
        }
        else if (data.rowCount == 0) {
        return next({status: 404, message: `Product ${id} does not exist.`});
        }
        // Check if submitted body has good information
        const request = req.body;
        let list = ['productName', 'productNumber', 'productLabel', 'startingInv', 'recievedInv', 'orderedInv', 'currentInv', 'minimumInv'];
        // Only has expected keys and expected integers are integers
        for (let key in request) {
        if (!list.includes(key)) {
            return next({status: 400, message: 'Bad information provided. Key name. ' + key});
        }
        else if (key.endsWith('_id') && !Number(request[key])) {
            return next({status: 400, message: 'Bad information provided. Key name. ' + key + ' Key Value. ' + request[key]});
        }
        }
        // Perform the update for each key value requested
        for (let key in request) {
            let queryText = 'UPDATE products SET ' + key + '=$1 WHERE id = $2'
            const result = pool.query(queryText, [request[key], id], (writeError, data)=> {
                if (writeError) {
                    return next({status: 500, message: writeError});
                }
            });
        }
        res.send(`Updated requested information to Table products.`);
    });
});






// TODO:
// app.patch routes for purchases and orders




// ROUTES TO DELETE :id IN :table
app.delete("/api/:table/:id", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['products', 'purchases', 'orders'];
    const id = req.params.id;

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `Table ${tableName} does not exist.`});
    }
    // Verify that id is a number
    else if (isNaN(id)) {
        return next({status: 404, message: `Id (${parseInt(id)}) is not a number.`});
    }
    // If all is good, perform the request
    else {
        // Verify the ID exists
        let queryText = `SELECT * FROM ${tableName} WHERE id = $1;`;
        let result = pool.query(queryText, [id], (err, deletedData) => {
            if (err) {
                return next({ status: 500, message: err});
            }
            else if (deletedData.rowCount == 0) {
                return next({status: 404, message: ` ${id} in ${tableName} does not exist.`});
            }
            deletedData = deletedData.rows[0];
            queryText = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
            result = pool.query(queryText, [id], (err, data) => {
                if (err) {
                    return next ({ status: 500, message: err });
                }
                //res.send('Deleted: ' + JSON.stringify(deletedData));
                res.send('Deleted id ' + id + ' in ' + tableName + '.');
            })
        });
    }
});





// if an error occured  -- Keep next to last
app.use((err, req, res, next) => {
  //console.error("Error Stack: ", err.stack);
  ('err:', err);
  res.status(err.status).send({ error: err });
});

// if requested handle does not exist -- keep last
app.use((req, res, next) => {
  // res.status(404).send('Path Not Found: ${req.url}');   // Only sends message or JSON, not both
  res.status(404).json({ error: { message: `Path Not Found: ${req.url}` } });
});
