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

/*Pings app every 200000 ms to keep alive*/

app.get("/", (request, response) =>
{
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});

app.listen(process.env.PORT);

setInterval(() =>
{
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 200000);



/*Global declaration*/

var db = new Datastore({ filename: '.data/datafile', autoload: true });
const client = new Discord.Client();

var waitingPlayersList=[];
var playerList=[];
var mafiaChannel;
var gameState=-1;
var gameTime=0;
var logicGameTime=0;
var defensePlayer=null;
var guiltCount=0;
var timeController=null;
var findChannelString;


/*Role constants + prefix constant*/
const MAFIA = 0;
const DETECTIVE = 1;
const TOWN = 2;
const DOCTOR = 3;
const DAY = 0;
const NIGHT = 1;
const DEFENSE = 2;
const VOTING = 3;
const GAMESTARTING = 4;
const NOGAME = -1;
const ENDGAME = 5;

const prefix = 'm.';

/*Helper functions*/

//get a random int from 0 to max. Doesn't include max.
function getRandomInt(max)
{
  return Math.floor(Math.random() * Math.floor(max));
}

function checkPlayersDeadOrAlive(player)
{
  return player.alive;
  
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

//given a string of a name returns the player obj with that name. Return null if player isn't found.
function findPlayerWithName(name)
{
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].name.username == name)
    {
      return playerList[i];
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
  name.send("Game Commands: ");
  name.send("m.play - join a game");
  name.send("m.quit - quit the game");
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
  var numOfMafia = Math.floor((waitingPlayersList.length - 2) / 3);
  if(numOfMafia < 2)
    numOfDoc = 0;
  //Other options for less then 5 players
  if(waitingPlayersList.length < 5)
  {
    numOfMafia = 1;
    numOfDoc = 0;
    numOfDete = 1;
  }
  
  
  var indexes = [];
  for(var i = 0; i < waitingPlayersList.length; i++)
  {
    indexes.push(i);
  }
  
  while(numOfDoc >= 1)
  {
    var randNum = getRandomInt(indexes.length);
    //console.log("before:\n"+waitingPlayersList[0]);
    placeItemRandomlyInArray(playerList, new Player(waitingPlayersList[indexes[randNum]], DOCTOR));
    indexes.splice(randNum, 1);
    
    //console.log(playerList[playerList.length-1]);
    numOfDoc--;
  }
  
  while(numOfDete >= 1)
  {
    //something like?
    var randNum = getRandomInt(indexes.length);
    //console.log("before:\n"+waitingPlayersList[0]);//undefined
    placeItemRandomlyInArray(playerList, new Player(waitingPlayersList[indexes[randNum]], DETECTIVE));
    indexes.splice(randNum, 1);
    //console.log(playerList[playerList.length-1]);
    numOfDete--;
  }
  while(numOfMafia >= 1)
  {
    var randNum = getRandomInt(indexes.length);
    placeItemRandomlyInArray(playerList, new Player(waitingPlayersList[indexes[randNum]], MAFIA));
    indexes.splice(randNum, 1);
    //console.log(playerList[playerList.length-1]);
    numOfMafia--;
  }
  while(indexes.length > 0)
  {
    var randNum = getRandomInt(indexes.length);
    placeItemRandomlyInArray(playerList, new Player(waitingPlayersList[indexes[randNum]], TOWN));
    indexes.splice(randNum, 1);
    //console.log(playerList[playerList.length-1]);
  }
}



function checkWin()
{
  var aliveMafia = 0;
  var aliveInnocent = 0;
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].role == MAFIA && playerList[i].alive)
    {
      aliveMafia++;
    }
    if(playerList[i].role != MAFIA && playerList[i].alive)
    {
      aliveInnocent++;
    }
  }
  if(aliveMafia == 0)
  {
    //innocent wins.
    mafiaChannel.send("Dun Dun Dun. Town Wins!");
    mafiaChannel.send("Number Of Mafia Left: " + aliveMafia + " Number Of Town Left: " + aliveInnocent);
    return true;
  }
  if(aliveMafia >= aliveInnocent)
  {
    //mafia wins.
    mafiaChannel.send("Dun Dun Dun. Maifa Wins!");
    mafiaChannel.send("Number Of Mafia Left: " + aliveMafia + " Number Of Town Left: " + aliveInnocent);
    return true;
  }
  return false;
}

//returns a array of all the mafia players that are still alive.
function getAllMafiaPlayers()
{
  var mafiaP = [];
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].role == MAFIA && playerList[i].alive)
    {
      mafiaP.push(playerList[i]);
    }
  }
  return mafiaP;
}

//returns an array of all alive players
function getAllAlivePlayers()
{
  var mafiaP = [];
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].alive)
    {
      mafiaP.push(playerList[i]);
    }
  }
  return mafiaP;
}

//returns a array of all the mafia players names that are still alive.
function getAllMafiaPlayersNames()
{
  var mafiaP = [];
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].role == MAFIA && playerList[i].alive)
    {
      mafiaP.push(playerList[i].name);
    }
  }
  return mafiaP;
}

function getMafiaCount()
{
  var count = 0;
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].role == MAFIA && playerList[i].alive)
    {
      count++;
    }
  }
  return count;
}

//returns the player object of the person whose name is the parameter passed in.
function getPlayerOf(name)
{
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].name == name)
    {
      return playerList[i];
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
  for(var i = 0; i < playerList.length; i++)
  {
    var currPlayer = playerList[i];
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
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].alive && playerList[i].role == DOCTOR)
    {
      if(playerList[i].healed == null)
      {
        playerList[i].healedLastRound = null;
        return null;
      }
      var healedPerson = playerList[i].healed;
      playerList[i].healedLastRound = healedPerson;
      playerList[i].healed = null;
      return healedPerson;
    }
  }
  return null;
}

//gets the person that was investigated.
//return null if no one was investigated.
function tellTheDetectiveWhoHeSearched()
{
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].alive && playerList[i].role == DETECTIVE)
    {
      var investigatedPlayer = playerList[i].searched;
      playerList[i].searched = null;
      if(investigatedPlayer != null)
      {
        if(investigatedPlayer.role == MAFIA)
          playerList[i].name.send("The person you investigated was a mafia.");
        else
          playerList[i].name.send("The person you investigated was not a mafia.");
      }
    }
  }
}

function resetVariables()
{
  waitingPlayersList=[];
  playerList=[];
  if(mafiaChannel != null)
    mafiaChannel.delete();
    mafiaChannel = null;
    gameState=-1;
    gameTime=0;
    logicGameTime=0;
    defensePlayer=null;
    guiltCount=0;
  if(timeController != null)
  {
    clearTimeout(timeController);
    timeController = null;
  }
}

function sendNightInstructions()
{
  for(var i = 0; i < playerList.length; i++)
  {
    if(playerList[i].alive)
    {
      if(playerList[i].role == MAFIA)
      {
        playerList[i].name.send("You are allowed to kill one player. \n Use m.check to check player numbers. \n Use m.kill {their number} to vote kill someone");
      }
      if(playerList[i].role == DETECTIVE)
      {
        playerList[i].name.send("You can investigate one player at night. \n Use m.check to check player numbers. \n Use m.investigate {their number} to investigate someone. \n In the morning you will get your result");
      }
      if(playerList[i].role == DOCTOR)
      {
        playerList[i].name.send("You can heal one player at night. \n Use m.check to check player numbers. \n Use m.heal {their number} to heal someone.");
      }
      if(playerList[i].role == TOWN)
      {
        playerList[i].name.send("It is night. Stay safe until morning");
      }
    }
  }
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
});

client.on('message', message => 
{ 
  var server = message.guild;
  var name = message.author;
  //when the game starts currentPlayer is retrieved from the list of players.
  var currentPlayer = getPlayerOf(name);
  //ignore bot's own messages
  if (name === client.user) return;
  
  //command handlers
  if (message.content.startsWith(prefix + 'ping')) 
  {
    message.channel.send('pong');
  }
  
  if (message.content.startsWith(prefix + 'help')) 
  {
    sendInstructions(message.channel);
  }
  
  if (message.content.startsWith(prefix + 'quit'))
  {
    if(gameState!=NOGAME)
    {
      //if the game started and someone wants to quit run this code.
      message.channel.send("too bad " + name + " you can't quit the game.");
    }
    else
    {
      if(waitingPlayersList.indexOf(name) > -1)
      {
        waitingPlayersList.splice(waitingPlayersList.indexOf(name), 1);
        message.channel.send(name+" has left the queue. Currently "+waitingPlayersList.length+" players in queue and need a minimum of 5 to start.");
      }
      else
      {
        message.channel.send("You are not on the player list");
      }
    }
  }
  
  if (message.content.startsWith(prefix + 'reset')) 
  {
    message.channel.send("Game Reset");
    resetVariables(); 
  }
  
  if ((gameState==GAMESTARTING||gameState==NOGAME)&&message.content.startsWith(prefix + 'play')) 
  {
   
      if(waitingPlayersList.indexOf(name) == -1)//check to see if the user is already playing
      {
        waitingPlayersList.push(name);//add user to the waitingList
        message.channel.send(name+" has joined the queue. Currently "+waitingPlayersList.length+" players in queue and need a minimum of 5 to start.");
      }
      
      
      //met player requirments and game isnt already starting
      if(waitingPlayersList.length>=3 && gameState==NOGAME)
      {
        gameState = GAMESTARTING;
        message.channel.send("Enough players have joined the match. You have 10 seconds to join before the ability to join is closed off.");
        //channel creation
        findChannelString="mafia";
        var serverNum=1;
        /*while(client.channels.find("name",findChannelString)!=null)
        {
          findChannelString = "mafia " + serverNum;
          serverNum++;
        }*/
        server.createChannel(findChannelString, 'text', [
        {//define channel permissions
          id: server.id,
          deny: ['MANAGE_MESSAGES','CREATE_INSTANT_INVITE','MANAGE_CHANNELS','SEND_MESSAGES','MANAGE_MESSAGES','MANAGE_ROLES','MANAGE_WEBHOOKS','MENTION_EVERYONE'],
          allow: ['ADD_REACTIONS','VIEW_CHANNEL','READ_MESSAGE_HISTORY','EMBED_LINKS','ATTACH_FILES','SEND_TTS_MESSAGES','USE_EXTERNAL_EMOJIS']
        }]);
        timeController=setInterval(function()
        {
          //increments gameTime evry second
          gameTime++;
          logicGameTime++;
          //checks for first 10 seconds and game isnt started
          if(gameTime>=10&&gameState==GAMESTARTING){
            gameState=DAY; 
            mafiaChannel = client.channels.find("name",findChannelString);
            //setting channel variable
            mafiaChannel.send("Joining closed, Game starting : Players in game "+ waitingPlayersList.join() );
            mafiaChannel.send("The mafia is trying to kill members of the town! As town villagers, vote to kill the mafia and keep the town safe! You have 3 mins to chat and vote before night falls.\n Use m.check to see which number corresponds to which player and use m.vote <playerNumber> to vote for them(Use m.cancelvote to cancel your vote). You will be sleeping at night and won't be able to talk.");
            //send a message to the channel people are using to join the telling players that the game has started and they can no longer join
            message.channel.send("The game has started. No more players are allowed to join");
            //set roles and fill player list with player objects
            assignRoles();
            var mafiaAmt = getMafiaCount();
            //playerList.push(new Player(waitingPlayersList[0],3));
            for(var i in playerList){
              mafiaChannel.overwritePermissions(playerList[i].name, {
                SEND_MESSAGES: true
              });
              if(playerList[i].role==MAFIA&&mafiaAmt==1){
                playerList[i].name.send("You are the mafia and can kill 1 person a night.");
              }
              if(playerList[i].role==MAFIA&&mafiaAmt>1){
                playerList[i].name.send("You are the mafia and can kill 1 person a night. Your teammate(s) is(are) "+getAllMafiaPlayersNames().join());
              }
              if(playerList[i].role==DOCTOR){
                console.log(playerList[i]);
                playerList[i].name.send("You are the doctor and can heal 1 person a night but you can't heal the same person twice in a row.");
              }
              if(playerList[i].role==DETECTIVE){
                console.log(playerList[i]);
                playerList[i].name.send("You are the detective and can investigate 1 person a night.");
              }
              if(playerList[i].role==TOWN){
                playerList[i].name.send("You are part of the town and need to find the mafia.");
              }
            }
            //resets gameTime after setup
            gameTime=0;
            logicGameTime=0;
          }
          //changes to night + switch to night logic
          if(logicGameTime>=180&&gameState==DAY)
          {
            mafiaChannel.send("It is now night.");
            sendNightInstructions();
            gameState=NIGHT;
            for(var i in playerList){
              mafiaChannel.overwritePermissions(playerList[i].name, {
                SEND_MESSAGES: false
              });
            }
            logicGameTime=0;
          }
          //changes to day + switch to day logic
          if(logicGameTime>=60&&gameState==NIGHT)
          {
            mafiaChannel.send("It is now day.");
            gameState=DAY;
            //at the beginning of the day tell the detective who he invetigated.
            //tell everyone who was killed.
            tellTheDetectiveWhoHeSearched();
            var playerHealed = getHealedPlayer();
            var playerKilled = getKilledPlayer();
            if(playerKilled == null || (playerKilled == playerHealed))
              mafiaChannel.send("No one was killed.");
            else
            {
              mafiaChannel.send(playerKilled.name + " was killed.");
              playerKilled.alive = false;
            }
            
            for(var i in playerList){
              if(playerList[i].alive){
                playerList[i].voteCount = 0;
                playerList[i].hasVoted = false;
                playerList[i].votedWhat = null;
                defensePlayer=null;
                guiltCount=0;
                //send a message to the chat saying who died
                
                mafiaChannel.overwritePermissions(playerList[i].name, {
                  SEND_MESSAGES: true
                });
              }
            }
            if(checkWin()){
              gameState=ENDGAME;
              mafiaChannel.send("All players will have chat functions now. 2 mins until the game deletes itself. Thanks for playing and remember to upvote in discords bots");
            }
            logicGameTime=0;
          }
          //changes to defense + switch to defense logic
          if(gameState==DEFENSE)
          {
            if(logicGameTime==1)
              mafiaChannel.send("It is now "+defensePlayer.name+"'s defense.");
            //makes everyone unable to speak except defense player
            for(var i in playerList){
              if(playerList[i]!=defensePlayer){
                mafiaChannel.overwritePermissions(playerList[i].name, {
                  SEND_MESSAGES: false
                });
              }
            }
            if(logicGameTime>=30){
              mafiaChannel.send("Your time is up, the town will have to vote on your fate.");
              gameState=VOTING;
              logicGameTime=0;
            }
          }
          if(gameState==VOTING)
          {
            if(logicGameTime==1)
              mafiaChannel.send("Use m.innocent or m.guilty to vote. Use m.cancelvote to cancel your vote");
            for(var i in playerList){
              if(playerList[i].alive){
                mafiaChannel.overwritePermissions(playerList[i].name, {
                  SEND_MESSAGES: true
                });
              }
            }
            if(logicGameTime>=30){
              if(guiltCount<0){
                defensePlayer.alive=false;
                mafiaChannel.send(defensePlayer.name+" has been sentenced to death by the town.");
              }else{
                mafiaChannel.send(defensePlayer.name+" has been voted inncocent by the town.");
              }
              if(checkWin()){
                gameState=ENDGAME;
                mafiaChannel.send("All players will have chat functions now. 2 mins until the game deletes itself. Thanks for playing and remember to upvote in discords bots");
                logicGameTime=0
              }else{
                logicGameTime=179;
                gameState=DAY;
              }
            }
          }
          if(gameState==ENDGAME)
          {
            mafiaChannel.overwritePermissions(server.id, {
                SEND_MESSAGES: true
            });
            if(logicGameTime>=120){
              resetVariables();
            }
          }
        },1000);
        
      }
        
  }
  //game has already started
  if (message.content.startsWith(prefix + 'play')&&(gameState!=-1&&gameState!=4)) 
  {
    message.channel.send("The game has started. No more players are allowed to join. Please wait for the next round.");
  }
  
  //the detective can investigate a player at night
  if (message.content.startsWith(prefix + 'investigate')&&currentPlayer!=null&&currentPlayer.role == DETECTIVE&&gameState == NIGHT&&currentPlayer.alive)
  {
    var searchNum = parseInt(message.content.substring(prefix.length + 11));
    //checks to see if there is a error from the players input.
    if(!isNaN(searchNum) && searchNum >= 0 && searchNum <= playerList.length - 1)
    {
      //you cannot search yourself.
      if(playerList[searchNum] != currentPlayer)
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
        if(playerList[searchNum].alive)
        {
          name.send("You are going to investigate " + playerList[searchNum].name + "'s house.");
          currentPlayer.detectivePm = name;
          currentPlayer.searched = playerList[searchNum];
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
  if (message.content.startsWith(prefix + 'heal')&&currentPlayer!=null&&currentPlayer.role == DOCTOR&&gameState == NIGHT&&currentPlayer.alive)
  {
    var searchNum = parseInt(message.content.substring(prefix.length + 4));
    //checks to see if there is a error from the players input.
    if(!isNaN(searchNum) && searchNum >= 0 && searchNum <= playerList.length - 1)
    {
      //cannot heal dead people.
      if(playerList[searchNum].alive)
      {
        //the doctor cannot heal the same person in a row.
        if(playerList[searchNum] != currentPlayer.healedLastRound)
        {
          //the doctor chose a player to save.
          if(playerList[searchNum] != currentPlayer) 
          {
            //put selected the player into a variable

            name.send("You chose to save" + playerList[searchNum].name);
          }
          else
          {
            name.send("You chose to save yourself. Ehhh so selfish~~");
          }
          currentPlayer.healed = playerList[searchNum];
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
  if (message.content.startsWith(prefix + 'kill')&&currentPlayer!=null&&currentPlayer.role == MAFIA&&gameState == NIGHT&&currentPlayer.alive)
  {
    var searchNum = parseInt(message.content.substring(prefix.length + 4));
    //checks to see if there is a error from the players input.
    if(!isNaN(searchNum) && searchNum >= 0 && searchNum <= playerList.length - 1)
    {
      //checks too see if the player is alive or not
      if(playerList[searchNum].alive)
      {
        if(playerList[searchNum] != currentPlayer)
        {
          if(playerList[searchNum].role != MAFIA)
          {
            currentPlayer.kill = playerList[searchNum];
            name.send("You voted to kill " + playerList[searchNum].name + ".");
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
  if(message.content.startsWith(prefix + 'vote')&&gameState == DAY&&currentPlayer!=null&&currentPlayer.alive)
  {
    var tempStr = message.content.split(" ");
    //if second parameter is a number
    if(!isNaN(tempStr[1]) && playerList[Number(tempStr[1])]!=null){
      //case checks
      if(playerList[Number(tempStr[1])]==currentPlayer){
        message.channel.send("You can not vote for yourself.");
      }
      if(!playerList[Number(tempStr[1])].alive){
        message.channel.send("You can not vote for dead people.");
      }
      if(currentPlayer.hasVoted&&currentPlayer.votedWhat==playerList[Number(tempStr[1])].name){
        message.channel.send("You have already voted for this player");
      }
      if(currentPlayer.hasVoted&&currentPlayer.votedWhat!=playerList[Number(tempStr[1])].name){
        for(var i in playerList){
          if(playerList[i].name==currentPlayer.votedWhat){
            playerList[i].voteCount--;
          }
        }
        message.channel.send(currentPlayer.name+" has retracted his vote aganist "+currentPlayer.votedWhat);
        currentPlayer.hasVoted=false;
        currentPlayer.votedWhat=null;
        playerList[Number(tempStr[1])].voteCount+=1;
        message.channel.send(currentPlayer.name+" voted for "+playerList[Number(tempStr[1])].name+" and they currently have "+playerList[Number(tempStr[1])].voteCount+" votes aganist them.");
        currentPlayer.hasVoted=true;
        currentPlayer.votedWhat=playerList[Number(tempStr[1])].name;
        //voting logic here
        if(playerList[Number(tempStr[1])].voteCount>getAllAlivePlayers().length/2){
          message.channel.send(playerList[Number(tempStr[1])].name+" has been voted on by the town and will be given 30 seconds to provide a defense before the town voted guilty or innocent.");
          gameState=DEFENSE;
          defensePlayer=playerList[Number(tempStr[1])];
          logicGameTime=0;
          for(var i in playerList){
            playerList[i].hasVoted=false;
          }
        }
      }
      if(playerList[Number(tempStr[1])].alive&&playerList[Number(tempStr[1])]!=currentPlayer&&!currentPlayer.hasVoted){
        playerList[Number(tempStr[1])].voteCount+=1;
        message.channel.send(currentPlayer.name+" voted for "+playerList[Number(tempStr[1])].name+" and they currently have "+playerList[Number(tempStr[1])].voteCount+" votes aganist them.");
        currentPlayer.hasVoted=true;
        currentPlayer.votedWhat=playerList[Number(tempStr[1])].name;
        //voting logic here
        if(playerList[Number(tempStr[1])].voteCount>getAllAlivePlayers().length/2){
          message.channel.send(playerList[Number(tempStr[1])].name+" has been voted on by the town and will be given 30 seconds to provide a defense before the town voted guilty or innocent.");
          gameState=DEFENSE;
          defensePlayer=playerList[Number(tempStr[1])];
          logicGameTime=0;
          for(var i in playerList){
            playerList[i].hasVoted=false;
          }
        }
      }
    }
    //if second parameter is a name
    if(waitingPlayersList.indexOf(tempStr[1])>-1){
      for(var i in playerList){
        if(playerList[i].name==tempStr[1])
          var tempStorePlayer=playerList[i];
      }
      //case checks
      if(tempStr[1]==currentPlayer.name){
        message.channel.send("You can not vote for yourself.");
      }
      if(!tempStorePlayer.alive){
        message.channel.send("You can not vote for dead people.");
      }
      if(currentPlayer.hasVoted&&currentPlayer.votedWhat==tempStorePlayer.name){
        message.channel.send("You have already voted for this player");
      }
      if(currentPlayer.hasVoted&&currentPlayer.votedWhat!=tempStorePlayer.name){
        for(var i in playerList){
          if(playerList[i].name==currentPlayer.votedWhat){
            playerList[i].voteCount--;
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
          gameState=DEFENSE;
          defensePlayer=tempStorePlayer;
          logicGameTime=0;
          for(var i in playerList){
            playerList[i].hasVoted=false;
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
          gameState=DEFENSE;
          defensePlayer=tempStorePlayer;
          logicGameTime=0;
          for(var i in playerList){
            playerList[i].hasVoted=false;
          }
        }
      }
    }
  }
  
  if(message.content.startsWith(prefix + 'guilty')&&gameState == VOTING&&currentPlayer!=null&&currentPlayer.alive)
  {
    if(currentPlayer.hasVoted&&currentPlayer.votedWhat){
      message.channel.send("You have already voted. Please use m.votecancel to cancel your vote.");
    }
    if(currentPlayer.hasVoted&&!currentPlayer.votedWhat){
      guiltCount-=2;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=false;
      message.channel.send(currentPlayer.name +" has changed his mind and voted innocent.");
    }
    if(currentPlayer!=defensePlayer&&!currentPlayer.hasVoted){
      guiltCount-=1;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=true;
      message.channel.send(currentPlayer.name +" has voted guilty.");
    } 
  }
  
  if(message.content.startsWith(prefix + 'innocent')&&gameState == VOTING&&currentPlayer!=null&&currentPlayer.alive)
  {
    if(currentPlayer.hasVoted&&!currentPlayer.votedWhat){
      message.channel.send("You have already voted. Please use m.votecancel to cancel your vote.");
    }
    if(currentPlayer.hasVoted&&currentPlayer.votedWhat){
      guiltCount+=2;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=true;
      message.channel.send(currentPlayer.name +" has changed his mind and voted guilty.");
    }
    if(currentPlayer!=defensePlayer&&!currentPlayer.hasVoted){
      guiltCount+=1;
      currentPlayer.hasVoted=true;
      currentPlayer.votedWhat=false;
      message.channel.send(currentPlayer.name +" has voted innocent.");
    }
  }
  
  if(message.content.startsWith(prefix + 'cancelvote')&&(gameState == VOTING || gameState == DAY)&&currentPlayer!=null&&currentPlayer.alive&&currentPlayer.hasVoted)
  {
    //voting stage
    if(gameState == VOTING){
      //guilty vote
      if(currentPlayer.votedWhat){
        guiltCount+=1;
        currentPlayer.hasVoted=false;
        currentPlayer.votedWhat=null;
        message.channel.send(currentPlayer.name+" has retracted his guilty vote.");
        //innocent vote
      }else{
        guiltCount-=1;
        currentPlayer.hasVoted=false;
        currentPlayer.votedWhat=null;
        message.channel.send(currentPlayer.name+" has retracted his innocent vote.");
      }
      //day vote stage
    }else{
      for(var i in playerList){
        if(playerList[i].name==currentPlayer.votedWhat){
          playerList[i].voteCount--;
        }
      }
      message.channel.send(currentPlayer.name+" has retracted his vote aganist "+currentPlayer.votedWhat);
      currentPlayer.hasVoted=false;
      currentPlayer.votedWhat=null;
    }
  }
  
  if(message.content.startsWith(prefix + 'debug')&&(message.author.id==process.env.BOTTOKEN)){
    message.channel.send(" gameState "+ gameState + " mafia "+ getAllMafiaPlayersNames() + " gameTime "+ gameTime + " logicGameTime "+ logicGameTime+ " guiltCount "+ guiltCount);
  }
  
  if(message.content.startsWith(prefix + 'check')&&gameState!=NOGAME&&gameState!=GAMESTARTING&&currentPlayer!=null&&currentPlayer.alive){
    var tempNames="";
    for(var i in playerList){
      tempNames+=i+". "+playerList[i].name+"\n";
    }
    message.channel.send(tempNames);
  }
  
  
  //ignore this part
  if (message.content == "good night" || message.content == "gn" || message.content == "gnight")
  {
    message.channel.send("Good Night");
  }
  
  if (message.content.startsWith("test"))
  {
    message.channel.send(message.content);
    console.log(message.content);
  }
  
});

client.login(process.env.TOKEN);