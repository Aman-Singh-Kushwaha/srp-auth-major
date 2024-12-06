const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const srp = require('../utils/srp');

// CSV file setup
const CSV_FILE = './users.csv';
const csvWriter = createCsvWriter({
    path: CSV_FILE,
    header: [
        { id: 'username', title: 'USERNAME' },
        { id: 'salt', title: 'SALT' },
        { id: 'verifier', title: 'VERIFIER' }
    ]
});

// Initialize CSV file if it doesn't exist
if (!fs.existsSync(CSV_FILE)) {
    csvWriter.writeRecords([]).then(() => console.log('CSV file initialized'));
}

const register = async (req, res) => {
    console.log('Registration request received');
    const { username, password } = req.body;
    
    try {
        // Check if user exists
        const users = [];
        await new Promise((resolve) => {
            fs.createReadStream(CSV_FILE)
                .pipe(csv())
                .on('data', (data) => users.push(data))
                .on('end', resolve);
        });
        
        if (users.some(user => user.USERNAME === username)) {
            console.log('Username already exists');
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Generate salt and verifier
        const salt = srp.generateSalt();
        const verifier = srp.generateVerifier(username, password, salt);
        
        // Save user
        await csvWriter.writeRecords([{
            username,
            salt,
            verifier: verifier.toString()
        }]);
        
        console.log('User registered successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

const initLogin = async (req, res) => {
    console.log('Login initialization request received');
    const { username } = req.body;
    
    try {
        // Find user
        const users = [];
        await new Promise((resolve) => {
            fs.createReadStream(CSV_FILE)
                .pipe(csv())
                .on('data', (data) => users.push(data))
                .on('end', resolve);
        });
        
        const user = users.find(u => u.USERNAME === username);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate server ephemeral
        const v = BigInt(user.VERIFIER);
        const serverEphemeral = srp.generateServerEphemeral(v);
        
        // Store session data
        const sessionId = Math.random().toString(36).substring(2);
        srp.sessions.set(sessionId, {
            username,
            salt: user.SALT,
            verifier: v,
            serverPrivateEphemeral: serverEphemeral.private
        });
        
        console.log('Login initialization successful');
        res.json({
            salt: user.SALT,
            serverPublicEphemeral: serverEphemeral.public.toString(),
            sessionId
        });
    } catch (error) {
        console.error('Login initialization error:', error);
        res.status(500).json({ error: 'Login initialization failed' });
    }
};

const verifyLogin = (req, res) => {
    console.log('Login verification request received');
    const { sessionId, clientPublicEphemeral, clientProof } = req.body;
    
    try {
        const session = srp.sessions.get(sessionId);
        if (!session) {
            console.log('Invalid session');
            return res.status(400).json({ error: 'Invalid session' });
        }
        
        const A = BigInt(clientPublicEphemeral);
        const B = srp.generateServerEphemeral(session.verifier).public;
        const sharedKey = srp.computeSessionKey(
            A, B,
            null, session.serverPrivateEphemeral,
            session.verifier,
            session.salt,
            session.username,
            null // password not needed on server side
        );
        
        if (sharedKey === clientProof) {
            console.log('Login successful');
            srp.sessions.set(sessionId, {
                ...session,
                authenticated: true,
                sharedKey
            });
            res.json({ success: true, sharedKey });
        } else {
            console.log('Invalid proof');
            res.status(401).json({ error: 'Invalid proof' });
        }
    } catch (error) {
        console.error('Login verification error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

const getProtectedData = (req, res) => {
    const sessionId = req.headers.authorization;
    const session = srp.sessions.get(sessionId);
    
    if (!session || !session.authenticated) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({
        username: session.username,
        sharedKey: session.sharedKey
    });
};

module.exports = {
    register,
    initLogin,
    verifyLogin,
    getProtectedData
}; 