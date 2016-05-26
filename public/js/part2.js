/* global clear_blocks */
/* global formatMoney */
/* global in_array */
/* global new_block */
/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};
var itId = '';
var user = {username: bag.session.username};
var valid_users = ["MANUFACTURER","DISTRIBUTOR","RETAILER"];
var panels = [
	{
		name: "dashboard",
		formID: "dashboardFilter",
		tableID: "#dashboardBody",
		filterPrefix: "dashboard_"
	}
];
var lastTx = ''

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();

	if(user.username)
	{
		$("#userField").html(user.username+ ' ');
	}

	// Customize which panels show up for which user
	$(".nav").hide();
	//console.log("user role", bag.session.user_role);

	// Only show tabs if a user is logged in
	if(user.username) {
		// Display tabs based on user's role
		if(bag.session.user_role && bag.session.user_role.toUpperCase() === "manufacturer".toUpperCase()) {
			$("#newItemLink").show();
			$("#newItemPanel").show();
			$("#dashboardLink").show();
			$("#transferLink").show();
			$("#confirmLink").hide();
			$("#changeStatusLink").show();
			$("#dashboardPanel").hide();
			$("#itemDetailsTable").hide();
			$("#transferForm").hide();
			$("#confirmForm").hide();
			$("#changeStatusForm").hide();
		} else if(user.username) {
			$("#dashboardLink").show();
			$("#transferLink").show();
			$("#confirmLink").show();
			$("#changeStatusLink").show();
			$("#dashboardPanel").show();
			$("#newItemLink").hide();
			$("#newItemPanel").hide();
			$("#itemDetailsTable").hide();
			$("#transferForm").hide();
			$("#confirmForm").hide();
			$("#changeStatusForm").hide();
		}

	}

	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$("#generate").click(function(){
		if(user.username){
			$("input[name='ItemId']").val(randStr(15).toUpperCase());
		
			$("input[name='Date']").val(formatDate(Date(), '%Y-%m-%d %H:%M'));
			
			$("#submit").removeAttr("disabled");		
		}

		return false;
	});

	$("#submit").click(function(){
		if(user.username){
			var obj = 	{
							type: "createItem",
							item: {
								id: $("input[name='ItemId']").val(),
								barcode: $("select[name='Barcode']").val(),
								currentowner: user.username, 
								location: bag.session.user_loc,
								vdate: $("input[name='Date']").val()
							}
						};

			if(obj.item && obj.item.id){
				console.log('creating item, sending', obj);
				ws.send(JSON.stringify(obj));
				$(".panel").hide();
				$('#itemTag').html('');
				$('#spinner').show();
				$('#tagWrapper').hide();
				$("#itemTagPanel").show();
				$("input[name='ItemId']").val('');
				$("input[name='Date']").val('')
				$("#submit").prop('disabled', true);

			}
		}
		return false;
	});

	$("#transfersubmit").click(function(){
		if(user.username){
			var obj = {
				type: "transferItem",
				item: {
					id: itId,
					user: user.username,
					date: formatDate(Date(), '%Y-%M-%d %I:%m%p'),
					location: bag.session.user_loc,
					newowner: $("input[name='AccountId']").val()
				}
			};
			if(obj.item.id && obj.item.newowner) {
				ws.send(JSON.stringify(obj));
			}
			else {
				alert("Please select items to transfer first");
			}
		}
		return false;
	});


	$("#confirmsubmit").click(function(){
		if(user.username){
			var obj = {
				type: "confirmItem",
				item: {
					id: itId,
					user: user.username,
					date: formatDate(Date(), '%Y-%m-%d %H:%M'),
					location: bag.session.user_loc
				}
			};
			if(obj.item.id) {
				ws.send(JSON.stringify(obj));
			}
			else {
				alert("Please select items to confirm first");
			}
		}
		return false;
	});

	$("#changestatussubmit").click(function(){
		if(user.username){
			var obj = {
				type: "changeStatus",
				item: {
					id: itId,
					user: user.username,
					date: formatDate(Date(), '%Y-%m-%d %H:%M'),
					location: bag.session.user_loc,
					status: $("select[name='newStatus']").val()
				}
			};
			if(obj.item.id) {
				ws.send(JSON.stringify(obj));
			}
			else {
				alert("Please select items to change status for first");
			}
		}
		return false;
	});



	
	$("#newItemLink").click(function(){
		$("#itemTagPanel").hide();
		$("#newItemPanel").show();
		$('#spinner2').hide();
		$('#openTrades').hide();
	});

	$("#dashboardLink").click(function(){
		if(user.username) {
			$("#dashboardPanel").show();
			$('#spinner2').show();
			$('#openTrades').hide();
			$("#itemTagPanel").hide();
			$("#newItemPanel").hide();
			$("#newItemPanel").hide();
			$("#transferForm").hide();
			$("#confirmForm").hide();
			$("#statusChangeForm").hide();
			ws.send(JSON.stringify({type: "getAllItems", v: 2}));
		}
	});
	
	$("#transferLink").click(function(){
		if(user.username) {
			$("#dashboardPanel").show();
			$('#spinner2').show();
			$('#openTrades').hide();
			$("#itemTagPanel").hide();
			$("#newItemPanel").hide();
			$("#transferForm").show();
			$("#confirmForm").hide();
			$("#statusChangeForm").hide();
			ws.send(JSON.stringify({type: "getAllItemsStatus", itstatus: "VERIFIED", v: 2}));
		}
	});
	
	$("#confirmLink").click(function(){
		if(user.username) {
			$("#dashboardPanel").show();
			$('#spinner2').show();
			$('#openTrades').hide();
			$("#itemTagPanel").hide();
			$("#newItemPanel").hide();
			$("#confirmForm").show();
			$("#transferForm").hide();
			$("#statusChangeForm").hide();
			ws.send(JSON.stringify({type: "getAllItemsStatus", itstatus: "IN OWNERSHIP TRANSIT", v: 2}));
		}
	});

	$("#changeStatusLink").click(function(){
		if(user.username) {
			$("#dashboardPanel").show();
			$('#spinner2').show();
			$('#openTrades').hide();
			$("#itemTagPanel").hide();
			$("#newItemPanel").hide();
			$("#transferForm").hide();
			$("#confirmForm").hide();
			$("#statusChangeForm").show();
			ws.send(JSON.stringify({type: "getAllItems", v: 2}));
		}
	});

	//login events
	$("#whoAmI").click(function(){													//drop down for login
		if($("#loginWrap").is(":visible")){
			$("#loginWrap").fadeOut();
		}
		else{
			$("#loginWrap").fadeIn();
		}
	});

	// Filter the trades whenever the filter modal changes
	$(".dashboard-filter").keyup(function() {
		"use strict";
		console.log("Change in filter detected.");
		processFilterForm(panels[0]);
	});

	var e = formatDate(new Date(), '%d/%M/%Y &nbsp;%I:%m%P');
	$("#blockdate").html('<span style="color:#D4DCDC">TIME</span>&nbsp;&nbsp;' + e + ' UTC');

	setInterval(function() {
		var e = formatDate(new Date(), '%d/%M/%Y &nbsp;%I:%m%P');
		$("#blockdate").html('<span style="color:#D4DCDC">TIME</span>&nbsp;&nbsp;' + e + ' UTC');

	}, 60000);

	

	$("#dashboardTable").on('click', 'tr', function() {
	    itId = $(this).find('td:first').text() ;
	    if(itId != 'Nothing here...'){
	    	ws.send(JSON.stringify({type: "getItem", itemId: itId}));
	    }
	});
});


// =================================================================================
// Helper Fun
// =================================================================================
function escapeHtml(str) {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
};

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	var connected = false;
	connect();
		
	function connect(){
		var wsUri = '';
		console.log('protocol', window.location.protocol);
		if(window.location.protocol === 'https:'){
			wsUri = "wss://" + bag.setup.SERVER.EXTURI;
		}
		else{
			wsUri = "ws://" + bag.setup.SERVER.EXTURI;
		}

		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log("WS CONNECTED");
		connected = true;
		clear_blocks();
		$("#errorNotificationPanel").fadeOut();
		ws.send(JSON.stringify({type: "chainstats", v:2}));
		if(user.username && bag.session.user_role && bag.session.user_role.toUpperCase() === "manufacturer".toUpperCase()) {
			$('#spinner2').show();
			$('#openTrades').hide();
			ws.send(JSON.stringify({type: "getAllItems", v: 2}));
		}

	}

	function onClose(evt){
		console.log("WS DISCONNECTED", evt);
		connected = false;
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var data = JSON.parse(msg.data);
			
			if(data.msg === 'allItems'){
				console.log("---- ", data);
				build_Items(data.items, null);
				$('#spinner2').hide();
				$('#openTrades').show();
			}
			else if(data.msg === 'item'){
				console.log(data);
				var txs = data.item.transactions;
				var html = ''
				$("#itemDetailsTable").show();
				for(var i=0; i<txs.length; i++){
					console.log(txs[i]);
					$("#bDetHeader").html("ITEM #" + data.item.id + ' - <span style="font-size:16px;font-weight:500">' + data.item.name + '</span>');


					if(txs[i].transactionType == "CREATE"){
			          //litem = {avatar:"ion-ios-box-outline", date: tx.vDate, location: tx.location, desc:"ADDED BY ", owner:tx.owner};
				        html += '<tr>';
						html +=	'<td>';
						html +=	'<div style="font-size: 34px;color:#5596E6;float:right;"><i class="icon ion-ios-box-outline"></i></div>';
						html += '</td>';
						html += '<td style="text-align:left;padding-left:20px">';
						html +=	'<div style="display: inline-block; vertical-align: middle;">';
						html += '<p style="font-weight:500;">ADDED BY <span style="color:#5596E6">' + txs[i].newOwner +'</span></p>';
						html += '<p style="">' + txs[i].vDate +'</p>';
						html += '<p style="">' + txs[i].location +'</p>';
						html +=	'</div>';
						html += '</td>';
						html += '</tr>';
			        }
			        else if(txs[i].transactionType == "CONFIRM"){
			          //litem = {avatar:"ion-ios-barcode-outline", date: data.batch.vDate, location: data.batch.location, desc:"PICKED UP BY ", owner:data.batch.owner};
			        	html += '<tr>';
						html +=	'<td>';
						html +=	'<div style="font-size: 34px;color:#5596E6;float:right;"><i class="ion-ios-barcode-outline"></i></div>';
						html += '</td>';
						html += '<td style="text-align:left;padding-left:20px">';
						html +=	'<div style="display: inline-block; vertical-align: middle;">';
						html += '<p style="font-weight:500;">PICKED UP BY <span style="color:#5596E6">' + txs[i].newOwner +'</span></p>';
						html += '<p style="">' + txs[i].vDate +'</p>';
						html += '<p style="">' + txs[i].location +'</p>';
						html +=	'</div>';
						html += '</td>';
						html += '</tr>';
			        }
			        else if(txs[i].transactionType == "TRANSFER"){
			          //litem = {avatar:"ion-ios-shuffle", date: data.batch.vDate, location: data.batch.location, desc:"DELIVERED TO ", owner:data.batch.owner};
			        	html += '<tr>';
						html +=	'<td>';
						html +=	'<div style="font-size: 34px;color:#5596E6;float:right;"><i class="ion-ios-shuffle"></i></div>';
						html += '</td>';
						html += '<td style="text-align:left;padding-left:20px">';
						html +=	'<div style="display: inline-block; vertical-align: middle;">';
						html += '<p style="font-weight:500;">IN TRANSIT TO <span style="color:#5596E6">' + txs[i].newOwner +'</span></p>';
						html += '<p style="">' + txs[i].vDate +'</p>';
						html += '<p style="">' + txs[i].location +'</p>';
						html +=	'</div>';
						html += '</td>';
						html += '</tr>';
			        }
			        else if(txs[i].transactionType == "CHANGE STATUS"){
			          //litem = {transactionType:data.batch.transactionType, avatar:"ion-ios-bolt-outline", date: data.batch.vDate, location: data.batch.location, desc:"QUALITY IMPACTED DUE TO HIGH T°", owner:""};
			        	html += '<tr>';
						html +=	'<td>';
						html +=	'<div style="font-size: 34px;color:#ef473a;float:right;"><i class="ion-ios-bolt-outline"></i></div>';
						html += '</td>';
						html += '<td style="text-align:left;padding-left:20px">';
						html +=	'<div style="display: inline-block; vertical-align: middle;">';
						html += '<p style="font-weight:500;color:#ef473a">CURRENT STATUS: ' + data.item.status +'</p>';
						html += '<p style="">' + txs[i].vDate +'</p>';
						html += '<p style="">' + txs[i].location +'</p>';
						html +=	'</div>';
						html += '</td>';
						html += '</tr>';
			        }

				}

				$("#itemDetailsBody").html(html);
			}
			else if(data.msg === 'chainstats'){
				if(data.blockstats.transactions)
				{
					var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
					//$("#blockdate").html('<span style="color:#fff">LAST BLOCK</span>&nbsp;&nbsp;' + e + ' UTC');
					var temp = { 
									id: data.blockstats.height, 
									blockstats: data.blockstats
								};
					new_block(temp);
				}									//send to blockchain.js
			}
			else if(data.msg === 'itemCreated'){
				$("#notificationPanel").animate({width:'toggle'});
				$('#spinner').hide();
				$('#tagWrapper').show();
				console.log(data.Id);
				$('#itemTag').qrcode(data.Id);
			}
			else if(data.msg === 'itemTransferred'){
				alert('Transfer completed!');
			}
			else if(data.msg === 'itemConfirmed'){
				alert('Transfer confirmed!');
			}
			else if(data.msg === 'itemChangedStatus'){
				alert('Change status confirmed!');
			}
			else if(data.msg === 'reset'){						
				if(user.username && bag.session.user_role && bag.session.user_role.toUpperCase() === "manufacturer".toUpperCase()) {
					$('#spinner2').show();
					$('#openTrades').hide();
					ws.send(JSON.stringify({type: "getAllItems", v: 2}));
				}
			}
		}
		catch(e){
			console.log('ERROR', e);
			//ws.close();
		}
	}

	function onError(evt){
		console.log('ERROR ', evt);
		if(!connected && bag.e == null){											//don't overwrite an error message
			$("#errorName").html("Warning");
			$("#errorNoticeText").html("Waiting on the node server to open up so we can talk to the blockchain. ");
			$("#errorNoticeText").append("This app is likely still starting up. ");
			$("#errorNoticeText").append("Check the server logs if this message does not go away in 1 minute. ");
			$("#errorNotificationPanel").fadeIn();
		}
	}

	function sendMessage(message){
		console.log("SENT: " + message);
		ws.send(message);
	}
}


// =================================================================================
//	UI Building
// =================================================================================
function build_Items(items, panelDesc){
	var html = '';
	bag.items = items;					
	// If no panel is given, assume this is the trade panel
	if(!panelDesc) {
		panelDesc = panels[0];
	}
	
	for(var i in items){
		console.log('!', items[i].id);
		
		if(excluded(items[i].id, filter)) {
			
			// Create a row for each item
			html += '<tr>';
			html +=		'<td>' + items[i].id + '</td>';
			html +=		'<td>' + items[i].barcode + '</td>';
			html +=		'<td>' + items[i].currentOwner + '</td>';
			html +=		'<td>' + items[i].manufacturer + '</td>';
			html +=		'<td>' + items[i].status + '</td>';
			html += '</tr>';
			
		}
	}

	// Placeholder for an empty table
	if(html == '' && panelDesc.name === "dashboard") html = '<tr><td>Nothing here...</td><td></td><td></td><td></td><td></td><td></td></tr>';

	$(panelDesc.tableID).html(html);
}

// =================================================================================
//	Helpers for the filtering of trades
// =================================================================================
var filter = {};

/**
 * Describes all the fields that describe a trade.  Used to create
 * a filter that can be used to control which trades get shown in the
 * table.
 * @type {string[]}
 */
var names = [
	"itemId"
];

/**
 * Parses the filter forms in the UI into an object for filtering
 * which trades are displayed in the table.
 * @param panelDesc An object describing which panel
 */
function processFilterForm(panelDesc) {
	"use strict";

	var form = document.forms[panelDesc.formID];

	console.log("Processing filter form");

	// Reset the filter parameters
	filter = {};

	// Build the filter based on the form inputs
	for (var i in names) {

		var name = names[i];
		var id = panelDesc.filterPrefix + name;
		if(form[id] && form[id].value !== "") {
			filter[name] = form[id].value;
		}
	}

	console.log("New filter parameters: " + JSON.stringify(filter));
	console.log("Rebuilding list");
	build_Batches(bag.items, panelDesc);
}

/**
 * Validates a trade object against a given set of filters.
 * @param paper The object to be validated.
 * @param owner The specific owner in the trade object that you want to validate.
 * @param filter The filter object to validate the trade against.
 * @returns {boolean} True if the trade is valid according to the filter, false otherwise.
 */
function excluded(batch, filter) {
	"use strict";

	if(filter.batchId && filter.batchId!== "" && batch.toUpperCase().indexOf(filter.batchId.toUpperCase()) == -1 ) return false;

	// Must be a valid trade if we reach this point
	return true;
}


