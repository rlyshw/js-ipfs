'use strict'

const React = require('react')
const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
const randomWords = require("random-words")

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;


var peerConnection;
var room;

var peerConnectionConfig = {'iceServers': [
  {'urls': 'stun:stun.stunprotocol.org:3478'},
  {'urls': 'stun:stun.l.google.com:19302'},
]};

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
var peerConnection;

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: null,
      roomVal: "",
      joined: false,
      localStream: "",
      remoteStream: "",
      peerConnection: null
    }
  }
  start(isCaller){
    let self = this;
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = this.gotIceCandidate;
    peerConnection.onaddstream = evt=>this.gotRemoteStream(evt,this);
    peerConnection.addStream(this.state.localStream);
  
    if(isCaller) {
      peerConnection.createOffer(self.gotDescription,self.createOfferError)
    }
  }
  gotMessageFromServer(message,self) {
    if(!peerConnection) self.start(false);
  
    var signal = JSON.parse(message.data);
    if(signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
            if(signal.sdp.type == 'offer') {
                peerConnection.createAnswer(self.gotDescription, console.log);
            }
        });
    } else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
  }
  gotRemoteStream(event, self) {
    console.log('got remote stream');
    self.setState({remoteStream:event.stream})
  }
  gotIceCandidate(event) {
    if(event.candidate != null) {
      room.broadcast(JSON.stringify({'ice': event.candidate}));
    }
  }
  gotDescription(description) {
    console.log('got description');
    peerConnection.setLocalDescription(description, function () {
        room.broadcast(JSON.stringify({'sdp': description}));
    }, function() {console.log('set description error')});
  }
  createOfferError(error) {
    console.log(error);
  }
  join(self) {
    // Create the IPFS node instance
    let node = new IPFS(ipfsOptions)

    node.once('ready', async () => {
      node.id((err,info)=>{
        if(err) console.log(err)

        room = Room(node, self.state.roomName)
        room.on('peer joined', (peer) => {
          console.log('Peer joined the room', peer)
        })
      
        room.on('peer left', (peer) => {
          console.log('Peer left...', peer)
        })

        room.on('message',(msg)=>this.gotMessageFromServer(msg,self))
      
        // now started to listen to room
        room.on('subscribed', () => {
          console.log('Now connected!')
          self.setState({joined:true})
        })
      })
    })
  }
  componentDidMount () {
    let self = this;
    navigator.getUserMedia({video:true,audio:true},(stream)=>{self.setState({localStream:stream})},console.log)
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
        <button onClick={()=>this.start(true)}>Call</button>
        {this.state.joined ? (<div>
          <h2>Room name: {this.state.roomName}</h2>
          <video id="localVideo" autoPlay muted style={{width:"40%"}} src={window.URL.createObjectURL(this.state.localStream)}></video>
          {this.state.remoteStream ? <video id="remoteVideo" autoPlay style={{width:"40%"}} src={window.URL.createObjectURL(this.state.remoteStream)}></video> : null}
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