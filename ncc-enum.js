module.exports.DEVICE_TYPE = {
  WEB: 2001
};
module.exports.COMMAND_TYPE = {
  CreateRoom: 1101,
  InviteRoom: 1102,
  DeleteRoom: 1005,
  SyncRoom: 1006,
  GetRoomList: 1010,
  ChangeRoomName: 1011,
  SetRoomAlarm: 1012,
  DelegateMaster: 1013,
  FindOpenRoomList: 1014,
  RejectMember: 1015,
  FindMyCafeList: 1016,
  ProhibitWordCheck: 1017,
  GetRoomMemberList: 2001,
  SendMsg: 3001,
  SyncMsg: 3002,
  GetMsg: 3003,
  AckMsg: 3004,
  ReportBadMember: 5001,
  CloseOpenroom: 6001,
  GetGroupChatUseConfigList: 100001,
  GetCafeGroupChatUse: 100002,
  ChageGroupChatUseConfig: 100003,
  GetBlockMemberList: 100101,
  AddBlockMember: 100102,
  DeleteBlockMember: 100103,
  CheckBlockMemberList: 100104
};
module.exports.ROOM_TYPE = {
  '1to1': 0,
  '1toN': 1
};
module.exports.OPEN_TYPE = {
  OPEN: 'O',
  CLOSE: 'C'
};
module.exports.MSG_TYPE = {
  Normal: 0,
  Invite: 101,
  Leave: 102,
  ChangeRoomName: 103,
  ChangeMasterId: 104,
  JoinRoom: 105,
  RejectMember: 106,
  OpenRoomCreateGreeting: 107,
  Sticker: 201,
  Image: 301
};
module.exports.NOTI_TYPE = {
  Msg: 93001,
  Invited: 93002,
  ChangeRoomName: 93003,
  DeleteRoom: 93004,
  DelegateMaster: 93005,
  JoinRoom: 93006,
  RejectMember: 93007,
  ClosedOpenroom: 93008
};
module.exports.COMMAND_RESULT_CODE = {
  SUCCESS: 0,
  ERR_NOT_DEFINED_COMMAND: 104,
  NOT_FOUND_ROOM: 1001,
  NOT_ROOM_MEMBER: 1002,
  WRONG_ROOM_INFO: 1003,
  WRONG_ROOM_MEMBER_INFO: 1004,
  NOT_ALLOW_ROOM_AUTH: 1005,
  OVER_ROOM_MEMBER_LIMIT: 1006,
  NOT_ALLOW_CREATE_ROOM_MEMBER_LEVEL: 1007,
  NOT_ALLOW_CREATE_ROOM_UNUSED_CHAT: 1008,
  NOT_ALLOW_CREATE_ROOM_BLOCKED_USER: 1009,
  NOT_SUPPORT_ROOM_TYPE: 1010,
  NOT_SUPPORT_MESSAGE_TYPE: 1011,
  ALREADY_EXIST_ROOM: 1012,
  NOT_SUPPORT_INVITE: 1013,
  INVALID_ROOM_MEMBER_COUNT: 1014,
  EXCEED_ROOM_COUNT: 1015,
  NOT_EXIST_SESSION: 1016,
  INVALID_SESSION_ID: 1017,
  ALREADY_EXIST_ROOM_MEMBERS: 1018,
  NOT_ALLOW_CREATE_ROOM_UNUSE_GROUPCHAT: 1019,
  NOT_ALLOW_CREATE_ROOM_SENDER_IS_NOT_CAFEMEMBER: 1020,
  NOT_ALLOW_CREATE_ROOM_NOT_EXIST_CAFEMEMBER: 1021,
  NOT_ALLOW_CREATE_ROOM_NOT_EXIST_USEGROUPCHAT_MEMBER: 1022,
  ALREADY_BLOCK_MEMBER: 1023,
  NOT_ALLOW_DELEGATE_MASTER_NOT_ALLOW_ROOM_TYPE: 1024,
  NOT_ALLOW_DELEGATE_MASTER_NOT_EXIST_MEMBER: 1025,
  NOT_ALLOW_DELEGATE_MASTER_INACTIVE_ROOM: 1026,
  NOT_ALLOW_REJECT_ONES_OWN_this: 1027,
  NOT_ALLOW_REJECT_MASTER_USER: 1028,
  NOT_CAFEMEMBER: 1029,
  GROUP_CHAT_BLOCK: 1030,
  REJECTED_MEMBER: 1031,
  NOT_ALLOW_ROOM_TYPE: 1033,
  NEED_TO_INSERT_CAPTCHA_WHEN_CREATE_ROOM: 1034,
  INVALID_CAPTCHA_KEY_VALUE_WHEN_CREATE_ROOM: 1035,
  NEED_TO_INSERT_CAPTCHA_WHEN_INVITE_ROOM: 1036,
  INVALID_CAPTCHA_KEY_VALUE_WHEN_INVITE_ROOM: 1037,
  EXCEED_MEMBER_DAILY_LIMIT: 1101,
  EXCEED_MEMBER_TIME_LIMIT: 1102,
  PROHIBIT_WORD_EXIST: 1103,
  ERR_USER_CUSTOM_MESSAGE_ALERT: 9901,
  ERR_USER_CUSTOM_MESSAGE_ALERT_AND_BACK: 9902,
  ERR_USER_CUSTOM_MESSAGE_ALERT_AND_CLOSE: 9903,
  AUTHENTICATION_ERROR: 10000,
  INVALID_AUTHENTICATION_ERROR: 10001,
  COMMON_ERROR: 90000,
  INVALID_COMMAND_ERROR: 90001,
  INSPECTION_MODE: 99999
};
module.exports.RESULT_CODE = {
  HTTP_SUCCESS: 200,
  CMD_SUCCESS: 0,
  POLLING_RE_CONN: 204,
  ERR_INTERNAL_ERROR: 102,
  ERR_INVALID_PARAMETER: 105,
  ERR_INVALID_SESSION: 201,
  ERR_SESSION_NOT_FOUND: 202,
  ERR_SESSION_CONFLICT: 203,
  ERR_EXPIRED_COOKIE: 302,
  CONN_RESP: 10100
}
module.exports.CONFIG = {
  POLLING_TIMEOUT: 20,
  CONN_TIMEOUT: 3,
  REQUEST_TYPE_JSONP: 'jsonp',
  DEFAULT_METHOD: 'get',
  POLL_RETRY_LIMIT_CNT: 3,
  CONN_RETRY_LIMIT_CNT: 10,
  POLL_SLEEP_DELAY: 1000,
  CONN_SLEEP_DELAY: 500,
  CONN_SLEEP_MAX_DELAY: 3000,
};
module.exports.COMMAND_URL = '/api/Command.nhn';
module.exports.POLL_URL = '/poll.nhn';
module.exports.CONNECT_URL = '/conn.nhn';
module.exports.UPLOAD_PIC_URL = '/AttachChatPhotoForJindoUploader.nhn';
module.exports.COMMAND_REQUEST_URLS = {
  'CafeMemberList': '/api/CafeMemberList.nhn',
  'CheckBlockMemberList': '/api/BlockMemberListCheck.nhn',
  'FindBlockMemberList': '/api/BlockMemberList.nhn',
  'AddBlockMember': '/api/BlockMemberAdd.nhn',
  'RemoveBlockMember': '/api/BlockMemberRemove.nhn',
  'ChatTitleCheck': '/api/ChatTitleCheck.nhn'
};
module.exports.CHAT_BROKER_URL = 'http://chat.cafe.naver.com';
module.exports.CHAT_BROKER_SSL_URL = 'https://chat.cafe.naver.com';
module.exports.CAFE_MAIN_URL = 'http://cafe.naver.com';
module.exports.CHAT_IMGS_URL = 'http://cafechat.phinf.naver.net';
module.exports.CHAT_IMGS_SSL_URL = 'https://ssl.pstatic.net/cafechat.phinf';
module.exports.UPLOAD_URL = 'https://up.cafe.naver.com';
module.exports.SESSION_SERVER_URL = 'https://ss.cafe.naver.com';
module.exports.HT_SESSION_SERVER_URLS = {
  1: 'https://ss1.cafe.naver.com',
  2: 'https://ss2.cafe.naver.com',
  3: 'https://ss3.cafe.naver.com',
  4: 'https://ss4.cafe.naver.com',
  5: 'https://ss5.cafe.naver.com',
  6: 'https://ss6.cafe.naver.com',
  7: 'https://ss7.cafe.naver.com',
  8: 'https://ss8.cafe.naver.com',
  9: 'https://ss9.cafe.naver.com',
  10: 'https://ss10.cafe.naver.com',
  11: 'https://ss11.cafe.naver.com',
  12: 'https://ss12.cafe.naver.com',
  13: 'https://ss13.cafe.naver.com',
  14: 'https://ss14.cafe.naver.com',
  15: 'https://ss15.cafe.naver.com',
  16: 'https://ss16.cafe.naver.com',
  17: 'https://ss17.cafe.naver.com',
  18: 'https://ss18.cafe.naver.com',
  19: 'https://ss19.cafe.naver.com',
  20: 'https://ss20.cafe.naver.com'
};
module.exports.CHAT_HOME_URL = 'https://chat.cafe.naver.com/ChatHome.nhn';
module.exports.VERSION = 1;
module.exports.base64 = {
  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  encode: function (e) {
    var a = '';
    var o,
    m,
    h,
    n,
    l,
    g,
    f;
    var b = 0;
    while (b < e.length) {
      o = e.charCodeAt(b++);
      m = e.charCodeAt(b++);
      h = e.charCodeAt(b++);
      n = o >> 2;
      l = ((o & 3) << 4) | (m >> 4);
      g = ((m & 15) << 2) | (h >> 6);
      f = h & 63;
      if (isNaN(m)) {
        g = f = 64;
      } else {
        if (isNaN(h)) {
          f = 64;
        }
      }
      a = a + this._keyStr.charAt(n) + this._keyStr.charAt(l) + this._keyStr.charAt(g) + this._keyStr.charAt(f);
    }
    return a;
  },
  decode: function (e) {
    var a = '';
    var o,
    m,
    h;
    var n,
    l,
    g,
    f;
    var b = 0;
    e = e.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    while (b < e.length) {
      n = this._keyStr.indexOf(e.charAt(b++));
      l = this._keyStr.indexOf(e.charAt(b++));
      g = this._keyStr.indexOf(e.charAt(b++));
      f = this._keyStr.indexOf(e.charAt(b++));
      o = (n << 2) | (l >> 4);
      m = ((l & 15) << 4) | (g >> 2);
      h = ((g & 3) << 6) | f;
      a = a + String.fromCharCode(o);
      if (g != 64) {
        a = a + String.fromCharCode(m);
      }
      if (f != 64) {
        a = a + String.fromCharCode(h);
      }
    }
    return a;
  },
  _utf8_encode: function (b) {
    b = b.replace(/\r\n/g, '\n');
    var a = '';
    for (var f = 0; f < b.length; f++) {
      var e = b.charCodeAt(f);
      if (e < 128) {
        a += String.fromCharCode(e);
      } else {
        if ((e > 127) && (e < 2048)) {
          a += String.fromCharCode((e >> 6) | 192);
          a += String.fromCharCode((e & 63) | 128);
        } else {
          a += String.fromCharCode((e >> 12) | 224);
          a += String.fromCharCode(((e >> 6) & 63) | 128);
          a += String.fromCharCode((e & 63) | 128);
        }
      }
    }
    return a;
  },
  _utf8_decode: function (a) {
    var b = '';
    var e = 0;
    var f = c1 = c2 = 0;
    while (e < a.length) {
      f = a.charCodeAt(e);
      if (f < 128) {
        b += String.fromCharCode(f);
        e++;
      } else {
        if ((f > 191) && (f < 224)) {
          c2 = a.charCodeAt(e + 1);
          b += String.fromCharCode(((f & 31) << 6) | (c2 & 63));
          e += 2;
        } else {
          c2 = a.charCodeAt(e + 1);
          c3 = a.charCodeAt(e + 2);
          b += String.fromCharCode(((f & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          e += 3;
        }
      }
    }
    return b;
  }
}
