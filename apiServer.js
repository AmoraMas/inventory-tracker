// define dependencies
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8000;  // Port that Express listens to for requests

app.use(cors());

app.use(express.json());

// define structure for accessing database
//const { Pool } = require('pg');
const dbConn = require('./dbConn');
const pool = dbConn.getPool();

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

// ROUTES TO GET EVERYTHING IN TABLE
app.get("/api/:table", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['products', 'purchases', 'orders'];

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `Table ${tableName} does not exist.`});
    }
    // If all is good, perform the request
    else {
        const queryText = 'SELECT * FROM ' + tableName + ';';
        const result = pool.query(queryText, (err, data) => {
            if (err) {
            return next ({ status: 500, message: err });
            }
            res.send(data.rows);
        })
    }
});

// ROUTES TO GET :id IN :table
app.get("/api/:table/:id", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['products', 'purchases', 'orders'];
    const id = parseInt(req.params.id);

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `Table ${tableName} does not exist.`});
    }
    // Verify that id is a number
    else if (isNaN(id)) {
        return next({status: 404, message: `Id ${id} is not a number.`});
    }
    // If all is good, perform the request
    else {
        const queryText = 'SELECT * FROM ' + tableName + ' WHERE id = $1;';
        const result = pool.query(queryText, [id], (err, data) => {
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
  if (!productName || !productNumber || !productLabel || !startingInv || !recievedInv || !orderedInv || !currentInv || !minimumInv) {
    return next({ status: 400, message: `Required information was not provided to add product.` });
  }

  const columnNames = `productName, productNumber, productLabel, startingInv, recievedInv, orderedInv, currentInv, minimumInv`;
  const references = '$1, $2, $3, $4, $5, $6, $7, $8';
  const queryText = `INSERT INTO products (${columnNames}) VALUES (${references}) RETURNING *;`;
  const queryValues = [productName, productNumber, productLabel, startingInv, recievedInv, orderedInv, currentInv, minimumInv];
  
  const result = pool.query(queryText, queryValues, (err, data) => {
    if (writeError) {
      return next({ status: 500, message: err });
    }
    res.send(`Added product`);
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
    if (writeError) {
      return next({ status: 500, message: err });
    }
    res.send(`Added purchase`);
  });
});

// Adds entry to orders
app.post("/api/orders", (req, res, next) => {
  const { customerTitle, customerFirstName, customerLastName, product_id, orderDetails, numOrdered, numShipped, price, dateOrdered, dateShipped } = req.body;
  if (!productName || !productNumber || !productLabel || !startingInv || !recievedInv || !orderedInv || !currentInv || !minimumInv) {
    return next({ status: 400, message: `Required information was not provided to add product.` });
  }

  const columnNames = 'customerTitle, customerFirstName, customerLastName, product_id, orderDetails, numOrdered, numShipped, price, dateOrdered, dateShipped';
  const references = '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10';
  const queryText = `INSERT INTO orders (${columnNames}) VALUES (${references}) RETURNING *;`;
  const queryValues = [customerTitle, customerFirstName, customerLastName, product_id, orderDetails, numOrdered, numShipped, price, dateOrdered, dateShipped];
  
  const result = pool.query(queryText, queryValues, (err, data) => {
    if (writeError) {
      return next({ status: 500, message: err });
    }
    res.send(`Added order`);
  });
});









// TODO:
// app.patch routes
// app.get routes where purchases/orders product_id = id




// ROUTES TO DELETE :id IN :table
app.delete("/api/:table/:id", (req, res, next) => {
    const tableName = req.params.table;
    const tableList = ['products', 'purchases', 'orders'];
    const id = parseInt(req.params.id);

    // Verify requested table exists within tableList
    if (!tableList.includes(tableName)) {
        return next({status: 404, message: `Table ${tableName} does not exist.`});
    }
    // Verify that id is a number
    else if (isNaN(id)) {
        return next({status: 404, message: `Id ${id} is not a number.`});
    }
    // If all is good, perform the request
    else {
        // Verify the ID exists
        let queryText = `SELECT * FROM ${tableName} WHERE id = $1;`;
        let result = pool.query('SELECT * FROM places WHERE id = $1;', [id], (err, deletedData) => {
            if (err) {
                return next({ status: 500, message: err});
            }
            else if (deletedData.rowCount == 0) {
                return next({status: 404, message: ` ${id} in ${tableName} does not exist.`});
            }
        });
        deletedData = deletedData.rows[0];
        queryText = 'DELETE FROM ' + tableName + 'WHERE id = $1 RETURNING *;';
        result = pool.query(queryText, [id], (err, data) => {
            if (err) {
            return next ({ status: 500, message: err });
            }
            //res.send('Deleted: ' + JSON.stringify(deletedData));
            res.send('Deleted id ' + id + ' in ' + tableName + '.');
        })
    }
});





// if an error occured  -- Keep next to last
app.use((err, req, res, next) => {
  //console.error("Error Stack: ", err.stack);
  res.status(err.status).send({ error: err });
});

// if requested handle does not exist -- keep last
app.use((req, res, next) => {
  // res.status(404).send('Path Not Found: ${req.url}');   // Only sends message or JSON, not both
  res.status(404).json({ error: { message: `Path Not Found: ${req.url}` } });
});