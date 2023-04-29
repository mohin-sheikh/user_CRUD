import { Router } from 'express';
import { createUser, getUserById, updateUser, deleteUser, getUserByEmailOrPhone, patchUser } from '../db/user.db';
import bcrypt from 'bcrypt';
import * as jwt from "jsonwebtoken";
const usersRouter = Router();

usersRouter.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, phone } = req.body;
        if (!first_name || !last_name || !email || !phone) {
            throw new Error('Invalid request body');
        }
        const user = await createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

usersRouter.post('/login', async (req, res) => {
    try {
        const { email_or_phone, password } = req.body;

        if (!email_or_phone) {
            throw new Error('Invalid request body');
        }

        const user = await getUserByEmailOrPhone(email_or_phone);

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or phone number' });
        }

        if (!user.email_verified && !user.phone_verified) {
            return res.status(400).json({ error: 'Email or phone number is not verified' });
        }

        if (password && !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Login successful
        const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET);
        return res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


usersRouter.get('/:id', async (req, res) => {
    try {
        const user = await getUserById(parseInt(req.params.id));
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

usersRouter.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await patchUser({ id: parseInt(id), ...req.body });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


usersRouter.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const deleted = await deleteUser(id);
        if (deleted) {
            res.sendStatus(204).json({ response: 'Successfully deleted' });
        } else {
            res.status(404).json({ error: `User with id ${id} not found` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default usersRouter;
