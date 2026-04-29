//^ method-1
// import mongooes from 'mongooes';
// import {DB_name} from './constant';

/*
import express from 'express'
const app =express()

(async ()=>{
    try {
        await mongooes.connect(`${process.env.MONGODB_URI}/${DB_name}`)
        app.on("Error",(error)=>{
            console.log("ERROR: ", error)
            throw error    
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR ", error)
        throw new Error("There is some error in the database");
        
    }
})()*/



// ^method-2
// require('dotenv').config()
import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
    path:'./.env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running at port:${process.env.PORT}`);
    })
    app.on("Error",(error)=>{
            console.log("ERROR: ", error)
            throw error    
        });
})
.catch((ERROR)=>{
    console.log("MONFODB failed to connect",ERROR);
})