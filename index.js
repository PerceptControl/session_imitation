const { PORT, MINUTE, MAX_SESSION_MEMBERS } = require('./consts')
const timers = require('./usersTimers')

const { Server } = require('socket.io')
const io = new Server(PORT)

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
  socket.on('searchGame', () => {
    console.log(`User#${socket.userID} connected`)
    joinFreeRoom(socket)
    socket.emit('joined', { id: socket.session })
  })

  socket.on('disconnect', (reason) => {
    console.log(`User#${socket.userID} disconnected`)
    timers.get(socket.userID).addTimer(setTimeout(() => timers.delete(socket.userID), MINUTE * 10))
  })
})

const rooms = new Array()

function joinFreeRoom(socket) {
  for (let room of rooms.values()) {
    let ioRoom = io.sockets.adapter.rooms.get(room)
    if (ioRoom && ioRoom.size < MAX_SESSION_MEMBERS) {
      socket.session = room
      return socket.join(room)
    }
  }

  let sessionID = v4()

  rooms.push(sessionID)
  socket.session = sessionID

  return socket.join(sessionID)
}

console.log(`Listening ${PORT}`)
