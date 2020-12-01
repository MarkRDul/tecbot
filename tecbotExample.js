const Discord = require("discord.js")
const client= new Discord.Client()

//Name to your config file - should include a prefix and the bot's token
const config = require ("./configTecExample.json")

//A dictionary to hold current games - will be populated later
tttGames={}

//A message will follow this pattern if intended for the bot:
// <prefix> <command> <arguments>
//The prefix is defined in your config.json file, the command is the word that follows the prefix, and arguments hold any other relevant data

client.on("message", msg => {
    //Get arguments after the prefix
    arguments=msg.content.slice(config.prefix.length).trim().split(/ +/)
    //Check if the author is a bot or the message starts with the prefix - if it is a bot or starts with a prefix, return
    if (msg.author.bot||!msg.content.toLowerCase().startsWith(config.prefix)) return;
    if (arguments[0]=="ttt"){
        //Check if there currently is a game for the user
       gameCheck=checkGame(msg)
        //If there is a current game, expect an argument for the space to play in
        if (gameCheck){
            spot=parseInt(arguments[1])
            //Check if spot is a number, if so play in that spot
            if (!isNaN(spot)){
                userPlay(spot, msg)
            }
        }
    }
})

client.login(config.token)

//Checks whether or not a game exists with the author of the message
//Passes in msg, which is the object from the client.on("message" => msg above
function checkGame(msg){
    //Check if the msg author has a currently saved game
    if (!tttGames[msg.author]){
        //The board is nine dashes store in an array
        ttt=["-","-","-","-","-","-","-","-","-"]
        //Rand is used to determine who goes first.
        //Math.random() returns a number between 0 and 1. Multiply that by two to get a value between 0-2.
        //Math.floor() returns the rounded down version of a decimal to an integer. Math.floor(1.99) returns 1.
        rand=Math.floor(Math.random()*2)
        //Save the game in the dictionary with the author as the key.
        //The value is an array with the board for that user and a true/false value for whether the play went first.
        tttGames[msg.author]=[ttt,rand>=1]
        //Send the user a message confirming a game has started
        msg.channel.send("You have started a game of Tic Tac Toe. Use !tec ttt <number> to play in that space.")
        //The ? in the following command can send two pieces depending on whether the data before the ? is true or false.
        //tttGames[msg.author][1] is the true/false value of whether the user went first - allowing us to use the ?
        //The following two strings are in the true:false pattern - if true, send the first. If false, send the second. Separate with a :
        msg.channel.send(tttGames[msg.author][1]?"You are going first.":"The bot is going first.")
        //If the user does not go first
        if (tttGames[msg.author][1]===false){
            //Have the bot play. Since the bot goes first, the X token is assigned to the bot
            botPlay(tttGames[msg.author][0],"X",msg)
            //Push the O token to the user as they will go second
            tttGames[msg.author].push("O")
        }
        //If the user goes first
        else{
            //Push the X token to the user as they will go first
            tttGames[msg.author].push("X")
            //Display the board and wait for them to play
            displayBoard(tttGames[msg.author][0],msg)
        }
        //Return false to show that there was not a game in session, meaning we shouldn't expect an additional argument for position
        return false
    }
    //If there is a current game, return true to look for the spot the user wants to play in
    return true
}

//botPlay is a simple random number generated function to provide a base level player. It is not the smartest bot.
//Pass in the board of the game, the token the bot uses, and msg from above to send messages
function botPlay(board,token,msg){
    //Get a random spot on the board from 0-8 using the same method as checkGame
    rand=Math.floor(Math.random()*9)
    //Generate a check to see if the board has played
    check=false
    //While the bot has not played
    while(!check){
        //If the board at the random spot is empty
        if (board[rand]==="-"){
            //Set the token at the spot on the board and set check to true
            board[rand]=token
            check=true
        }
        //Else generate a new random spot
        else{
            rand=Math.floor(Math.random()*9)
        }
    }
    //Send back where the bot played and display the board for the user
    msg.channel.send("The bot played in spot "+rand+".")
    displayBoard(board,msg)
}

//userPlay is the heavy lifter - it plays for the user and has the logic for the game flow.
//Pass in the spot the user wants to play in and msg from above to send messages
function userPlay(spot,msg){
    //set user to tttGames[msg.author] as it will be referred to a lot in this function. Designed to save time.
    user=tttGames[msg.author]
    //
    //  Important to remember - user[0] is the board. user[1] is the true/false value for whether the user went first. user[2] is the user's token.
    //
    // We take spot-1 because the index of an array starts at 0, while the user will enter 1-9 for a TTT board.
    // If the board at spot-1 is a blank space
    if (user[0][spot-1]==="-"){
        //That spot on the board is now user[2], which is the token the user is playing with
        user[0][spot-1]=user[2]
        //Check if the game is finished - if checkFinished(board) is not a dash, the game is over
        if (checkFinished(user[0])!=="-"){
            //Get the result of the game
            winner=checkFinished(user[0])
            //If checkFinished(board) returns the user's token, the user has won
            if (winner===user[2]){
                //Send back the board, delete the game from tttGames (as it has finished), and return so the function doesn't continue running.
                msg.channel.send("You have won!")
                displayBoard(user[0],msg)
                delete tttGames[msg.author]
                return
            }
            //If not the game has ended in a tie. Repeat the same logic above
            else{
                msg.channel.send("The game has ended in a tie.")
                displayBoard(user[0],msg)
                delete tttGames[msg.author]
                return
            }
        }
        //If the game is still ongoing, the bot needs to play
        else{
            //Have the bot play. user[1]?"O":"X" checks whether the user went first. If the user went first, user[1] is true, which means the bot plays the O token.
            botPlay(user[0],user[1]?"O":"X",msg)
            //Repeat the same check finished logic as above. Only change is to not display the board as botPlay displays the board anyway.
            if (checkFinished(user[0])!=="-"){
                winner=checkFinished(user[0])
                if (winner==="tie"){
                    msg.channel.send("The game has ended in a tie.")
                    delete tttGames[msg.author]
                    return
                }
                else{
                    msg.channel.send("The bot has won the game.")
                    delete tttGames[msg.author]
                    return
                }
            }
        }
    }
    //If the user enters a number not between 1-9 or the spot is already taken, send them a message.
    else{
        msg.channel.send("The board spot entered is either unavailable or taken.")
    }
}

//displayBoard is set to print out the board in a way that spaces out characters equally, presenting a decent board shape
//The ``` at the beginning specifies to discord that the board should be in a code block. A code block will space out characters equally within.
//If it is not in a code block the board will compress in size and will not look like a board when sent in the discord chat.
function displayBoard(board, msg){
    msg.channel.send("``` "+board[0]+" | "+board[1]+" | "+board[2]+"\n-----------\n "+board[3]+" | "+board[4]+" | "+board[5]+"\n-----------\n "+board[6]+" | "+board[7]+" | "+board[8]+"```")
}


//checkFinished is used to see if the game is finished.
//Pass in the board of the game.
function checkFinished(board){
    //The logic of the checks are to see if the three spots on the board are the same character and that one of those spots isn't empty
    //If it is not empty and all three spots match, somebody has won. Return that token and we can determine who won from the tttGames object
    //Remember that the board is in this form:
    // 0 | 1 | 2
    // ---------
    // 3 | 4 | 5
    // ---------
    // 6 | 7 | 8
    //Check the rows of the board
    if (board[0]!=="-"&&board[0]===board[1]&&board[1]===board[2]){return board[0]} //First row
    if (board[3]!=="-"&&board[3]===board[4]&&board[4]===board[5]){return board[3]} //Second row
    if (board[6]!=="-"&&board[6]===board[7]&&board[7]===board[8]){return board[6]} //Third row

    //Check the columns on the board
    if (board[0]!=="-"&&board[0]===board[3]&&board[3]===board[6]){return board[0]} //First column
    if (board[1]!=="-"&&board[1]===board[4]&&board[4]===board[7]){return board[1]} //Second column
    if (board[2]!=="-"&&board[2]===board[5]&&board[5]===board[8]){return board[2]} //Third column

    //Check the diagonals on the board
    if (board[0]!=="-"&&board[0]===board[4]&&board[4]===board[8]){return board[0]} //Top left to bottom right
    if (board[2]!=="-"&&board[2]===board[4]&&board[4]===board[6]){return board[2]} //Top right to bottom left

    //If it's down here and still hasn't returned, nobody has won. Need to check for a tie before returning the game is still in progress.
    //Set space to false. This is used to check if there is an empty space on the board.
    space=false
    //For every spot on the board
    for (x=0;x<board.length;x++){
        //If that space on the board is empty
        if (board[x]==="-"){
            //Set space to true.
            space=true
        }
    }
    //If space is still false, that means every spot has a token and nobody won. Therefore the game has ended in a tie.
    if (!space){
        return "Tie"
    }
    //If there is a space, the game is still going. Return a dash to indicate the game is still ongoing.
    return "-"
}


