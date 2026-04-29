import express from 'express'
import cors from 'cros'
import cookieParser from 'cookie-parser'

const App=express()

// app.use() /*Option-1*/

app.use(cors({
    origin:process.env.CORS_ORIGIN,
     Credential:true
}))


app.use(express.json({limit:"50kb"}))

app.use(express.urlencodeed({extended:true,limit:"50kb"}))

app.use(express.static("public"))

app.use(cookieParser())


export{app}  