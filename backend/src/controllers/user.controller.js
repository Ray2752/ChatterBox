import FriendRequest from "../models/FriendRequest.js"
import User from "../models/User.js"

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const excludedIds = [currentUserId, ...(currentUser.friends || [])];

    const recommendedUsers = await User.find({
      _id: { $nin: excludedIds },
      isOnBoarded: true,
    });

    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "INTERNAL SERVER ERROR11" });
  }
}

export async function getMyFriends(req, res) {
    try {
        const user = await User.findById(req.user.id).select("friends")
        .populate("friends","fullName profilePic nativeLanguage learningLanguage");

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getMyFriends controller", error.message);
        res.status(500).json({ message: "INTERNAL SERVER ERROR22" });
    }
}

export async function sendFriendRequest(req, res) {
    try {
        const myId = req.user.id;
       const {id:recipientId} = req.params

       if(myId===recipientId){
        return res.status(400).json({ message: "You can't send friend request to yourself (dahhhh)"});
       }
        
       const recipient = await User.findById(recipientId)
       if(!recipient) {
        return res.status(404).json({ message: "Recipient not found" })
       }

       if(recipient.friends.includes(myId)){
        return res.status(400).json({ message: "You are already friends" })
       }

       const existingRequest = await FriendRequest.findOne({
        $or: [
            { sender: myId, recipient:recipientId },
            { sender: recipient, recipient:myId},
        ],
       });

       if (existingRequest) {
        return res.status(400).json({ message: "A friend request already exists "});
       }

       const friendRequest = await FriendRequest.create({
        sender: myId,
        recipient: recipientId,
       });

       res.status(201).json(friendRequest);

    } catch (error) {
        console.error("Error in setMyFriends controller", error.message);
        res.status(500).json({ message: "INTERNAL SERVER ERROR34" });
    }
}

export async function acceptFriendRequest(req, res) {
    try {
        const { id: requestId } = req.params;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // Verify the current user is the recipient
        if (friendRequest.recipient.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to accept this request"
            });
        }

        // Update the request status
        friendRequest.status = "accepted";
        await friendRequest.save();

        // Add each user to the other's friends array
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient },
        });

        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender },
        });

        return res.status(200).json({ success: true, message: "Friend request accepted" });

    } catch (error) {
        console.error("Error accepting friend request:", error);
        return res.status(500).json({ message: "Internal server error22" });
    }
}

export async function getFriendRequest(req, res) {
  try {
    console.log("Request User:", req.user); // ← añade esto

    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.error("Error getPendingFriendRequests request:", error);
    return res.status(500).json({ message: "Internal server error56" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.error("Error getOutgoingFriendReqs request:", error);
        return res.status(500).json({ message: "Internal server error12" });
    }
    
}