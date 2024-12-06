const crypto = require('crypto');
const CryptoJS = require('crypto-js');

// Constants for SRP protocol
const N = BigInt('0x' + 'EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE48E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B297BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9AFD5138FE8376435B9FC61D2FC0EB06E3');
const g = BigInt(2);
const k = BigInt(3);

// In-memory session storage (in production, use Redis or similar)
const sessions = new Map();

// Server-side SRP functions
function generateSalt() {
  console.log('Server: Generating salt');
  return crypto.randomBytes(16).toString('hex');
}

function generateServerPrivateKey() {
  console.log('Server: Generating private key');
  return BigInt('0x' + crypto.randomBytes(32).toString('hex'));
}

function generateVerifier(username, password, salt) {
  // x = H(salt | H(username | ':' | password))
  console.log('Server: Generating verifier for registration');
  const innerHash = CryptoJS.SHA256(username + ':' + password).toString();
  const x = BigInt('0x' + CryptoJS.SHA256(salt + innerHash).toString());
  
  // v = g^x % N
  return modPow(g, x, N);
}

function generateServerEphemeral(verifier) {
  console.log('Server: Generating ephemeral key B');
  const b = generateServerPrivateKey();
  const B = (k * BigInt(verifier) + modPow(g, b, N)) % N;
  return { 
    privateKey: b,
    publicKey: B.toString()
  };
}

function modPow(base, exponent, modulus) {
  base = BigInt(base);
  exponent = BigInt(exponent);
  modulus = BigInt(modulus);
  
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
}

function verifyClientProof(clientPublicKey, serverPrivateKey, verifier, clientProof) {
  console.log('Server: Verifying client proof');
  try {
    const A = BigInt(clientPublicKey);
    const b = BigInt(serverPrivateKey);
    const v = BigInt(verifier);
    
    // Calculate B
    const B = (k * v + modPow(g, b, N)) % N;
    
    // Calculate u = H(A | B)
    const u = BigInt('0x' + CryptoJS.SHA256(A.toString() + B.toString()).toString());
    
    if (u === 0n) {
      console.log('Server: Invalid u value detected');
      throw new Error('Invalid u value');
    }
    
    // Calculate S = (A * v^u)^b % N
    const S = modPow(A * modPow(v, u, N), b, N);
    
    // Calculate K = H(S)
    const serverKey = CryptoJS.SHA256(S.toString()).toString();
    console.log('Server: Generated server key');
    
    return serverKey === clientProof;
  } 
  catch (error) {
    console.error('Server: Error in proof verification:', error);
    return false;
  }
}

module.exports = {
  generateSalt,
  generateVerifier,
  generateServerEphemeral,
  verifyClientProof,
  sessions
}; 