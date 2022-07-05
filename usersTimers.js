const users = new Map()

class UserTimersManager {
  _timers = new Array()

  constructor(userID) {
    this._userID = userID
  }

  addTimer(timerID) {
    this._timers.push(timerID)
  }

  get timers() {
    return this._timers
  }

  get id() {
    return this._userID
  }
}

module.exports.create = function (id) {
  users.set(id, new UserTimersManager(id))
}

module.exports.delete = function (id) {
  return users.delete(id)
}

module.exports.has = function (id) {
  return users.has(id)
}

module.exports.get = function (id) {
  return users.get(id)
}
