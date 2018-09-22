/*
  Game seems to be written only to work in a single channel so far,
  Priority seems to be to get the game working then refactor for use in multiple channels
  *warning* Refactoring in this way is going to be stupid, you'll have to re-write a lot.
  
  note: using .find is _usually_ pretty slow, especially if you have to do it a bunch
  wherever possible you should use .find once and store the result in a variable to
  use later to save on expensive .find calls
  
  also COMMENT MORE, stick functions and declarations in groups. code that is organized and easier to read
  and navigate makes life a LOT easier for everyone involved.
  
  note on commits: The point of a source control system is to allow you to go through and see what changes
  were made, why they were made, and reverse them if needed. When you commit the way you seem to. you don't have
  any commit messages or the like, this somewhat defeats the point of having/using the source control system.
  if possible you should properly commit your work with propper messages, especially if you are gonna
  have more than one person working on the project.
*/

const http = require('http');
const express = require('express');
const app = express();
const Discord = require('discord.js');
const Datastore = require('nedb');


/*Global declaration*/

var db = new Datastore({ filename: '.data/datafile', autoload: true });
const client = new Discord.Client();

var currentGuildVars=null;
var serversObj=[];
var serversList=[];
var waitingPlayersList=[];
var playerList=[];
var mafiaChannel=null;
var gameState=-1;
var gameTime=0;
var logicGameTime=0;
var defensePlayer=null;
var guiltCount=0;
var timeController=null;
var findChannelString=null;
var numPlayers = 5;
var testTimer = null;
var activeGames = [];


/*Role constants + prefix constant*/
const MAFIA = 0;
const DETECTIVE = 1;
const TOWN = 2;
const DOCTOR = 3;
const NOGAME = -1;
const DAY = 0;
const NIGHT = 1;
const DEFENSE = 2;
const VOTING = 3;
const GAMESTARTING = 4;
const ENDGAME = 5;

const DAYLENGTH = 180;
const NIGHTLENGTH = 60;
const DEFENSELENGTH = 30;
const VOTINGLENGTH = 30;

const prefix = 'm.';

/*Helper functions*/

//get a random int from 0 to max. Doesn't include max.
function getRandomInt(max)
{
  return Math.floor(Math.random() * Math.floor(max));
}

//makes vars into objs
function ServerObj(id)
{
  return {
    id: id,
    waitingPlayersList: waitingPlayersList,
    playerList: playerList,
    mafiaChannel: mafiaChannel,
    gameState: gameState,
    gameTime: gameTime,
    logicGameTime: logicGameTime,
    defensePlayer: defensePlayer,
    guiltCount: guiltCount,
    timeController: timeController,
    findChannelString: findChannelString,
    testTimer: testTimer
  };
}

//update the data
function updateData(id,varName,amt)
{
  var found = false;
  db.find({ _id: id }, function (err, docs) {
    if(docs.length==0)
      found=true;
  });
  if(found){
    var foundData;
    db.find({ _id: id }, function (err, docs) {
    if(docs.length==0)
      foundData=docs;
    });
    foundData[0][varName]=amt;
  }
}

//converts the given amount of seconds to minutes and seconds.
function convertSecToMinSec(sec)
{
  if(sec < 60)
  {
    return sec + " sec";
  }
  var minutes = Math.floor(sec / 60);
  sec -= minutes * 60;
  return minutes + " min and " + sec + " sec";
}

//given a array and a item. Put the item in a random position in the array.
function placeItemRandomlyInArray(array, item)
{
  if(array.length == 0)
  {
    array.push(item);
  }
  else
  { 
    var ranNum = getRandomInt(array.length + 1);
    array.splice(ranNum,0,item);
  }
}

//given a string of a id returns the player obj with that name. Return null if player isn't found.
function findPlayerWithId(id)
{
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].name.id == id)
    {
      return currentGuildVars.playerList[i];
    }
  }
  return null;
}

// function getDetective(players)
// {
//   //looks through a array of player and finds the detective.
//   //if there is no detective then return null.
//   for(var i in players)
//   {
//     if(i.role == DETECTIVE)
//     {
//       return i;
//     }
//   }
//   return null;
// }

//send instrictions on the commands
function sendInstructions(name)
{
  var tempText = "Game Commands: \n" 
  + "m.play - join a game \n"
  + "m.quit - quit the game \n"
  + "m.check - checks the players playing the game (only useable ingame) \n"
  + "m.getrules - send instructions to user via pm \n"
  + "m.time - gets the current time (only useable ingame) \n";
  name.send(tempText);
}

//assigns roles to players and adds Player objects to the playerList array (players come from the waitingPlayersList array
function assignRoles()
{
//   var numOfDoc = 1;
//   var numOfDete = 1;
//   var numOfMafia = Math.floor((waitingPlayersList.length - 2) / 3);
//   if(numOfMafia < 2)
//     numOfDoc = 0;
//   //randomly selects roles for everyone.
//   while(numOfDoc >= 1)
//   {
//     var randNum = getRandomInt(waitingPlayersList.length);
//     console.log("before:\n"+waitingPlayersList[0]);
    
//     playerList.push(new Player(waitingPlayersList[randNum], DOCTOR));
//     waitingPlayersList.splice(randNum, 1);
    
//     console.log(playerList[playerList.length-1]);
//     numOfDoc--;
//   }
//   while(numOfDete >= 1)
//   {
//     //something like?
//     var randNum = getRandomInt(waitingPlayersList.length);
//     console.log("before:\n"+waitingPlayersList[0]);//undefined
//     playerList.push(new Player(waitingPlayersList[randNum], DETECTIVE));
//     waitingPlayersList.splice(randNum, 1);
//     console.log(playerList[playerList.length-1]);
//     numOfDete--;
//   }
//   while(numOfMafia >= 1)
//   {
//     var randNum = getRandomInt(waitingPlayersList.length);
//     playerList.push(new Player(waitingPlayersList.splice(waitingPlayersList[randNum], 1), MAFIA));
//     waitingPlayersList.splice(randNum, 1);
//     console.log(playerList[playerList.length-1]);
//     numOfMafia--;
//   }
  
//   //for the rest of the players make them town people.
//   while(waitingPlayersList.length > 0)
//   {
//     var randNum = getRandomInt(waitingPlayersList.length);
//     playerList.push(new Player(waitingPlayersList.splice(waitingPlayersList[randNum], 1), TOWN));
//     waitingPlayersList.splice(randNum, 1);
//     console.log(playerList[playerList.length-1]);
//   }
  var numOfDoc = 1;
  var numOfDete = 1;
  var numOfMafia = Math.floor((currentGuildVars.waitingPlayersList.length - 2) / 3);
  if(numOfMafia < 2)
    numOfDoc = 0;
  //Other options for less then 5 players
  if(currentGuildVars.waitingPlayersList.length < 5)
  {
    numOfMafia = 1;
    numOfDoc = 0;
    numOfDete = 1;
  }
  
  
  var indexes = [];
  for(var i = 0; i < currentGuildVars.waitingPlayersList.length; i++)
  {
    indexes.push(i);
  }
  
  while(numOfDoc >= 1)
  {
    var randNum = getRandomInt(indexes.length);
    //console.log("before:\n"+waitingPlayersList[0]);
    placeItemRandomlyInArray(currentGuildVars.playerList, new Player(currentGuildVars.waitingPlayersList[indexes[randNum]], DOCTOR));
    indexes.splice(randNum, 1);
    
    //console.log(playerList[playerList.length-1]);
    numOfDoc--;
  }
  
  while(numOfDete >= 1)
  {
    //something like?
    var randNum = getRandomInt(indexes.length);
    //console.log("before:\n"+waitingPlayersList[0]);//undefined
    placeItemRandomlyInArray(currentGuildVars.playerList, new Player(currentGuildVars.waitingPlayersList[indexes[randNum]], DETECTIVE));
    indexes.splice(randNum, 1);
    //console.log(playerList[playerList.length-1]);
    numOfDete--;
  }
  while(numOfMafia >= 1)
  {
    var randNum = getRandomInt(indexes.length);
    placeItemRandomlyInArray(currentGuildVars.playerList, new Player(currentGuildVars.waitingPlayersList[indexes[randNum]], MAFIA));
    indexes.splice(randNum, 1);
    //console.log(playerList[playerList.length-1]);
    numOfMafia--;
  }
  while(indexes.length > 0)
  {
    var randNum = getRandomInt(indexes.length);
    placeItemRandomlyInArray(currentGuildVars.playerList, new Player(currentGuildVars.waitingPlayersList[indexes[randNum]], TOWN));
    indexes.splice(randNum, 1);
    //console.log(playerList[playerList.length-1]);
  }
}

//checks to see if the game has ended or not. return true for yes, false for no.
function checkWin()
{
  var aliveMafia = 0;
  var aliveInnocent = 0;
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].role == MAFIA && currentGuildVars.playerList[i].alive)
    {
      aliveMafia++;
    }
    if(currentGuildVars.playerList[i].role != MAFIA && currentGuildVars.playerList[i].alive)
    {
      aliveInnocent++;
    }
  }
  if(aliveMafia == 0)
  {
    //innocent wins.
    currentGuildVars.mafiaChannel.send("Town Wins!");
    currentGuildVars.mafiaChannel.send("Number Of Mafia Left: " + aliveMafia + " Number Of Town Left: " + aliveInnocent);
    return true;
  }
  if(aliveMafia >= aliveInnocent)
  {
    //mafia wins.
    currentGuildVars.mafiaChannel.send("Maifa Wins!");
    currentGuildVars.mafiaChannel.send("Number Of Mafia Left: " + aliveMafia + " Number Of Town Left: " + aliveInnocent);
    return true;
  }
  return false;
}

//returns a array of all the mafia players that are still alive.
function getAllMafiaPlayers()
{
  var mafiaP = [];
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    var tempCurrentPlayer = currentGuildVars.playerList[i];
    if(tempCurrentPlayer.role == MAFIA && tempCurrentPlayer.alive)
    {
      mafiaP.push(tempCurrentPlayer);
    }
  }
  return mafiaP;
}

//returns an array of all alive players
function getAllAlivePlayers()
{
  var mafiaP = [];
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].alive)
    {
      mafiaP.push(currentGuildVars.playerList[i]);
    }
  }
  return mafiaP;
}

//returns a array of all the mafia players names that are still alive.
function getAllMafiaPlayersNames()
{
  var mafiaP = [];
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].role == MAFIA && currentGuildVars.playerList[i].alive)
    {
      mafiaP.push(currentGuildVars.playerList[i].name);
    }
  }
  return mafiaP;
}

function getMafiaCount()
{
  var count = 0;
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].role == MAFIA && currentGuildVars.playerList[i].alive)
    {
      count++;
    }
  }
  return count;
}

//returns the player object of the person whose name is the parameter passed in.
function getPlayerOf(name)
{
  for(var i = 0; i < serversObj.length; i++)
  {
    var currentGuild = serversObj[i];
    for(var j = 0; j < currentGuild.playerList.length; j++)
    {
      if(currentGuild.playerList[j].name == name)
        return currentGuild.playerList[j];
    }
  }
  return null;
}

//Returns the player that was voted to be killed by the mafia.
//If there was a tie in the vote a random player is chosen from the ties.
//If there was no vote then return null.
function getKilledPlayer()
{
  //This is the list of players that has been voted to kill.
  var listOfPlayersVoted = [];
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    var currPlayer = currentGuildVars.playerList[i];
    //if the current player is alive and is a mafia. find out who the mafia voted.
    if(currPlayer.alive && currPlayer.role == MAFIA)
    {
      //if the vote isn't null. Add one to the voted player's kill count, push the voted player into a array, and set the mafia's kill back to null.
      if(currPlayer.kill != null)
      {
        currPlayer.kill.voteKill++;
        listOfPlayersVoted.push(currPlayer.kill);
        currPlayer.kill = null;
      }
    }
  }
  //todo:with the list of votekill players return one that is killed.
  if(listOfPlayersVoted.length == 0)
    return null;
  return listOfPlayersVoted[getRandomInt(listOfPlayersVoted.length)];
}

//gets the person that the doctor healed.
//If the doctor didn't heal anyone return null.
function getHealedPlayer()
{
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].alive && currentGuildVars.playerList[i].role == DOCTOR)
    {
      if(currentGuildVars.playerList[i].healed == null)
      {
        currentGuildVars.playerList[i].healedLastRound = null;
        return null;
      }
      var healedPerson = currentGuildVars.playerList[i].healed;
      currentGuildVars.playerList[i].healedLastRound = healedPerson;
      currentGuildVars.playerList[i].healed = null;
      return healedPerson;
    }
  }
  return null;
}

//returns the doctor if there is one.
function getDoctor()
{
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].alive && currentGuildVars.playerList[i].role == DOCTOR)
    {
      return currentGuildVars.playerList[i];
    }
  }
  return null;
}

//gets the person that was investigated.
//return null if no one was investigated.
function tellTheDetectiveWhoHeSearched()
{
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].alive && currentGuildVars.playerList[i].role == DETECTIVE)
    {
      var investigatedPlayer = currentGuildVars.playerList[i].searched;
      currentGuildVars.playerList[i].searched = null;
      if(investigatedPlayer != null)
      {
        if(investigatedPlayer.role == MAFIA)
          currentGuildVars.playerList[i].name.send("The person you investigated was a mafia.");
        else
          currentGuildVars.playerList[i].name.send("The person you investigated was not a mafia.");
      }
    }
  }
}

//searched through all the players in all servers. If the player is in game return true. False otherwise.
function isPlayerInGame(name)
{
  for(var i = 0; i < serversObj.length; i++)
  {
    var currentGuild = serversObj[i];
    for(var j = 0; j < currentGuild.waitingPlayersList.length; j++)
    {
      if(currentGuild.waitingPlayersList[j] == name)
        return true;
    }
    for(var j = 0; j < currentGuild.playerList.length; j++)
    {
      if(currentGuild.playerList[j].name == name)
        return true;
    }
  }
  return false;
}

function getServerOfPlayer(player)
{
  for(var i = 0; i < serversObj.length; i++)
  {
    var currentGuild = serversObj[i];
    if(currentGuild.playerList.indexOf(player) != -1)
      return serversObj[i];
  }
  return null;
}

//resets all variables to their default.
function resetVariables()
{
  currentGuildVars.waitingPlayersList=[];
  currentGuildVars.playerList=[];
  if(currentGuildVars.mafiaChannel != null)
    currentGuildVars.mafiaChannel.delete();
    currentGuildVars.mafiaChannel = null;
    currentGuildVars.gameState=-1;
    currentGuildVars.gameTime=0;
    currentGuildVars.logicGameTime=0;
    currentGuildVars.defensePlayer=null;
    currentGuildVars.guiltCount=0;
    currentGuildVars.findChannelString="mafia";
  if(currentGuildVars.timeController != null)
  {
    clearTimeout(currentGuildVars.timeController);
    currentGuildVars.timeController = null;
  }
}

function sendNightInstructions()
{
  for(var i = 0; i < currentGuildVars.playerList.length; i++)
  {
    if(currentGuildVars.playerList[i].alive)
    {
      if(currentGuildVars.playerList[i].role == MAFIA)
      {
        currentGuildVars.playerList[i].name.send("You are allowed to kill one player. \n Use m.check to check player numbers. \n Use m.kill {their number} to vote kill someone");
      }
      if(currentGuildVars.playerList[i].role == DETECTIVE)
      {
        currentGuildVars.playerList[i].name.send("You can investigate one player at night. \n Use m.check to check player numbers. \n Use m.investigate {their number} to investigate someone. \n In the morning you will get your result");
      }
      if(currentGuildVars.playerList[i].role == DOCTOR)
      {
        currentGuildVars.playerList[i].name.send("You can heal one player at night. \n Use m.check to check player numbers. \n Use m.heal {their number} to heal someone.");
      }
      if(currentGuildVars.playerList[i].role == TOWN)
      {
        currentGuildVars.playerList[i].name.send("It is night. Stay safe until morning");
      }
    }
  }
}

//send instructions in a pm to the user provided.
function sendHowToPlayInstructions(name)
{
  var instructionText = "";
  instructionText += "Hello " + name.username + "! Welcome to the game of Mafia. \n";
  instructionText += "Overview: \n In Mafia there are two groups of people, the mafia(s) and the innocents. At the beginning of the game you are assigned a role (your role will be sent to you by private message from me "
  + client.user.username + ". If you're a mafia your goal is to kill non-mafias until there is only the same amount of mafias as non-mafias (Ex. if there are 2 mafias, your goal is to kill until there are only 2 non-mafias left to win)."
  + " If you a non-mafia your goal is to kill all mafias. \n";
  instructionText += "";
  name.send(instructionText);
}

/*Objects*/

function Player(name,role)
{
  this.name = name;
  this.voteCount = 0;
  this.voteKill = 0;
  this.role = role;
  this.hasVoted = false;
  this.alive = true;
  this.votedWhat = null;
  this.searched = null;
  this.healed = null;
  this.healedLastRound = null;
  this.kill = null;
  this.detectivePm = null;
}

/*Usefulfunctions*/

/*Handlers*/


client.on('ready',() => 
{
  console.log('I\'m Online\nI\'m Online');
  client.user.setPresence({ status: 'online', game: { name: 'm.play || m.help' } });
});

client.on('message', message => 
{ 
  var server = message.guild;
  var name = message.author;
  //when the game starts currentPlayer is retrieved from the list of all players on all servers.
  var currentPlayer = getPlayerOf(name);
  
  if(serversList.indexOf(server)>-1){
    currentGuildVars=serversObj[serversList.indexOf(server)];
  }else{
    serversList.push(server);
    serversObj.push(new ServerObj(server));
    currentGuildVars=serversObj[serversList.indexOf(server)];
    resetVariables();
  }
  if(currentPlayer != null && message.channel.type == "dm")
    currentGuildVars = getServerOfPlayer(currentPlayer);
  
  //ignore bot's own messages
  if (name === client.user) return;
  
  if(currentGuildVars.gameState==NIGHT && name != client.user && message.guild != null){
    message.delete();
    message.channel.send('Shhhhh. It is night time. (Please don\'t type at night as it ruins the integrity of the game.');
  }
  
  if(currentGuildVars.gameState==DEFENSE && name != client.user && defensePlayer.name!=name && message.guild != null){
    message.delete();
    message.author.send('Shhhhh. It is defense time. (Please don\'t type at their defense as it ruins the integrity of the game.');
  }
  
  //command handlers
  if (message.content.startsWith(prefix + 'ping')) 
  {
    message.channel.send('pong');
  }
  
  if (message.content.startsWith(prefix + 'help')) 
  {
    message.channel.send('A help message has been sent to your inbox.');
    sendInstructions(message.author);
  }
  
  if (message.content.startsWith(prefix + 'quit'))
  {
    if(message.channel.type == "text")
    {
      if(currentGuildVars.gameState!=NOGAME)
      {
        //if the game started and someone wants to quit run this code.
        message.channel.send("too bad " + name + " you can't quit the game.");
      }
      else
      {
        if(currentGuildVars.waitingPlayersList.indexOf(name) > -1)
        {
          currentGuildVars.waitingPlayersList.splice(currentGuildVars.waitingPlayersList.indexOf(name), 1);
          message.channel.send(name+" has left the queue. Currently "+currentGuildVars.waitingPlayersList.length+" players in queue and need a minimum of 5 to start.");
        }
        else
        {
          message.channel.send("You are not on the player list");
        }
      }
    }
    else
    {
      message.channel.send("You cannot use this command outside of a guild's chat channel");
    }
  }
  
  if(message.content.startsWith(prefix + 'getrules'))
  {
    sendHowToPlayInstructions(name);
    if(message.channel.type == "text")
      message.channel.send("Instruction sent to " + name + ". Please check your private message.");
  }
  
  //gets the current time in the game.
  if(message.content.startsWith(prefix + 'time') && currentGuildVars.gameState != NOGAME && currentPlayer != null && currentPlayer.alive)
  {
    var timeUntilItEnds = "";
    var currentSetting = "";
    if(currentGuildVars.gameState == DAY)
    {
      timeUntilItEnds = convertSecToMinSec(DAYLENGTH - currentGuildVars.logicGameTime);
      currentSetting = "day";
    }
    if(currentGuildVars.gameState == NIGHT)
    {
      timeUntilItEnds = convertSecToMinSec(NIGHTLENGTH - currentGuildVars.logicGameTime);
      currentSetting = "night";
    }
    if(currentGuildVars.gameState == DEFENSE)
    {
      timeUntilItEnds = convertSecToMinSec(DEFENSELENGTH - currentGuildVars.logicGameTime);
      currentSetting = "player defense";
    }
    if(currentGuildVars.gameState == VOTING)
    {
      timeUntilItEnds = convertSecToMinSec(VOTINGLENGTH - currentGuildVars.logicGameTime);
      currentSetting = "voting";
    }
    message.channel.send(timeUntilItEnds + " remaining until " + currentSetting + " ends.");
  }
  
  //able to increase the time or decrease it.
  if(message.content.startsWith(prefix + 'tmagic') && currentGuildVars.gameState != NOGAME && currentPlayer != null && currentPlayer.alive && message.author.id==process.env.BOTTOKEN)
  {
    var inputNum = parseInt(message.content.split(" ")[1]);
    //checks to see if there is a error from the players input.
    if(!isNaN(inputNum))
    {
      if(inputNum < -60)
        inputNum = -60;
      if(inputNum > 60)
        inputNum = 60;
      currentGuildVars.logicGameTime += inputNum;
      if(currentGuildVars.logicGameTime < 0)
        currentGuildVars.logicGameTime = 0;
      if(inputNum > 0)
        currentGuildVars.mafiaChannel.send(currentPlayer.name + " used time magic to remove " + Math.abs(inputNum) + " sec from the clock.");
      else if(inputNum < 0)
        currentGuildVars.mafiaChannel.send(currentPlayer.name + " used time magic to add " + Math.abs(inputNum) + " sec to the clock." );
    }
  }
  
  if (message.content.startsWith(prefix + 'reset') && message.author.id==process.env.BOTTOKEN) 
  {
    message.channel.send("Game Reset");
    resetVariables(); 
  }
  
  if ((currentGuildVars.gameState==GAMESTARTING||currentGuildVars.gameState==NOGAME)&&message.content.startsWith(prefix + 'play')) 
  {
    if(message.channel.type == "text")
    {
      if(!isPlayerInGame(name))
      {
        if(currentGuildVars.waitingPlayersList.indexOf(name) == -1)//check to see if the user is already playing
        {
          currentGuildVars.waitingPlayersList.push(name);//add user to the waitingList
          message.channel.send(name+" has joined the queue. Currently "+currentGuildVars.waitingPlayersList.length+" players in queue and need a minimum of "+numPlayers+" to start.");
        }
      }
      else
      {
        message.channel.send("You are already in a game, cannot join another game.");
      }
    }
    else
    {
      message.channel.send("You cannot use this command outside of a guild's chat channel");
    }
      
      
      //met player requirments and game isnt already starting
      if(currentGuildVars.waitingPlayersList.length>=numPlayers && currentGuildVars.gameState==NOGAME)
      {
        activeGames.push(currentGuildVars);
        currentGuildVars.gameState = GAMESTARTING;
        message.channel.send("Enough players have joined the match. You have 10 seconds to join before the ability to join is closed off.");
        //channel creation
        currentGuildVars.findChannelString="mafia";
        var serverNum=1;
        
        //uncommented for testing. Channel name changer.
        while(server.channels.find("name",currentGuildVars.findChannelString)!=null)
        {
          currentGuildVars.findChannelString = "mafia-" + serverNum;
          serverNum++;
        }
        
        server.createChannel(currentGuildVars.findChannelString, 'text', [
        {//define channel permissions
          id: server.id,
          deny: ['MANAGE_MESSAGES','CREATE_INSTANT_INVITE','MANAGE_CHANNELS','SEND_MESSAGES','MANAGE_MESSAGES','MANAGE_ROLES','MANAGE_WEBHOOKS','MENTION_EVERYONE'],
          allow: ['ADD_REACTIONS','VIEW_CHANNEL','READ_MESSAGE_HISTORY','EMBED_LINKS','ATTACH_FILES','SEND_TTS_MESSAGES','USE_EXTERNAL_EMOJIS']
        }]);
        var timeController=setInterval(function()
        {
          var tempcurrentGuildVars=currentGuildVars;
          for(var k in activeGames){
            currentGuildVars=activeGames[k];
            //increments gameTime evry second
            currentGuildVars.gameTime++;
            currentGuildVars.logicGameTime++;
            //checks for first 10 seconds and game isnt started
            if(currentGuildVars.gameTime>=10&&currentGuildVars.gameState==GAMESTARTING){
              currentGuildVars.gameState=DAY; 
              currentGuildVars.mafiaChannel = currentGuildVars.id.channels.find("name",currentGuildVars.findChannelString);
              //setting channel variable
              currentGuildVars.mafiaChannel.send("Joining closed, Game starting : Players in game "+ currentGuildVars.waitingPlayersList.join() );
              currentGuildVars.mafiaChannel.send("The mafia is trying to kill members of the town! As town villagers, vote to kill the mafia and keep the town safe! You have 3 mins to chat and vote before night falls.\n Use m.check to see which number corresponds to which player and use m.vote <playerNumber> to vote for them(Use m.cancelvote to cancel your vote). You will be sleeping at night and won't be able to talk.");
              //send a message to the channel people are using to join the telling players that the game has started and they can no longer join
              message.channel.send("The game has started. No more players are allowed to join");
              //set roles and fill player list with player objects
              assignRoles();
              var mafiaAmt = getMafiaCount();
              //playerList.push(new Player(waitingPlayersList[0],3));
              for(var i in currentGuildVars.playerList){
                currentGuildVars.mafiaChannel.overwritePermissions(currentGuildVars.playerList[i].name, {
                  SEND_MESSAGES: true
                });
                currentGuildVars.playerList[i].name.send("You are playing on: " + currentGuildVars.id.name);
                if(currentGuildVars.playerList[i].role==MAFIA&&mafiaAmt==1){
                  currentGuildVars.playerList[i].name.send("You are the mafia and can kill 1 person a night.");
                }
                if(currentGuildVars.playerList[i].role==MAFIA&&mafiaAmt>1){
                  currentGuildVars.playerList[i].name.send("You are the mafia and can kill 1 person a night. Your teammate(s) is(are) "+getAllMafiaPlayersNames().join());
                }
                if(currentGuildVars.playerList[i].role==DOCTOR){
                  currentGuildVars.playerList[i].name.send("You are the doctor and can heal 1 person a night but you can't heal the same person twice in a row.");
                }
                if(currentGuildVars.playerList[i].role==DETECTIVE){
                  currentGuildVars.playerList[i].name.send("You are the detective and can investigate 1 person a night.");
                }
                if(currentGuildVars.playerList[i].role==TOWN){
                  currentGuildVars.playerList[i].name.send("You are part of the town and need to find the mafia.");
                }
              }
              //resets gameTime after setup
              currentGuildVars.gameTime=0;
              currentGuildVars.logicGameTime=0;
            }
            //changes to night + switch to night logic
            if(currentGuildVars.logicGameTime>=DAYLENGTH&&currentGuildVars.gameState==DAY)
            {
              currentGuildVars.mafiaChannel.send("It is now night.");
              sendNightInstructions();
              currentGuildVars.gameState=NIGHT;
              for(var i in currentGuildVars.playerList){
                currentGuildVars.mafiaChannel.overwritePermissions(currentGuildVars.playerList[i].name, {
                  SEND_MESSAGES: false
                });
              }
              currentGuildVars.logicGameTime=0;
            }
            //changes to day + switch to day logic
            if(currentGuildVars.logicGameTime>=NIGHTLENGTH&&currentGuildVars.gameState==NIGHT)
            {
              currentGuildVars.mafiaChannel.send("It is now day.");
              currentGuildVars.gameState=DAY;
              //at the beginning of the day tell the detective who he invetigated.
              //tell everyone who was killed.
              tellTheDetectiveWhoHeSearched();
              var playerHealed = getHealedPlayer();
              var playerKilled = getKilledPlayer();
              var tempDocVar = getDoctor();
              //tellTheDoctorIfHealed
              if(tempDocVar != null)
              {
                if(playerHealed != null)
                {
                  if(playerKilled == playerHealed)
                  {
                    tempDocVar.send("You managed to save " + playerHealed.name +" from the mafia.");
                  }
                  else
                  {
                    tempDocVar.send("You didn't heal anyone");
                  }
                }
                else
                {
                  tempDocVar.send("You didn't heal anyone");
                }
              }
              if(playerKilled == null || (playerKilled == playerHealed))
              {
                currentGuildVars.mafiaChannel.send("No one was killed.");
              }
              else
              {
                currentGuildVars.mafiaChannel.send(playerKilled.name + " was killed.");
                playerKilled.alive = false;
                currentGuildVars.mafiaChannel.overwritePermissions(playerKilled.name, {
                  SEND_MESSAGES: false
                });
              }

              for(var i in currentGuildVars.playerList){
                if(true){
                  currentGuildVars.playerList[i].voteCount = 0;
                  currentGuildVars.playerList[i].hasVoted = false;
                  currentGuildVars.playerList[i].votedWhat = null;
                  currentGuildVars.defensePlayer=null;
                  currentGuildVars.guiltCount=0;
                  //send a message to the chat saying who died

                  currentGuildVars.mafiaChannel.overwritePermissions(currentGuildVars.playerList[i].name, {
                    SEND_MESSAGES: true
                  });
                }
              }
              if(checkWin()){
                currentGuildVars.gameState=ENDGAME;
                currentGuildVars.mafiaChannel.send("All players will have chat functions now. 2 mins until the game deletes itself. Thanks for playing and remember to upvote in discords bots");
              }
              currentGuildVars.logicGameTime=0;
            }
            //changes to defense + switch to defense logic
            if(currentGuildVars.gameState==DEFENSE)
            {
              if(currentGuildVars.logicGameTime==1)
                currentGuildVars.mafiaChannel.send("It is now "+currentGuildVars.defensePlayer.name+"'s defense.");
              //makes everyone unable to speak except defense player
              for(var i in currentGuildVars.playerList){
                if(currentGuildVars.playerList[i]!=currentGuildVars.defensePlayer){
                  currentGuildVars.mafiaChannel.overwritePermissions(currentGuildVars.playerList[i].name, {
                    SEND_MESSAGES: false
                  });
                }
              }
              if(currentGuildVars.logicGameTime>=DEFENSELENGTH){
                currentGuildVars.mafiaChannel.send("Your time is up, the town will have to vote on your fate.");
                currentGuildVars.gameState=VOTING;
                currentGuildVars.logicGameTime=0;
              }
            }
            if(currentGuildVars.gameState==VOTING)
            {
              if(currentGuildVars.logicGameTime==1)
                currentGuildVars.mafiaChannel.send("Use m.innocent or m.guilty to vote. Use m.cancelvote to cancel your vote");
              for(var i in currentGuildVars.playerList){
                if(currentGuildVars.playerList[i].alive){
                  currentGuildVars.mafiaChannel.overwritePermissions(currentGuildVars.playerList[i].name, {
                    SEND_MESSAGES: true
                  });
                }
              }
              if(currentGuildVars.logicGameTime>=VOTINGLENGTH){
                if(currentGuildVars.guiltCount<0){
                  currentGuildVars.defensePlayer.alive=false;
                  currentGuildVars.mafiaChannel.overwritePermissions(currentGuildVars.defensePlayer.name, {
                  SEND_MESSAGES: false
                });
                  currentGuildVars.mafiaChannel.send(currentGuildVars.defensePlayer.name+" has been sentenced to death by the town.");
                }else{
                  currentGuildVars.mafiaChannel.send(currentGuildVars.defensePlayer.name+" has been voted inncocent by the town.");
                }
                if(checkWin()){
                  currentGuildVars.gameState=ENDGAME;
                  currentGuildVars.mafiaChannel.send("All players will have chat functions now. 2 mins until the game deletes itself. Thanks for playing and remember to upvote in discords bots");
                  currentGuildVars.logicGameTime=0
                }else{
                  currentGuildVars.logicGameTime=DAYLENGTH;
                  currentGuildVars.gameState=DAY;
                }
              }
            }
            if(currentGuildVars.gameState==ENDGAME)
            {
              currentGuildVars.mafiaChannel.overwritePermissions(server.id, {
                  SEND_MESSAGES: true
              });
              if(currentGuildVars.logicGameTime>=120){
                resetVariables();
              }
            }
          }
          currentGuildVars=tempcurrentGuildVars;
        },1000);
      }
        
  }
  //game has already started
  if (message.content.startsWith(prefix + 'play')&&(currentGuildVars.gameState!=-1&&currentGuildVars.gameState!=4)) 
  {
    message.channel.send("The game has started. No more players are allowed to join. Please wait for the next round.");
  }
  
  //the detective can investigate a player at night
  if (message.content.startsWith(prefix + 'investigate')&&currentPlayer!=null&&currentPlayer.role == DETECTIVE&&currentGuildVars.gameState == NIGHT&&currentPlayer.alive)
  {
    var searchNum = parseInt(message.content.substring(prefix.length + 11));
    //checks to see if there is a error from the players input.
    if(!isNaN(searchNum) && searchNum >= 0 && searchNum <= currentGuildVars.playerList.length - 1)
    {
      //you cannot search yourself.
      if(currentGuildVars.playerList[searchNum] != currentPlayer)
      {
        // var searchedPersonsRole = playerList[searchNum].role;
        // if(searchedPersonsRole == DOCTOR)
        // {
        //   name.send("You searched around " + playerList[searchNum].name + "'s house and realized that " + playerList[searchNum].name + " is a Doctor.");
        // }
        // if(searchedPersonsRole == MAFIA)
        // {
        //   name.send("You searched around " + playerList[searchNum].name + "'s house and found loads of guns. " + playerList[searchNum].name + " is a Mafia!");
        // }
        // if(searchedPersonsRole == TOWN)
        // {
        //   name.send("You searched around " + playerList[searchNum].name + "'s house. Nope just a innocent person");
        // }
        // //after the detectives searches his hasSearched is set to true.
        // currentPlayer.hasSearched = true;
        
        //you cannot search dead people.
        if(currentGuildVars.playerList[searchNum].alive)
        {
          name.send("You are going to investigate " + currentGuildVars.playerList[searchNum].name + "'s house.");
          currentPlayer.detectivePm = name;
          currentPlayer.searched = currentGuildVars.playerList[searchNum];
        }
        else
        {
          name.send("You cannot investigate dead people.");
        }
      }
      else
      {
        name.send("You cannot investigate yourself.");
      }
    }
    else
    {
      name.send("No No No Please try again");
    }
  }
  
  //the doctor can choose someone to save 
  if (message.content.startsWith(prefix + 'heal')&&currentPlayer!=null&&currentPlayer.role == DOCTOR&&currentGuildVars.gameState == NIGHT&&currentPlayer.alive)
  {
    var searchNum = parseInt(message.content.substring(prefix.length + 4));
    //checks to see if there is a error from the players input.
    if(!isNaN(searchNum) && searchNum >= 0 && searchNum <= currentGuildVars.playerList.length - 1)
    {
      //cannot heal dead people.
      if(currentGuildVars.playerList[searchNum].alive)
      {
        //the doctor cannot heal the same person in a row.
        if(currentGuildVars.playerList[searchNum] != currentPlayer.healedLastRound)
        {
          //the doctor chose a player to save.
          if(currentGuildVars.playerList[searchNum] != currentPlayer) 
          {
            //put selected the player into a variable

            name.send("You chose to save" + currentGuildVars.playerList[searchNum].name);
          }
          else
          {
            name.send("You chose to save yourself. Ehhh so selfish~~");
          }
          currentPlayer.healed = currentGuildVars.playerList[searchNum];
        }
        else
        {
          name.send("You can't pick the same person twice in a row.");
        }
        
      }
      else
      {
        name.send("You cannot heal dead people.");
      }
    }
    else
    {
      name.send("No No No Please try again");
    }
  }
  
  //the mafias have to vote to kill someone.
  if (message.content.startsWith(prefix + 'kill')&&currentPlayer!=null&&currentPlayer.role == MAFIA&&currentGuildVars.gameState == NIGHT&&currentPlayer.alive)
  {
    var searchNum = parseInt(message.content.substring(prefix.length + 4));
    //grabs the player that someone inputted.
    // var inputPlayer = findPlayerWithId(Number(message.content.match(/<@(\d+)>/i)[1]));//try to find a user that someone @tagged
    // if (inputPlayer == null)
    // {
    //   if(!isNaN(searchNum) && searchNum >= 0 && searchNum <= playerList.length - 1)
    //     inputPlayer = playerList[Number(searchNum)];
    // }//if the user did not specify the name then try and use the num id like we used to
    // //checks to see if there is a error from the players input.
    if(!isNaN(searchNum) && searchNum >= 0 && searchNum <= currentGuildVars.playerList.length - 1)
    {
      //checks too see if the player is alive or not
      if(currentGuildVars.playerList[searchNum].alive)
      {
        if(currentGuildVars.playerList[searchNum] != currentPlayer)
        {
          if(currentGuildVars.playerList[searchNum].role != MAFIA)
          {
            currentPlayer.kill = currentGuildVars.playerList[searchNum];
            name.send("You voted to kill " + currentGuildVars.playerList[searchNum].name + ".");
          }
          else
          {
            name.send("You cannot vote to kill another mafia");
          }
        }
        else
        {
          name.send("Why would you want to kill yourself?");
        }
      }
      else
      {
        name.send("This person is already dead.");
      }
    }
  }   
  
  //in the morning everyone votes to eliminiate someome.
  if(message.content.startsWith(prefix + 'vote')&&currentGuildVars.gameState == DAY&&currentPlayer!=null&&currentPlayer.alive)
  {
    var tempStr = message.content.split(" ");
    //if second parameter is a number
    if(!isNaN(tempStr[1]) && currentGuildVars.playerList[Number(tempStr[1])]!=null){
      //case checks
      if(currentGuildVars.playerList[Number(tempStr[1])]==currentPlayer){
        message.channel.send("You can not vote for yourself.");
      }
      if(!currentGuildVars.playerList[Number(tempStr[1])].alive){
        message.channel.send("You can not vote for dead people.");
      }
      if(currentPlayer.hasVoted&&currentPlayer.votedWhat==currentGuildVars.playerList[Number(tempStr[1])].name){
        message.channel.send("You have already voted for this player");
      }
      if(currentPlayer.hasVoted&&currentPlayer.votedWhat!=currentGuildVars.playerList[Number(tempStr[1])].name&&currentGuildVars.playerList[Number(tempStr[1])]!=currentPlayer){
        for(var i in currentGuildVars.playerList){
          if(currentGuildVars.playerList[i].name==currentPlayer.votedWhat){
            currentGuildVars.playerList[i].voteCount--;
          }
        }
        message.channel.send(currentPlayer.name+" has retracted his vote aganist "+currentPlayer.votedWhat);
        currentPlayer.hasVoted=false;
        currentPlayer.votedWhat=null;
        currentGuildVars.playerList[Number(tempStr[1])].voteCount+=1;
        message.channel.send(currentPlayer.name+" voted for "+currentGuildVars.playerList[Number(tempStr[1])].name+" and they currently have "+currentGuildVars.playerList[Number(tempStr[1])].voteCount+" votes aganist them.");
        currentPlayer.hasVoted=true;
        currentPlayer.votedWhat=currentGuildVars.playerList[Number(tempStr[1])].name;
        //voting logic here
        if(currentGuildVars.playerList[Number(tempStr[1])].voteCount>getAllAlivePlayers().length/2){
          message.channel.send(currentGuildVars.playerList[Number(tempStr[1])].name+" has been voted on by the town and will be given 30 seconds to provide a defense before the town voted guilty or innocent.");
          currentGuildVars.gameState=DEFENSE;
          currentGuildVars.defensePlayer=currentGuildVars.playerList[Number(tempStr[1])];
          currentGuildVars.logicGameTime=0;
          for(var i in currentGuildVars.playerList){
            currentGuildVars.playerList[i].hasVoted=false;
          }
        }
      }
      if(currentGuildVars.playerList[Number(tempStr[1])].alive&&currentGuildVars.playerList[Number(tempStr[1])]!=currentPlayer&&!currentPlayer.hasVoted){
        currentGuildVars.playerList[Number(tempStr[1])].voteCount+=1;
        message.channel.send(currentPlayer.name+" voted for "+currentGuildVars.playerList[Number(tempStr[1])].name+" and they currently have "+currentGuildVars.playerList[Number(tempStr[1])].voteCount+" votes aganist them.");
        currentPlayer.hasVoted=true;
        currentPlayer.votedWhat=currentGuildVars.playerList[Number(tempStr[1])].name;
        //voting logic here
        if(currentGuildVars.playerList[Number(tempStr[1])].voteCount>getAllAlivePlayers().length/2){
          message.channel.send(currentGuildVars.playerList[Number(tempStr[1])].name+" has been voted on by the town and will be given 30 seconds to provide a defense before the town voted guilty or innocent.");
          currentGuildVars.gameState=DEFENSE;
          currentGuildVars.defensePlayer=currentGuildVars.playerList[Number(tempStr[1])];
          currentGuildVars.logicGameTime=0;
          for(var i in currentGuildVars.playerList){
            currentGuildVars.playerList[i].hasVoted=false;
          }
        }
      }
    }else if(message.content.match(/<@(\d+)>/i)!=null){
      //if second parameter is a name
      if(findPlayerWithId(Number(message.content.match(/<@(\d+)>/i)[1]))!=null){
        var inputPlayer = findPlayerWithId(Number(message.content.match(/<@(\d+)>/i)[1]));
        var tempStorePlayer=inputPlayer;
        //case checks
        if(inputPlayer==currentPlayer){
          message.channel.send("You can not vote for yourself.");
        }
        if(!tempStorePlayer.alive){
          message.channel.send("You can not vote for dead people.");
        }
        if(currentPlayer.hasVoted&&currentPlayer.votedWhat==tempStorePlayer.name){
          message.channel.send("You have already voted for this player");
        }
        if(currentPlayer.hasVoted&&currentPlayer.votedWhat!=tempStorePlayer.name&&inputPlayer!=currentPlayer){
          for(var i in currentGuildVars.playerList){
            if(currentGuildVars.playerList[i].name==currentPlayer.votedWhat){
              currentGuildVars.playerList[i].voteCount--;
            }
          }
          message.channel.send(currentPlayer.name+" has retracted his vote aganist "+currentPlayer.votedWhat);
          currentPlayer.hasVoted=false;
          currentPlayer.votedWhat=null;
          tempStorePlayer.voteCount+=1;
          message.channel.send(currentPlayer.name+" voted for "+tempStorePlayer.name+" and they currently have "+tempStorePlayer.voteCount+" votes aganist them.");
          currentPlayer.hasVoted=true;
          currentPlayer.votedWhat=tempStorePlayer.name;
          //voting logic here
          if(tempStorePlayer.voteCount>getAllAlivePlayers().length/2){
            message.channel.send(tempStorePlayer.name+" has been voted on by the town and will be given 30 seconds to provide a defense before the town voted guilty or innocent.");
            currentGuildVars.gameState=DEFENSE;
            currentGuildVars.defensePlayer=tempStorePlayer;
            currentGuildVars.logicGameTime=0;
            for(var i in currentGuildVars.playerList){
              currentGuildVars.playerList[i].hasVoted=false;
            }
          }
        }
        if(tempStorePlayer.alive&&tempStorePlayer!=currentPlayer&&!currentPlayer.hasVoted){
          tempStorePlayer.voteCount+=1;
          message.channel.send(currentPlayer.name+" voted for "+tempStorePlayer.name+" and they currently have "+tempStorePlayer.voteCount+" votes aganist them.");
          currentPlayer.hasVoted=true;
          currentPlayer.votedWhat=tempStorePlayer.name;
          //voting logic here
          if(tempStorePlayer.voteCount>getAllAlivePlayers().length/2){
            message.channel.send(tempStorePlayer.name+" has been voted on by the town and will be given 30 seconds to provide a defense before the town voted guilty or innocent.");
            currentGuildVars.gameState=DEFENSE;
            currentGuildVars.defensePlayer=tempStorePlayer;
            currentGuildVars.logicGameTime=0;
            for(var i in currentGuildVars.playerList){
              currentGuildVars.playerList[i].hasVoted=false;
            }
          }
        }
      }
    }
  }
  
  if(message.content.startsWith(prefix + 'guilty')&&currentGuildVars.gameState == VOTING&&currentPlayer!=null&&currentPlayer.alive)
  {
    if(currentPlayer.hasVoted&&currentPlayer.votedWhat){
      message.channel.send("You have already voted. Please use m.votecancel to cancel your vote.");
    }
    if(currentPlayer.hasVoted&&!currentPlayer.votedWhat){
      currentGuildVars.guiltCount-=2;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=false;
      message.channel.send(currentPlayer.name +" has changed his mind and voted guilty.");
    }
    if(currentPlayer!=currentGuildVars.defensePlayer&&!currentPlayer.hasVoted){
      currentGuildVars.guiltCount-=1;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=true;
      message.channel.send(currentPlayer.name +" has voted guilty.");
    } 
  }
  
  if(message.content.startsWith(prefix + 'innocent')&&currentGuildVars.gameState == VOTING&&currentPlayer!=null&&currentPlayer.alive)
  {
    if(currentPlayer.hasVoted&&!currentPlayer.votedWhat){
      message.channel.send("You have already voted. Please use m.votecancel to cancel your vote.");
    }
    if(currentPlayer.hasVoted&&currentPlayer.votedWhat){
      currentGuildVars.guiltCount+=2;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=true;
      message.channel.send(currentPlayer.name +" has changed his mind and voted innocent.");
    }
    if(currentPlayer!=currentGuildVars.defensePlayer&&!currentPlayer.hasVoted){
      currentGuildVars.guiltCount+=1;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=false;
      message.channel.send(currentPlayer.name +" has voted innocent.");
    }
  }
  
  if(message.content.startsWith(prefix + 'cancelvote')&&(currentGuildVars.gameState == VOTING || currentGuildVars.gameState == DAY)&&currentPlayer!=null&&currentPlayer.alive&&currentPlayer.hasVoted)
  {
    //voting stage
    if(currentGuildVars.gameState == VOTING){
      //guilty vote
      if(currentPlayer.votedWhat){
        currentGuildVars.guiltCount+=1;
        currentPlayer.hasVoted=false;
        currentPlayer.votedWhat=null;
        message.channel.send(currentPlayer.name+" has retracted his guilty vote.");
        //innocent vote
      }else{
        currentGuildVars.guiltCount-=1;
        currentPlayer.hasVoted=false;
        currentPlayer.votedWhat=null;
        message.channel.send(currentPlayer.name+" has retracted his innocent vote.");
      }
      //day vote stage
    }else{
      for(var i in currentGuildVars.playerList){
        if(currentGuildVars.playerList[i].name==currentPlayer.votedWhat){
          currentGuildVars.playerList[i].voteCount--;
        }
      }
      message.channel.send(currentPlayer.name+" has retracted his vote aganist "+currentPlayer.votedWhat);
      currentPlayer.hasVoted=false;
      currentPlayer.votedWhat=null;
    }
  }
  
  if(message.content.startsWith(prefix + 'debug')&&(message.author.id==process.env.BOTTOKEN)){
    message.channel.send(" gameState "+ currentGuildVars.gameState + " mafia "+ getAllMafiaPlayersNames() + " gameTime "+ currentGuildVars.gameTime + " logicGameTime "+ currentGuildVars.logicGameTime+ " guiltCount "+ currentGuildVars.guiltCount);
  }
  
  //todo: add a command that lets players know their role.
  if(message.content.startsWith(prefix + "role"))
  {
    
  }
  
  ///NEED TO TEST !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  if(message.content.startsWith(prefix + 'check')&&currentGuildVars.gameState!=NOGAME&&currentGuildVars.gameState!=GAMESTARTING&&currentPlayer!=null&&currentPlayer.alive)
  {
    var tempNames="";
    var aliveNames = "";
    var deadNames = "";
    var someoneIsDead = false;
    for(var i in currentGuildVars.playerList)
    {
      // if(!playerList[i].alive)
      //   tempNames+="(dead)";
      // tempNames+=i+". "+playerList[i].name+"\n";
      if(currentGuildVars.playerList[i].alive)
      {
        aliveNames += i + ". " + currentGuildVars.playerList[i].name;
        //if the message was sent from a pm with the bot then tag on their role as well.
        if(message.channel.type == "dm")
        {
          if(currentPlayer.role == MAFIA && currentGuildVars.playerList[i].role == MAFIA)
            aliveNames += " (Mafia)";
          else
            if(currentPlayer == currentGuildVars.playerList[i])
            {
              if(currentPlayer.role == DOCTOR)
                aliveNames += " (Doctor)";
              if(currentPlayer.role == DETECTIVE)
                aliveNames += " (Detective)";
              if(currentPlayer.role == TOWN)
                aliveNames += " (Town)";
            }
        }
        aliveNames += "\n";     
      }
      else
      {
        deadNames += i + ". " + currentGuildVars.playerList[i].name + "\n";
        someoneIsDead = true;
      }
    }
    if(someoneIsDead)
      tempNames += "Alive: \n" + aliveNames + "Dead: \n" + deadNames;
    else
      tempNames += aliveNames;
    message.channel.send(tempNames);
  }
  
  //testing db
  if(message.content.startsWith(prefix + 'insert')&& message.author.id==process.env.BOTTOKEN){
    var doc = { hello: 'world'
               , n: 5
               , today: new Date()
               , nedbIsAwesome: true
               , notthere: null
               , notToBeSaved: undefined  // Will not be saved
               , fruits: [ 'apple', 'orange', 'pear' ]
               , infos: { name: 'nedb' }
               };

    db.insert(doc, function (err, newDoc) {   // Callback is optional
      // newDoc is the newly inserted document, including its _id
      // newDoc has no key called notToBeSaved since its value was undefined
    });
  }
  
  if(message.content.startsWith(prefix + 'print')&& message.author.id==process.env.BOTTOKEN){
    db.find({ hello: 'world' }, function (err, docs) {
      console.log(docs);
      console.log(docs[0].hello);
    });
  }
  
  if(message.content.startsWith(prefix + 'testTimer')&& message.author.id==process.env.BOTTOKEN){
    currentGuildVars.mafiaChannel=message.channel;
    currentGuildVars.testTimer = setInterval(function(){
      currentGuildVars.gameTime++;
      currentGuildVars.mafiaChannel.send("THis is a test, plz ignore : "+currentGuildVars.id.name+"\n Time= "+currentGuildVars.gameTime);
    },5000);
  }
  
  //ignore this part
  if (message.content == "good night" || message.content == "gn" || message.content == "gnight")
  {
    
    // if(message.channel.type == "text")
    //   message.channel.send("Ok?");
    message.channel.send("Good night " + name.username);
    // if(message.channel.type == "dm")
    //   message.channel.send("What?");
    console.log(message.channel);
  }
  
  if (message.content == "good morning" || message.content == "gm" || message.content == "gmorning")
  {
    
    // if(message.channel.type == "text")
    //   message.channel.send("Ok?");
    message.channel.send("Good morning " + name.username);
    // if(message.channel.type == "dm")
    //   message.channel.send("What?");
    console.log(message.channel);
  }
  /*
  if (message.content.startsWith("test"))
  {
    message.channel.send(message.content);
    console.log(message.content);
    console.log(message.author.id);
    
    var regex = /<@(\d+)>/g;
    var match = regex.exec(message.content);
    console.log(match);
    console.log(match[1]);
    console.log(message.content.match(/<@(\d+)>/i)[1])//does the same thing as the above 3 lines
    //findPlayerWithId(Number(match[1])).send("hi");
    
    
    playerList.push(new Player(message.author), DOCTOR);
    //findPlayerWithId(message.substring(4)).send("hi");
    //findPlayerWithId(Number(match[1])).send("hi");
    findPlayerWithId(Number(message.content.match(/<@(\d+)>/i)[1])).name.send("hi");
  }*/
  
});

client.login(process.env.TOKEN);