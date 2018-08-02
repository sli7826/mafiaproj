const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 200000);

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

var Datastore = require('nedb'), 
    db = new Datastore({ filename: '.data/datafile', autoload: true });

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready',() => {
  //console.log('I\'m Online\nI\'m Online');
});

var x=[];
var voteCounts=[];
var whoVoted=[];
var gameStarted=false;
var mafia;
var gameTime=0;
var night = false;
const prefix = 'm.';
var killed;
client.on('message', message => 
          {
  if (message.author === client.user) return;
  if (message.content.startsWith(prefix + 'ping')) 
  {
    message.channel.send('pong');
  }
  if (message.content.startsWith(prefix + 'play')&&!gameStarted) 
  {
    var server = message.guild;
    var name = message.author;
      if(x.indexOf(name) == -1)
      {
        x.push(name);
        voteCounts.push(0);



        if(client.channels.find("name","mafia")==null)
        {
          server.createChannel('mafia', 'text', [
            {
              id: server.id,
              deny: ['MANAGE_MESSAGES','CREATE_INSTANT_INVITE','MANAGE_CHANNELS','SEND_MESSAGES','SEND_TTS_MESSAGES','MANAGE_MESSAGES','EMBED_LINKS','ATTACH_FILES','MANAGE_ROLES','MANAGE_WEBHOOKS','USE_EXTERNAL_EMOJIS','MENTION_EVERYONE'],
              allow: ['ADD_REACTIONS','VIEW_CHANNEL','READ_MESSAGE_HISTORY']
            },
            {
              id: name,
              deny: ['MANAGE_MESSAGES','CREATE_INSTANT_INVITE','MANAGE_CHANNELS','SEND_MESSAGES','SEND_TTS_MESSAGES','MANAGE_MESSAGES','EMBED_LINKS','ATTACH_FILES','MANAGE_ROLES','MANAGE_WEBHOOKS','USE_EXTERNAL_EMOJIS','MENTION_EVERYONE'],
              allow: ['ADD_REACTIONS','VIEW_CHANNEL','READ_MESSAGE_HISTORY','SEND_MESSAGES','EMBED_LINKS','ATTACH_FILES','USE_EXTERNAL_EMOJIS']
          }]);
          server.createChannel('mafiaVC', 'voice', [
            {
              id: server.id,
              deny: ['CREATE_INSTANT_INVITE','MANAGE_CHANNELS','SPEAK','MUTE_MEMBERS','DEAFEN_MEMBERS','MOVE_MEMBERS','USE_VAD','MANAGE_ROLES','MANAGE_WEBHOOKS'],
              allow: ['VIEW_CHANNEL','CONNECT']
            },
            {
              id: name,
              deny: ['CREATE_INSTANT_INVITE','MANAGE_CHANNELS','SPEAK','MUTE_MEMBERS','DEAFEN_MEMBERS','MOVE_MEMBERS','USE_VAD','MANAGE_ROLES','MANAGE_WEBHOOKS'],
              allow: ['VIEW_CHANNEL','CONNECT','SPEAK','USE_VAD']
          }]);
          message.channel.send(name+" has join the game, waiting for more players...");
        }
        else
        {
          client.channels.find("name","mafia").overwritePermissions(name,{
              SEND_MESSAGES:true,
              EMBED_LINKS:true,
              ATTACH_FILES:true,
              USE_EXTERNAL_EMOJIS:true,
              ADD_REACTIONS:true
            });
          client.channels.find("name","mafiaVC").overwritePermissions(name,{
              SPEAK:true,
              USE_VAD:true
            });
          message.channel.send(name+" has join the game, waiting for more players...");
        }


      }
      
      
      if(x.length>=3)
      {
        message.channel.send("Players done, Time till game closed: 10 seconds");
        setTimeout(function(){ client.channels.find("name","mafia").send("Game Closed : Players in game "+ x.join() );
                               client.channels.find("name","mafia").send("You have 3 mins to discuss before night falls.\n Use m.check to see which number corresponds to which player and use m.vote <playerNumber> to vote for them.");
                               gameStarted=true;
                              mafia=x[getRandomInt(x.length)];
                              mafia.send("You are the mafia! You will have one kill at night.");
                              for(var i in x)
                              {
                                if(x[i]!=mafia)
                                  x[i].send("You are a villager and your goal is to find the mafia before they kill you.");
                              }
                             }, 10000);
        
        var timeController=setInterval(function()
        {
          gameTime++;
          if(gameTime>11){
            if(gameTime==180){
              for(var i in x){
                client.channels.find("name","mafia").overwritePermissions(x[i],{
                  CREATE_INSTANT_INVITE:false,
                  MANAGE_CHANNELS:false,
                  SEND_MESSAGES:false,
                  SEND_TTS_MESSAGES:false,
                  MANAGE_MESSAGES:false,
                  MANAGE_ROLES :false,
                  MANAGE_WEBHOOKS :false
                });
              }
              client.channels.find("name","mafia").send("It is currently nighttime.");
              night=true;
              mafia.send("Use m.kill <playerNumber> to kill a player or say nothing to not kill this round");
            }
            if(gameTime%240==0){
             for(var i in x){
                client.channels.find("name","mafia").overwritePermissions(x[i],{
                  CREATE_INSTANT_INVITE:false,
                  MANAGE_CHANNELS:false,
                  SEND_MESSAGES:true,
                  SEND_TTS_MESSAGES:false,
                  MANAGE_MESSAGES:false,
                  MANAGE_ROLES :false,
                  MANAGE_WEBHOOKS :false
                });
              }
              for(var i in voteCounts){
                 voteCounts[i]=0;
               }
               whoVoted=[];
               night=false;
                client.channels.find("name","mafia").send("It is currently daytime.");
               client.channels.find("name","mafia").send(killed+"was killed.");
            }
            if((gameTime-180)%240==0&&gameTime>180){
              for(var i in x){
                client.channels.find("name","mafia").overwritePermissions(x[i],{
                  CREATE_INSTANT_INVITE:false,
                  MANAGE_CHANNELS:false,
                  SEND_MESSAGES:false,
                  SEND_TTS_MESSAGES:false,
                  MANAGE_MESSAGES:false,
                  MANAGE_ROLES :false,
                  MANAGE_WEBHOOKS :false
                });
              }
              client.channels.find("name","mafia").send("It is currently nighttime.");
                night=true;
                mafia.send("Use m.kill <playerNumber> to kill a player or say nothing to not kill this round");
            }
            if(x.length==2 && x.indexOf(mafia)!=-1){
              clearTimeout(timeController);
              client.channels.find("name","mafia").send("Mafia wins! "+mafia+ " was the mafia!");
            }
            if(x.indexOf(mafia)==-1){
              clearTimeout(timeController);
              client.channels.find("name","mafia").send("Town wins! "+mafia+ " was the mafia!");
            }
          }
        },1000);
        
      }
  }
  
  if (message.content.startsWith(prefix + 'delete')) {
    x=[];
    voteCounts=[];
    whoVoted=[];
    night = false;
    gameStarted=false;
    mafia=null;
    gameTime=0;
    if(client.channels.find("name","mafiaVC")!=null){
      client.channels.find("name","mafiaVC").delete();
      client.channels.find("name","mafia").delete();
    }
  }
  
  if (message.content.startsWith(prefix + 'debug')) {
    message.channel.send('Players= '+x+' gameState= '+gameStarted+' gameTime= '+gameTime+' mafia= '+mafia);
  }
  
  if (message.content.startsWith(prefix + 'check')&&gameStarted) {
    var tempStr="";
    for(var i in x){
      tempStr+=i+". "+x[i]+"\n";
    }
    message.channel.send('Players = '+tempStr);
  }
  
  if (message.content.startsWith(prefix + 'vote')&&gameStarted&&!night) {
    var checkStr=message.content.split(" ");
    for(var i in x){
                client.channels.find("name","mafia").overwritePermissions(x[i],{
                  CREATE_INSTANT_INVITE:false,
                  MANAGE_CHANNELS:false,
                  SEND_MESSAGES:false,
                  SEND_TTS_MESSAGES:false,
                  MANAGE_MESSAGES:false,
                  MANAGE_ROLES :false,
                  MANAGE_WEBHOOKS :false
                });
    }
    if(whoVoted.indexOf(message.author)==-1){
      if(Number(checkStr[1])!=null&Number(checkStr[1])<x.length){
        voteCounts[Number(checkStr[1])]=voteCounts[Number(checkStr[1])]+1;
        client.channels.find("name","mafia").send(x[Number(checkStr[1])]+" was voted on by "+message.author+" and currrently has "+voteCounts[Number(checkStr[1])]+" aganist him/her.");
        whoVoted.push(message.author);
        if(voteCounts[Number(checkStr[1])]>x.length/2){
          killed=x[Number(checkStr[1])];
          x.splice(Number(checkStr[1]),1);
          voteCounts.splice(Number(checkStr[1]),1);
          client.channels.find("name","mafia").send(killed+"was killed.");
          gameTime=179;
        }
      }
        for(var i in x){
                  client.channels.find("name","mafia").overwritePermissions(x[i],{
                    CREATE_INSTANT_INVITE:false,
                    MANAGE_CHANNELS:false,
                    SEND_MESSAGES:true,
                    SEND_TTS_MESSAGES:false,
                    MANAGE_MESSAGES:false,
                    MANAGE_ROLES :false,
                    MANAGE_WEBHOOKS :false
                  });
        }
    }else{
      client.channels.find("name","mafia").send("You can only vote once per round "+message.author);
    }
  }
  
  if (message.content.startsWith(prefix + 'kill')&&gameStarted&&night) {
    if(message.author==mafia){
      var checkStr=message.content.split(" ");
      if(Number(checkStr[1])!=null&Number(checkStr[1])<x.length){
        killed=x[Number(checkStr[1])];
        x.splice(Number(checkStr[1]),1);
        voteCounts.splice(Number(checkStr[1]),1);
        night=false;
        gameTime=239;
      }
    }
  }
  
});

client.login(process.env.TOKEN);