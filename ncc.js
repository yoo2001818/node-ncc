var http = require('http');
var async = require('async');
var request = require('request');
var fs = require('fs');
var vm = require('vm');
var querystring = require('querystring');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var FormData = require('form-data');
var KeepAliveAgent = require('keep-alive-agent');

var enums = require('./ncc-enum');

var objects = require('./ncc-object');
var ChatRoom = objects.ChatRoom;
var Message = objects.Message;
var Member = objects.Member;

module.exports.ChatRoom = ChatRoom;
module.exports.Message = Message;
module.exports.Member = Member;

module.exports.enums = enums;

module.exports.validateLogin = function (cookieJar, callback) {
  request({
    url: enums.CHAT_HOME_URL,
    jar: cookieJar,
    strictSSL: false
    }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if(response.request.uri.href.indexOf("nidlogin.login?") != -1) {
        callback(null);
      } else {
        var pattern = /var g_sUserId = "([^"\n]+)";/;
        var matched = pattern.exec(body);
        callback(matched[1]);
      }
    } else {
      callback(null);
    }
  });
}

module.exports.login = function (userID, password, callback) {
  async.waterfall([
    function (iCallback) {
      var cookieJar = request.jar();
      request({
        url: 'http://static.nid.naver.com/enclogin/keys.nhn',
        jar: cookieJar
        }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          iCallback(null, cookieJar, body);
        } else {
          iCallback(error);
        }
      });
    },
    function (cookieJar, keyString, iCallback) {
      fs.readFile(__dirname+'/naver_login.js', {encoding: "utf-8"}, function (error, data) {
        if(!error) {
          iCallback(null, cookieJar, keyString, data);
        } else {
          iCallback(error);
        } 
      });
    },
    function (cookieJar, keyString, loginScript, iCallback) {
      var sandbox = {};
      sandbox.uid = userID;
      sandbox.upw = password;
      sandbox.keystr = keyString;
      var runCode = 
        "rsa = new RSAKey();" +
        "keySplit();" +
        "rsa.setPublic(evalue, nvalue);" +
        "encrypted = rsa.encrypt(getLenChar(sessionkey)+sessionkey+getLenChar(uid)+uid+getLenChar(upw)+upw);";
      try {
        var context = vm.createContext(sandbox);
        vm.runInContext(loginScript, context, 'naver_login.js');
        vm.runInContext(runCode, context);
        iCallback(null, cookieJar, context.keyname, context.encrypted);
      } catch (e) {
        iCallback(e);
      }
    },
    function (cookieJar, keyName, encryptedPassword, iCallback) {
      var options = {
        url: 'https://nid.naver.com/nidlogin.login',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/plain'
        },
        method: 'POST',
        body: querystring.stringify({
          enctp: 1,
          encnm: keyName,
          svctype: 0,
          enc_url: 'http0X0.0000000000001P-10220.0000000.000000www.naver.com',
          url: 'www.naver.com',
          smart_level: 1,
          encpw: encryptedPassword
        }),
        jar: cookieJar
      };
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var cookieText = cookieJar.getCookieString('https://nid.naver.com/', {});
          if(cookieText.indexOf("NID_AUT") != -1) {
            iCallback(null, cookieJar);
          } else {
            iCallback("Invalid ID or password");
          }
        } else {
          iCallback(error);
        }
      });
    }
  ], function(error, result) {
    callback(error, result);
  });
}

var Session = function (uid, cookieJar) {
  EventEmitter.call(this);
  this.chatRooms = {};
  this.connected = false;
  this.uid = uid;
  this.sid = null;
  this.ssid = 1;
  this.sessionServerUrl = null;
  this.request = request.defaults({
    jar: cookieJar,
    strictSSL: false,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Referer': enums.CHAT_HOME_URL
    },
    pool: new KeepAliveAgent.Secure(),
    timeout: (enums.CONFIG.POLLING_TIMEOUT * 1000)
  });
}

util.inherits(Session, EventEmitter);

module.exports.Session = Session;

Session.prototype.getChatRoom = function (cafeId, roomId) {
  var key = cafeId + '/' + roomId;
  if(!!this.chatRooms[key]) return this.chatRooms[key];
  var chatRoom = new ChatRoom(cafeId, roomId);
  this.chatRooms[key] = chatRoom;
  return chatRoom;
}
Session.prototype.requestChatRoomList = function (callback) {
  var self = this;
  var body = {
    cafeId: 0,
    type: 1, // What does this mean?
    lastMsgTimeSec: 0,
    size: 100
  };
  this.sendCommand(enums.COMMAND_TYPE.GetRoomList, body, function (error, data) {
    if(!!error) {
      callback(error, data);
      return;
    }
    var body = data.bdy.roomList;
    for(var key in body) {
      var entry = body[key];
      var room = self.getChatRoom(entry.cafeId, entry.roomId);
      room.roomName = entry.roomName;
      room.cafeName = entry.cafeName;
      room.cafeImageUrl = entry.cafeImageUrl;
      room.lastMessage = new Message(room, entry.lastMsgType, entry.lastMsgSn, 
        entry.lastMsgTimeSec, entry.lastMsgTimeSec, null, entry.lastMsg);
      room.roomType = entry.roomType;
      room.openType = entry.openType;
      room.limitMemberCnt = 100; // Hard coded
      room.memberCnt = entry.memberCnt;
      room.masterUserId = entry.masterUserId;
      room.updateTimeSec = entry.lastMsgTimeSec;
      room.createdDate = entry.createDate;
    }
    callback(null, self);
  });
}
Session.prototype.requestChatRoomInfo = function (chatRoom, callback, fresh) {
  var body = {
    cafeId: chatRoom.cafeId,
    roomId: chatRoom.roomId,
    updateTimeSec: 0,
    size: 20
  };
  var self = this;
  this.sendCommand(enums.COMMAND_TYPE.SyncRoom, body, function (error, data) {
    if(!!error) {
      if(callback) callback(error, data);
      return;
    }
    var body = data.bdy;
    chatRoom.isFetched = true;
    chatRoom.cafeName = body.cafeName;
    chatRoom.roomName = body.roomName;
    chatRoom.roomType = body.roomType;
    chatRoom.openType = body.openType;
    chatRoom.memberCnt = body.membercnt;
    chatRoom.limitMemberCnt = body.limitMemberCnt;
    chatRoom.updateTimeSec = body.updateTimeSec;
    chatRoom.masterUserId = body.masterUserId;
    chatRoom.memberList = [];
    for(var key in body.memberList) {
      var memberEntry = body.memberList[key];
      var member = new Member(chatRoom, memberEntry.memberId, memberEntry.nickname, memberEntry.memberProfileImageUrl.web);
      chatRoom.memberList.push(member);
    }
    if(fresh) {
      var msgList = body.msgList;
      chatRoom.lastMessage = new Message(chatRoom, 0, body.lastMsgSn, null, null, null, null);
      for(var key in msgList) {
        var messageItem = msgList[key];
        messageItem.cafeId = chatRoom.cafeId;
        messageItem.roomId = chatRoom.roomId;
        self.handleNotification(messageItem);
      }
    }
    if(callback) callback(null, chatRoom, body.msgList, body.lastMsgSn);
  });
}
Session.prototype.requestRoomMemberList = function (chatRoom, callback) {
  var body = {
    cafeId: chatRoom.cafeId,
    roomId: chatRoom.roomId
  };
  this.sendCommand(enums.COMMAND_TYPE.SyncRoom, body, function (error, data) {
    if(!!error) {
      callback(error, data);
      return;
    }
    var body = data.bdy;
    chatRoom.masterUserId = body.masterInfo.userId;
    chatRoom.memberList = [];
    var member = new Member(chatRoom, body.masterInfo.userId, body.masterInfo.nickname, body.masterInfo.profileUrl.web);
    chatRoom.memberList.push(member);
    for(var key in body.memberList) {
      var memberEntry = body.memberList[key];
      var member = new Member(chatRoom, memberEntry.userId, memberEntry.nickname, memberEntry.profileUrl.web);
      chatRoom.memberList.push(member);
    }
    callback(null, chatRoom);
  });
}
Session.prototype.requestCafeList = function (callback) {
  var body = {};
  this.sendCommand(enums.COMMAND_TYPE.FindMyCafeList, body, function (error, data) {
    if(!!error) {
      callback(error, data);
      return;
    }
    var body = data.bdy;
    callback(null, body);
  });
}
Session.prototype.requestOpenRoomList = function (cafeId, page, callback) {
  var body = {
    cafeId: cafeId,
    orderBy: 'LastMsgTimestamp',
    page: page
  };
  this.sendCommand(enums.COMMAND_TYPE.FindOpenRoomList, body, function (error, data) {
    if(!!error) {
      callback(error, data);
      return;
    }
    var body = data.bdy;
    callback(null, body);
  });
}
Session.prototype.requestSyncMessage = function (chatRoom, lastMsgSn, callback) {
  var body = {
    cafeId: chatRoom.cafeId,
    roomId: chatRoom.roomId,
    lastMsgSn: lastMsgSn,
    size: 100
  };
  var self = this;
  this.sendCommand(enums.COMMAND_TYPE.SyncMsg, body, function (error, data) {
    if(!!error) {
      if(error.code == enums.NOT_FOUND_ROOM) {
        delete chatRoom;
      }
      callback(error);
      return;
    }
    var body = data.bdy.msgList;
    chatRoom.lastMessage = new Message(chatRoom, 0, data.bdy.lastMsgSn, null, null, null, null);
    for(var key in body) {
      var messageItem = body[key];
      messageItem.cafeId = chatRoom.cafeId;
      messageItem.roomId = chatRoom.roomId;
      self.handleNotification(messageItem);
    }
    callback(null, body);
  });
}
Session.prototype.requestGetMessage = function (chatRoom, from, to, callback) {
  var body = {
    cafeId: chatRoom.cafeId,
    roomId: chatRoom.roomId,
    startMsgSn: from,
    endMsgSn: to
  };
  this.sendCommand(enums.COMMAND_TYPE.GetMsg, body, function (error, data) {
    if(!!error) {
      callback(error);
      return;
    }
    var body = data.bdy.msgList;
    callback(null, body);
  });
}
Session.prototype.requestDeleteRoom = function (chatRoom, callback) {
  var body = {
    cafeId: chatRoom.cafeId,
    roomId: chatRoom.roomId
  };
  this.sendCommand(enums.COMMAND_TYPE.DeleteRoom, body, function (error, data) {
    if(!!error) {
      if(callback) callback(error, data);
      return;
    }
    delete chatRoom;
    if(callback) callback(null, data);
  });
}
Session.prototype.getMyself = function (chatRoom) {
  return chatRoom.getMemberById(this.uid);
}
Session.prototype.connect = function (callback) {
  var self = this;
  if(!this.connected) {
    if(this.ssid != null) {
      this.sessionServerUrl = enums.HT_SESSION_SERVER_URLS[this.ssid];
    } else {
      this.sessionServerUrl = enums.HT_SESSION_SERVER_URLS[Math.floor(Math.random()*10)+11];
    }
    var param = {
      callback_fn: 'window.__jindo2_callback._'+(Math.floor(Math.random()*900)+100),
      uid: this.uid,
      tid: new Date().getTime().toString(),
      devType: enums.DEVICE_TYPE.WEB,
      crypto: false
    };
    this.request(this.sessionServerUrl+enums.CONNECT_URL+'?'+querystring.stringify(param), function (error, response, body) {
      if(error) {
        if(!!callback) callback(error);
        return;
      }
      var unpacked = body.slice(body.indexOf('"')+1, body.lastIndexOf('"'));
      var decrypted = enums.base64._utf8_decode(enums.base64.decode(unpacked));
      var message = JSON.parse(decrypted);
      if(message.cmd == enums.RESULT_CODE.CONN_RESP) {
        if (message.retCode == enums.RESULT_CODE.CMD_SUCCESS) {
          self.sid = message.bdy.sid;
          self.connected = true;
          if(!!callback) callback(null);
        } else {
          if(!!callback) callback(message);
          return;
        }
      }
      setTimeout(function (){
        self.poll();
      }, enums.CONFIG.POLL_SLEEP_DELAY);
    });
  }
}
Session.prototype.handlePoll = function (message) {
  var self = this;
  //console.log(JSON.stringify(message));
  if(message.retCode == enums.RESULT_CODE.CMD_SUCCESS) {
    var messageList = message.bdy;
    for(var key in messageList) {
      var messagePacket = messageList[key];
      this.emit('notification', messagePacket);
      this.handleNotification(messagePacket.bdy, messagePacket.cmd);
    }
  }
  self.poll();
}
Session.prototype.handleNotification = function (body, cmd) {
  var self = this;
  var chatRoom = this.getChatRoom(body.cafeId, body.roomId);
  // refresh user information
  var member = chatRoom.getMemberById(body.senderId);
  if(!member) {
    member = new Member(chatRoom, body.senderId, body.senderNickname, body.senderProfileUrl.web);
    chatRoom.memberList.push(member);
  }
  member.id = body.senderId;
  member.nickname = body.senderNickname;
  member.profileUrl = body.senderProfileUrl.web;
  if(chatRoom.syncingMessage && !(cmd == null || cmd == undefined)) {
    console.log('syncing interrupt');
    return;
  }
  if(cmd == enums.NOTI_TYPE.Msg || cmd == null || cmd == undefined) {
    this.emit('raw_message', body);
    // process message
    var message = new Message(chatRoom, body.msgType, body.msgSn, body.msgTimeSec, body.msgId, member, body.msg);
    var prevMessage = chatRoom.lastMessage;
    chatRoom.lastMessage = message;
    if(prevMessage) {
      var messageDiff = message.serial - prevMessage.serial;
      if(messageDiff > 1) {
        console.log('requesting sync: missing chat message');
        chatRoom.syncingMessage = true;
        this.requestSyncMessage(chatRoom, prevMessage.serial, function (error, data) {
          chatRoom.syncingMessage = false;
        });
        return;
      }
    }
    if(message.type == enums.MSG_TYPE.Normal) {
      this.emit('text_message', message);
    }
    if(message.type == enums.MSG_TYPE.Image) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'Image: '+data.orgUrl;
      this.emit('image_message', message);
    }
    if(message.type == enums.MSG_TYPE.Sticker) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'Sticker: '+data.stickerId;
      this.emit('sticker_message', message);
    }
    if(message.type == enums.MSG_TYPE.Invite) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'Invited: '+data.sender.nickName+' -> '+data.target.map(function(a){return a.nickName}).join(',');
      this.emit('announce_message', message);
    }
    if(message.type == enums.MSG_TYPE.Leave) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'Left: '+data.sender.nickName;
      this.emit('announce_message', message);
      chatRoom.memberList.splice(chatRoom.memberList.indexOf(member), 1);
    }
    if(message.type == enums.MSG_TYPE.JoinRoom) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'Joined: '+data.sender.nickName;
      this.emit('announce_message', message);
    }
    if(message.type == enums.MSG_TYPE.ChangeRoomName) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'RoomName Change: '+data.actionItem;
      this.emit('announce_message', message);
      chatRoom.roomName = data.actionItem;
    }
    if(message.type == enums.MSG_TYPE.ChangeMasterId) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'Master Change: '+data.actionItem;
      this.emit('announce_message', message);
      chatRoom.masterUserId = chatRoom.getMemberByName(data.actionItem).id;
    }
    if(message.type == enums.MSG_TYPE.RejectMember) {
      var data = JSON.parse(message.message);
      message.data = data;
      message.message = 'Blocked: '+data.actionItem.nickName;
      this.emit('announce_message', message);
      chatRoom.memberList.splice(chatRoom.memberList.indexOf(chatRoom.getMemberById(data.actionItem.memberId)), 1);
    }
    if(message.type == enums.MSG_TYPE.OpenRoomCreateGreeting) {
      message.message = 'Created chatroom';
      this.emit('announce_message', message);
    }
    this.emit('all_message', message);
  } else if(cmd == enums.NOTI_TYPE.ClosedOpenroom) {
    // room exploded
  } else {
    if(cmd == enums.NOTI_TYPE.Invited) {
      if(body.isToInvitee) {
        //WORKAROUND: invite message doesn't show if you're invited
        chatRoom.syncingMessage = true;
        var self = this;
        this.requestChatRoomInfo(chatRoom, function (error, data2, msgList, lastMsgSn) {
          //Create fake object
          var message = new Message(chatRoom, enums.MSG_TYPE.Invite, lastMsgSn - msgList.length, new Date().getTime()/1000, new Date().getTime(), member, 'Invited: '+member.nickname+' -> '+self.getMyself(chatRoom).nickname);
          message.data = {
            sender: {
              id: member.id,
              nickName: member.nickname
            },
            target: [{
              id: self.getMyself(chatRoom).id,
              nickName: self.getMyself(chatRoom).nickname
            }]
          };
          self.emit('announce_message', message);
          self.emit('all_message', message);
          chatRoom.lastMessage = new Message(chatRoom, 0, lastMsgSn, null, null, null, null);
          for(var key in msgList) {
            var messageItem = msgList[key];
            messageItem.cafeId = chatRoom.cafeId;
            messageItem.roomId = chatRoom.roomId;
            self.handleNotification(messageItem);
          }
          chatRoom.syncingMessage = false;
        }, false);
        return;
      }
      console.log(JSON.stringify(body));
    }
    if(chatRoom.lastMessage) {
      console.log('requesting sync');
      var prevMessage = chatRoom.lastMessage;
      chatRoom.syncingMessage = true;
      this.requestSyncMessage(chatRoom, prevMessage.serial, function (error, data) {
        chatRoom.syncingMessage = false;
      });
    } else {
      console.log('downloading room information');
      chatRoom.syncingMessage = true;
      var self = this;
      this.requestChatRoomInfo(chatRoom, function (error, data) {
        self.requestGetMessage(chatRoom, chatRoom.lastMessage.serial - 60, chatRoom.lastMessage.serial, function (error, data) {
          console.log(JSON.stringify(data));
        });
        chatRoom.syncingMessage = false;
      }, true);
    }
  }
  
  /* else if(cmd == enums.NOTI_TYPE.JoinRoom) {
    this.emit('join', member);
    this.emit('announce', 'join', member);
  } else if(cmd == enums.NOTI_TYPE.DeleteRoom) {
    this.emit('quit', member);
    this.emit('announce', 'quit', member);
  } else if(cmd == enums.NOTI_TYPE.Invited) {
    if(body.isToInvitee == false) {
      var data = JSON.parse(body.msg);
      this.emit('invite', member, data.target);
      this.emit('announce', 'invite', member, data.target);
    } else {
      // you are invited
      console.log(JSON.stringify(body));
      this.emit('invite', member, {id: body.senderId, nickName: body.senderNickname});
      this.emit('announce', 'invite', member, {id: body.senderId, nickName: body.senderNickname});
    }
  } else {
    console.log(JSON.stringify(message));
  }*/
  
}
Session.prototype.poll = function () {
  var self = this;
  var param = {
    callback_fn: 'window.__jindo2_callback._'+(Math.floor(Math.random()*900)+100),
    sid: this.sid,
    tid: new Date().getTime().toString(),
    crypto: false
  };
  this.request(this.sessionServerUrl+enums.POLL_URL+'?'+querystring.stringify(param), function (error, response, body) {
    if(error) {
      self.emit('error', error);
      self.poll();
      return;
    }
    var unpacked = body.slice(body.indexOf('"')+1, body.lastIndexOf('"'));
    var decrypted = enums.base64._utf8_decode(enums.base64.decode(unpacked));
    try {
      self.handlePoll(JSON.parse(decrypted));
    } catch (e) {
      self.emit('error', e);
      self.poll();
      console.log(e);
    }
  });
}
Session.prototype.sendCommand = function(command, body, callback) {
  var self = this;
  var param = {
    ver: enums.VERSION,
    uid: this.uid,
    tid: new Date().getTime().toString(),
    sid: this.sid,
    deviceType: enums.DEVICE_TYPE.WEB,
    cmd: command,
    bdy: body
  };
  this.request({
    url: enums.CHAT_BROKER_SSL_URL+enums.COMMAND_URL,
    method: 'POST',
    body: JSON.stringify(param)
  }, function(error, response, body) {
    if(!error) {
      var message = JSON.parse(body);
      self.emit('command', message);
      if(message.retCode != enums.COMMAND_RESULT_CODE.SUCCESS) {
        self.emit('error', {msg: message.retMsg, code: message.retCode});
        if(!!callback) callback({msg: message.retMsg, code: message.retCode});
      } else {
        if(!!callback) callback(null, message, param);
      }
    } else {
      self.emit('error', error);
      if(!!callback) callback(error);
    }
  });
}
Session.prototype.sendMessage = function(chatRoom, message, callback) {
  var body = {
    cafeId: chatRoom.cafeId,
    roomId: chatRoom.roomId,
    msgType: message.type,
    msgId: message.id,
    msg: message.message
  };
  var self = this;
  this.sendCommand(enums.COMMAND_TYPE.SendMsg, body, function(error, data) {
    if(error) {
      if(callback) callback(error, data);
      return;
    }
    message.serial = data.bdy.msgSn;
    message.time = data.bdy.msgTimeSec;
    var prevMessage = chatRoom.lastMessage;
    chatRoom.lastMessage = message;
    var messageDiff = message.serial - prevMessage.serial;
    if(messageDiff > 1) {
      self.requestGetMessage(chatRoom, (prevMessage.serial+1), (message.serial-1), function (error, data) {
        if(error) {
          self.emit('error', error);
          console.log(error);
          return;
        }
        for(var key in data) {
          var messageItem = data[key];
          messageItem.cafeId = chatRoom.cafeId;
          messageItem.roomId = chatRoom.roomId;
          self.handleNotification(messageItem);
        }
        chatRoom.lastMessage = message;
        if(callback) callback(error, data);
        message.sent = true;
        if(message.type == enums.MSG_TYPE.Normal) {
          self.emit('text_message_sent', message);
        }
        if(message.type == enums.MSG_TYPE.Image) {
          var data = JSON.parse(message.message);
          message.data = data;
          message.message = 'Image: '+data.orgUrl;
          self.emit('image_message_sent', message);
        }
        if(message.type == enums.MSG_TYPE.Sticker) {
          var data = JSON.parse(message.message);
          message.data = data;
          message.message = 'Sticker: '+data.stickerId;
          self.emit('sticker_message_sent', message);
        }
        self.emit('all_message_sent', message);
      });
      return;
    }
    if(callback) callback(error, data);
    message.sent = true;
    if(message.type == enums.MSG_TYPE.Normal) {
      self.emit('text_message_sent', message);
    }
    if(message.type == enums.MSG_TYPE.Image) {
      message.message = 'Image: '+message.data.orgUrl;
      self.emit('image_message_sent', message);
    }
    if(message.type == enums.MSG_TYPE.Sticker) {
      message.message = 'Sticker: '+message.data.stickerId;
      self.emit('sticker_message_sent', message);
    }
    self.emit('all_message_sent', message);
  });
}
Session.prototype.sendText = function(chatRoom, message, callback) {
  var data = new Message(chatRoom, enums.MSG_TYPE.Normal, 0, new Date().getTime()/1000, 
    new Date().getTime(), this.getMyself(chatRoom), message);
  this.sendMessage(chatRoom, data, callback);
  return data;
}
Session.prototype.sendImage = function(chatRoom, readStream, callback) {
  var self = this;
  var r = this.request.post(enums.UPLOAD_URL + enums.UPLOAD_PIC_URL, function (error, response, body) {
    if(!error) {
      var regex = /\]\)\('([^']+)'\);/;
      var unpacked = regex.exec(body);
      if(unpacked.length < 2) {
        callback(new Error('File transfer failed'));
        return;
      }
      unpacked = unpacked[1];
      var data = JSON.parse(unpacked);
      var param = {
        path: data.savedPath,
        fileSize: data.size,
        width: data.width,
        height: data.height
      };
      var message = new Message(chatRoom, enums.MSG_TYPE.Image, 0, new Date().getTime(), 
        new Date().getTime(), self.getMyself(chatRoom), param);
      self.sendMessage(chatRoom, message, function(error, data) {
        if(!!error && !!callback) callback(error);
        else if(!!callback) callback(null, message);
      });
    } else {
      self.emit('error', error);
      if(!!callback) callback(error);
    }
  });
  var form = r.form();
  form.append('photo', readStream);
  form.append('callback', '/html/AttachImageDummyCallback.html');
  form.append('callback_func', 'tmpFrame_'+(Math.floor(Math.random()*9000)+1000)+'_func');
}
Session.prototype.sendSticker = function(chatRoom, stickerId, callback) {
  var data = new Message(chatRoom, enums.MSG_TYPE.Sticker, 0, new Date().getTime(), 
    new Date().getTime(), this.getMyself(chatRoom), stickerId);
  this.sendMessage(chatRoom, data, callback);
  return data; 
}
