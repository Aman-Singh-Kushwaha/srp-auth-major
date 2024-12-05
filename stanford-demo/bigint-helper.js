class ModernBigIntHelper {
  constructor() {
      this.rng = window.crypto;
  }

  parseBigInt(str, radix) {
      if (radix === 64) {
          return this.parseBigInt(this.b64tob8(str), 8);
      }
      if (str.length === 0) str = "0";
      
      if (radix === 16) {
          return BigInt(`0x${str}`);
      }
      
      return BigInt(str);
  }

  bigIntToRadix(bi, radix) {
      if (radix === 64) {
          return this.b8tob64(bi.toString(8));
      }
      if (radix === 16) {
          return bi.toString(16).toUpperCase();
      }
      return bi.toString(radix);
  }

  randomBigInt(bytes) {
      const array = new Uint8Array(bytes);
      this.rng.getRandomValues(array);
      let hex = Array.from(array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      return BigInt(`0x${hex}`);
  }

  b64tob8(str) {
      const b64_chr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./";
      const hex_chr = "0123456789abcdef";
      let ret = "";
      for (let j = 0; j < str.length; ++j) {
          const d = b64_chr.indexOf(str.charAt(j));
          ret += hex_chr.charAt((d >> 3) & 7);
          ret += hex_chr.charAt(d & 7);
      }
      return ret;
  }

  b8tob64(str) {
      const b64_chr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./";
      let ret = "";
      let j = 0;
      if ((str.length & 1) > 0) {
          ret += str.charAt(0);
          j = 1;
      }
      while (j < str.length) {
          ret += b64_chr.charAt(parseInt(str.substr(j, 2), 8));
          j += 2;
      }
      return ret;
  }

  modPow(base, exponent, modulus) {
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
}

const bigintHelper = new ModernBigIntHelper();