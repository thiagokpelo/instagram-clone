const express    = require( 'express' ),
      bodyParser = require( 'body-parser' ),
      multiparty = require( 'connect-multiparty' ),
      fs         = require( 'fs' )
      mongodb    = require( 'mongodb' ),
      objectId   = require( 'mongodb' ).ObjectId
      app        = express(),
      port       = 3000

const db = new mongodb.Db(
    'instagram',
    new mongodb.Server( 'localhost', 27017, {} ),
    {}
)


app.use( bodyParser.urlencoded({ extended : true }) )
app.use( bodyParser.json() )
app.use( multiparty() )
app.use( ( req, res, next ) => {

    res.setHeader( 'Access-Control-Allow-Origin', '*' )
    res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE' )
    res.setHeader( 'Access-Control-Allow-Headers', 'content-type' )
    res.setHeader( 'Access-Control-Allow-Credentials', true )

    next()
})

app.listen( port, ( err ) => console.log( `Servidor rodando na porta: ${port}` ))

// GET (ready)
app.get( '/api', ( req, res ) => {

    

    db.open( ( err, mongoclient ) => {
        mongoclient.collection( 'postagens', ( err, collection ) => {
            collection.find().toArray( ( err, results ) => {
                if ( err )
                    res.json( err )
                else
                    res.json( results )
                
                mongoclient.close()
            })
        })
    })
})

// GET by Id (ready)
app.get( '/api/:id', ( req, res ) => {

    db.open( ( err, mongoclient ) => {
        mongoclient.collection( 'postagens', ( err, collection ) => {
            collection.find( objectId( req.params.id ) ).toArray( ( err, result ) => {
                if ( err )
                    res.json( err )
                else
                    res.json( result )
                
                mongoclient.close()
            })
        })
    })
})

// PUT by Id (update)
app.put( '/api/:id', ( req, res ) => {

    db.open( ( err, mongoclient ) => {
        mongoclient.collection( 'postagens', ( err, collection ) => {
            collection.update(
                { _id: objectId( req.params.id ) },
                { $push : {
                    comentarios: {
                        id_comentario : new objectId(),
                        comentario: req.body.comentario
                    }
                }
                },
                {},
                ( err, records ) => {
                    if ( err )
                        res.json( err )
                    else
                        res.json( records )
                    
                    mongoclient.close()
                }
            )
        })
    })
})

// DELETE by Id (remove)
app.delete( '/api/:id', ( req, res ) => {

    db.open( ( err, mongoclient ) => {
        mongoclient.collection( 'postagens', ( err, collection ) => {
            collection.update(
                {},
                { $pull : {
                    comentarios: { id_comentario : objectId( req.params.id ) }
                }
                },
                { multi : true },
                ( err, records ) => {
                    if ( err )
                        res.json( err )
                    else
                        res.json( records )
                    
                    mongoclient.close()
                }
            )
        })
    })
})

// POST (Create)
app.post( '/api', ( req, res ) => {

    const date        = new Date()
    const timeStamp   = date.getTime()
    const urlImagem   = `${timeStamp}_${req.files.arquivo.originalFilename}`
    const pathOrigem  = req.files.arquivo.path
    const pathDestino = './uploads/' + urlImagem

    fs.rename(
        pathOrigem,
        pathDestino,
        ( err ) => {
            if ( err ) {
                res.status( 500 ).json({ error : err })
                return
            }

            const dados = {
                url_imagem: urlImagem,
                titulo: req.body.titulo
            }

            db.open( ( err, mongoclient ) => {
                mongoclient.collection( 'postagens', ( err, collection ) => {
                    collection.insert( dados, ( err, records ) => {
                        if ( err )
                            res.json({ 'status' : 'erro' })
                        else
                            res.json({ 'status' : 'inclusao realizada com sucesso' })
                        
                        mongoclient.close()
                    })
                })
            })
        }
    )
})

app.get( '/uploads/:imagem', ( req, res ) => {

    const imagem = req.params.imagem

    fs.readFile(
        `./uploads/${imagem}`,
        ( err, content ) => {
            if ( err ) {
                res.status( 400 ).json( err )
                return
            }

            res.writeHead(
                200,
                { 'content-type' : 'image/jpg' }
            )
            res.end( content )
        }
    )
})
