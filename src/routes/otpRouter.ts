import { Router } from 'express';
import { getUserById, updateUser } from '../db/user.db';
const otpRouter = Router();

otpRouter.post('/:id', async (req, res) => {
    try {
        const user = await getUserById(parseInt(req.params.id));
        console.log(user);

        const { otp, email, phone } = req.body;

        if (!user || user.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (user.email === email || user.phone === phone) {
            user.email_verified = user.email === email;
            user.phone_verified = user.phone === phone;
            user.otp = ""; // remove OTP after successful verification
            await updateUser(user);
            return res.status(200).json({ message: 'Verification successful' });
        } else {
            return res.status(400).json({ error: 'Invalid email or phone number' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default otpRouter;
