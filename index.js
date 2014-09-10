// node-ncc test

var fs = require('fs');
var util = require('util');
var request = require('request');
var async = require('async');
var tough = require('tough-cookie');
var path = require('path');

var ncc = require('./ncc');

var config;
try {
  config = (JSON.parse(fs.readFileSync('config.json', 'utf8')));
} catch (e) {
  console.log('설정 파일이 존재하지 않습니다.');
  process.exit(2);
}

var cookieJar = new request.jar();
try {
  var cookieText = fs.readFileSync('cookie.json', 'utf8');
  var cookieList = JSON.parse(cookieText);
  for(var key in cookieList) {
    // Dirty method :P
    var cookie = tough.Cookie.fromJSON(JSON.stringify(cookieList[key]));
    cookieJar._jar.store.putCookie(cookie, function () {});
  }
  console.log("Loaded cookies.");
} catch (e) {
}

var userID;
var session;

async.waterfall([
  function (callback) {
    // validate naver login
    console.log("Validating login information.");
    ncc.validateLogin(cookieJar, function (data) {
      if(data == null) {
        console.log("Logging in...");
        callback(null, false);
      } else {
        console.log("Already logged in with ID " + data);
        userID = data;
        callback(null, true);
      }
    });
  },
  function (logged, callback) {
    if(logged) {
      callback(null);
      return;
    }
    ncc.login(config.id, config.password, function (error, data) {
      if(error) {
        console.log(error);
        process.exit(3);
        return;
      }
      console.log("Logged on!");
      ncc.validateLogin(data, function (data) {
        if(data == null) {
          console.log("Nope");
        } else {
          console.log("Already logged in with ID " + data);
        }
      });
      cookieJar = data;
      userID = config.id;
      /// save cookies
      var cookieList = cookieJar.getCookies('https://nid.naver.com/');
      fs.writeFile('cookie.json', JSON.stringify(cookieList), function (error) {
        if(error) throw error;
        callback(null);
      });
    });
  },
  function (callback) {
    // create session and connect to them
    console.log("Connecting to chat server");
    session = new ncc.Session(userID, cookieJar);
    session.connect(function (error) {
      if(!error) {
        callback(null);
      }
    });
  },
  function (callback) {
    // request room info and print it
    session.requestChatRoomList(function (error) {
      if(!!error) {
        console.log(error);
      }
      // print room information
      for(var key in session.chatRooms) {
        var chatRoom = session.chatRooms[key];
        console.log([chatRoom.cafeName, '-', chatRoom.roomName,
          ':', chatRoom.lastMessage.message].join(' '));
      }
      console.log("----------------------");
    });
    session.on('all_message', function(message) {
      if(message.message == "!echotest") {
        session.sendText(message.chatRoom, "Echo test return message");
      }
      if(message.message == "!phototest") {
        session.sendImage(message.chatRoom, 
          fs.createReadStream(path.join(__dirname, 'imagetest.png')));
      }
      if(message.message == "!stickertest") {
        session.sendSticker(message.chatRoom, "moon_and_james-2");
      }
      console.log(message.chatRoom.roomName+" - "+message.sender.nickname + " : " + message.message);
    });
    session.on('announce', function(type, member) {
      console.log(member.chatRoom.roomName+" - "+member.nickname + " has "+ type);
    });
    session.on('error', function(data) {
      console.log(data);
    });
  }
]);
