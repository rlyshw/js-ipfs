'use strict'

const React = require('react')
const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
const randomWords = require("random-words")

const ipfsOptions = {
  repo:repo(),
  EXPERIMENTAL: {
    pubsub: true
  },
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ]
    }
  }
}

const stringToUse = 'a test, from a webpacked IPFS'

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: null,
      roomVal: "",
      joined: false
    }
  }
  join(self) {
    // Create the IPFS node instance
    let node = new IPFS(ipfsOptions)

    node.once('ready', async () => {
      node.id((err,info)=>{
        if(err) console.log(err)

        console.log('IPFS initialized with address '+info.id)

        const room = Room(node, self.state.roomName)
        room.on('peer joined', (peer) => {
          console.log('Peer joined the room', peer)
        })
      
        room.on('peer left', (peer) => {
          console.log('Peer left...', peer)
        })
      
        // now started to listen to room
        room.on('subscribed', () => {
          console.log('Now connected!')
          self.setState({joined:true})
        })
      })
    })
  }
  componentDidMount () {
  }

  updateRoomName(e){
    this.setState({
      roomName:e
    })
  }

  render () {
    return (
      <div style={{textAlign: 'center'}}>
        <h1>IPFS RTC</h1>
        {this.state.joined ? (<div>
          <h2>Room name: {this.state.roomName}</h2>
        </div>): (<div><button onClick={()=>{
          this.updateRoomName(randomWords(5).join('-'));this.join(this)}
          }>Create a room</button>
        <br/>
        <br/>
        <input onChange={e=>this.updateRoomName(e.target.value)}></input><button onClick={()=>this.join(this)}>Join a room</button></div>)}
      </div>
    )
  }
}
module.exports = App


function repo() {
  return 'ipfs/pubsub/'+Math.random()
}