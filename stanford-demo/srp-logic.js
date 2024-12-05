// Global variables
let N, g, k, salt, v, x;

// Predefined parameters
const PARAMS = {
    1024: {
        N: "EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE48E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B297BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9AFD5138FE8376435B9FC61D2FC0EB06E3",
        g: "2"
    },
    // Add other bit lengths if needed
};

// Utility functions
async function sha1(str) {
    const utf8Encode = new TextEncoder();
    const data = utf8Encode.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getRadix() {
    return parseInt(document.querySelector('input[name="radix"]:checked').value);
}

function getProtocol() {
    return document.querySelector('input[name="protocol"]:checked').value;
}

function updateDisplay() {
    const radix = getRadix();
    document.getElementById('N').value = bigintHelper.bigIntToRadix(N, radix);
    document.getElementById('g').value = bigintHelper.bigIntToRadix(g, radix);
    document.getElementById('k').value = bigintHelper.bigIntToRadix(k, radix);
    if (salt) document.getElementById('salt').value = bigintHelper.bigIntToRadix(salt, radix);
    if (x) document.getElementById('x').value = bigintHelper.bigIntToRadix(x, radix);
    if (v) document.getElementById('v').value = bigintHelper.bigIntToRadix(v, radix);
}

async function updateK() {
    const protocol = getProtocol();
    if (protocol === "3") {
        k = 1n;
    } else if (protocol === "6") {
        k = 3n;
    } else if (protocol === "6a") {
        const Nhex = N.toString(16);
        const ghex = g.toString(16).padStart(2, '0');
        const kHash = await sha1(Nhex + ghex);
        k = BigInt(`0x${kHash}`);
    }
    updateDisplay();
}

async function updateVerifier() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    salt = bigintHelper.randomBigInt(10);
    const saltHex = salt.toString(16);
    
    const identity = `${username}:${password}`;
    const identityHash = await sha1(identity);
    const xHash = await sha1(saltHex + identityHash);
    
    x = BigInt(`0x${xHash}`);
    v = bigintHelper.modPow(g, x, N);
    
    updateDisplay();
}

async function authenticate() {
    // Client side
    const a = bigintHelper.randomBigInt(32);
    const A = bigintHelper.modPow(g, a, N);
    
    // Server side
    const b = bigintHelper.randomBigInt(32);
    const B = (k * v + bigintHelper.modPow(g, b, N)) % N;
    
    // Both sides
    const Ahex = A.toString(16);
    const Bhex = B.toString(16);
    const uHash = await sha1(Ahex + Bhex.padStart(Ahex.length, '0'));
    const u = BigInt(`0x${uHash}`);
    
    // Client side computation
    const clientPassword = document.getElementById('client_password').value;
    const identity = `${document.getElementById('username').value}:${clientPassword}`;
    const identityHash = await sha1(identity);
    const saltHex = salt.toString(16);
    const xHashClient = await sha1(saltHex + identityHash);
    const xClient = BigInt(`0x${xHashClient}`);
    
    const clientS = bigintHelper.modPow((B - k * bigintHelper.modPow(g, xClient, N)) % N, 
                                       (a + u * xClient), N);
    
    // Server side computation
    const serverS = bigintHelper.modPow(A * bigintHelper.modPow(v, u, N) % N, b, N);
    
    // Display results
    document.getElementById('a').value = bigintHelper.bigIntToRadix(a, getRadix());
    document.getElementById('A').value = bigintHelper.bigIntToRadix(A, getRadix());
    document.getElementById('b').value = bigintHelper.bigIntToRadix(b, getRadix());
    document.getElementById('B').value = bigintHelper.bigIntToRadix(B, getRadix());
    document.getElementById('client_x').value = bigintHelper.bigIntToRadix(xClient, getRadix());
    document.getElementById('u').value = bigintHelper.bigIntToRadix(u, getRadix());
    document.getElementById('client_S').value = bigintHelper.bigIntToRadix(clientS, getRadix());
    document.getElementById('server_S').value = bigintHelper.bigIntToRadix(serverS, getRadix());
    
    // Verify authentication
    if (clientS === serverS) {
        document.getElementById('status').style.color = 'green';
        document.getElementById('status').textContent = 'Authentication successful!';
    } else {
        document.getElementById('status').style.color = 'red';
        document.getElementById('status').textContent = 'Authentication failed!';
    }
}

function setPredefined() {
    const bits = document.getElementById('bits').value;
    const params = PARAMS[bits];
    N = bigintHelper.parseBigInt(params.N, 16);
    g = bigintHelper.parseBigInt(params.g, 10);
    updateK();
    updateDisplay();
}