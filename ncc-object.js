var ChatRoom = function (cafeId, roomId) {
  this.cafeId = cafeId;
  this.roomId = roomId;
  this.cafeName = null;
  this.roomName = null;
  this.roomType = null;
  this.limitMemberCnt = null;
  this.memberCnt = null;
  this.memberList = [];
  this.openType = null;
  this.masterUserId = null;
  this.updateTimeSec = null;
  this.cafeImageUrl = null;
  this.lastMessage = null;
  this.createdDate = null;
}

ChatRoom.prototype.getMemberById = function (id) {
  for(var key in this.memberList) {
    var member = this.memberList[key];
    if(member.id == id) return member;
  }
  return null;
}

ChatRoom.prototype.getMemberByName = function (nickname) {
  for(var key in this.memberList) {
    var member = this.memberList[key];
    if(member.nickname == nickname) return member;
  }
  return null;
}

module.exports.ChatRoom = ChatRoom;

var Message = function (chatRoom, type, serial, time, id, sender, message) {
  this.chatRoom = chatRoom;
  this.type = type;
  this.serial = serial;
  this.time = time;
  this.id = id;
  this.sender = sender;
  this.message = message;
  this.data = null;
}

module.exports.Message = Message;

var Member = function (chatRoom, id, nickname, profileUrl) {
  this.chatRoom = chatRoom;
  this.id = id;
  this.nickname = nickname;
  this.profileUrl = profileUrl;
}

module.exports.Member = Member;
