const { sessions } = require('../utils/srp');

const requireAuth = (req, res, next) => {
    const sessionId = req.headers.authorization;
    const session = sessions.get(sessionId);
    
    if (!session || !session.authenticated) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.session = session;
    next();
};

module.exports = { requireAuth }; 