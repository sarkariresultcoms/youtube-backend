//const asyncHandler= () => {};

//const asyncHandler=(fn)=>async()=>{}

/*
const asyncHandler = (fn) => async(req, res, next) => {
    try {
        await fn(req, res, next);
        
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
        
    }
} */


// A higher-order function to handle async errors in Express routes

const ayncHandler = (requestHandler) => {
  async (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).
  catch((err)=>next(err));
 }
}
export {ayncHandler};