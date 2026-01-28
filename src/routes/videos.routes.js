import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
const router = Router();

router.route("/").get(getAllVideos);    
router.route("/publish").post(VerifyJWT, upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }      
]), publishAVideo);
router.route("/:videoId").get(getVideoById);
router.route("/:videoId").put(VerifyJWT, upload.single("thumbnail"), updateVideo);
router.route("/:videoId").delete(VerifyJWT, deleteVideo);
router.route("/:videoId/toggle-publish").patch(VerifyJWT, togglePublishStatus);
export default router;