/* global __dirname */
"use strict";
/* global process */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
var express = require('express');
var router = express.Router();
var fs = require("fs");
var setup = require('../setup.js');
var path = require('path');
var ibc = {};
var chaincode = {};
var async = require('async');

// Load our modules.
//var aux     = require("./site_aux.js");
var rest    	= require("../utils/rest.js");
var creds	= require("../user_creds.json");
var prodinfo	= require("../product_info.json");


// ============================================================================================================================
// Home
// ============================================================================================================================

router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
//	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});  

router.route("/").get(function(req, res){
	check_login(res, req);
	res.render('part2', {title: 'CheckIt', bag: {setup: setup, e: process.error, session: req.session}} );
});

router.route("/home").get(function(req, res){
	check_login(res, req);
	res.redirect("/dashboard");
});

router.route("/newItem").get(function(req, res){
	check_login(res, req);
	res.render('part2', {title: 'CheckIt', bag: {setup: setup, e: process.error, session: req.session}} );
});


router.route("/dashboard").get(function(req, res){
	check_login(res, req);
	res.render('part2', {title: 'CheckIt', bag: {setup: setup, e: process.error, session: req.session}} );
});


router.route("/getItemsWithID").post(function(req, res){

	chaincode.query.getItemDetailsWithID([req.body.itemId], function (e, item){
		if(e != null){
			console.log('Get Item error', e);
			res.send(e);
		}
		else{
			var pinfo = {};
			var company = "";
			var owner = "";
			for (var i in creds){
				if(creds[i].username == JSON.parse(item).manufacturer){
					company = creds[i].companyname
				}
			}
			for (var i in creds){
				if(creds[i].username == JSON.parse(item).currentOwner){
					owner = creds[i].companyname
				}
			}
			for(var i in prodinfo){
                         	if(prodinfo[i].barcode == JSON.parse(item).barcode){
					pinfo = {
						name: prodinfo[i].productname,
						image: prodinfo[i].productimage,
						expdate: prodinfo[i].expdate,
						batchno: prodinfo[i].batchno,
						manufacturer: company,
						origin: JSON.parse(item).transactions[0].location,
						currentowner: owner, 
						location: JSON.parse(item).transactions[JSON.parse(item).transactions.length-1].location
					}
					res.send(pinfo);
				}
			}
			res.send(pinfo);
		}
	})
	chaincode.invoke.addScanCount([req.body.itemId], function (e){
		if(e != null){
			console.log('Add Scan Count error', e);
			res.send(e);
		}
		else {
			null
		}
	})
});

/*
router.route("/claimBatch").post(function(req, res){

	chaincode.invoke.claimBatch([req.body.batchId,req.body.user,req.body.date,req.body.location], function (e, resMsg){
		if(e != null){
			console.log('Claim Batch error', e);
			res.send(e);
		}
		else{
			res.send(resMsg);
		}
	})
});
*/

router.route("/getAllBatches").post(function(req, res){

	chaincode.query.getAllBatches([req.body.user], function (e, resMsg){
		if(e != null){
			console.log('Get All Batch error', e);
			//res.send(e);
		}
		else{
			res.send(resMsg);
		}
	})
});

/*
router.route("/getAllBatchesDetails").post(function(req, res){

	chaincode.query.getAllBatchesDetails([req.body.user], function (e, resMsg){
		if(e != null){
			console.log('Get All Batch Details error', e);
			//res.send(e);
		}
		else{
			res.send(resMsg);
		}
	})
});

router.route("/transferBatch").post(function(req, res){

	chaincode.invoke.transferBatch([req.body.batchId,req.body.user,req.body.date,req.body.location,req.body.newOwner,req.body.signature], function (e, resMsg){
		if(e != null){
			console.log('Transfer Batch error', e);
			//res.send(e);
		}
		else{
			res.send(resMsg);
		}
	})
});
*/


router.route("/login").get(function(req, res){
	res.render('login', {title: 'Login', bag: {setup: setup, e: process.error, session: req.session}} );
});

router.route("/logout").get(function(req, res){
	req.session.destroy();
	res.redirect("/login");
});

router.route("/:page").post(function(req, res){
	req.session.error_msg = 'Invalid username or password';
	
	for(var i in creds){
		if(creds[i].username == req.body.username){
			if(creds[i].password == req.body.password){
				console.log('user has logged in', req.body.username);
				req.session.username = req.body.username;
				req.session.error_msg = null;

				// Roles are used to control access to various UI elements
				if(creds[i].role) {
					console.log("user has specific role:", creds[i].role);
					req.session.user_role = creds[i].role;
				} else {
					console.log("user role not specified, assuming:", "user");
					req.session.user_role = "user";
				}
				
				if(creds[i].location) {
					console.log("user has specific location:", creds[i].location);
					req.session.user_loc = creds[i].location;
				} else {
					console.log("user location not specified, set as unknown by default");
					req.session.user_loc = "Location Unknown";
				}

				res.redirect('/newItem');
				
				return;
			}
			break;
		}
	}
	res.redirect('/login');
});

module.exports = router;



function check_login(res, req){
	if(!req.session.username || req.session.username == ''){
		console.log('! not logged in, redirecting to login');
		res.redirect('/login');
	}
}


module.exports.setup = function(sdk, cc){
	ibc = sdk;
	chaincode = cc;
};
