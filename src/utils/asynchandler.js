const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}


export {asyncHandler}
















// !showing how this actually work
// const asyncHandler=()=>{}
// const asyncHandler (func)=>()=>{}
// const asyncHandter (func)=>async()=>{}

// !try catch wraper part
//     const asyncHandler=(fun)=>async(err,req,res,next)=>{
//     try {
//         await fun(err,req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }


