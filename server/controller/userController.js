import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "User Not Found" });
        }

        res.json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        })
    } catch (error) {
        console.error({ success: false, message: error.message })
    }
}