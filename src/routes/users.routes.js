import { Router } from "express";
import { resigterUser, 
    loginUser , 
    logoutUser ,
    refreshAcessToken ,
    getUserProfile,
    changeUserPassword,
    updateUserProfile,
    updateAvatar,
    updatecoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post
    (upload.fields
        ([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
        ]), 
     resigterUser
    );
router.route("/login").post(loginUser);
router.route("/logout").post(VerifyJWT, logoutUser);
router.route("/update-profile").put(VerifyJWT, updateUserProfile);
router.route("/update-profile-photo").put(VerifyJWT, upload.single("avatar"), updateAvatar);
router.route("/update-profile-coverImage").put(VerifyJWT, upload.single("coverImage"), updatecoverImage);
router.route("/profile").get(VerifyJWT, getUserProfile);
router.route("/change-password").put(VerifyJWT, changeUserPassword);
router.route("/refresh-token").get(refreshAcessToken);
router.route("/channel/:username").get(VerifyJWT, getUserChannelProfile);
router.route("/watch-history").get(VerifyJWT, getWatchHistory);

export default router;