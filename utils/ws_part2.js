// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var ibc = {};
var chaincode = {};
var async = require('async');

module.exports.setup = function(sdk, cc){
	ibc = sdk;
	chaincode = cc;
};

// Devesh: shouldn't 'owner' be renamed to 'user'. Also errors that are received from server side need to be handled better and actually displayed to the browser.
module.exports.process_msg = function(ws, data, owner){
	
	
	if(data.type == 'chainstats'){
		console.log('Chainstats msg');
		ibc.chain_stats(cb_chainstats);
	}
	else if(data.type == 'createItem'){
		console.log('Create Item ', data, owner);
		if(data.item){
			chaincode.invoke.createItem([data.item.id, data.item.name, data.item.currentowner, data.item.barcode, data.item.vdate, data.item.location], cb_invoked_createitem);				//create a new paper
		}
	}
	else if(data.type == 'transferItem'){
		console.log('Tranfer Item ', data);
		chaincode.invoke.transferOwnership([data.item.id, data.item.user, data.item.date, data.item.location, data.item.newowner], cb_invoked_transferitem);
	}
	else if(data.type == 'confirmItem'){
		console.log('Confirm Item ', data);
		chaincode.invoke.confirmOwnership([data.item.id, data.item.user, data.item.date, data.item.location], cb_invoked_confirmitem);
	}
	else if(data.type == 'getItem'){
		console.log('Get Item', data.itemId);
		chaincode.query.getItemDetailsWithID([data.itemId], cb_got_item);
	}
	else if(data.type == 'getAllItems'){
		console.log('Get All Items', owner);
		chaincode.query.getCurrentOwnerItems([owner], cb_got_allitems);
	}
	else if(data.type == 'getAllItemsStatus'){
		console.log('Get All Items By Status', data.itstatus, owner);
		chaincode.query.getCurrentOwnerItemsByStatus([owner, data.itstatus], cb_got_allitems);
	}
	else if(data.type == 'getItemByBarcode'){
		console.log('Get single Item By Barcode', data.barcode);
		chaincode.query.getItemDetailsWithBarcode([data.barcode], cb_got_item);
	}
	else if(data.type == 'changeStatus'){
		console.log('Change status of single item', data, owner);
		chaincode.invoke.changeStatus([data.item.id, owner, data.item.date, data.item.location, data.item.status], cb_invoked_changed_status);
	}

	function cb_got_item(e, item){
		if(e != null){
			console.log('Get Item error', e);
		}
		else{
			sendMsg({msg: 'item', item: JSON.parse(item)});
		}
	}
	
	function cb_got_allitems(e, allItems){
		if(e != null){
			console.log('Get All Items error', e);
		}
		else{
			sendMsg({msg: 'allItems', items: JSON.parse(allItems).items});
		}
	}
	
	function cb_invoked_createitem(e, a){
		console.log('response: ', e, a);
		if(e != null){
			console.log('Invoked create item error', e);
		}
		else{
			console.log("Item ID #" + data.item.id)
			sendMsg({msg: 'itemCreated', Id: data.item.id});
		}
	}

	function cb_invoked_transferitem(e, a){
		console.log('response: ', e, a);
		if(e != null){
			console.log('Invoked transfer item error', e);
		}
		else{
			console.log("Item ID #" + data.item.id)
			sendMsg({msg: 'itemTransferred'});
		}
	}

	function cb_invoked_confirmitem(e, a){
		console.log('response: ', e, a);
		if(e != null){
			console.log('Invoked confirm item error', e);
		}
		else{
			console.log("Item ID #" + data.item.id)
			sendMsg({msg: 'itemConfirmed'});
		}
	}

	function cb_invoked_changed_status(e, a){
		console.log('response: ', e, a);
		if(e != null){
			console.log('Invoked change status error', e);
		}
		else{
			console.log("Item ID #" + data.item.id)
			sendMsg({msg: 'itemChangedStatus'});
		}
	}


	//call back for getting the blockchain stats, lets get the block height now
	var chain_stats = {};
	function cb_chainstats(e, stats){
		chain_stats = stats;
		if(stats && stats.height){
			var list = [];
			for(var i = stats.height - 1; i >= 1; i--){										//create a list of heights we need
				list.push(i);
				if(list.length >= 8) break;
			}
			list.reverse();																//flip it so order is correct in UI
			console.log(list);
			async.eachLimit(list, 1, function(key, cb) {								//iter through each one, and send it
				ibc.block_stats(key, function(e, stats){
					if(e == null){
						stats.height = key;
						sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
					}
					cb(null);
				});
			}, function() {
			});
		}
	}

	//call back for getting a block's stats, lets send the chain/block stats
	function cb_blockstats(e, stats){
		if(chain_stats.height) stats.height = chain_stats.height - 1;
		sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
	}
	

	//send a message, socket might be closed...
	function sendMsg(json){
		if(ws){
			try{
				ws.send(JSON.stringify(json));
			}
			catch(e){
				console.log('error ws', e);
			}
		}
	}
};
