const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();

const token = JSON.parse(fs.readFileSync('config.js'));
const PREFIX = "";
const defaultLife = 40;

let mtgdata = JSON.parse(fs.readFileSync('mtgCurrent.json'));
console.log(mtgdata);


bot.on('ready', () =>{
	console.log('ShaunJSBot is online!');
})

bot.on('message', message=>{

	let args = message.content.substring(PREFIX.length).split(" ");
	let nickname = message.member.nickname;
	let userId = message.author.id;
	let target = userId;
	let amount = 1;
	let lifeToSet = defaultLife;

	if (message.channel.name === "basement")
	{
		switch(args[0])
		{
			case 'mtg.join':
				if (!isUserInGame(userId))
				{
					lifeToSet = defaultLife;
					if (args[1] != undefined) lifeToSet = args[1];
					if (nickname === null) nickname = message.author.username;
					mtgdata[userId] = {
						life: parseInt(lifeToSet),
						name: nickname
					};
					updateLifeNick();
					//message.channel.send('Added ' + nickname + ' to the game with ' + lifeToSet + ' life! GLHF');
					message.react('✅');
					updateJsonFile();
				}
				else
				{
					message.channel.send('A user with your discord ID is already being tracked');
				}
			break;


			case 'mtg.clear':
				restoreAllNicks();
				mtgdata = {};
				message.channel.send('All data reset, hopefully all nicks restored lol');
				updateJsonFile();
			break;

			case 'mtg.leave':
				message.react('👋');
				restoreNick();
				delete mtgdata[userId];
				updateJsonFile();
			break;

			case 'mtg.help':
				message.channel.send('The following commands exist:\n\n**mtg.join [life]** - join the game with a set amount of life (default 40)\n**mtg.clear** - restores all nicknames and resets all data\n**mtg.leave** - restores your nickname and removes you from the game');
				message.channel.send('\nWhen in the game you can use +, - and = to add/subtract and set life totals respectively.\nThe format is [+/-/=] [amount] [player]\n eg: "+ 5 Shaun". (Spaces matter, case should not.)\namount defaults to 1, player defaults to self, so for example just typing "+" adds 1 to your own total\nuse "all" or "*" to target all players. eg: "= 40 all"');
			break;

			case '+':
			case '-':
			case '=':
				target = userId;
				amount = 1;
				
				//default amount (amout must be set for =)
				if (args[1] === undefined) 
				{
					if (args[0] === '=')
					{
						message.react('❌');
						break;
					}
				} else amount = args[1];

				//Apply to everyone
				if (args[2] === 'all' || args[2] === '*')
				{
					for (var _player in mtgdata)
					{
						var _result = parseInt(mtgdata[_player].life);
						if (args[0] === '+')  _result += parseInt(amount);
						if (args[0] === '-')  _result -= parseInt(amount);
						if (args[0] === '=')  _result = parseInt(amount);
						if (!isNaN(_result)) mtgdata[_player].life = _result;
						console.log(_result);
					}
					updateAllNicks();
					if (isNaN(_result))
					{
						message.react('❌');	
					}
					else message.react('✅');
					return updateJsonFile();
				}
				else //Apply to single target
				{
					if (args[2] != undefined)
					{
						target = findUserID(args[2])
						if (target === -1) return message.channel.send('Can\'t find \'' + args[2] + '\' in the current game :(');
					} 
					
					if (mtgdata[target] != undefined)
					{
						var _result = parseInt(mtgdata[target].life);
						if (args[0] === '+')  _result += parseInt(amount);
						if (args[0] === '-')  _result -= parseInt(amount);
						if (args[0] === '=')  _result = parseInt(amount);
						console.log(_result);
						if (!isNaN(_result))
						{
							mtgdata[target].life = _result;
							message.react('✅');
							updateAllNicks();
							updateJsonFile();
						} else message.react('❌');	
					}
					else
					{
						message.channel.send('Can\'t find you in the current game :(');
					}
				}
			break;
		}



		function updateLifeNick()
		{
			if (!message.guild.me.hasPermission('MANAGE_NICKNAMES') || (message.author.id === message.guild.ownerID))
			{
				message.channel.send('I don\'t have permission to change your nickname!');
			}
			else
			{	
				message.member.setNickname(String(mtgdata[userId].name) + " ["+String(mtgdata[userId].life)+"]");
			}
		}


		function restoreNick()
		{
			if (!message.guild.me.hasPermission('MANAGE_NICKNAMES') || (message.author.id === message.guild.ownerID))
			{
				message.channel.send('I don\'t have permission to change your nickname!');
			}
			else
			{	
				message.member.setNickname(String(mtgdata[userId].name));
			}
		}

		function updateAllNicks()
		{
			for (var _player in mtgdata)
			{
				if (_player === message.guild.ownerID)
				{
					message.channel.send('I don\'t have permission to change your nickname!');
				} 
				else
				{
					message.guild.members.cache.get(_player).setNickname(String(mtgdata[_player].name) + " ["+String(mtgdata[_player].life)+"]");
				}
			}
		}

		function restoreAllNicks()
		{
			for (var _player in mtgdata)
			{
				if (_player === message.guild.ownerID)
				{
					message.channel.send('I don\'t have permission to change your nickname!');
				} 
				else
				{
					message.guild.members.cache.get(_player).setNickname(String(mtgdata[_player].name));
				}
			}
		}

		function updateJsonFile()
		{
			fs.writeFileSync('mtgCurrent.json', JSON.stringify(mtgdata, null, 2));
			console.log(mtgdata);
		}

		function findUserID(_nick)
		{
			for (var property in mtgdata)
			{
				if (mtgdata[property].name.toLowerCase() === _nick.toLowerCase()) return property;
			}
			return -1;
		}

		function isUserInGame(_id)
		{
			for (var _ids in mtgdata)
			{
				if (_ids === _id) return true;
			}
			return false;
		}

	}

})

function sanitise(x) {
  if (isNaN(x)) {
    return NaN;
  }
  return x;
}

bot.login(token.token);

//check user exists in data before doing mtg.leave
//check user exists before allowing them to join twice
