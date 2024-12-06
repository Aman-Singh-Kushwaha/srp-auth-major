import CryptoJS from 'crypto-js';

// Constants for SRP protocol (same as server)
const N = BigInt('0x' + 'EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE48E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B297BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9AFD5138FE8376435B9FC61D2FC0EB06E3');
const g = BigInt(2);
const k = BigInt(3);

// Validation functions
function validateBigInt(value, name) {
    try {
        const bigIntValue = BigInt(value);
        if (bigIntValue <= 0n) {
            throw new Error(`${name} must be positive`);
        }
        return bigIntValue;
    } catch (error) {
        throw new Error(`Invalid ${name}: ${error.message}`);
    }
}

// Client-side SRP functions
function generateClientPrivateKey() {
    console.log('Client: Generating private key');
    try {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const privateKey = BigInt('0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''));
        return privateKey % (N - 1n) + 1n; // Ensure it's in the valid range
    } catch (error) {
        console.error('Error generating private key:', error);
        throw new Error('Failed to generate secure private key');
    }
}

function modPow(base, exponent, modulus) {
    try {
        base = validateBigInt(base, 'base');
        exponent = validateBigInt(exponent, 'exponent');
        modulus = validateBigInt(modulus, 'modulus');
        
        if (modulus === 1n) return 0n;
        
        let result = 1n;
        base = base % modulus;
        
        while (exponent > 0n) {
            if (exponent % 2n === 1n) {
                result = (result * base) % modulus;
            }
            exponent = exponent >> 1n;
            base = (base * base) % modulus;
        }
        
        return result;
    } catch (error) {
        console.error('Error in modPow calculation:', error);
        throw new Error('Failed to perform modular exponentiation');
    }
}

function generateClientEphemeral() {
    console.log('Client: Generating ephemeral key A');
    try {
        const a = generateClientPrivateKey();
        console.log('Generated private key a:', a.toString());
        
        const A = modPow(g, a, N);
        console.log('Generated public key A:', A.toString());
        
        // Validate A is not 0 mod N
        if (A === 0n || A % N === 0n) {
            throw new Error('Invalid ephemeral key (A = 0 mod N)');
        }
        
        return {
            privateKey: a.toString(),
            publicKey: A.toString()
        };
    } catch (error) {
        console.error('Error generating client ephemeral:', error);
        throw new Error('Failed to generate client ephemeral key');
    }
}

function computeClientProof(username, password, salt, clientEphemeral, serverPublicEphemeral) {
    console.log('Client: Computing session key');
    try {
        // Validate inputs
        if (!username || !password) throw new Error('Username and password are required');
        if (!salt) throw new Error('Salt is required');
        if (!clientEphemeral?.publicKey || !clientEphemeral?.privateKey) {
            throw new Error('Invalid client ephemeral');
        }
        if (!serverPublicEphemeral) throw new Error('Server public ephemeral is required');

        const A = validateBigInt(clientEphemeral.publicKey, 'Client public key');
        const a = validateBigInt(clientEphemeral.privateKey, 'Client private key');
        const B = validateBigInt(serverPublicEphemeral, 'Server public key');

        // Verify B != 0 mod N
        if (B === 0n || B % N === 0n) {
            throw new Error('Invalid server public key (B = 0 mod N)');
        }

        // Calculate u = H(A | B)
        const u = BigInt('0x' + CryptoJS.SHA256(A.toString() + B.toString()).toString());
        console.log('Client: Calculated u:', u.toString());

        if (u === 0n) {
            throw new Error('Invalid u value (u = 0)');
        }

        // Calculate x = H(salt | H(username | ':' | password))
        const innerHash = CryptoJS.SHA256(username + ':' + password).toString();
        const x = BigInt('0x' + CryptoJS.SHA256(salt + innerHash).toString());
        console.log('Client: Calculated x:', x.toString());

        // Calculate S = (B - k * g^x)^(a + u * x) % N
        const gx = modPow(g, x, N);
        const kgx = (k * gx) % N;
        const diff = ((B - kgx) % N + N) % N; // Ensure positive
        const exponent = (a + u * x) % (N - 1n); // Reduce exponent
        const S = modPow(diff, exponent, N);
        console.log('Client: Calculated S:', S.toString());

        // Calculate K = H(S)
        const K = CryptoJS.SHA256(S.toString()).toString();
        console.log('Client: Generated client key:', K);

        return K;
    } catch (error) {
        console.error('Client: Error in proof computation:', error);
        throw error;
    }
}

export { generateClientEphemeral, computeClientProof }; 