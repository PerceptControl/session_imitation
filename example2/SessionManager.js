const { v4 } = require('uuid')
const { MAX_SESSION_MEMBERS } = require('../consts')

class SessionManager {
  _sessions = new Map()
  _members = new Array()
  constructor() {}

  /**
   *
   * @param {string} memberID
   * @param {undefined | string} sessionID
   * @returns { { session: undefined | string, state: boolean } }
   */
  joinSession(memberID, sessionID = undefined) {
    if (this._hasMember(memberID)) return { state: false }
    let session = this.getSession(sessionID)
    if (!session.join(memberID)) return { state: false }

    this._members.push(memberID)
    return { state: true, session: session._id }
  }

  /**
   *
   * @param {string} sessionID
   * @param {string} memberID
   * @returns {boolean}
   */
  leaveSession(sessionID, memberID) {
    if (!this._sessions.has(sessionID)) return false
    let session = this._sessions.get(sessionID)
    if (!session.leave(memberID)) return false

    if (session.size === 0) this._sessions.delete(sessionID)
    this._members.splice(this._members.indexOf(memberID), 1)
    return true
  }

  /**
   * @param {string} sessionID
   * @returns {Session}
   */
  getSession(sessionID) {
    if (sessionID && this._sessions.has(sessionID)) return this._sessions.get(sessionID)

    let notFilledSession = this._findFreeSession()

    if (notFilledSession) return notFilledSession
    return this._createSession()
  }

  _hasMember(memberID) {
    return this._members.includes(memberID)
  }

  _findFreeSession() {
    for (let [_, session] of this._sessions) if (!session.filled) return session
  }

  _createSession() {
    let id = v4()
    this._sessions.set(id, new Session(id))
    return this._sessions.get(id)
  }
}

class Session {
  _members = new Array(MAX_SESSION_MEMBERS).fill(undefined)
  _size = 0

  constructor(id) {
    this._id = id
  }

  join(memberID) {
    if (this._members.includes(memberID)) return true
    if (this.filled) return false

    this._size++
    this._members[this._members.indexOf(undefined)] = memberID

    return true
  }

  leave(memberID) {
    let index = this._members.indexOf(memberID)
    if (!~index) return false

    this._size--
    this._members[index] = undefined

    return true
  }

  get size() {
    return this._size
  }

  get filled() {
    return !this._members.includes(undefined)
  }

  get members() {
    return this._members
  }
}

module.exports = new SessionManager()
