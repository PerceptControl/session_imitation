const { PORT, MINUTE } = require('../consts')
const timers = require('../usersTimers')

const { Server } = require('socket.io')
const io = new Server(PORT)

const manager = require('./SessionManager')
const { v4 } = require('uuid')

io.use((socket, next) => {
  let userID = socket.handshake.auth.id
  if (userID) {
    socket.userID = userID
    if (timers.has(userID)) timers.get(userID).timers.forEach((timer) => clearTimeout(timer))
    else timers.create(userID)
    return next()
  }

  userID = v4()

  timers.create(userID)
  socket.userID = userID
  socket.emit('userID', { id: userID })

  next()
})

io.on('connection', (socket) => {
  console.log(`User#${socket.userID} connected`)

  socket.on('searchGame', () => {
    let result = manager.joinSession(socket.userID)
    if (!result.state) socket.emit('error', 'session if filled')
    else {
      socket.emit('joined', { id: result.session })
      socket.session = result.session
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`User#${socket.userID} disconnected`)
    if (reason == 'transport close' && socket.session) manager.leaveSession(socket.session, socket.userID)
    else if (socket.session) {
      let user = timers.get(socket.userID)
      user.addTimer(setTimeout(() => delete timers[socket.userID], MINUTE * 10))
      user.addTimer(setTimeout(() => manager.leaveSession(socket.session, socket.userID), MINUTE * 5))
    }
  })
})

console.log(`Listening ${PORT}`)
