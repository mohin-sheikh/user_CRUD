import * as jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    id: string;
}

function verifyToken(req, res, next) {
    const token = req.get('Authorization').split(' ')[1];
    console.log(token);

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decodedToken);

        req.userId = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export default verifyToken;
