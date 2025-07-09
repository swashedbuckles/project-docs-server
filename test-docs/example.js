// Example JavaScript file for testing syntax highlighting

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

class Calculator {
  constructor() {
    this.result = 0;
  }
  
  add(value) {
    this.result += value;
    return this;
  }
  
  multiply(value) {
    this.result *= value;
    return this;
  }
  
  getResult() {
    return this.result;
  }
}

const calc = new Calculator();
const result = calc.add(5).multiply(3).getResult();
console.log(`Result: ${result}`);

// Generate fibonacci sequence
for (let i = 0; i < 10; i++) {
  console.log(`fib(${i}) = ${fibonacci(i)}`);
}