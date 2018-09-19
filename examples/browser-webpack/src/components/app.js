'use strict'

const React = require('react')
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}

const stringToUse = 'a test, from a webpacked IPFS'

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: null,
      version: null,
      protocol_version: null,
      added_file_hash: null,
      added_file_contents: null
    }
  }
  componentDidMount () {
    const self = this
    let node

    create()

    function create () {
      // Create the IPFS node instance

      //node = new IPFS({ repo: String(Math.random() + Date.now()) })
      node = new IPFS(ipfsOptions)

      node.once('ready', async () => {
        console.log('IPFS node is ready')
        const orbitdb = new OrbitDB(node)
        const db = await orbitdb.log('hello')
        db.events.on('ready',(dbname,heads)=>{
          console.log(dbname,heads)
        })
        db.events.on('replicated',(addr)=>{
          console.log(db.iterator({limit: -1}).collect())
        })
        await db.load()
        const hash = await db.add('world')
        console.log(hash)

        const result = db.iterator({limit:-1}).collect()
        console.log(JSON.stringify(result, null, 2))
        ops()
      })
    }

    function ops () {
      node.id((err, res) => {
        if (err) {
          throw err
        }
        self.setState({
          id: res.id,
          version: res.agentVersion,
          protocol_version: res.protocolVersion
        })
      })

      node.files.add([Buffer.from(stringToUse)], (err, filesAdded) => {
        if (err) { throw err }

        const hash = filesAdded[0].hash
        self.setState({added_file_hash: hash})

        node.files.cat(hash, (err, data) => {
          if (err) { throw err }
          self.setState({added_file_contents: data})
        })
      })
    }
  }
  render () {
    return (
      <div style={{textAlign: 'center'}}>
        <h1>Everything is working!</h1>
        <p>Your ID is <strong>{this.state.id}</strong></p>
        <p>Your IPFS version is <strong>{this.state.version}</strong></p>
        <p>Your IPFS protocol version is <strong>{this.state.protocol_version}</strong></p>
        <hr />
        <div>
          Added a file! <br />
          {this.state.added_file_hash}
        </div>
        <br />
        <br />
        <p>
          Contents of this file: <br />
          {this.state.added_file_contents}
        </p>
      </div>
    )
  }
}
module.exports = App
