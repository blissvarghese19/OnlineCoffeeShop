// import dependencies
const express = require('express');
const path = require('path');
// set up expess validator
const {check, validationResult} = require('express-validator'); //destructuring an object
const exp = require('constants');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
// set up variables to use packages
var myApp = express();
myApp.use(express.urlencoded({extended:false})); 
// set path to public folders and view folders
myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');
// set up different routes (pages) of the website
// render the home page
myApp.get('/',function(req, res){
    res.render('home'); // will render views/home.ejs
});
myApp.get('/product',function(req, res){
    res.render('products'); // will render views/products.ejs
});
myApp.get('/gallery',function(req, res){
    res.render('gallery'); // will render views/gallery.ejs
});
//redirect to products page
myApp.post('/product',function(req,res){
    res.render('products')
});
//regex validations
var custNameRegex    = /^[a-zA-Z0-9]{1,}\s[a-zA-Z0-9]{1,}$/;
var cardNumRegex     = /^[0-9]{4}[\-][0-9]{4}[\-][0-9]{4}[\-][0-9]{4}$/;
var cardMonthRegex   = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/;
var cardYearRegex    = /^[0-9]{4}$/;
var phoneNoRegex     = /^\d{10}$/;
var prodQtyRegex     = /^[0-9]+$/;
//functions for validation
function checkRegex(userInput, regex){
    if(regex.test(userInput)){
        return true;
    }
    else{
        return false;
    }
}
//number validation for quantity
function cuppuQuantityValidation(value, {req}){
    var prodCuppuQty = req.body.prodCuppuQty;
    if(!checkRegex(prodCuppuQty, prodQtyRegex) && prodCuppuQty != ""){
        throw new Error('Cuppuccino quantity should be a number.');
    }
    return true;
}
function expQuantityValidation(value, {req}){
    var prodExpQty = req.body.prodExpQty;
    if(!checkRegex(prodExpQty, prodQtyRegex) && prodExpQty != ""){
        throw new Error('Expresso quantity should be a number.');
    }
    return true;
}
function ameQuantityValidation(value, {req}){
    var prodAmeQty = req.body.prodAmeQty;
    if(!checkRegex(prodAmeQty, prodQtyRegex) && prodAmeQty != ""){
        throw new Error('Americano quantity should be a number.');
    }
    return true;
}
//variable declaration and initialization for products
var prodList     = new Array();
var prodDetails  = new Array();
var totalCuppuCost = 0;
var totalExpCost   = 0;
var totalAmeCost   = 0;
var totalCost      = 0;
var tax            = 0;
var subTotal       = 0;
var totalTax       = 0;
const cuppuPrice   = 8;
const expPrice     = 9;
const amePrice     = 12;

//redirect to bill page when user clicks proceed
myApp.post('/receipt',[
    check('custName', '*Please enter your full name').matches(custNameRegex),
    check('custAddress', '*Please enter your address.').not().isEmpty(),
    check('custCity', '*Please enter a city.').not().isEmpty(),
    check('custProvince', '*Please select your provice code').not().isEmpty(),
    check('custPhone', '*Please enter a valid Phone Number.Eg:5198201234').matches(phoneNoRegex),
    check('custEmail', '*Please enter a valid email.Eg:test@test.com').isEmail(),
    check('cardNo', '*Please enter valid Card Number.Eg:1111-1111-1111-1111').matches(cardNumRegex),
    check('cardExpMonth', '*Please enter valid Expiry Month.Eg:JAN').matches(cardMonthRegex),
    check('cardExpYear', '*Please enter valid Expiry Year.Eg:2022').matches(cardYearRegex),
    check('prodCuppuQty').custom(cuppuQuantityValidation),
    check('prodExpQty').custom(expQuantityValidation),
    check('prodAmeQty').custom(ameQuantityValidation)
], function(req,res){
    // check for errors
    const errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty())
    {
        res.render('products',{er: errors.array()});
    }
    else
    {
        //clearing once submitted values
        prodList = new Array();
        totalCost = 0;
        tax = 0;
        subTotal =0;
        //fetch the values
        var custName     = req.body.custName; 
        var custAddress  = req.body.custAddress;
        var custCity     = req.body.custCity;
        var custProvince = req.body.custProvince;
        var custPhone    = req.body.custPhone;
        var custEmail    = req.body.custEmail;
        var cardNo       = req.body.cardNo;
        var prodCuppuQty = req.body.prodCuppuQty; // the key here is from the name attribute not the id attribute
        var prodExpQty   = req.body.prodExpQty;
        var prodAmeQty   = req.body.prodAmeQty;
        //getting the last 4 characters from credit card
        var lastNum  = cardNo.substr(-4);
        var mask     = "XXXX-XXXX-XXXX-";
        cardNo  = mask + lastNum;
        //checking product quantity is not zero to add items
        if(prodCuppuQty != 0)
        {
            totalCuppuCost = cuppuPrice * prodCuppuQty;
            prodDetails = ["Cuppuccino","$" + cuppuPrice,prodCuppuQty,"$" + totalCuppuCost];
            prodList.push(prodDetails);
            totalCost += totalCuppuCost;
        }
        if(prodExpQty != 0)
        {
            totalExpCost = expPrice * prodExpQty;
            prodDetails = ["Expresso","$" + expPrice,prodExpQty,"$" +totalExpCost];
            prodList.push(prodDetails);
            totalCost += totalExpCost;
        }
        if(prodAmeQty != 0)
        {
            totalAmeCost = amePrice * prodAmeQty;
            prodDetails = ["Americano","$" + amePrice,prodAmeQty,"$" + totalAmeCost];
            prodList.push(prodDetails);
            totalCost += totalAmeCost;
        }
        //calculating tax according to each province
        if(totalCost != 0)
        {
            if(custProvince == "AB" || custProvince == "NT" || custProvince == "NU" || custProvince == "YT")
            {
                tax = 0.05;
            }
            if(custProvince == "BC" || custProvince == "MB")
            {
                tax = 0.12;
            }
            if(custProvince == "NB"|| custProvince == "NL" || custProvince == "NS" ||custProvince == "PE")
            {
                tax = 0.15;
            }
            if(custProvince == "ON")
            {
                tax = 0.13;
            }
            if(custProvince == "QC")
            {
                tax = 0.149;
            }
            if(custProvince == "SK")
            {
                tax = 0.11;
            }
            totalTax = totalCost * tax;
            subTotal = totalCost + totalTax;
        }
        // create an object with the fetched data to send to the view
        var pageData = {
            custName    : custName,
            custAddress : custAddress,
            custCity    : custCity,
            custProvince: custProvince,
            custEmail   : custEmail,
            custPhone   : custPhone,
            custCardNo  : cardNo,
            prodCuppuQty:prodCuppuQty,
            prodExpQty  : prodExpQty,
            prodAmeQty  : prodAmeQty,
            totalCost   : totalCost,
            totalTax    :totalTax,
            subTotal    : subTotal,
            prodList    : prodList
        }
        // send the data to the view and render it
        res.render('invoice', pageData);
    }
});
// start the server and listen at a port
myApp.listen(8080);

//tell everything is going good
console.log('Everything executed fine.. website at port 8080....');

