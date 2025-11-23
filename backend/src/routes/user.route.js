import express from 'express'
import { protectRoute } from '../middleware/auth.middleware.js';
import { getRecommendedUsers, getMyFriends, sendFriendRequest, acceptFriendRequest, getFriendRequest, getOutgoingFriendReqs, getUserPublicKey, updateMyPublicKey } from '../controllers/user.controller.js';

const router = express.Router();

router.use(protectRoute);
router.get("/", getRecommendedUsers)
router.get("/friends", getMyFriends)
router.post("/friend-request/:id", sendFriendRequest)
router.put("/friend-request/:id/accept", acceptFriendRequest)

// ADD router.put("/friend-request/:id/reject", acceptFriendRequest)

router.get("/friend-requests", getFriendRequest)
router.get("/outgoing-friend-requests", getOutgoingFriendReqs)

// Rutas para cifrado E2EE
router.get("/:id/public-key", getUserPublicKey)
router.put("/my-public-key", updateMyPublicKey)

export default router;
