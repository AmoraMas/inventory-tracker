// global configs -- move to database table later
const warningInventory = 5; // number items in stock above minimumInv where a warning will show
const warningOldOrder = 5;  // number of days since the item was orderd to warn about too old
const dangerOldOrder = 10;  // number of days since the item was orderd to warn about too old


// draw the a card based on information provided within data
function drawTable (title, data, appendTo) {
    $(appendTo).empty();   // Empty the HTML div
    // Draw the title and table headers in the HTML div
    $(appendTo).append(`<h2>${title}</h2>`);
    let $table = $('<table>').addClass('table');
    let $tr = $('<tr>').addClass('row');
    for (let key in data[0]) {
        let header = key;
        header = header.replace('customer', '');   // remove string 'customer' from table headers
        //header = header.replace('num', '');   // remove string 'num' from table headers
        $tr.append($('<th>').addClass('header').text(header));
        $($table).append($tr);
    }

    // Draw the table body in the HTML div
    for (let i = 0; i < data.length; i++) {
        $tr = $('<tr>').addClass('row');
        for (let key in data[i]) {
            let $td = $('<td>').addClass('entry').text(data[i][key])
            $td.click(() => {
                $td.parent().parent().children().removeClass('selected').children().removeClass('selected');
                $td.addClass('selected').siblings().addClass('selected');
            })
            if (title == 'Products') {
                $td.click( () => {
                    $.get(`/api/purchases/product/${data[i].id}`, data => {
                        drawTable('Purchases', [data], '#purchasesDiv');
                    });
                    $.get(`/api/orders/product/${data[i].id}`, data => {
                        drawTable('Orders', [data], '#ordersDiv');
                    });
                });
            }
            $tr.append($td);
        }
        // used for testing dates compared to today
        let today = new Date();
        let warningDate = new Date();
        let dangerDate = new Date();
        warningDate.setDate(today.getDate() - warningOldOrder);
        dangerDate.setDate(today.getDate() - dangerOldOrder);
        //console.log('warning:', warningDate, 'danger:', dangerDate);

        // highlights rows based on the data within them
        if (data[i].currentinv <= data[i].minimuminv) {
            $tr.addClass('danger');  // Danger for low Product inventory
        }
        else if (data[i].currentinv <= data[i].minimuminv + warningInventory) {
            $tr.addClass('warning');  // Warning for low Product inventory
        }
        else if (data[i].numshipped < data[i].numordered  && new Date(data[i].dateordered) < dangerDate ) {
            $tr.addClass('danger');  // Danger for low slow shipping on an order
        }
        else if (data[i].numshipped < data[i].numordered  && new Date(data[i].dateordered) < warningDate ) {
            $tr.addClass('warning');  // Warning for slow shipping on an order
        }
        $($table).append($tr);
    }
    $(appendTo).append($table);
}


function getAllProducts () {
    $.get('/api/products', (data) => {
        //console.log('data', data);
        drawTable('Products', data, '#productsDiv');
    });
}

function getAllPurchases () {
    $.get('/api/purchases', (data) => {
        //console.log('data', data);
        drawTable('Purchases', data, '#purchasesDiv');
    });
}

function getAllOrders () {
    $.get('/api/orders', (data) => {
        //console.log('data', data);
        drawTable('Orders', data, '#ordersDiv');
    });
}

function getPendingPurchases () {
    $.get('/api/purchases/pending', (data) => {
        //console.log('data', data);
        drawTable('Purchases', data, '#purchasesDiv');
    });
}

function getPendingOrders () {
    $.get('/api/orders/pending', (data) => {
        //console.log('data', data);
        drawTable('Orders', data, '#ordersDiv');
    });
}


function showPending() {
    getAllProducts();
    getPendingPurchases();
    getPendingOrders();
}

showPending();


//
//  WHAT BUTTONS DO
//

$('#ShowAll').click( () => {
    getAllProducts();
    getAllPurchases();
    getAllOrders();
});

$('#ShowPending').click( () => {
    showPending();
});

$('#UpdateDB').click( () => {
    $.get('/api/products', (data) => {  // returns an array of objects for all products
        for (let i = 0; i < data.length; i++) {  // iterates through entire array
            let { id, startinginv} = data[i];
            let recievedInv = 0;
            let orderedInv = 0;
            console.log(`Updating information for product id ${id}`);
            $.get(`/api/purchases/product/${id}`, (data) => {
                for (let j = 0; j < data.length; j++) {
                    recievedInv += data[j].numrecieved;
                    console.log(`Updating recieved inventory for id ${id} to ${recievedInv}`);
                }
                //const pushData = { "recievedinv": recievedinv };
                $.ajax({
                    type: "PATCH",
                    url: `/api/products/${id}`,
                    data: `{ "recievedInv": ${recievedInv} }`,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        console.log(result);
                        getAllProducts();
                    }
                });
                $.get(`/api/orders/product/${id}`, (data) => {
                    for (let j = 0; j < data.length; j++) {
                        orderedInv += data[j].numordered;
                        console.log(`Updating ordered inventory for id ${id} to ${orderedInv}`);
                    }
                    //const pushData = { "orderedinv": orderedinv };
                    $.ajax({
                        type: "PATCH",
                        url: `/api/products/${id}`,
                        data: `{ "orderedInv": ${orderedInv} }`,
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function (result) {
                            console.log(result);
                            getAllProducts();
                        }
                    });
                });
                setTimeout( () => {
                    $.get(`/api/products/${id}`, (data) => {
                        let startingInv = data.startinginv;
                        let recievedInv = data.recievedinv;
                        let orderedInv = data.orderedinv;
                        let currentInv = startingInv + recievedInv - orderedInv;
                        console.log(`Updating current inventory for product id ${id}`);
                        $.ajax({
                            type: "PATCH",
                            url: `/api/products/${id}`,
                            data: `{ "currentInv": ${currentInv} }`,
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function (result) {
                                console.log(result);
                                getAllProducts();
                            }
                        });
                    })
                }, 2000);
            });
        }
    });
});