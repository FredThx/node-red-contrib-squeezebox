var squeezenode  = require('squeezenode');

module.exports = function(RED) {
	
	// squeezebox-server
    function  squeezebox_server(config){ 
        RED.nodes.createNode(this, config); 
		this.host = config.host;
		this.port = config.port;
		this.server = null;
		var node = this;
		
		this.initialize_squeezebox_connection = function(){
			if (node.server){
				//node.log("SqueezeBox Server already connected.");
			} else {
				node.log("Configuring connection to squeezebox Server at " + node.host + ":" + node.port);
				node.server = new squeezenode(node.host, node.port);
			}
			return node.server;
		};
		this.initialize_squeezebox_connection();
		
		this.get_player = function(squeezebox_out_node){
			node.initialize_squeezebox_connection();
			node.server.getPlayers( function(reply){
				var found = false;
				for (var id in reply.result){
					if (reply.result[id].name == squeezebox_out_node.player_name){
						found = true;
						squeezebox_out_node.player = node.server.players[reply.result[id].playerid];
						//node.log("Player " + squeezebox_out_node.player_name + " found : " + squeezebox_out_node.player.playerId);
						squeezebox_out_node.status({fill:"green", shape:"dot", text:"connected"});
					}
				}
				if (!found){
					node.log("Player " + squeezebox_out_node.player_name + " not found!");
					squeezebox_out_node.status({fill:"red", shape:"ring", text:"disconnected"});
				}
			});
		};
    }
    RED.nodes.registerType("squeezebox-server" ,squeezebox_server); 
	
	// squeezebox-out
    function squeezebox_out(config) {
        RED.nodes.createNode(this,config);
        this.squeezebox_server_node = RED.nodes.getNode(config.squeezebox_server);
		this.player_name = config.player_name;
		this.command = config.command;
		/* this.log("New squeezebox-out : " + 
					this.player_name + 
					"@" + this.squeezebox_server_node.host + 
					":" + this.squeezebox_server_node.port + 
					" - Cde : " + this.command); */
		this.status({});
		this.squeezebox_server_node.get_player(this);
		var node = this;
        
		this.on('input', function(msg) {
			//node.log("squeezebox-out input : " + msg.payload);
			node.squeezebox_server_node.get_player(node);
			if (node.player){
				var command;
				if (node.command){
					command = node.command;
				} else {
					command = msg.payload;
				}
				if (typeof(command) === 'string') {
					command = command.split(',');
				}
				node.player.request(node.player.playerId, command, function(reply){
							msg.payload = reply;
							node.send(msg);
						});
			} else {
				msg.payload = "SqueezeBox disconnected";
				node.send(msg);
			}
        });
		
		//this.squeezebox_server_node.initialize_squeezebox_connection();
		
    }
    RED.nodes.registerType("squeezebox-out",squeezebox_out);
}

